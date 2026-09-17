import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { coordenacoes } from '../db/schema.js'
import type { Coordenacao } from '../types.js'

type Row = typeof coordenacoes.$inferSelect

function toDTO(row: Row): Coordenacao {
  return {
    id: row.id,
    area: row.area,
    servoId: row.servoId,
    obrigacoes: row.obrigacoes,
  }
}

export const coordenacaoRepository = {
  async list(retiroId?: string): Promise<Coordenacao[]> {
    const rows = retiroId
      ? await db
          .select()
          .from(coordenacoes)
          .where(eq(coordenacoes.retiroId, retiroId))
          .orderBy(asc(coordenacoes.area))
      : await db.select().from(coordenacoes).orderBy(asc(coordenacoes.area))
    return rows.map(toDTO)
  },
}
