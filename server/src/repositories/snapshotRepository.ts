import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  categorias,
  conducoes,
  despesas,
  escalas,
  inscritos,
  lideres,
  pagamentos,
  predios,
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
import {
  categoriaRepository,
  conducaoRepository,
  lideresRepository,
  predioRepository,
} from './listaRepository.js'
import { produtoRepository } from './produtoRepository.js'
import { quartoRepository } from './quartoRepository.js'
import { retiroRepository } from './retiroRepository.js'
import { vendaRepository } from './vendaRepository.js'

const RETIRO_ID = 'atual'
const ESCALA_ID = 'atual'

/** Remove itens com id repetido, mantendo a última ocorrência (a mais recente
 *  no array). Evita "duplicate key" caso o cliente envie ids duplicados. */
function dedupePorId<T extends { id: string }>(itens: T[]): T[] {
  return Array.from(new Map(itens.map((x) => [x.id, x])).values())
}

export const snapshotRepository = {
  /** Monta o snapshot completo do domínio a partir do banco. */
  async loadAll(): Promise<DomainSnapshot | null> {
    const retiro = await retiroRepository.getAtual()
    if (!retiro) return null // banco ainda não semeado

    const [
      retirosPassadosLista,
      lideresLista,
      categoriasLista,
      prediosLista,
      conducoesLista,
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
      predioRepository.list(),
      conducaoRepository.list(),
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
      predios: prediosLista,
      conducoes: conducoesLista,
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
      await tx.delete(predios)
      await tx.delete(conducoes)
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
      if (snap.predios.length)
        await tx.insert(predios).values(snap.predios.map((nome) => ({ nome })))
      if (snap.conducoes.length)
        await tx.insert(conducoes).values(snap.conducoes.map((nome) => ({ nome })))

      // Inscritos: MERGE (upsert). Nunca apagamos inscritos que não vieram no
      // snapshot — assim inscrições feitas pelo formulário público (inseridas
      // direto no banco) sobrevivem a um "save" do app do administrador.
      for (const p of snap.inscritos) {
        const row = {
          id: p.id,
          nome: p.nome,
          genero: p.genero,
          tipo: p.tipo,
          idade: p.idade,
          dataNascimento: p.dataNascimento,
          vez: p.vez,
          lider: p.lider,
          predio: p.predio,
          conducao: p.conducao,
          forma: p.forma,
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

      // Dedupe defensivo por id: um clique-duplo no cliente pode gerar dois
      // registros com o mesmo id (ids baseados em Date.now()); sem isso o
      // insert falharia com "duplicate key" e travaria toda a sincronização.
      const quartosU = dedupePorId(snap.quartos)
      const produtosU = dedupePorId(snap.produtos)
      const despesasU = dedupePorId(snap.despesas)
      const vendasU = dedupePorId(snap.vendas)

      if (quartosU.length) await tx.insert(quartos).values(quartosU)
      if (produtosU.length) await tx.insert(produtos).values(produtosU)
      if (despesasU.length) await tx.insert(despesas).values(despesasU)

      if (vendasU.length) {
        await tx.insert(vendas).values(
          vendasU.map((v) => ({
            id: v.id,
            tipo: v.tipo,
            cliente: v.cliente,
            forma: v.forma,
            status: v.status,
            data: v.data,
          })),
        )
        const itens = vendasU.flatMap((v) =>
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
