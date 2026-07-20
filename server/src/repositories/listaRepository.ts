import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { categorias, conducoes, lideres, predios } from '../db/schema.js'
import type { Lider, Predio } from '../types.js'

/** Categorias de despesa padrão (semeadas ao criar um retiro). */
export const DEFAULT_CATEGORIAS = [
  'Alimentação',
  'Material',
  'Transporte',
  'Limpeza',
  'Hospedagem',
  'Decoração',
  'Outros',
]

/** Conduções padrão (semeadas ao criar um retiro). */
export const DEFAULT_CONDUCOES = ['Carro Próprio', 'Ônibus do Encontro (Translado)']

// ---- Líderes (por retiro, com nome do prédio) ------------------------------
export const lideresRepository = {
  async list(retiroId: string): Promise<Lider[]> {
    const rows = await db
      .select()
      .from(lideres)
      .where(eq(lideres.retiroId, retiroId))
      .orderBy(asc(lideres.id))
    return rows.map((r) => ({ nome: r.nome, predio: r.predio }))
  },
  async replaceAll(retiroId: string, lista: Lider[]): Promise<void> {
    await db.delete(lideres).where(eq(lideres.retiroId, retiroId))
    if (lista.length)
      await db
        .insert(lideres)
        .values(lista.map((l) => ({ nome: l.nome, predio: l.predio ?? '', retiroId })))
  },
}

// ---- Categorias de despesa (por retiro) ------------------------------------
export const categoriaRepository = {
  async list(retiroId: string): Promise<string[]> {
    const rows = await db
      .select()
      .from(categorias)
      .where(eq(categorias.retiroId, retiroId))
      .orderBy(asc(categorias.id))
    return rows.map((r) => r.nome)
  },
  async replaceAll(retiroId: string, nomes: string[]): Promise<void> {
    await db.delete(categorias).where(eq(categorias.retiroId, retiroId))
    if (nomes.length)
      await db.insert(categorias).values(nomes.map((nome) => ({ nome, retiroId })))
  },
  /** Cria as categorias padrão para um retiro (usado ao criar o retiro). */
  async seedDefaults(retiroId: string): Promise<void> {
    await db.insert(categorias).values(DEFAULT_CATEGORIAS.map((nome) => ({ nome, retiroId })))
  },
}

// ---- Conduções (por retiro) ------------------------------------------------
export const conducaoRepository = {
  async list(retiroId: string): Promise<string[]> {
    const rows = await db
      .select()
      .from(conducoes)
      .where(eq(conducoes.retiroId, retiroId))
      .orderBy(asc(conducoes.id))
    return rows.map((r) => r.nome)
  },
  async replaceAll(retiroId: string, nomes: string[]): Promise<void> {
    await db.delete(conducoes).where(eq(conducoes.retiroId, retiroId))
    if (nomes.length)
      await db.insert(conducoes).values(nomes.map((nome) => ({ nome, retiroId })))
  },
  async seedDefaults(retiroId: string): Promise<void> {
    await db.insert(conducoes).values(DEFAULT_CONDUCOES.map((nome) => ({ nome, retiroId })))
  },
}

// ---- Prédios (persistentes; participam de um retiro por vez) ---------------
export const predioRepository = {
  /** Nomes dos prédios participando de um retiro (para formulário/UI). */
  async list(retiroId: string): Promise<string[]> {
    const rows = await db
      .select()
      .from(predios)
      .where(eq(predios.retiroId, retiroId))
      .orderBy(asc(predios.id))
    return rows.map((r) => r.nome)
  },
  /** Todos os prédios (gestão). */
  async listAll(): Promise<Predio[]> {
    const rows = await db.select().from(predios).orderBy(asc(predios.id))
    return rows.map((r) => ({ id: r.id, nome: r.nome, retiroId: r.retiroId }))
  },
  async getById(id: number): Promise<Predio | null> {
    const [row] = await db.select().from(predios).where(eq(predios.id, id))
    return row ? { id: row.id, nome: row.nome, retiroId: row.retiroId } : null
  },
  async getByNomeRetiro(nome: string, retiroId: string): Promise<Predio | null> {
    const [row] = await db
      .select()
      .from(predios)
      .where(and(eq(predios.nome, nome), eq(predios.retiroId, retiroId)))
    return row ? { id: row.id, nome: row.nome, retiroId: row.retiroId } : null
  },
  async create(nome: string, retiroId: string | null): Promise<Predio> {
    const [row] = await db.insert(predios).values({ nome, retiroId }).returning()
    return { id: row.id, nome: row.nome, retiroId: row.retiroId }
  },
  async setRetiro(id: number, retiroId: string | null): Promise<void> {
    await db.update(predios).set({ retiroId }).where(eq(predios.id, id))
  },
  async remove(id: number): Promise<void> {
    await db.delete(predios).where(eq(predios.id, id))
  },
}
