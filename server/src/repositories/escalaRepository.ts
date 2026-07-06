import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { escalas } from '../db/schema.js'
import type { Escala } from '../types.js'

const ESCALA_ID = 'atual'

export const escalaRepository = {
  async get(): Promise<Escala> {
    const [row] = await db.select().from(escalas).where(eq(escalas.id, ESCALA_ID))
    return (row?.data as Escala) ?? null
  },

  async save(data: Escala): Promise<void> {
    await db
      .insert(escalas)
      .values({ id: ESCALA_ID, data: data ?? null })
      .onConflictDoUpdate({ target: escalas.id, set: { data: data ?? null } })
  },
}
