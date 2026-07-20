import { useEffect, useState } from 'react'
import { ACESSOS, labelAcesso } from '../acessos'
import { apiClient, ApiError } from '../services/api/apiClient'
import { useAuth } from '../store/AuthContext'

interface Usuario {
  id: number
  username: string
  nome: string
  role: string
  acessos: string[]
  predioId: number | null
}

interface Predio {
  id: number
  nome: string
  retiroId: string | null
}

interface RetiroResumo {
  id: string
  nome: string
}

interface FormState {
  id: number | null
  username: string
  nome: string
  password: string
  acessos: string[]
  predioId: number | null
}

const vazio: FormState = { id: null, username: '', nome: '', password: '', acessos: [], predioId: null }

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function UsuariosView() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [predios, setPredios] = useState<Predio[]>([])
  const [retiroNome, setRetiroNome] = useState<Record<string, string>>({})
  const [form, setForm] = useState<FormState | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const rotuloPredio = (p: Predio) =>
    p.nome + (p.retiroId && retiroNome[p.retiroId] ? ' — ' + retiroNome[p.retiroId] : '')
  const nomePredio = (id: number | null) => {
    const p = predios.find((x) => x.id === id)
    return p ? rotuloPredio(p) : '—'
  }

  const carregar = async () => {
    try {
      const [us, prs, rets] = await Promise.all([
        apiClient.get<Usuario[]>('/usuarios'),
        apiClient.get<Predio[]>('/predios'),
        apiClient.get<RetiroResumo[]>('/retiros'),
      ])
      setUsuarios(us)
      setPredios(prs)
      setRetiroNome(Object.fromEntries(rets.map((r) => [r.id, r.nome])))
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao carregar usuários.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  const abrirNovo = () => {
    setErro('')
    setForm({ ...vazio })
  }
  const abrirEdicao = (u: Usuario) => {
    setErro('')
    setForm({ id: u.id, username: u.username, nome: u.nome, password: '', acessos: [...u.acessos], predioId: u.predioId ?? null })
  }

  const toggleAcesso = (id: string) => {
    if (!form) return
    setForm({
      ...form,
      acessos: form.acessos.includes(id)
        ? form.acessos.filter((a) => a !== id)
        : [...form.acessos, id],
    })
  }

  const salvar = async () => {
    if (!form || salvando) return
    setErro('')
    setSalvando(true)
    try {
      if (form.id === null) {
        await apiClient.post('/usuarios', {
          username: form.username,
          nome: form.nome,
          password: form.password,
          acessos: form.acessos,
          predioId: form.predioId,
        })
      } else {
        await apiClient.put('/usuarios/' + form.id, {
          nome: form.nome,
          acessos: form.acessos,
          predioId: form.predioId,
          ...(form.password ? { password: form.password } : {}),
        })
      }
      setForm(null)
      await carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao salvar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (u: Usuario) => {
    if (!window.confirm(`Excluir o usuário "${u.username}"?`)) return
    setErro('')
    try {
      await apiClient.delete('/usuarios/' + u.id)
      await carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao excluir usuário.')
    }
  }

  return (
    <div data-screen-label="Usuários">
      <div className="crumbs">
        <span>Administração</span>
        <span className="last">Usuários</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Usuários e acessos</h1>
          <div className="desc">Crie usuários e defina a que áreas cada um tem acesso.</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={abrirNovo}>+ Novo usuário</button>
        </div>
      </div>

      {erro && (
        <div style={{ fontSize: 13, color: 'var(--status-rejected-fg)', background: 'var(--status-rejected-bg)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
          {erro}
        </div>
      )}

      <div className="tbl-wrap">
        <div className="tbl-head-bar">
          <h3>Usuários cadastrados</h3>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{usuarios.length} usuário(s)</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Prédio</th>
                <th>Acessos</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: 24 }}>Carregando…</td></tr>
              )}
              {!carregando && usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="vaga-name">{u.nome}</td>
                  <td style={{ fontSize: 12 }}>@{u.username}</td>
                  <td style={{ fontSize: 12 }}>{nomePredio(u.predioId)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {u.acessos.map((a) => (
                        <span key={a} className="chip-mini" style={{ background: a === 'adm' ? 'var(--color-primary-tint)' : 'var(--bg-muted)', color: a === 'adm' ? 'var(--color-primary)' : 'var(--fg-default)' }}>
                          {labelAcesso(a)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn btn-outline btn-xs" onClick={() => abrirEdicao(u)}>Editar</button>
                      <button className="btn btn-default btn-xs" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => excluir(u)} disabled={u.id === user?.id}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!carregando && usuarios.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: 24 }}>Nenhum usuário.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div
          onClick={() => setForm(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', animation: 'popIn .18s var(--ease-default)', padding: '22px 24px' }}
          >
            <h3 style={{ marginBottom: 16 }}>{form.id === null ? 'Novo usuário' : 'Editar usuário'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
              </div>
              <div>
                <label style={labelStyle}>Usuário (login)</label>
                <input
                  className="input"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="ex.: joao"
                  disabled={form.id !== null}
                  style={{ opacity: form.id !== null ? 0.6 : 1 }}
                />
              </div>
              <div>
                <label style={labelStyle}>{form.id === null ? 'Senha' : 'Nova senha (deixe em branco para manter)'}</label>
                <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="mín. 6 caracteres" autoComplete="new-password" />
              </div>
              <div>
                <label style={labelStyle}>Prédio (define o evento que o usuário enxerga)</label>
                <select
                  className="input"
                  value={form.predioId ?? ''}
                  onChange={(e) => setForm({ ...form, predioId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Sem prédio (ex.: administrador — vê todos)</option>
                  {predios.map((p) => (
                    <option key={p.id} value={p.id}>{rotuloPredio(p)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Acessos</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ACESSOS.map((a) => (
                    <label key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={form.acessos.includes(a.id)} onChange={() => toggleAcesso(a.id)} style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--color-primary)' }} />
                      <span>
                        <b>{a.label}</b>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{a.descricao}</div>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button className="btn btn-default" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
