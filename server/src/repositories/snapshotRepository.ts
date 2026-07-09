import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  categorias,
  despesas,
  escalas,
  inscritos,
  lideres,
  pagamentos,
  produtos,
  quartos,
  retiros,
  retirosPassados,
  vendaItens,
  vendas,
} from '../db/schema.js'
import type { DomainSnapshot } from '../types.js'
import { despesaRepository } from './despesaRepository.js'
import { escalaRepository } from './escalaRepository.js'
import { inscritoRepository } from './inscritoRepository.js'
import { categoriaRepository, lideresRepository } from './listaRepository.js'
import { produtoRepository } from './produtoRepository.js'
import { quartoRepository } from './quartoRepository.js'
import { retiroRepository } from './retiroRepository.js'
import { vendaRepository } from './vendaRepository.js'

const RETIRO_ID = 'atual'
const ESCALA_ID = 'atual'

export const snapshotRepository = {
  /** Monta o snapshot completo do domínio a partir do banco. */
  async loadAll(): Promise<DomainSnapshot | null> {
    const retiro = await retiroRepository.getAtual()
    if (!retiro) return null // banco ainda não semeado

    const [
      retirosPassadosLista,
      lideresLista,
      categoriasLista,
      inscritosLista,
      quartosLista,
      produtosLista,
      vendasLista,
      despesasLista,
      escala,
    ] = await Promise.all([
      retiroRepository.listPassados(),
      lideresRepository.list(),
      categoriaRepository.list(),
      inscritoRepository.list(),
      quartoRepository.list(),
      produtoRepository.list(),
      vendaRepository.list(),
      despesaRepository.list(),
      escalaRepository.get(),
    ])

    return {
      retiro,
      retirosPassados: retirosPassadosLista,
      lideres: lideresLista,
      categorias: categoriasLista,
      inscritos: inscritosLista,
      quartos: quartosLista,
      produtos: produtosLista,
      vendas: vendasLista,
      despesas: despesasLista,
      escala,
    }
  },

  /** Substitui TODO o estado do domínio de forma transacional (last-write-wins). */
  async replaceAll(snap: DomainSnapshot): Promise<void> {
    await db.transaction(async (tx) => {
      // Limpa (filhos primeiro; FKs em cascata também cobririam).
      // ATENÇÃO: inscritos e pagamentos NÃO são apagados aqui — eles são
      // "merge" (upsert) mais abaixo, para nunca sobrescrever inscrições
      // criadas pelo formulário público enquanto o admin estava offline.
      await tx.delete(vendaItens)
      await tx.delete(vendas)
      await tx.delete(quartos)
      await tx.delete(produtos)
      await tx.delete(despesas)
      await tx.delete(retirosPassados)
      await tx.delete(lideres)
      await tx.delete(categorias)
      await tx.delete(retiros)
      await tx.delete(escalas)

      // Retiro atual
      await tx.insert(retiros).values({ id: RETIRO_ID, ...snap.retiro })

      if (snap.retirosPassados.length)
        await tx.insert(retirosPassados).values(snap.retirosPassados)
      if (snap.lideres.length)
        await tx.insert(lideres).values(snap.lideres.map((nome) => ({ nome })))
      if (snap.categorias.length)
        await tx.insert(categorias).values(snap.categorias.map((nome) => ({ nome })))

      // Inscritos: MERGE (upsert). Nunca apagamos inscritos que não vieram no
      // snapshot — assim inscrições feitas pelo formulário público (inseridas
      // direto no banco) sobrevivem a um "save" do app do administrador.
      for (const p of snap.inscritos) {
        const row = {
          id: p.id,
          nome: p.nome,
          genero: p.genero,
          tipo: p.tipo,
          diaServir: p.diaServir,
          lider: p.lider,
          forma: p.forma,
          parcelas: p.parcelas,
          tel: p.tel,
          statusInscricao: p.statusInscricao,
          cancelInfo: p.cancelInfo,
          comprovante: p.comprovante,
          comprovanteId: p.comprovanteId,
          quarto: p.quarto,
        }
        await tx.insert(inscritos).values(row).onConflictDoUpdate({ target: inscritos.id, set: row })
        // Substitui os pagamentos apenas deste inscrito.
        await tx.delete(pagamentos).where(eq(pagamentos.inscritoId, p.id))
      }
      const pags = snap.inscritos.flatMap((p) =>
        p.pagamentos.map((pg, i) => ({
          inscritoId: p.id,
          ordem: i,
          valor: pg.valor,
          oferta: pg.oferta,
          forma: pg.forma,
          obs: pg.obs,
          data: pg.data,
          usuario: pg.usuario,
          dataPrevista: pg.dataPrevista ?? null,
        })),
      )
      if (pags.length) await tx.insert(pagamentos).values(pags)

      if (snap.quartos.length) await tx.insert(quartos).values(snap.quartos)
      if (snap.produtos.length) await tx.insert(produtos).values(snap.produtos)
      if (snap.despesas.length) await tx.insert(despesas).values(snap.despesas)

      if (snap.vendas.length) {
        await tx.insert(vendas).values(
          snap.vendas.map((v) => ({
            id: v.id,
            tipo: v.tipo,
            cliente: v.cliente,
            forma: v.forma,
            status: v.status,
            data: v.data,
          })),
        )
        const itens = snap.vendas.flatMap((v) =>
          v.itens.map((i) => ({
            vendaId: v.id,
            itemId: i.id,
            nome: i.nome,
            valor: i.valor,
            qtd: i.qtd,
          })),
        )
        if (itens.length) await tx.insert(vendaItens).values(itens)
      }

      await tx.insert(escalas).values({ id: ESCALA_ID, data: snap.escala ?? null })
    })
  },
}
