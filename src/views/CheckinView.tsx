import { useEffect, useState } from 'react'
import { AttachmentLink } from '../components/AttachmentLink'
import { appConfig } from '../config'
import { fmt, initials } from '../lib/format'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { ofertado, pago, statusPag, valorInscricao } from '../store/selectors'
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

  // Filtros de visualização (estado local, não sincronizado).
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  // Filtro geral por prédio — afeta os cards E a lista.
  const [filtroPredio, setFiltroPredio] = useState('')
  const [alfabetico, setAlfabetico] = useState(false)

  // Ao abrir o Check-in, sempre começa mostrando qualquer forma de pagamento.
  useEffect(() => {
    patch({ ciPag: 'todos' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const s = state
  // Eventos avulsos não têm o conceito de Convidado/Servo → oculta a coluna Tipo.
  const avulso = s.retiro.tipo === 'avulso'
  const narrow = s.narrow
  const compacto = appConfig.modoCompacto
  const seg = (on: boolean) => (on ? 'on' : '')
  const busca = s.ciBusca.toLowerCase()

  // Prédios do evento (participantes + os que aparecem em inscrições).
  const prediosOpcoes = Array.from(
    new Set([...s.predios, ...s.inscritos.map((p) => p.predio).filter(Boolean)]),
  ).sort((a, b) => a.localeCompare(b))

  // Base filtrada por prédio — usada nos cards E na lista.
  const inscritosBase = filtroPredio ? s.inscritos.filter((p) => (p.predio || '') === filtroPredio) : s.inscritos
  const atv = inscritosBase.filter((p) => p.statusInscricao !== 'cancelada')

  const filtrados0 = inscritosBase.filter((p) => {
    if (busca && !(p.nome.toLowerCase().includes(busca) || p.lider.toLowerCase().includes(busca))) return false
    if (s.ciTipo === 'servo' && p.tipo !== 'Servo') return false
    if (s.ciTipo === 'enc' && p.tipo !== 'Encontrista') return false
    // Período pela data da inscrição (YYYY-MM-DD de criadoEm).
    if (de || ate) {
      const d = (p.criadoEm || '').slice(0, 10)
      if (de && (!d || d < de)) return false
      if (ate && (!d || d > ate)) return false
    }
    const sp = statusPag(s, p)
    if (s.ciPag === 'pend' && (sp === 'confirmado' || p.statusInscricao === 'cancelada')) return false
    if (s.ciPag === 'ok' && sp !== 'confirmado') return false
    return true
  })
  // Sem ordenação alfabética a lista segue a ordem de inscrição.
  const filtrados = alfabetico
    ? filtrados0.slice().sort((a, b) => a.nome.localeCompare(b.nome))
    : filtrados0

  const arrecadadoTot = inscritosBase.reduce((a, p) => a + pago(p), 0)
  const aReceberTot = atv.reduce((a, p) => a + Math.max(0, valorInscricao(s, p) - pago(p) - ofertado(p)), 0)

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
        <div className="actions" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)' }}>Prédio:</span>
          <select className="input" style={{ width: 'auto', minWidth: 180 }} value={filtroPredio} onChange={(e) => setFiltroPredio(e.target.value)}>
            <option value="">Todos os prédios</option>
            {prediosOpcoes.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span style={{ fontWeight: 600 }}>Período da inscrição:</span>
          <input type="date" className="input" style={{ width: 'auto', padding: '6px 8px', fontSize: 12 }} value={de} max={ate || undefined} onChange={(e) => setDe(e.target.value)} title="Data inicial" />
          <span>até</span>
          <input type="date" className="input" style={{ width: 'auto', padding: '6px 8px', fontSize: 12 }} value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} title="Data final" />
          {(de || ate) && (
            <button className="btn btn-default btn-xs" onClick={() => { setDe(''); setAte('') }}>Limpar</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--fg-default)', marginBottom: 10 }}>
        <span>
          <b>{filtrados.length}</b> inscritos encontrados.
        </span>
        <button
          className={'btn btn-sm ' + (alfabetico ? 'btn-secondary' : 'btn-outline')}
          onClick={() => setAlfabetico((v) => !v)}
          title={alfabetico ? 'Voltar à ordem de inscrição' : 'Ordenar os nomes de A a Z'}
        >
          {alfabetico ? '↓ A–Z ativo' : '↓ Ordenar A–Z'}
        </button>
      </div>

      <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Inscrito</th>
              {!avulso && <th>Tipo</th>}
              <th>Líder</th>
              <th>Prédio</th>
              <th>Valor inscrição</th>
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
              const vInsc = valorInscricao(s, p)
              const cancelada = p.statusInscricao === 'cancelada'
              let resumo = ''
              if (of >= vInsc) resumo = 'abatido como oferta'
              else if (pg > 0)
                resumo = fmt(pg) + ' pago' + (of ? ' + oferta' : '') + (sp === 'parcial' ? ' · resta ' + fmt(vInsc - pg - of) : '')
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
                  <td style={{ fontSize: 12, fontWeight: 600 }}>{fmt(vInsc)}</td>
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
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => setModal({ type: 'detalhes', pid: p.id })}
                    >
                      Ver detalhes
                    </button>
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
