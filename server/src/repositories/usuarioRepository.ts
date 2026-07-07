import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { usuarios } from '../db/schema.js'

export type UsuarioRow = typeof usuarios.$inferSelect

export const usuarioRepository = {
  async findByUsername(username: string): Promise<UsuarioRow | null> {
    const [row] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.username, username))
    return row ?? null
  },

  /** Cria ou atualiza um usuário pelo username (usado no seed do admin). */
  async upsert(u: {
    username: string
    senhaHash: string
    nome: string
    role: string
  }): Promise<void> {
    await db
      .insert(usuarios)
      .values({ ...u, criadoEm: new Date().toISOString() })
      .onConflictDoUpdate({
        target: usuarios.username,
        set: { senhaHash: u.senhaHash, nome: u.nome, role: u.role },
      })
  },
}
