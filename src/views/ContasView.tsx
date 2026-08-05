import { AttachmentLink } from '../components/AttachmentLink'
import { fmt, initials } from '../lib/format'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { ativos, cantinaTotais, ofertado, pago, statusPag, valorInscricao } from '../store/selectors'
import { useViewport } from '../hooks/useViewport'
import type { StatusPagamento } from '../types'

const pagInfo: Record<StatusPagamento, [string, string]> = {
  confirmado: ['chip-approved', 'Pago'],
  parcial: ['chip-progress', 'Parcial'],
  pendente: ['chip-closed', 'Pendente'],
}

export function ContasView() {
  const { state, patch } = useRetiro()
  const { exportarRelatorio, setModal } = useActions()
  const { mid } = useViewport()

  const s = state
  const narrow = s.narrow
  const atv = ativos(s)
  const confirmados = atv.filter((p) => p.statusInscricao === 'confirmada')

  const arrecadadoTot = s.inscritos.reduce((a, p) => a + pago(p), 0)
  const aReceberTot = atv.reduce((a, p) => a + Math.max(0, valorInscricao(s, p) - pago(p) - ofertado(p)), 0)
  const ofertaUtilizada = s.inscritos.reduce((a, p) => a + ofertado(p), 0)
  const ofertaRecebida = s.retiro.oferta || 0
  const ofertaDisponivel = ofertaRecebida - ofertaUtilizada
  const despesasTot = s.despesas.reduce((a, d) => a + d.valor, 0)
  const cantina = cantinaTotais(s)
  // Entrada conta a oferta RECEBIDA (cadastrada); o abatimento é só uso do saldo.
  const totalEntradas = arrecadadoTot + ofertaRecebida + cantina.vendido
  const saldo = totalEntradas - despesasTot
  const ofertasN = s.inscritos.filter((p) => ofertado(p) > 0).length

  const checkinRows = confirmados
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((p) => {
      const sp = statusPag(s, p)
      const rest = Math.max(0, valorInscricao(s, p) - pago(p) - ofertado(p))
      const obs = p.pagamentos.map((x) => x.obs).filter(Boolean).slice(-1)[0] || ''
      return {
        id: p.id,
        nome: p.nome,
        tipo: p.tipo,
        lider: p.lider,
        cls: pagInfo[sp][0],
        label: pagInfo[sp][1],
        valorInscricao: fmt(valorInscricao(s, p)),
        pago: fmt(pago(p)),
        oferta: ofertado(p) ? fmt(ofertado(p)) : '—',
        saldo: rest ? fmt(rest) : '—',
        // Pendência (saldo > 0) destacada em vermelho.
        saldoColor: rest ? 'var(--status-rejected-fg)' : 'var(--fg-muted)',
        saldoBold: rest > 0,
        comprovanteId: p.comprovanteId,
        obs,
      }
    })

  return (
    <div data-screen-label="Prestação de contas">
      <div className="crumbs">
        <span>Financeiro</span>
        <span className="last">Prestação de contas</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Prestação de contas — {s.retiro.nome}</h1>
          <div className="desc">Entradas (inscrições, ofertas e cantina), despesas e saldo do evento.</div>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={exportarRelatorio}>
            Exportar relatório
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setModal({ type: 'oferta', valor: String(s.retiro.oferta || 0) })}
          >
            Cadastrar oferta
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModal({ type: 'despesa', categoria: s.categorias[0] ?? '', descricao: '', valor: '', comprovante: null })}
          >
            + Lançar despesa
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: narrow ? '1fr 1fr' : 'repeat(5, 1fr)' }}>
        <div className="kpi">
          <div className="topline">Total arrecadado</div>
          <div className="v" style={{ fontSize: 22, color: 'var(--color-primary)' }}>{fmt(arrecadadoTot)}</div>
          <div className="meta">{confirmados.length} inscrições confirmadas</div>
        </div>
        <div className="kpi">
          <div className="topline">A arrecadar</div>
          <div className="v" style={{ fontSize: 22, color: 'var(--status-progress-fg)' }}>{fmt(aReceberTot)}</div>
          <div className="meta">pendentes + parciais</div>
        </div>
        <div className="kpi">
          <div className="topline">Oferta recebida</div>
          <div className="v" style={{ fontSize: 22, color: 'var(--color-sage)' }}>{fmt(ofertaRecebida)}</div>
          <div className="meta" style={{ color: ofertaDisponivel < 0 ? 'var(--status-rejected-fg)' : undefined }}>
            usado {fmt(ofertaUtilizada)} · saldo {fmt(ofertaDisponivel)}
          </div>
        </div>
        <div className="kpi">
          <div className="topline">Total de despesas</div>
          <div className="v" style={{ fontSize: 22, color: 'var(--status-rejected-fg)' }}>{fmt(despesasTot)}</div>
          <div className="meta">{s.despesas.length} lançamentos</div>
        </div>
        <div className="kpi" style={{ borderColor: saldo >= 0 ? 'var(--color-sage)' : 'var(--status-rejected-fg)' }}>
          <div className="topline">Saldo do evento</div>
          <div className="v" style={{ fontSize: 22, color: saldo >= 0 ? 'var(--status-final-fg)' : 'var(--status-rejected-fg)' }}>{fmt(saldo)}</div>
          <div className="meta">entradas − despesas</div>
        </div>
      </div>

      {/* Entradas + Despesas */}
      <div className="row" style={{ gridTemplateColumns: narrow || mid ? '1fr' : '1fr 1fr' }}>
        {/* Entradas */}
        <div className="tbl-wrap" style={{ alignSelf: 'start' }}>
          <div className="tbl-head-bar">
            <h3>Entradas</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(totalEntradas)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <EntradaRow
              chip="Inscrições"
              chipBg="var(--color-primary-tint)"
              chipFg="var(--color-primary)"
              titulo="Inscrições pagas"
              sub={confirmados.length + ' inscrições confirmadas'}
              valor={fmt(arrecadadoTot)}
            />
            <EntradaRow
              chip="Ofertas"
              chipBg="var(--color-sage-soft)"
              chipFg="var(--color-sage)"
              titulo="Oferta recebida"
              sub={ofertasN + ' inscrições abatidas · usado ' + fmt(ofertaUtilizada)}
              valor={fmt(ofertaRecebida)}
            />
            <EntradaRow
              chip="Cantina"
              chipBg="var(--color-secondary-tint)"
              chipFg="var(--color-secondary-hover)"
              titulo="Total vendido na cantina"
              sub={cantina.vendas + ' vendas · recebido ' + fmt(cantina.recebido) + ' · em aberto ' + fmt(cantina.emAberto)}
              valor={fmt(cantina.vendido)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>
              <span>Total de entradas</span>
              <span style={{ color: 'var(--color-primary)' }}>{fmt(totalEntradas)}</span>
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="tbl-wrap" style={{ alignSelf: 'start' }}>
          <div className="tbl-head-bar">
            <h3>Despesas</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-rejected-fg)' }}>{fmt(despesasTot)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {s.despesas.map((d) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border-default)' }}>
                <span className="chip-mini" style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}>{d.categoria}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.descricao}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                    <AttachmentLink
                      fileId={d.anexoId}
                      label={'📎 ' + d.anexo}
                      fallback={d.anexo ? '📎 ' + d.anexo : 'sem comprovante'}
                      style={{ fontSize: 11 }}
                    />
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--status-rejected-fg)', whiteSpace: 'nowrap' }}>− {fmt(d.valor)}</div>
                <button
                  onClick={() => patch({ despesas: s.despesas.filter((x) => x.id !== d.id) })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 14, padding: 2 }}
                >
                  ×
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>
              <span>Total de despesas</span>
              <span style={{ color: 'var(--status-rejected-fg)' }}>{fmt(despesasTot)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de inscrições com check-in */}
      <div className="tbl-wrap" style={{ marginTop: 4 }}>
        <div className="tbl-head-bar">
          <h3>Inscrições com check-in — pagamentos</h3>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{checkinRows.length} confirmadas · pagas, parciais e pendentes</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Inscrito</th>
                <th>Tipo</th>
                <th>Líder</th>
                <th>Status pgto.</th>
                <th style={{ textAlign: 'right' }}>Valor inscrição</th>
                <th style={{ textAlign: 'right' }}>Pago</th>
                <th style={{ textAlign: 'right' }}>Oferta</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
                <th>Comprovante</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {checkinRows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setModal({ type: 'detalhes', pid: r.id })}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="resp-cell">
                      <div className="av">{initials(r.nome)}</div>
                      <div className="vaga-name" style={{ fontWeight: 500 }}>{r.nome}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{r.tipo}</td>
                  <td style={{ fontSize: 12 }}>{r.lider}</td>
                  <td>
                    <span className={'chip-mini ' + r.cls}>{r.label}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.valorInscricao}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.pago}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-sage)' }}>{r.oferta}</td>
                  <td style={{ textAlign: 'right', color: r.saldoColor, fontWeight: r.saldoBold ? 700 : 400 }}>{r.saldo}</td>
                  <td style={{ fontSize: 12 }} onClick={(e) => e.stopPropagation()}>
                    {r.comprovanteId
                      ? <AttachmentLink fileId={r.comprovanteId} label="📎 ver" style={{ fontSize: 11 }} />
                      : <span style={{ color: 'var(--fg-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.obs}>
                    {r.obs || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EntradaRow({
  chip,
  chipBg,
  chipFg,
  titulo,
  sub,
  valor,
}: {
  chip: string
  chipBg: string
  chipFg: string
  titulo: string
  sub: string
  valor: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border-default)' }}>
      <span className="chip-mini" style={{ background: chipBg, color: chipFg }}>{chip}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titulo}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{sub}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-sage)', whiteSpace: 'nowrap' }}>+ {valor}</div>
    </div>
  )
}
