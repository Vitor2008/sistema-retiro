import { useEffect, useState } from 'react'
import { apiClient, ApiError } from '../services/api/apiClient'

interface Predio {
  id: number
  nome: string
}

export function PrediosView() {
  const [predios, setPredios] = useState<Predio[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editNome, setEditNome] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [aExcluir, setAExcluir] = useState<Predio | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = async () => {
    try {
      setPredios(await apiClient.get<Predio[]>('/predios'))
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao carregar prédios.')
    } finally {
      setCarregando(false)
    }
  }
  useEffect(() => {
    void carregar()
  }, [])

  const adicionar = async () => {
    const nome = novoNome.trim()
    if (!nome) return
    setErro('')
    try {
      await apiClient.post('/predios', { nome })
      setNovoNome('')
      await carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao cadastrar prédio.')
    }
  }

  const salvarEdicao = async () => {
    const nome = editNome.trim()
    if (!nome || editId === null) return
    setErro('')
    try {
      await apiClient.put('/predios/' + editId, { nome })
      setEditId(null)
      setEditNome('')
      await carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao renomear prédio.')
    }
  }

  const confirmarExclusao = async () => {
    if (!aExcluir) return
    setErro('')
    setExcluindo(true)
    try {
      await apiClient.delete('/predios/' + aExcluir.id)
      setAExcluir(null)
      await carregar()
    } catch (e) {
      setAExcluir(null)
      setErro(e instanceof ApiError ? e.message : 'Erro ao excluir prédio.')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div data-screen-label="Prédios">
      <div className="crumbs">
        <span>Administração</span>
        <span className="last">Prédios</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Prédios</h1>
          <div className="desc">Catálogo de prédios usado nos eventos (campo "Qual prédio?").</div>
        </div>
      </div>

      {erro && (
        <div style={{ fontSize: 13, color: 'var(--status-rejected-fg)', background: 'var(--status-rejected-bg)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
          {erro}
        </div>
      )}

      <div className="tbl-wrap">
        <div className="tbl-head-bar">
          <h3>Prédios cadastrados</h3>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{predios.length} prédio(s)</span>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, maxWidth: 480 }}>
            <input
              className="input"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') adicionar()
              }}
              placeholder="Nome do prédio (ex.: IMEL - Areão)"
            />
            <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={adicionar}>
              + Cadastrar
            </button>
          </div>

          {carregando ? (
            <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Carregando…</div>
          ) : predios.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum prédio cadastrado ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {predios.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderBottom: '1px solid var(--border-default)' }}>
                  {editId === p.id ? (
                    <>
                      <input
                        className="input"
                        style={{ maxWidth: 320 }}
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') salvarEdicao()
                          if (e.key === 'Escape') setEditId(null)
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'inline-flex', gap: 6, marginLeft: 'auto' }}>
                        <button className="btn btn-primary btn-xs" onClick={salvarEdicao}>Salvar</button>
                        <button className="btn btn-default btn-xs" onClick={() => setEditId(null)}>Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 14 }}>{p.nome}</span>
                      <div style={{ display: 'inline-flex', gap: 6, marginLeft: 'auto' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => { setEditId(p.id); setEditNome(p.nome); setErro('') }}>
                          Editar
                        </button>
                        <button className="btn btn-default btn-xs" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => { setAExcluir(p); setErro('') }}>
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {aExcluir && (
        <div
          onClick={() => !excluindo && setAExcluir(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 440, animation: 'popIn .18s var(--ease-default)' }}
          >
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Excluir prédio</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Tem certeza que deseja excluir o prédio <b>{aExcluir.nome}</b>? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" disabled={excluindo} onClick={() => setAExcluir(null)}>
                  Cancelar
                </button>
                <button
                  className="btn"
                  style={{ background: 'var(--status-rejected-fg)', color: '#fff' }}
                  disabled={excluindo}
                  onClick={confirmarExclusao}
                >
                  {excluindo ? 'Excluindo…' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
