import { useState } from 'react'
import { initials } from '../lib/format'
import { esc, imprimirHtml, logoFolha } from '../lib/print'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { ativos, idadeDe, porId } from '../store/selectors'
import { useViewport } from '../hooks/useViewport'
import type { Genero, Inscrito } from '../types'

export function QuartosView() {
  const { state, patch, toast } = useRetiro()
  const { atribuirQuarto, preDefinirQuartos, removerQuarto, setModal } = useActions()
  const { mid } = useViewport()
  const [aExcluir, setAExcluir] = useState<string | null>(null)
  const [tip, setTip] = useState<{ txt: string; x: number; y: number; below: boolean } | null>(null)

  const s = state
  const narrow = s.narrow
  const atv = ativos(s)
  const byId = porId(s)
  const semQuartoAll = atv.filter((p) => !p.quarto)
  const temQuartos = s.quartos.length > 0
  const todosAlocados = atv.length > 0 && semQuartoAll.length === 0

  const imprimirAlocacao = () => {
    // Uma folha A4 por quarto (para colar na porta), nomes grandes e centralizados.
    // Ordem: líderes do quarto → demais servos → encontristas; alfabético dentro.
    const papelDe = (q: (typeof s.quartos)[number], m: (typeof atv)[number]) =>
      q.lideres.includes(m.id) ? 'Líder' : m.tipo === 'Servo' ? 'Servo' : 'Encontrista'
    const ordem: Record<string, number> = { Líder: 0, Servo: 1, Encontrista: 2 }

    const folhas = s.quartos
      .map((q) => {
        const membros = atv
          .filter((p) => p.quarto === q.id)
          .map((m) => ({ nome: m.nome, papel: papelDe(q, m) }))
          .sort((a, b) => ordem[a.papel] - ordem[b.papel] || a.nome.localeCompare(b.nome))
        const linhas = membros.length
          ? membros
              .map(
                (m) =>
                  `<div class="membro"><span class="papel">${esc(m.papel)}</span>${esc(m.nome)}</div>`,
              )
              .join('')
          : `<div class="membro" style="color:#999">— quarto vazio —</div>`
        return `<section class="folha">
          ${logoFolha()}
          <div class="titulo">${esc(q.nome)}</div>
          <div class="subtitulo">${q.genero === 'M' ? 'Masculino' : 'Feminino'} · ${membros.length}/${q.cap}</div>
          ${linhas}
        </section>`
      })
      .join('')

    imprimirHtml('Alocação de quartos', folhas)
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

  const quartoExcluir = aExcluir ? s.quartos.find((q) => q.id === aExcluir) ?? null : null

  // Líder de célula e prédio de origem só no hover do nome, para não poluir os
  // cards. O tooltip é posicionado em coordenadas de tela porque a lista "Sem
  // quarto" tem rolagem própria e cortaria um elemento posicionado dentro dela.
  const infoPessoa = (p: Inscrito) => {
    const partes: string[] = []
    const anos = idadeDe(p)
    partes.push(anos > 0 ? anos + ' anos' : 'Idade não informada')
    partes.push(p.lider ? 'Líder: ' + p.lider : 'Sem líder informado')
    partes.push(p.predio ? 'Prédio: ' + p.predio : 'Sem prédio informado')
    return partes.join('  ·  ')
  }

  const tipDe = (p: Inscrito) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      const below = r.top < 56
      const meia = 140 // metade da largura máxima do tooltip
      setTip({
        txt: infoPessoa(p),
        x: Math.min(Math.max(r.left + r.width / 2, meia + 8), window.innerWidth - meia - 8),
        y: below ? r.bottom : r.top,
        below,
      })
    },
    onMouseLeave: () => setTip(null),
  })

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
            Arraste pessoas para os quartos — inclusive de um quarto para outro — ou toque na pessoa e depois no quarto de destino. ★ marca líderes de quarto (servos, ideal 2 por quarto).
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={() => setModal({ type: 'quarto', qid: null, nome: '', genero: 'M', cap: '8' })}>
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
                  setTip(null)
                  patch({ dragId: p.id })
                }}
                onDragEnd={() => patch({ dragId: null })}
                onClick={() => {
                  setTip(null)
                  patch({ selId: s.selId === p.id ? null : p.id })
                }}
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
                <span {...tipDe(p)} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.nome}
                </span>
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
            // Líderes do quarto primeiro (na ordem em que foram marcados),
            // depois os demais em ordem alfabética.
            const membros = atv
              .filter((p) => p.quarto === q.id)
              .sort((a, b) => {
                const ia = q.lideres.indexOf(a.id)
                const ib = q.lideres.indexOf(b.id)
                if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
                return a.nome.localeCompare(b.nome)
              })
            const n = membros.length
            const over = n > q.cap
            const cheio = n >= q.cap
            const dragP = s.dragId ? byId[s.dragId] : s.selId ? byId[s.selId] : null
            const alvo = !!dragP && dragP.genero === q.genero && !cheio && dragP.quarto !== q.id
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
                  <h3 style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.nome}</h3>
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: over ? 'var(--status-rejected-fg)' : cheio ? 'var(--color-secondary)' : 'var(--fg-muted)' }}>
                    {n} / {q.cap}
                  </span>
                  <button
                    title="Editar quarto"
                    onClick={(e) => {
                      e.stopPropagation()
                      setModal({ type: 'quarto', qid: q.id, nome: q.nome, genero: q.genero, cap: String(q.cap) })
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: '0 2px', fontSize: 13, lineHeight: 1 }}
                  >
                    ✎
                  </button>
                  <button
                    title={n > 0 ? 'Remova as pessoas do quarto para excluí-lo.' : 'Excluir quarto'}
                    disabled={n > 0}
                    onClick={(e) => {
                      e.stopPropagation()
                      setAExcluir(q.id)
                    }}
                    style={{ background: 'none', border: 'none', cursor: n > 0 ? 'not-allowed' : 'pointer', color: n > 0 ? 'var(--border-strong)' : 'var(--status-rejected-fg)', padding: '0 2px', fontSize: 13, lineHeight: 1 }}
                  >
                    🗑
                  </button>
                </div>
                <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: pct + '%', background: over ? 'var(--status-rejected-fg)' : cheio ? 'var(--color-secondary)' : 'var(--color-sage)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minHeight: 34 }}>
                  {membros.map((m) => {
                    const lider = q.lideres.includes(m.id)
                    const podeLider = m.tipo === 'Servo'
                    return (
                      <div
                        key={m.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          e.dataTransfer.setData('text/plain', m.id)
                          setTip(null)
                          patch({ dragId: m.id })
                        }}
                        onDragEnd={() => patch({ dragId: null })}
                        onClick={(e) => {
                          // O clique não sobe para o card: aqui já se decide se
                          // é o destino de quem está selecionado ou uma nova
                          // seleção (tocar na pessoa e depois no quarto).
                          e.stopPropagation()
                          setTip(null)
                          if (s.selId && s.selId !== m.id) atribuirQuarto(s.selId, q.id)
                          else patch({ selId: s.selId === m.id ? null : m.id })
                        }}
                        className={
                          'quarto-membro' +
                          (lider ? ' is-lider' : '') +
                          (s.selId === m.id ? ' is-sel' : '')
                        }
                      >
                        <button
                          className={lider ? undefined : podeLider ? 'star-toggle' : 'star-vazia'}
                          disabled={!lider && !podeLider}
                          aria-hidden={!lider && !podeLider}
                          tabIndex={!lider && !podeLider ? -1 : undefined}
                          title={lider ? 'Remover liderança' : 'Tornar líder de quarto'}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleStar(q.id, m.id)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, color: lider ? 'var(--color-secondary)' : 'var(--border-strong)', lineHeight: 1 }}
                        >
                          ★
                        </button>
                        <span {...tipDe(m)} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.nome}
                        </span>
                        {lider ? (
                          <span className="chip-mini" style={{ background: 'var(--color-secondary-tint)', color: 'var(--color-secondary-hover)' }}>
                            Líder
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{m.tipo === 'Servo' ? 'Servo' : 'Enc.'}</span>
                        )}
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

      {tip && (
        <div
          className={'tt' + (tip.below ? ' tt-below' : '')}
          style={{ position: 'fixed', left: tip.x, top: tip.y, maxWidth: 280, whiteSpace: 'normal', textAlign: 'center' }}
        >
          {tip.txt}
        </div>
      )}

      {quartoExcluir && (
        <div
          onClick={() => setAExcluir(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 440, animation: 'popIn .18s var(--ease-default)' }}
          >
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Excluir quarto</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Tem certeza que deseja excluir o quarto <b>{quartoExcluir.nome}</b>? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" onClick={() => setAExcluir(null)}>
                  Cancelar
                </button>
                <button
                  className="btn"
                  style={{ background: 'var(--status-rejected-fg)', color: '#fff' }}
                  onClick={() => {
                    removerQuarto(quartoExcluir.id)
                    setAExcluir(null)
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
