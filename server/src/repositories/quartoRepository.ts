import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { quartos } from '../db/schema.js'
import type { Quarto } from '../types.js'

type Row = typeof quartos.$inferSelect

function toDTO(row: Row): Quarto {
  return {
    id: row.id,
    nome: row.nome,
    genero: row.genero as Quarto['genero'],
    cap: row.cap,
    lideres: row.lideres ?? [],
  }
}

export const quartoRepository = {
  async list(retiroId?: string): Promise<Quarto[]> {
    const rows = retiroId
      ? await db.select().from(quartos).where(eq(quartos.retiroId, retiroId)).orderBy(asc(quartos.id))
      : await db.select().from(quartos).orderBy(asc(quartos.id))
    return rows.map(toDTO)
  },

  async get(id: string): Promise<Quarto | null> {
    const [row] = await db.select().from(quartos).where(eq(quartos.id, id))
    return row ? toDTO(row) : null
  },

  async create(dto: Quarto): Promise<Quarto> {
    await db.insert(quartos).values(dto)
    return dto
  },

  async update(id: string, dto: Quarto): Promise<Quarto> {
    await db
      .update(quartos)
      .set({ nome: dto.nome, genero: dto.genero, cap: dto.cap, lideres: dto.lideres })
      .where(eq(quartos.id, id))
    return dto
  },

  async remove(id: string): Promise<void> {
    await db.delete(quartos).where(eq(quartos.id, id))
  },
}
