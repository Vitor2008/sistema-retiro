// ============================================================================
// Sessão de autenticação (token JWT + usuário) persistida no localStorage.
// Módulo não-React, para o apiClient e o fileService lerem o token corrente.
// ============================================================================

export interface SessionUser {
  id: number
  username: string
  nome: string
  role: string
}

const TOKEN_KEY = 'retiros-token'
const USER_KEY = 'retiros-user'

let token: string | null = readToken()

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const session = {
  getToken: (): string | null => token,

  getUser(): SessionUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as SessionUser) : null
    } catch {
      return null
    }
  },

  set(tok: string, user: SessionUser) {
    token = tok
    try {
      localStorage.setItem(TOKEN_KEY, tok)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
      /* noop */
    }
  },

  clear() {
    token = null
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      /* noop */
    }
  },

  /** Chamado quando a API responde 401 (sessão expirada/ inválida). */
  onUnauthorized: null as null | (() => void),
}
