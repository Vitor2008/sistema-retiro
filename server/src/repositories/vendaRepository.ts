import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { vendaItens, vendas } from '../db/schema.js'
import type { ItemVenda, Venda } from '../types.js'

type VendaRow = typeof vendas.$inferSelect
type ItemRow = typeof vendaItens.$inferSelect

function toDTO(row: VendaRow, itens: ItemRow[]): Venda {
  return {
    id: row.id,
    tipo: row.tipo as Venda['tipo'],
    cliente: row.cliente,
    forma: row.forma,
    status: row.status as Venda['status'],
    data: row.data,
    itens: itens.map((i) => ({
      id: i.itemId,
      nome: i.nome,
      valor: i.valor,
      qtd: i.qtd,
    })),
  }
}

async function inserirItens(vendaId: string, itens: ItemVenda[]) {
  if (!itens.length) return
  await db.insert(vendaItens).values(
    itens.map((i) => ({
      vendaId,
      itemId: i.id,
      nome: i.nome,
      valor: i.valor,
      qtd: i.qtd,
    })),
  )
}

export const vendaRepository = {
  async list(retiroId?: string): Promise<Venda[]> {
    const rows = retiroId
      ? await db.select().from(vendas).where(eq(vendas.retiroId, retiroId)).orderBy(asc(vendas.id))
      : await db.select().from(vendas).orderBy(asc(vendas.id))
    const itens = await db.select().from(vendaItens)
    const porVenda = new Map<string, ItemRow[]>()
    for (const it of itens) {
      const arr = porVenda.get(it.vendaId) ?? []
      arr.push(it)
      porVenda.set(it.vendaId, arr)
    }
    return rows.map((r) => toDTO(r, porVenda.get(r.id) ?? []))
  },

  async get(id: string): Promise<Venda | null> {
    const [row] = await db.select().from(vendas).where(eq(vendas.id, id))
    if (!row) return null
    const itens = await db.select().from(vendaItens).where(eq(vendaItens.vendaId, id))
    return toDTO(row, itens)
  },

  async create(dto: Venda): Promise<Venda> {
    await db.insert(vendas).values({
      id: dto.id,
      tipo: dto.tipo,
      cliente: dto.cliente,
      forma: dto.forma,
      status: dto.status,
      data: dto.data,
    })
    await inserirItens(dto.id, dto.itens)
    return dto
  },

  async update(id: string, dto: Venda): Promise<Venda> {
    await db
      .update(vendas)
      .set({
        tipo: dto.tipo,
        cliente: dto.cliente,
        forma: dto.forma,
        status: dto.status,
        data: dto.data,
      })
      .where(eq(vendas.id, id))
    await db.delete(vendaItens).where(eq(vendaItens.vendaId, id))
    await inserirItens(id, dto.itens)
    return dto
  },

  async remove(id: string): Promise<void> {
    await db.delete(vendas).where(eq(vendas.id, id))
  },
}
