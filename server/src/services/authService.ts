import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../env.js'
import { usuarioRepository } from '../repositories/usuarioRepository.js'

export interface AuthUser {
  id: number
  username: string
  nome: string
  role: string
  acessos: string[]
}

export interface TokenPayload {
  sub: number
  username: string
  role: string
  acessos: string[]
}

const EXPIRES_IN = '12h'

export const authService = {
  /** Valida credenciais contra a tabela `usuarios` e devolve token + usuário. */
  async login(
    username: string,
    senha: string,
  ): Promise<{ token: string; user: AuthUser }> {
    if (!username?.trim() || !senha) throw new Error('Informe usuário e senha.')
    const u = await usuarioRepository.findByUsername(username.trim())
    // Mensagem genérica para não revelar se o usuário existe.
    if (!u) throw new Error('Usuário ou senha inválidos.')
    const ok = await bcrypt.compare(senha, u.senhaHash)
    if (!ok) throw new Error('Usuário ou senha inválidos.')

    const acessos = u.acessos ?? []
    const payload: TokenPayload = {
      sub: u.id,
      username: u.username,
      role: u.role,
      acessos,
    }
    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN })
    return {
      token,
      user: { id: u.id, username: u.username, nome: u.nome, role: u.role, acessos },
    }
  },

  /** Verifica um token; lança se inválido/expirado. */
  verify(token: string): TokenPayload {
    return jwt.verify(token, env.jwtSecret) as unknown as TokenPayload
  },

  hash(senha: string): Promise<string> {
    return bcrypt.hash(senha, 10)
  },
}
