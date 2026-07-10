import { DIAS_ESCALA, FRENTE_INFO, FRENTES_TODAS, TURNO_INFO } from '../escalaConfig'
import { fmtData } from '../lib/format'
import { esc, imprimirHtml } from '../lib/print'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { escalaVazia, porId, servosServico } from '../store/selectors'
import { appConfig } from '../config'
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
  // Normaliza a escala para o formato atual (compat com escalas antigas que
  // usavam as frentes 'prep'/'limp' — garante que toda célula tenha louca/pratos/patio).
  const escala = escalaVazia()
  const raw = s.escala as unknown as
    | Record<string, Record<string, Record<string, string[]>>>
    | null
  DIAS_ESCALA.forEach((dia) =>
    dia.turnos.forEach((t) => {
      const src = raw?.[dia.key]?.[t.key]
      FRENTES_TODAS.forEach((fr) => {
        const arr = src?.[fr]
        escala[dia.key][t.key][fr] = Array.isArray(arr) ? arr : []
      })
    }),
  )
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

  const homensNaLouca = (cel: { louca: string[] }) =>
    cel.louca.filter((id) => byId[id] && byId[id].genero === 'M').length

  // A escala está "completa" quando toda frente tem a quantidade exigida e a
  // louça tem os 2 homens.
  const escalaCompleta = DIAS_ESCALA.every((dia) =>
    dia.turnos.every((t) => {
      const cel = escala[dia.key][t.key]
      return t.frentes.every((fr) => {
        const cfg = FRENTE_INFO[fr]
        if (cel[fr].length < cfg.qtd) return false
        if (cfg.soHomens && homensNaLouca(cel) < cfg.qtd) return false
        return true
      })
    }),
  )

  const modEscala = (t: Turno, mut: (cel: (typeof escala)['sabado']['cafe']) => void) => {
    const e2 = JSON.parse(JSON.stringify(escala)) as typeof escala
    mut(e2[dk][t])
    patch({ escala: e2 })
  }

  const cargaMedia = servos.length
    ? (servos.reduce((a, sv) => a + (cargas[sv.id] || 0), 0) / servos.length).toFixed(1)
    : '0'

  const imprimirEscala = () => {
    const nomeCurto = (id: string) =>
      byId[id] ? byId[id].nome.split(' ').slice(0, 2).join(' ') + ' (' + byId[id].genero + ')' : '—'
    let html = `<h1>Escala de serviço — ${esc(s.retiro.nome)}</h1>`
    html += `<div class="sub">${esc(appConfig.nomeIgrejaCompleto)}</div>`
    DIAS_ESCALA.forEach((dia) => {
      const data = dataDoDia(s.retiro.inicio, dia.offset)
      html += `<h2>${esc(dia.label)}${data ? ' — ' + esc(data) : ''}</h2>`
      dia.turnos.forEach((t) => {
        const cel = escala[dia.key][t.key]
        html += `<table><thead><tr><th style="width:34%">${esc(TURNO_INFO[t.key].label)} · ${esc(TURNO_INFO[t.key].hora)}</th><th>Equipe</th></tr></thead><tbody>`
        t.frentes.forEach((fr) => {
          const nomes = cel[fr].map(nomeCurto).join(', ') || '<i>a definir</i>'
          html += `<tr><td><b>${esc(FRENTE_INFO[fr].label)}</b>${FRENTE_INFO[fr].soHomens ? ' <span class="tag">(2 homens)</span>' : ''}</td><td>${nomes}</td></tr>`
        })
        html += `</tbody></table>`
      })
    })
    imprimirHtml('Escala de serviço', html)
  }

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
            Cada refeição tem 3 frentes: lavar louça (2 homens), lavar pratos (2) e limpeza do pátio (2).
            Sexta: só o jantar. Sábado: café, almoço e jantar. Domingo: café e almoço.
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={gerarEscala}>
            ⟳ Gerar escala
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={imprimirEscala}
            disabled={!escalaCompleta}
            title={escalaCompleta ? undefined : 'Complete a escala (todas as frentes) para imprimir.'}
            style={escalaCompleta ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
          >
            🖨 Imprimir escala
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
          const warnLouca = cel.louca.length > 0 && homensNaLouca(cel) < 2
          const emUso = new Set<string>(FRENTES_TODAS.flatMap((fr) => cel[fr]))

          const frente = (fr: Frente) => {
            const cfg = FRENTE_INFO[fr]
            const ids = cel[fr]
            const alerta = fr === 'louca' && warnLouca
            const cor = fr === 'louca' ? 'var(--color-primary)' : fr === 'pratos' ? 'var(--color-sage)' : 'var(--color-secondary-hover)'
            return (
              <div key={fr} style={{ border: '1px solid ' + (alerta ? 'var(--status-rejected-fg)' : 'var(--border-default)'), borderRadius: 8, padding: '10px 12px', background: 'var(--bg-app)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cor }}>
                    {cfg.label}{cfg.soHomens ? ' (2 homens)' : ''}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: ids.length < cfg.qtd ? 'var(--status-rejected-fg)' : 'var(--fg-muted)' }}>
                    {ids.length}/{cfg.qtd}
                  </span>
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
                      .filter((sv) => !cfg.soHomens || sv.genero === 'M')
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
                {warnLouca && <span className="chip chip-rejected">⚠ Louça precisa de 2 homens</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
                {tCfg.frentes.map((fr) => frente(fr))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
