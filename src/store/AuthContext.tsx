import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiClient } from '../services/api/apiClient'
import { session, type SessionUser } from '../services/auth/session'

interface LoginResponse {
  token: string
  user: SessionUser
}

interface AuthContextValue {
  user: SessionUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => session.getUser())

  const logout = useCallback(() => {
    session.clear()
    setUser(null)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    })
    session.set(res.token, res.user)
    setUser(res.user)
  }, [])

  // Se qualquer chamada da API responder 401, derruba a sessão.
  useEffect(() => {
    session.onUnauthorized = () => {
      session.clear()
      setUser(null)
    }
    return () => {
      session.onUnauthorized = null
    }
  }, [])

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user && !!session.getToken(),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
