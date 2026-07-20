import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { escalas } from '../db/schema.js'
import type { Escala } from '../types.js'

// A escala é por retiro: a linha usa id = id do retiro.
export const escalaRepository = {
  async get(retiroId: string): Promise<Escala> {
    const [row] = await db.select().from(escalas).where(eq(escalas.id, retiroId))
    return (row?.data as Escala) ?? null
  },

  async save(retiroId: string, data: Escala): Promise<void> {
    await db
      .insert(escalas)
      .values({ id: retiroId, data: data ?? null })
      .onConflictDoUpdate({ target: escalas.id, set: { data: data ?? null } })
  },
}
