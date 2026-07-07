import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { usuarios } from '../db/schema.js'

export type UsuarioRow = typeof usuarios.$inferSelect

/** Usuário sem o hash de senha (para respostas da API). */
export interface UsuarioPublico {
  id: number
  username: string
  nome: string
  role: string
  acessos: string[]
}

export function toPublico(row: UsuarioRow): UsuarioPublico {
  return {
    id: row.id,
    username: row.username,
    nome: row.nome,
    role: row.role,
    acessos: row.acessos ?? [],
  }
}

export const usuarioRepository = {
  async findByUsername(username: string): Promise<UsuarioRow | null> {
    const [row] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.username, username))
    return row ?? null
  },

  async findById(id: number): Promise<UsuarioRow | null> {
    const [row] = await db.select().from(usuarios).where(eq(usuarios.id, id))
    return row ?? null
  },

  async list(): Promise<UsuarioPublico[]> {
    const rows = await db.select().from(usuarios).orderBy(asc(usuarios.id))
    return rows.map(toPublico)
  },

  async countAdmins(): Promise<number> {
    const rows = await db.select().from(usuarios)
    return rows.filter((r) => (r.acessos ?? []).includes('adm')).length
  },

  async create(u: {
    username: string
    senhaHash: string
    nome: string
    acessos: string[]
  }): Promise<UsuarioPublico> {
    const [row] = await db
      .insert(usuarios)
      .values({
        username: u.username,
        senhaHash: u.senhaHash,
        nome: u.nome,
        role: 'user',
        acessos: u.acessos,
        criadoEm: new Date().toISOString(),
      })
      .returning()
    return toPublico(row)
  },

  async update(
    id: number,
    patch: { nome?: string; acessos?: string[]; senhaHash?: string },
  ): Promise<UsuarioPublico | null> {
    const [row] = await db
      .update(usuarios)
      .set(patch)
      .where(eq(usuarios.id, id))
      .returning()
    return row ? toPublico(row) : null
  },

  async remove(id: number): Promise<void> {
    await db.delete(usuarios).where(eq(usuarios.id, id))
  },

  /** Cria ou atualiza pelo username (usado no seed do admin). */
  async upsert(u: {
    username: string
    senhaHash: string
    nome: string
    role: string
    acessos: string[]
  }): Promise<void> {
    await db
      .insert(usuarios)
      .values({ ...u, criadoEm: new Date().toISOString() })
      .onConflictDoUpdate({
        target: usuarios.username,
        set: { senhaHash: u.senhaHash, nome: u.nome, role: u.role, acessos: u.acessos },
      })
  },
}
