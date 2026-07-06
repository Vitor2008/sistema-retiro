import { appConfig } from '../config'
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

  const valor = state.retiro.valor
  const atv = ativos(state)
  const linkAberto = linkAbertoEfetivo(state)
  const vagasRest = vagasRestantes(state)
  const periodo = periodoSel(state)
  const link = 'https://' + linkPublico(state, appConfig.nomeIgreja)
  const pctIns = Math.min(100, Math.round((atv.length / state.retiro.max) * 100))

  const abrirNovoRetiro = () =>
    setModal({ type: 'retiro', novo: true, nome: '', inicio: '', fim: '', valor: '260', max: '45' })

  const editarRetiro = () =>
    setModal({
      type: 'retiro',
      novo: false,
      nome: state.retiro.nome,
      inicio: state.retiro.inicio,
      fim: state.retiro.fim,
      valor: String(valor),
      max: String(state.retiro.max),
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
                onClick={() => toast('Link copiado: ' + linkPublico(state, appConfig.nomeIgreja))}
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
              <button className="btn btn-default btn-sm" onClick={() => patch({ view: 'inscricao' })}>
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
    </div>
  )
}
