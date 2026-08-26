import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { cantinaCatalogo, produtos } from '../db/schema.js'
import type { CantinaCatalogoItem } from '../types.js'

export const cantinaCatalogoRepository = {
  async list(): Promise<CantinaCatalogoItem[]> {
    return db.select().from(cantinaCatalogo).orderBy(asc(cantinaCatalogo.nome))
  },

  async create(nome: string, valor: number): Promise<CantinaCatalogoItem> {
    const [row] = await db.insert(cantinaCatalogo).values({ nome, valor }).returning()
    return row
  },

  async update(id: number, nome: string, valor: number): Promise<void> {
    await db.update(cantinaCatalogo).set({ nome, valor }).where(eq(cantinaCatalogo.id, id))
  },

  /** True se o produto do catálogo está ATIVO em pelo menos um evento. */
  async ativoEmAlgumEvento(id: number): Promise<boolean> {
    const rows = await db
      .select({ id: produtos.id })
      .from(produtos)
      .where(and(eq(produtos.catalogoId, id), eq(produtos.ativo, true)))
    return rows.length > 0
  },

  async remove(id: number): Promise<void> {
    await db.delete(cantinaCatalogo).where(eq(cantinaCatalogo.id, id))
  },
}
