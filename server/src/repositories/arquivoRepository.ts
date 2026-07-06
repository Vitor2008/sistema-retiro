import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { arquivos } from '../db/schema.js'

export interface ArquivoDados {
  id: string
  nome: string
  mime: string
  tamanho: number
  dados: Buffer
}

export const arquivoRepository = {
  async save(a: ArquivoDados, criadoEm: string): Promise<void> {
    await db
      .insert(arquivos)
      .values({ ...a, criadoEm })
      .onConflictDoUpdate({
        target: arquivos.id,
        set: { nome: a.nome, mime: a.mime, tamanho: a.tamanho, dados: a.dados },
      })
  },

  async get(id: string): Promise<ArquivoDados | null> {
    const [row] = await db.select().from(arquivos).where(eq(arquivos.id, id))
    if (!row) return null
    return { id: row.id, nome: row.nome, mime: row.mime, tamanho: row.tamanho, dados: row.dados }
  },

  async remove(id: string): Promise<void> {
    await db.delete(arquivos).where(eq(arquivos.id, id))
  },
}
