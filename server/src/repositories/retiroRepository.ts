import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { retiros } from '../db/schema.js'
import type { Retiro } from '../types.js'

type Row = typeof retiros.$inferSelect

function toDTO(row: Row): Retiro {
  return {
    id: row.id,
    nome: row.nome,
    inicio: row.inicio,
    fim: row.fim,
    valor: row.valor,
    max: row.max,
    oferta: row.oferta,
    local: row.local,
    saida: row.saida,
    tipo: row.tipo,
    descricao: row.descricao,
    linkPagamento: row.linkPagamento,
    mostrarLider: row.mostrarLider,
    mostrarPredio: row.mostrarPredio,
    mostrarConducao: row.mostrarConducao,
    aberto: row.aberto,
    slug: row.slug,
    bannerId: row.bannerId,
    criadoEm: row.criadoEm,
  }
}

export const retiroRepository = {
  /** Todos os retiros, mais recentes primeiro. */
  async list(): Promise<Retiro[]> {
    const rows = await db.select().from(retiros).orderBy(asc(retiros.criadoEm))
    return rows.map(toDTO).reverse()
  },

  async get(id: string): Promise<Retiro | null> {
    const [row] = await db.select().from(retiros).where(eq(retiros.id, id))
    return row ? toDTO(row) : null
  },

  async getBySlug(slug: string): Promise<Retiro | null> {
    if (!slug) return null
    const [row] = await db.select().from(retiros).where(eq(retiros.slug, slug))
    return row ? toDTO(row) : null
  },

  async create(dto: Retiro): Promise<Retiro> {
    await db.insert(retiros).values(dto)
    return dto
  },

  /** Atualiza um retiro existente (por id). */
  async save(id: string, dto: Partial<Retiro>): Promise<void> {
    const { id: _omit, ...set } = dto as Retiro
    await db.update(retiros).set(set).where(eq(retiros.id, id))
  },

  async remove(id: string): Promise<void> {
    await db.delete(retiros).where(eq(retiros.id, id))
  },
}
