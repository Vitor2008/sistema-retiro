import { DIAS_ESCALA, TURNO_INFO } from '../escalaConfig'
import { fmtData } from '../lib/format'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { escalaVazia, porId, servosServico } from '../store/selectors'
import type { EscalaDia, Frente, Turno } from '../types'

function dataDoDia(inicio: string, offset: number): string {
  if (!inicio) return ''
  const d = new Date(new Date(inicio + 'T12:00:00').getTime() + offset * 86400000)
  return fmtData(d.toISOString().slice(0, 10))
}

export function EscalasView() {
  const { state, patch } = useRetiro()
  const { gerarEscala } = useActions()

  const s = state
  const narrow = s.narrow
  const escala = s.escala || escalaVazia()
  const dk = s.escalaDia
  const diaCfg = DIAS_ESCALA.find((d) => d.key === dk) ?? DIAS_ESCALA[0]
  const servos = servosServico(s)
  const byId = porId(s)
  const seg = (on: boolean) => (on ? 'on' : '')

  // carga por servo somando todos os dias/turnos/frentes da escala
  const cargas: Record<string, number> = {}
  DIAS_ESCALA.forEach((dia) =>
    dia.turnos.forEach((t) =>
      t.frentes.forEach((fr) =>
        (escala[dia.key][t.key][fr] || []).forEach((id) => (cargas[id] = (cargas[id] || 0) + 1)),
      ),
    ),
  )

  const modEscala = (t: Turno, mut: (cel: (typeof escala)['sabado']['cafe']) => void) => {
    const e2 = JSON.parse(JSON.stringify(escala)) as typeof escala
    mut(e2[dk][t])
    patch({ escala: e2 })
  }

  const cargaMedia = servos.length
    ? (servos.reduce((a, sv) => a + (cargas[sv.id] || 0), 0) / servos.length).toFixed(1)
    : '0'

  return (
    <div data-screen-label="Escalas">
      <div className="crumbs">
        <span>Operação</span>
        <span className="last">Escalas de serviço</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Escalas de serviço</h1>
          <div className="desc">
            Sexta: só a limpeza do jantar. Sábado: café, almoço e jantar (preparo + limpeza).
            Domingo: café e almoço (preparo + limpeza). Limpeza de almoço/jantar exige no mínimo 2 homens.
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={gerarEscala}>
            ⟳ Gerar escala
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="seg">
          {DIAS_ESCALA.map((dia) => {
            const data = dataDoDia(s.retiro.inicio, dia.offset)
            return (
              <button
                key={dia.key}
                className={seg(dk === dia.key)}
                onClick={() => patch({ escalaDia: dia.key as EscalaDia })}
              >
                {dia.label}
                {data ? ' — ' + data : ''}
              </button>
            )
          })}
        </div>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          {servos.length} servos · carga média {cargaMedia} turnos/pessoa no fim de semana
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {diaCfg.turnos.map((tCfg) => {
          const tk = tCfg.key
          const cel = escala[dk][tk]
          const homensLimp = cel.limp.filter((id) => byId[id] && byId[id].genero === 'M').length
          const warn = tk !== 'cafe' && cel.limp.length > 0 && homensLimp < 2
          const emUso = new Set(cel.prep.concat(cel.limp))

          const frente = (fr: Frente, label: string, cor: string) => {
            const ids = cel[fr]
            return (
              <div key={fr} style={{ border: '1px solid ' + (fr === 'limp' && warn ? 'var(--status-rejected-fg)' : 'var(--border-default)'), borderRadius: 8, padding: '10px 12px', background: 'var(--bg-app)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cor }}>{label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-muted)' }}>{ids.length} escalados</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ids
                    .filter((id) => byId[id])
                    .map((id) => (
                      <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: '1px solid var(--border-default)', borderRadius: 999, padding: '3px 5px 3px 10px', fontSize: 12 }}>
                        {byId[id].nome.split(' ').slice(0, 2).join(' ')}
                        <span style={{ fontSize: 9, color: 'var(--fg-muted)', background: 'var(--bg-muted)', borderRadius: 999, padding: '1px 5px' }}>{byId[id].genero}</span>
                        <button
                          onClick={() => modEscala(tk, (c) => (c[fr] = c[fr].filter((x) => x !== id)))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: '0 3px', fontSize: 13, lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  <select
                    className="input"
                    style={{ width: 'auto', padding: '3px 8px', fontSize: 12, borderRadius: 999, background: 'var(--bg-muted)', borderColor: 'transparent' }}
                    value=""
                    onChange={(e) => {
                      const id = e.target.value
                      if (id) modEscala(tk, (c) => (c[fr] = c[fr].concat([id])))
                    }}
                  >
                    <option value="">+ Adicionar servo</option>
                    {servos
                      .filter((sv) => !emUso.has(sv.id))
                      .map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.nome} · {cargas[sv.id] || 0} turnos
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )
          }

          return (
            <div key={tk} className="panel">
              <div className="head" style={{ marginBottom: 10 }}>
                <div>
                  <h3>{TURNO_INFO[tk].label}</h3>
                  <div className="sub">{TURNO_INFO[tk].hora}</div>
                </div>
                {warn && <span className="chip chip-rejected">⚠ Limpeza precisa de no mínimo 2 homens</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: narrow || tCfg.frentes.length === 1 ? '1fr' : '1fr 1fr', gap: 12 }}>
                {tCfg.frentes.includes('prep') && frente('prep', 'Preparo e serviço', 'var(--color-primary)')}
                {tCfg.frentes.includes('limp') && frente('limp', 'Limpeza' + (tk !== 'cafe' ? ' (mín. 2 homens)' : ''), 'var(--color-secondary-hover)')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
