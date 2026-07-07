// ============================================================================
// Cliente HTTP fino para a API do backend. Base URL vem de VITE_API_URL.
// ============================================================================

import { session } from '../auth/session'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function authHeaders(): Record<string, string> {
  const token = session.getToken()
  return token ? { Authorization: 'Bearer ' + token } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers },
  })
  // 401 numa rota protegida = sessão expirada → derruba o login.
  // No próprio /auth/login, 401 é credencial inválida e deve seguir o fluxo normal.
  if (res.status === 401 && !path.startsWith('/auth/')) {
    session.onUnauthorized?.()
    throw new ApiError('Sessão expirada. Faça login novamente.', 401)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const body = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    throw new ApiError(body?.error ?? res.statusText, res.status)
  }
  return body as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}
