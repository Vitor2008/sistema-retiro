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
  produtos,
  quartos,
  retiros,
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
} from './listaRepository.js'
import { produtoRepository } from './produtoRepository.js'
import { quartoRepository } from './quartoRepository.js'
import { retiroRepository } from './retiroRepository.js'
import { vendaRepository } from './vendaRepository.js'

/** Remove itens com id repetido, mantendo a última ocorrência. Evita "duplicate
 *  key" caso o cliente envie ids duplicados (ex.: clique-duplo). */
function dedupePorId<T extends { id: string }>(itens: T[]): T[] {
  return Array.from(new Map(itens.map((x) => [x.id, x])).values())
}

export const snapshotRepository = {
  /** Snapshot de UM retiro. */
  async loadAll(retiroId: string): Promise<DomainSnapshot | null> {
    const retiro = await retiroRepository.get(retiroId)
    if (!retiro) return null

    const [
      lideresLista,
      categoriasLista,
      conducoesLista,
      inscritosLista,
      quartosLista,
      produtosLista,
      vendasLista,
      despesasLista,
      escala,
      retRow,
    ] = await Promise.all([
      lideresRepository.list(retiroId),
      categoriaRepository.list(retiroId),
      conducaoRepository.list(retiroId),
      inscritoRepository.list(retiroId),
      quartoRepository.list(retiroId),
      produtoRepository.list(retiroId),
      vendaRepository.list(retiroId),
      despesaRepository.list(retiroId),
      escalaRepository.get(retiroId),
      db.select({ p: retiros.prediosParticipantes }).from(retiros).where(eq(retiros.id, retiroId)),
    ])
    const prediosLista = retRow[0]?.p ?? []

    return {
      retiro,
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

  /** Substitui o estado de UM retiro (transacional, last-write-wins). Prédios
   *  NÃO são tocados aqui (são persistentes, geridos por endpoint próprio). */
  async replaceAll(retiroId: string, snap: DomainSnapshot): Promise<void> {
    await db.transaction(async (tx) => {
      // Limpa apenas o que é deste retiro. vendaItens e pagamentos caem por
      // cascata (FK) ao apagar vendas/inscritos.
      await tx.delete(vendas).where(eq(vendas.retiroId, retiroId))
      await tx.delete(quartos).where(eq(quartos.retiroId, retiroId))
      await tx.delete(produtos).where(eq(produtos.retiroId, retiroId))
      await tx.delete(despesas).where(eq(despesas.retiroId, retiroId))
      await tx.delete(lideres).where(eq(lideres.retiroId, retiroId))
      await tx.delete(categorias).where(eq(categorias.retiroId, retiroId))
      await tx.delete(conducoes).where(eq(conducoes.retiroId, retiroId))

      // Atualiza os campos editáveis do retiro.
      const r = snap.retiro
      await tx
        .update(retiros)
        .set({
          nome: r.nome,
          inicio: r.inicio,
          fim: r.fim,
          valor: r.valor,
          max: r.max,
          oferta: r.oferta,
          local: r.local,
          saida: r.saida,
          tipo: r.tipo,
          descricao: r.descricao,
          linkPagamento: r.linkPagamento,
          mostrarLider: r.mostrarLider,
          mostrarPredio: r.mostrarPredio,
          mostrarConducao: r.mostrarConducao,
          prediosParticipantes: snap.predios ?? [],
          aberto: r.aberto,
          slug: r.slug,
          bannerId: r.bannerId,
        })
        .where(eq(retiros.id, retiroId))

      if (snap.lideres.length)
        await tx
          .insert(lideres)
          .values(snap.lideres.map((l) => ({ nome: l.nome, predio: l.predio ?? '', retiroId })))
      if (snap.categorias.length)
        await tx.insert(categorias).values(snap.categorias.map((nome) => ({ nome, retiroId })))
      if (snap.conducoes.length)
        await tx.insert(conducoes).values(snap.conducoes.map((nome) => ({ nome, retiroId })))

      // Inscritos: MERGE (upsert), escopado ao retiro. Nunca apaga inscritos que
      // não vieram no snapshot (inscrições públicas sobrevivem a um save do admin).
      for (const p of snap.inscritos) {
        const row = {
          id: p.id,
          retiroId,
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
          criadoEm: p.criadoEm || new Date().toISOString(),
        }
        // No update, NÃO sobrescreve criadoEm (preserva a data original da inscrição).
        const { criadoEm: _ce, ...setSemCriadoEm } = row
        await tx.insert(inscritos).values(row).onConflictDoUpdate({ target: inscritos.id, set: setSemCriadoEm })
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

      const quartosU = dedupePorId(snap.quartos)
      const produtosU = dedupePorId(snap.produtos)
      const despesasU = dedupePorId(snap.despesas)
      const vendasU = dedupePorId(snap.vendas)

      if (quartosU.length)
        await tx.insert(quartos).values(quartosU.map((q) => ({ ...q, retiroId })))
      if (produtosU.length)
        await tx.insert(produtos).values(produtosU.map((p) => ({ ...p, retiroId })))
      if (despesasU.length)
        await tx.insert(despesas).values(despesasU.map((d) => ({ ...d, retiroId })))

      if (vendasU.length) {
        await tx.insert(vendas).values(
          vendasU.map((v) => ({
            id: v.id,
            retiroId,
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

      // Prédios participantes já foram gravados no update do retiro acima
      // (retiros.predios_participantes). O catálogo de prédios é gerido à parte.

      await tx
        .insert(escalas)
        .values({ id: retiroId, data: snap.escala ?? null })
        .onConflictDoUpdate({ target: escalas.id, set: { data: snap.escala ?? null } })
    })
  },
}
