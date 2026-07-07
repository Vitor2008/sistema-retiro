import { useState } from 'react'
import { appConfig } from '../config'
import { ApiError } from '../services/api/apiClient'
import { useAuth } from '../store/AuthContext'

export function LoginView() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (carregando) return
    setErro('')
    setCarregando(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível entrar. Verifique a conexão.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        padding: 16,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <img
            src={appConfig.logoUrl}
            alt={appConfig.nomeIgreja}
            width={44}
            height={44}
            style={{ borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--fg-strong)' }}>
              Retiros · {appConfig.nomeIgreja}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{appConfig.nomeIgrejaCompleto}</div>
          </div>
        </div>

        <h2 style={{ marginBottom: 4 }}>Entrar</h2>
        <p className="dim" style={{ fontSize: 13, marginBottom: 20 }}>
          Acesse com seu usuário e senha.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Usuário
            </label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex.: adm"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Senha
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {erro && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--status-rejected-fg)',
                background: 'var(--status-rejected-bg)',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={carregando}
            style={{ justifyContent: 'center', padding: 12, fontSize: 15, marginTop: 4, opacity: carregando ? 0.7 : 1 }}
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
