import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { retiros, retirosPassados } from '../db/schema.js'
import type { Retiro, RetiroPassado } from '../types.js'

const RETIRO_ID = 'atual'

export const retiroRepository = {
  /** Retorna o retiro atual (linha de id fixo 'atual'), ou null. */
  async getAtual(): Promise<Retiro | null> {
    const [row] = await db.select().from(retiros).where(eq(retiros.id, RETIRO_ID))
    if (!row) return null
    return {
      nome: row.nome,
      inicio: row.inicio,
      fim: row.fim,
      valor: row.valor,
      max: row.max,
      aberto: row.aberto,
      slug: row.slug,
    }
  },

  /** Upsert do retiro atual. */
  async saveAtual(dto: Retiro): Promise<Retiro> {
    const values = { id: RETIRO_ID, ...dto }
    await db
      .insert(retiros)
      .values(values)
      .onConflictDoUpdate({ target: retiros.id, set: dto })
    return dto
  },

  async listPassados(): Promise<RetiroPassado[]> {
    const rows = await db
      .select()
      .from(retirosPassados)
      .orderBy(asc(retirosPassados.id))
    return rows.map((r) => ({
      nome: r.nome,
      periodo: r.periodo,
      inscritos: r.inscritos,
      max: r.max,
      arrecadado: r.arrecadado,
      saldo: r.saldo,
    }))
  },

  /** Substitui todo o histórico de retiros passados. */
  async replacePassados(lista: RetiroPassado[]): Promise<void> {
    await db.delete(retirosPassados)
    if (lista.length) await db.insert(retirosPassados).values(lista)
  },
}
