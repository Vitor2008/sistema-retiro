import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { despesas } from '../db/schema.js'
import type { Despesa } from '../types.js'

export const despesaRepository = {
  async list(): Promise<Despesa[]> {
    return db.select().from(despesas).orderBy(asc(despesas.id))
  },

  async get(id: string): Promise<Despesa | null> {
    const [row] = await db.select().from(despesas).where(eq(despesas.id, id))
    return row ?? null
  },

  async create(dto: Despesa): Promise<Despesa> {
    await db.insert(despesas).values(dto)
    return dto
  },

  async update(id: string, dto: Despesa): Promise<Despesa> {
    await db
      .update(despesas)
      .set({ categoria: dto.categoria, descricao: dto.descricao, valor: dto.valor, anexo: dto.anexo, anexoId: dto.anexoId })
      .where(eq(despesas.id, id))
    return dto
  },

  async remove(id: string): Promise<void> {
    await db.delete(despesas).where(eq(despesas.id, id))
  },
}
