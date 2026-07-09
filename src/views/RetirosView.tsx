import { useState } from 'react'
import { fmt } from '../lib/format'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import {
  ativos,
  linkAbertoEfetivo,
  linkPublico,
  periodo as periodoSel,
  vagasRestantes,
} from '../store/selectors'

export function RetirosView() {
  const { state, patch, toast } = useRetiro()
  const { toggleLink, setModal } = useActions()
  const [novoLider, setNovoLider] = useState('')

  const valor = state.retiro.valor
  const atv = ativos(state)
  const linkAberto = linkAbertoEfetivo(state)
  const vagasRest = vagasRestantes(state)
  const periodo = periodoSel(state)
  const link = linkPublico(state)
  const copiarLink = () => {
    navigator.clipboard?.writeText(link).catch(() => {})
    toast('Link copiado: ' + link)
  }
  const abrirFormulario = () => window.open(link, '_blank', 'noopener')
  const pctIns =
    state.retiro.max > 0
      ? Math.min(100, Math.round((atv.length / state.retiro.max) * 100))
      : 0

  const addLider = () => {
    const nome = novoLider.trim()
    if (!nome) return
    if (state.lideres.some((l) => l.toLowerCase() === nome.toLowerCase())) {
      toast('Esse líder já está cadastrado.')
      return
    }
    patch({ lideres: [...state.lideres, nome] })
    setNovoLider('')
  }
  const removeLider = (nome: string) =>
    patch({ lideres: state.lideres.filter((l) => l !== nome) })

  const abrirNovoRetiro = () =>
    setModal({ type: 'retiro', novo: true, nome: '', inicio: '', fim: '', valor: '260', max: '45', bannerId: null })

  const editarRetiro = () =>
    setModal({
      type: 'retiro',
      novo: false,
      nome: state.retiro.nome,
      inicio: state.retiro.inicio,
      fim: state.retiro.fim,
      valor: String(valor),
      max: String(state.retiro.max),
      bannerId: state.retiro.bannerId,
    })

  return (
    <div data-screen-label="Retiros">
      <div className="crumbs">
        <span>Retiros</span>
        <span className="last">Gestão de retiros</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Retiros</h1>
          <div className="desc">Cadastro, link de inscrição e histórico de retiros.</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={abrirNovoRetiro}>
            + Criar retiro
          </button>
        </div>
      </div>

      {/* Retiro atual */}
      <div
        className="card"
        style={{ marginBottom: 12, padding: '18px 20px', borderLeft: '3px solid var(--color-secondary)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 16 }}>{state.retiro.nome}</h3>
              <span
                className="chip-mini"
                style={{
                  background: linkAberto ? 'var(--color-sage-soft)' : 'var(--status-rejected-bg)',
                  color: linkAberto ? 'var(--status-final-fg)' : 'var(--status-rejected-fg)',
                }}
              >
                {linkAberto ? 'Inscrições abertas' : 'Inscrições fechadas'}
              </span>
            </div>
            <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>
              {periodo} · Inscrição {fmt(valor)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ width: 180, height: 8, background: 'var(--bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: pctIns + '%',
                    background: pctIns >= 100 ? 'var(--status-rejected-fg)' : 'var(--color-sage)',
                    borderRadius: 999,
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                <b style={{ color: 'var(--fg-strong)' }}>{atv.length}</b> / {state.retiro.max} vagas
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-muted)', border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '8px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeLinecap="round">
                <path d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-.5.5"></path>
                <path d="M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l.5-.5"></path>
              </svg>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {link}
              </span>
              <button
                className="btn btn-default btn-xs"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
                onClick={copiarLink}
              >
                Copiar
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                className={'btn ' + (state.retiro.aberto ? 'btn-default' : 'btn-secondary') + ' btn-sm'}
                onClick={toggleLink}
              >
                {state.retiro.aberto ? 'Fechar link de inscrição' : 'Reabrir link de inscrição'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={editarRetiro}>
                Editar retiro
              </button>
              <button className="btn btn-default btn-sm" onClick={abrirFormulario}>
                Ver formulário
              </button>
              {state.retiro.aberto && vagasRest === 0 && (
                <span className="chip chip-rejected">
                  Vagas esgotadas — link fechado automaticamente
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Retiros passados */}
      {state.retirosPassados.map((r) => (
        <div
          key={r.nome}
          className="card"
          style={{ marginBottom: 12, padding: '18px 20px', borderLeft: '3px solid var(--border-default)' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 16 }}>{r.nome}</h3>
                <span className="chip-mini" style={{ background: 'var(--status-closed-bg)', color: 'var(--status-closed-fg)' }}>
                  Concluído
                </span>
              </div>
              <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>
                {r.periodo} · Inscrição {fmt(260)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <div style={{ width: 180, height: 8, background: 'var(--bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: Math.round((r.inscritos / r.max) * 100) + '%', background: 'var(--border-strong)', borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  <b style={{ color: 'var(--fg-strong)' }}>{r.inscritos}</b> / {r.max} vagas
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Arrecadado</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-primary)' }}>{fmt(r.arrecadado)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Saldo</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--status-final-fg)' }}>{fmt(r.saldo)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Líderes (usados no formulário de inscrição) */}
      <div className="tbl-wrap" style={{ marginTop: 8 }}>
        <div className="tbl-head-bar">
          <h3>Líderes</h3>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {state.lideres.length} cadastrado(s)
          </span>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 10 }}>
            Aparecem no campo “Líder / quem convidou” do formulário de inscrição.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, maxWidth: 420 }}>
            <input
              className="input"
              value={novoLider}
              onChange={(e) => setNovoLider(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addLider()
              }}
              placeholder="Nome do líder"
            />
            <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={addLider}>
              Adicionar
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {state.lideres.map((l) => (
              <span
                key={l}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-muted)', borderRadius: 999, padding: '4px 6px 4px 12px', fontSize: 13 }}
              >
                {l}
                <button
                  onClick={() => removeLider(l)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: '0 3px', fontSize: 14, lineHeight: 1 }}
                  title="Remover"
                >
                  ×
                </button>
              </span>
            ))}
            {state.lideres.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Nenhum líder cadastrado ainda.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
