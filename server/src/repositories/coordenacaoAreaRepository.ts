import { asc, eq, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { coordenacaoAreas, coordenacoes } from '../db/schema.js'
import type { CoordenacaoArea } from '../types.js'

type Row = typeof coordenacaoAreas.$inferSelect

function toDTO(row: Row): CoordenacaoArea {
  return { id: row.id, nome: row.nome, obrigacoes: row.obrigacoes, ordem: row.ordem }
}

export const coordenacaoAreaRepository = {
  async list(): Promise<CoordenacaoArea[]> {
    const rows = await db
      .select()
      .from(coordenacaoAreas)
      .orderBy(asc(coordenacaoAreas.ordem), asc(coordenacaoAreas.id))
    return rows.map(toDTO)
  },

  async getById(id: number): Promise<CoordenacaoArea | null> {
    const [row] = await db.select().from(coordenacaoAreas).where(eq(coordenacaoAreas.id, id))
    return row ? toDTO(row) : null
  },

  /** Busca por nome, sem diferenciar maiúsculas — usado para barrar duplicidade. */
  async getByNome(nome: string): Promise<CoordenacaoArea | null> {
    const [row] = await db
      .select()
      .from(coordenacaoAreas)
      .where(sql`lower(${coordenacaoAreas.nome}) = lower(${nome})`)
    return row ? toDTO(row) : null
  },

  async create(nome: string, obrigacoes: string): Promise<CoordenacaoArea> {
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${coordenacaoAreas.ordem}), 0)` })
      .from(coordenacaoAreas)
    const [row] = await db
      .insert(coordenacaoAreas)
      .values({ nome, obrigacoes, ordem: Number(max) + 1 })
      .returning()
    return toDTO(row)
  },

  async update(id: number, nome: string, obrigacoes: string): Promise<void> {
    await db.update(coordenacaoAreas).set({ nome, obrigacoes }).where(eq(coordenacaoAreas.id, id))
  },

  /** Renomear a área precisa arrastar as coordenações já cadastradas, senão
   *  elas ficariam apontando para um nome que não existe mais no catálogo. */
  async renomearEmCoordenacoes(nomeAntigo: string, nomeNovo: string): Promise<void> {
    await db
      .update(coordenacoes)
      .set({ area: nomeNovo })
      .where(eq(coordenacoes.area, nomeAntigo))
  },

  /** Há alguma coordenação (de qualquer evento) usando esta área? */
  async emUso(nome: string): Promise<boolean> {
    const [row] = await db
      .select({ n: sql<number>`count(*)` })
      .from(coordenacoes)
      .where(eq(coordenacoes.area, nome))
    return Number(row?.n ?? 0) > 0
  },

  async remove(id: number): Promise<void> {
    await db.delete(coordenacaoAreas).where(eq(coordenacaoAreas.id, id))
  },

  async contar(): Promise<number> {
    const [row] = await db.select({ n: sql<number>`count(*)` }).from(coordenacaoAreas)
    return Number(row?.n ?? 0)
  },

  async inserirLote(itens: { nome: string; obrigacoes: string; ordem: number }[]): Promise<void> {
    if (itens.length) await db.insert(coordenacaoAreas).values(itens)
  },
}
