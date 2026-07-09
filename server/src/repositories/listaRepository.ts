import { asc } from 'drizzle-orm'
import { db } from '../db/client.js'
import { categorias, lideres } from '../db/schema.js'

/** Categorias de despesa padrão, criadas automaticamente no start caso faltem. */
export const DEFAULT_CATEGORIAS = [
  'Alimentação',
  'Material',
  'Transporte',
  'Limpeza',
  'Hospedagem',
  'Decoração',
  'Outros',
]

/** Repositórios de listas simples (nomes): líderes e categorias. */
export const lideresRepository = {
  async list(): Promise<string[]> {
    const rows = await db.select().from(lideres).orderBy(asc(lideres.id))
    return rows.map((r) => r.nome)
  },
  async replaceAll(nomes: string[]): Promise<void> {
    await db.delete(lideres)
    if (nomes.length) await db.insert(lideres).values(nomes.map((nome) => ({ nome })))
  },
}

export const categoriaRepository = {
  async list(): Promise<string[]> {
    const rows = await db.select().from(categorias).orderBy(asc(categorias.id))
    return rows.map((r) => r.nome)
  },
  async replaceAll(nomes: string[]): Promise<void> {
    await db.delete(categorias)
    if (nomes.length) await db.insert(categorias).values(nomes.map((nome) => ({ nome })))
  },

  /** Insere as categorias padrão que ainda não existem (não apaga nenhuma).
   *  Retorna as que foram criadas. */
  async ensureDefaults(): Promise<string[]> {
    const existentes = new Set(await this.list())
    const faltando = DEFAULT_CATEGORIAS.filter((c) => !existentes.has(c))
    if (faltando.length)
      await db.insert(categorias).values(faltando.map((nome) => ({ nome })))
    return faltando
  },
}
