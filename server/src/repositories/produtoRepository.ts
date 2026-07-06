import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { produtos } from '../db/schema.js'
import type { Produto } from '../types.js'

export const produtoRepository = {
  async list(): Promise<Produto[]> {
    return db.select().from(produtos).orderBy(asc(produtos.id))
  },

  async get(id: string): Promise<Produto | null> {
    const [row] = await db.select().from(produtos).where(eq(produtos.id, id))
    return row ?? null
  },

  async create(dto: Produto): Promise<Produto> {
    await db.insert(produtos).values(dto)
    return dto
  },

  async update(id: string, dto: Produto): Promise<Produto> {
    await db
      .update(produtos)
      .set({ nome: dto.nome, valor: dto.valor, estoque: dto.estoque })
      .where(eq(produtos.id, id))
    return dto
  },

  async remove(id: string): Promise<void> {
    await db.delete(produtos).where(eq(produtos.id, id))
  },
}
