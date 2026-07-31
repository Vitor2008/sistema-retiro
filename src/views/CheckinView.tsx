import { useEffect } from 'react'
import { AttachmentLink } from '../components/AttachmentLink'
import { appConfig } from '../config'
import { fmt, initials } from '../lib/format'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { ativos, ofertado, pago, statusPag } from '../store/selectors'
import type { StatusInscricao, StatusPagamento } from '../types'

const pagInfo: Record<StatusPagamento, [string, string]> = {
  confirmado: ['chip-approved', 'Confirmado'],
  parcial: ['chip-progress', 'Parcial'],
  pendente: ['chip-closed', 'Pendente'],
}
const insInfo: Record<StatusInscricao, [string, string]> = {
  confirmada: ['chip-final', 'Confirmada'],
  pendente: ['chip-progress', 'Pendente'],
  cancelada: ['chip-rejected', 'Cancelada'],
}

export function CheckinView() {
  const { state, patch } = useRetiro()
  const { setModal } = useActions()

  // Ao abrir o Check-in, sempre começa mostrando qualquer forma de pagamento.
  useEffect(() => {
    patch({ ciPag: 'todos' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const s = state
  const valor = s.retiro.valor
  // Eventos avulsos não têm o conceito de Convidado/Servo → oculta a coluna Tipo.
  const avulso = s.retiro.tipo === 'avulso'
  const atv = ativos(s)
  const narrow = s.narrow
  const compacto = appConfig.modoCompacto
  const seg = (on: boolean) => (on ? 'on' : '')
  const busca = s.ciBusca.toLowerCase()

  const filtrados = s.inscritos.filter((p) => {
    if (busca && !(p.nome.toLowerCase().includes(busca) || p.lider.toLowerCase().includes(busca))) return false
    if (s.ciTipo === 'servo' && p.tipo !== 'Servo') return false
    if (s.ciTipo === 'enc' && p.tipo !== 'Encontrista') return false
    const sp = statusPag(s, p)
    if (s.ciPag === 'pend' && (sp === 'confirmado' || p.statusInscricao === 'cancelada')) return false
    if (s.ciPag === 'ok' && sp !== 'confirmado') return false
    return true
  })

  const arrecadadoTot = s.inscritos.reduce((a, p) => a + pago(p), 0)
  const aReceberTot = atv.reduce((a, p) => a + Math.max(0, valor - pago(p) - ofertado(p)), 0)

  return (
    <div data-screen-label="Check-in">
      <div className="crumbs">
        <span>Operação</span>
        <span className="last">Check-in</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Check-in — {s.retiro.nome}</h1>
          <div className="desc">Confirmação de pagamentos e presença na recepção.</div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: narrow ? '1fr 1fr' : 'repeat(4, 1fr)' }}>
        <div className="kpi">
          <div className="topline">Inscritos ativos</div>
          <div className="v">{atv.length}</div>
          <div className="meta">de {s.retiro.max} vagas</div>
        </div>
        <div className="kpi">
          <div className="topline">Confirmados</div>
          <div className="v" style={{ color: 'var(--color-primary)' }}>
            {atv.filter((p) => p.statusInscricao === 'confirmada').length}
          </div>
          <div className="meta">check-in feito</div>
        </div>
        <div className="kpi">
          <div className="topline">Pagamento pendente</div>
          <div className="v" style={{ color: 'var(--status-progress-fg)' }}>
            {atv.filter((p) => statusPag(s, p) !== 'confirmado').length}
          </div>
          <div className="meta">incl. parciais</div>
        </div>
        <div className="kpi">
          <div className="topline">Arrecadado</div>
          <div className="v" style={{ fontSize: 22 }}>{fmt(arrecadadoTot)}</div>
          <div className="meta">a receber {fmt(aReceberTot)}</div>
        </div>
      </div>

      <div className="filterbar">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="10" cy="10" r="7"></circle>
            <line x1="21" y1="21" x2="15" y2="15"></line>
          </svg>
          <input placeholder="Buscar por nome ou líder…" value={s.ciBusca} onChange={(e) => patch({ ciBusca: e.target.value })} />
        </div>
        <div className="seg">
          <button className={seg(s.ciTipo === 'todos')} onClick={() => patch({ ciTipo: 'todos' })}>Todos</button>
          <button className={seg(s.ciTipo === 'servo')} onClick={() => patch({ ciTipo: 'servo' })}>Servos</button>
          <button className={seg(s.ciTipo === 'enc')} onClick={() => patch({ ciTipo: 'enc' })}>Encontristas</button>
        </div>
        <div className="seg">
          <button className={seg(s.ciPag === 'todos')} onClick={() => patch({ ciPag: 'todos' })}>Qualquer pagamento</button>
          <button className={seg(s.ciPag === 'pend')} onClick={() => patch({ ciPag: 'pend' })}>Pendentes</button>
          <button className={seg(s.ciPag === 'ok')} onClick={() => patch({ ciPag: 'ok' })}>Confirmados</button>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--fg-default)', marginBottom: 10 }}>
        <b>{filtrados.length}</b> inscritos encontrados.
      </div>

      <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Inscrito</th>
              {!avulso && <th>Tipo</th>}
              <th>Líder</th>
              <th>Prédio</th>
              <th>Pagamento</th>
              <th>Status pgto.</th>
              <th>Inscrição</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const sp = statusPag(s, p)
              const pg = pago(p)
              const of = ofertado(p)
              const cancelada = p.statusInscricao === 'cancelada'
              let resumo = ''
              if (of >= valor) resumo = 'abatido como oferta'
              else if (pg > 0)
                resumo = fmt(pg) + ' pago' + (of ? ' + oferta' : '') + (sp === 'parcial' ? ' · resta ' + fmt(valor - pg - of) : '')
              else resumo = 'nada recebido'

              return (
                <tr
                  key={p.id}
                  onClick={() => setModal({ type: 'detalhes', pid: p.id })}
                  style={{ opacity: cancelada ? 0.55 : 1, cursor: 'pointer' }}
                >
                  <td style={{ padding: (compacto ? '6px' : '12px') + ' 14px' }}>
                    <div className="resp-cell">
                      <div className="av">{initials(p.nome)}</div>
                      <div>
                        <div className="vaga-name">{p.nome}</div>
                        <div className="vaga-id">{p.tel}</div>
                      </div>
                    </div>
                  </td>
                  {!avulso && (
                    <td>
                      <span
                        className="chip-mini"
                        style={{
                          background: p.tipo === 'Servo' ? 'var(--color-primary-tint)' : 'var(--color-secondary-tint)',
                          color: p.tipo === 'Servo' ? 'var(--color-primary)' : 'var(--color-secondary-hover)',
                        }}
                      >
                        {p.tipo}
                      </span>
                    </td>
                  )}
                  <td style={{ fontSize: 12 }}>{p.lider}</td>
                  <td style={{ fontSize: 12 }}>{p.predio || '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {p.forma}
                    <div className="vaga-id">{cancelada ? '—' : resumo}</div>
                    {p.comprovanteId && (
                      <div style={{ marginTop: 2 }} onClick={(e) => e.stopPropagation()}>
                        <AttachmentLink fileId={p.comprovanteId} label="📎 comprovante" style={{ fontSize: 11 }} />
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={'chip-mini ' + pagInfo[sp][0]}>{pagInfo[sp][1]}</span>
                  </td>
                  <td>
                    <span className={'chip-mini ' + insInfo[p.statusInscricao][0]}>{insInfo[p.statusInscricao][1]}</span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {!cancelada ? (
                      <div style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        {/* Já confirmada e totalmente paga: nada a confirmar. */}
                        {!(p.statusInscricao === 'confirmada' && sp === 'confirmado') && (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() =>
                              setModal({
                                type: 'pagamento',
                                pid: p.id,
                                valorPago: String(Math.max(0, valor - pg - of)),
                                forma: p.forma,
                                obs: '',
                                oferta: false,
                                dataPrevista: '',
                                comprovante: null,
                              })
                            }
                          >
                            Confirmar inscrição
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() =>
                            setModal({
                              type: 'editarInscricao',
                              pid: p.id,
                              nome: p.nome,
                              tel: p.tel,
                              genero: p.genero,
                              idade: p.idade != null ? String(p.idade) : '',
                              dataNascimento: p.dataNascimento,
                              tipo: p.tipo,
                              vez: p.vez,
                              lider: p.lider,
                              predio: p.predio,
                              conducao: p.conducao,
                              forma: p.forma,
                            })
                          }
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-default btn-xs"
                          style={{ color: 'var(--status-rejected-fg)' }}
                          onClick={() => setModal({ type: 'cancelar', pid: p.id, obs: '' })}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{p.cancelInfo}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
