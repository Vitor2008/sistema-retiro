import { initials } from '../lib/format'
import { esc, imprimirHtml } from '../lib/print'
import { appConfig } from '../config'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { ativos, porId } from '../store/selectors'
import { useViewport } from '../hooks/useViewport'
import type { Genero } from '../types'

export function QuartosView() {
  const { state, patch, toast } = useRetiro()
  const { atribuirQuarto, preDefinirQuartos, setModal } = useActions()
  const { mid } = useViewport()

  const s = state
  const narrow = s.narrow
  const atv = ativos(s)
  const byId = porId(s)
  const semQuartoAll = atv.filter((p) => !p.quarto)
  const temQuartos = s.quartos.length > 0
  const todosAlocados = atv.length > 0 && semQuartoAll.length === 0

  const imprimirAlocacao = () => {
    let html = `<h1>Alocação de quartos — ${esc(s.retiro.nome)}</h1>`
    html += `<div class="sub">${esc(appConfig.nomeIgrejaCompleto)}</div><div class="grid">`
    s.quartos.forEach((q) => {
      const membros = atv
        .filter((p) => p.quarto === q.id)
        .sort((a, b) => a.nome.localeCompare(b.nome))
      html += `<div class="card"><h3><span>${esc(q.nome)} · ${q.genero === 'M' ? 'Masculino' : 'Feminino'}</span><span class="tag">${membros.length}/${q.cap}</span></h3><ul>`
      membros.forEach((m) => {
        const lider = q.lideres.includes(m.id)
        html += `<li>${lider ? '★ ' : ''}${esc(m.nome)} <span class="tag">${m.tipo === 'Servo' ? 'Servo' : 'Enc.'}</span></li>`
      })
      if (!membros.length) html += `<li><i>vazio</i></li>`
      html += `</ul></div>`
    })
    html += `</div>`
    imprimirHtml('Alocação de quartos', html)
  }
  const semQuartoG = semQuartoAll.filter((p) => p.genero === s.qGenero)
  const seg = (on: boolean) => (on ? 'on' : '')

  // Alertas
  const alertas: Array<{ msg: string; bg: string; fg: string }> = []
  s.quartos.forEach((q) => {
    const n = atv.filter((p) => p.quarto === q.id).length
    if (n > q.cap)
      alertas.push({
        msg: q.nome + ' ultrapassou a capacidade (' + n + ' pessoas para ' + q.cap + ' camas).',
        bg: 'var(--status-rejected-bg)',
        fg: 'var(--status-rejected-fg)',
      })
    const lidersServos = q.lideres.filter((id) => byId[id] && byId[id].quarto === q.id)
    if (n > 0 && lidersServos.length < 2)
      alertas.push({
        msg: q.nome + ' tem ' + lidersServos.length + ' líder(es) de quarto — o ideal são 2 servos.',
        bg: 'var(--status-progress-bg)',
        fg: 'var(--status-progress-fg)',
      })
  })
  if (semQuartoAll.length)
    alertas.push({
      msg:
        semQuartoAll.length +
        ' pessoas ainda sem quarto (' +
        semQuartoAll.filter((p) => p.genero === 'M').length +
        ' homens, ' +
        semQuartoAll.filter((p) => p.genero === 'F').length +
        ' mulheres).',
      bg: 'var(--status-progress-bg)',
      fg: 'var(--status-progress-fg)',
    })

  const toggleStar = (qid: string, mid2: string) => {
    const quartos = s.quartos.map((x) => {
      if (x.id !== qid) return x
      let ls = x.lideres.includes(mid2) ? x.lideres.filter((i) => i !== mid2) : x.lideres.concat([mid2])
      if (ls.length > 2) {
        toast('Máximo de 2 líderes por quarto.')
        ls = x.lideres
      }
      return { ...x, lideres: ls }
    })
    patch({ quartos })
  }

  const removeMembro = (qid: string, mid2: string) => {
    patch({
      inscritos: s.inscritos.map((x) => (x.id === mid2 ? { ...x, quarto: null } : x)),
      quartos: s.quartos.map((x) => (x.id === qid ? { ...x, lideres: x.lideres.filter((i) => i !== mid2) } : x)),
    })
  }

  return (
    <div data-screen-label="Quartos">
      <div className="crumbs">
        <span>Operação</span>
        <span className="last">Montagem de quartos</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Montagem de quartos</h1>
          <div className="desc">
            Arraste pessoas para os quartos, ou toque na pessoa e depois no quarto. ★ marca líderes de quarto (servos, ideal 2 por quarto).
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={() => setModal({ type: 'quarto', nome: '', genero: 'M', cap: '8' })}>
            + Novo quarto
          </button>
          {temQuartos && (
            <button className="btn btn-secondary btn-sm" onClick={preDefinirQuartos}>
              ⟳ Gerar pré-definição
            </button>
          )}
          <button
            className="btn btn-default btn-sm"
            onClick={imprimirAlocacao}
            disabled={!todosAlocados}
            title={todosAlocados ? undefined : 'Aloque todas as pessoas para imprimir.'}
            style={todosAlocados ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
          >
            🖨 Imprimir alocação
          </button>
        </div>
      </div>

      {alertas.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: a.bg, color: a.fg, borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 13, fontWeight: 500 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 9v4"></path>
            <path d="M12 17h.01"></path>
            <path d="M10.3 4.3l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0z"></path>
          </svg>
          {a.msg}
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '300px 1fr', gap: 14, alignItems: 'start' }}>
        {/* Sem quarto */}
        <div className="panel" style={{ position: 'sticky', top: 16 }}>
          <div className="head" style={{ marginBottom: 10 }}>
            <div>
              <h3>Sem quarto</h3>
              <div className="sub">{semQuartoAll.length} pessoas aguardando</div>
            </div>
          </div>
          <div className="seg" style={{ marginBottom: 10 }}>
            <button className={seg(s.qGenero === 'M')} onClick={() => patch({ qGenero: 'M' as Genero, selId: null })}>Homens</button>
            <button className={seg(s.qGenero === 'F')} onClick={() => patch({ qGenero: 'F' as Genero, selId: null })}>Mulheres</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 520, overflowY: 'auto' }}>
            {semQuartoG.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', p.id)
                  patch({ dragId: p.id })
                }}
                onClick={() => patch({ selId: s.selId === p.id ? null : p.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  border: '1px solid ' + (s.selId === p.id ? 'var(--color-sage)' : 'var(--border-default)'),
                  background: s.selId === p.id ? 'var(--color-sage-soft)' : '#fff',
                  borderRadius: 8,
                  cursor: 'grab',
                  fontSize: 13,
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {initials(p.nome)}
                </div>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</span>
                <span
                  className="chip-mini"
                  style={{
                    background: p.tipo === 'Servo' ? 'var(--color-primary-tint)' : 'var(--color-secondary-tint)',
                    color: p.tipo === 'Servo' ? 'var(--color-primary)' : 'var(--color-secondary-hover)',
                  }}
                >
                  {p.tipo === 'Servo' ? 'Servo' : 'Enc.'}
                </span>
              </div>
            ))}
            {semQuartoG.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', padding: '12px 4px' }}>Todos alocados. 🎉</div>
            )}
          </div>
        </div>

        {/* Quartos */}
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : mid ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
          {s.quartos.map((q) => {
            const membros = atv.filter((p) => p.quarto === q.id)
            const n = membros.length
            const over = n > q.cap
            const cheio = n >= q.cap
            const dragP = s.dragId ? byId[s.dragId] : s.selId ? byId[s.selId] : null
            const alvo = !!dragP && dragP.genero === q.genero && !cheio
            const pct = Math.min(100, Math.round((n / q.cap) * 100))
            return (
              <div
                key={q.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  atribuirQuarto(e.dataTransfer.getData('text/plain'), q.id)
                }}
                onClick={() => {
                  if (s.selId) atribuirQuarto(s.selId, q.id)
                }}
                className="card"
                style={{
                  padding: 14,
                  border: '1.5px solid ' + (alvo ? 'var(--color-sage)' : 'var(--border-default)'),
                  background: alvo ? 'var(--color-sage-soft)' : '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span
                    className="chip-mini"
                    style={{
                      background: q.genero === 'M' ? 'var(--status-interview-bg)' : 'rgb(252, 231, 243)',
                      color: q.genero === 'M' ? 'var(--status-interview-fg)' : 'rgb(190, 24, 93)',
                    }}
                  >
                    {q.genero === 'M' ? 'Masc.' : 'Fem.'}
                  </span>
                  <h3 style={{ fontSize: 14 }}>{q.nome}</h3>
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: over ? 'var(--status-rejected-fg)' : cheio ? 'var(--color-secondary)' : 'var(--fg-muted)' }}>
                    {n} / {q.cap}
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: pct + '%', background: over ? 'var(--status-rejected-fg)' : cheio ? 'var(--color-secondary)' : 'var(--color-sage)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minHeight: 34 }}>
                  {membros.map((m) => {
                    const lider = q.lideres.includes(m.id)
                    const podeLider = m.tipo === 'Servo'
                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, padding: '4px 6px', borderRadius: 6, background: lider ? 'var(--color-sage-soft)' : 'transparent' }}>
                        <button
                          title={lider ? 'Remover liderança' : podeLider ? 'Tornar líder de quarto' : ''}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (podeLider) toggleStar(q.id, m.id)
                          }}
                          style={{ background: 'none', border: 'none', cursor: podeLider ? 'pointer' : 'default', padding: 0, fontSize: 13, color: lider ? 'var(--color-secondary)' : podeLider ? 'var(--border-strong)' : 'transparent', lineHeight: 1 }}
                        >
                          ★
                        </button>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: lider ? 600 : 400 }}>{m.nome}</span>
                        <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{m.tipo === 'Servo' ? 'Servo' : 'Enc.'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMembro(q.id, m.id)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: '0 2px', fontSize: 13, lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                  {n === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', border: '1px dashed var(--border-strong)', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      Solte pessoas aqui
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
