import { useState } from 'react'
import { appConfig } from '../config'
import { initials, uid } from '../lib/format'
import { cabecalho, esc, imprimirHtml } from '../lib/print'
import { useRetiro } from '../store/RetiroContext'
import { servosServico } from '../store/selectors'
import type { Coordenacao } from '../types'

/** Áreas que podem ser coordenadas. Lista fechada de propósito: evita que cada
 *  pessoa cadastre a mesma área com um nome diferente. */
export const AREAS = [
  'Quartos - Homens',
  'Quartos - Mulheres',
  'Cozinha',
  'Cantina',
  'Escalas de serviço',
  'Recepção',
  'Secretaria',
  'Correios',
  'Louvor',
  'Intercessão',
  'Som e projeção',
  'Limpeza',
  'Transporte',
  'Enfermaria',
]

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function CoordenacoesView() {
  const { state, patch, toast } = useRetiro()
  const s = state
  const coordenacoes = s.coordenacoes ?? []
  const servos = servosServico(s).slice().sort((a, b) => a.nome.localeCompare(b.nome))

  const vazio = { area: '', servoId: '', obrigacoes: '' }
  const [form, setForm] = useState(vazio)
  const [editId, setEditId] = useState<string | null>(null)
  const [aExcluir, setAExcluir] = useState<string | null>(null)

  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }))
  const cancelar = () => {
    setEditId(null)
    setForm(vazio)
  }

  const nomeServo = (id: string | null) => (id ? servos.find((x) => x.id === id)?.nome ?? null : null)

  // Se um cadastro antigo tiver uma área fora da lista, ela entra como opção só
  // enquanto está em edição — assim o valor não se perde ao salvar de novo.
  const areasDisponiveis = form.area && !AREAS.includes(form.area) ? [form.area, ...AREAS] : AREAS

  const salvar = () => {
    const area = form.area.trim()
    if (!area) {
      toast('Selecione a área da coordenação.')
      return
    }
    // Mesma área com a mesma pessoa é duplicidade. Duas entradas na mesma área
    // com pessoas diferentes são permitidas (coordenador e vice, por exemplo).
    const dup = coordenacoes.some(
      (c) =>
        c.id !== editId &&
        c.area.trim().toLowerCase() === area.toLowerCase() &&
        (c.servoId ?? '') === form.servoId,
    )
    if (dup) {
      toast('Essa área já tem essa mesma pessoa cadastrada.')
      return
    }
    const dados = { area, servoId: form.servoId || null, obrigacoes: form.obrigacoes.trim() }

    if (editId) {
      patch({ coordenacoes: coordenacoes.map((c) => (c.id === editId ? { ...c, ...dados } : c)) })
      toast('Coordenação atualizada.')
    } else {
      patch({ coordenacoes: coordenacoes.concat([{ id: uid('co'), ...dados }]) })
      toast('Coordenação cadastrada.')
    }
    cancelar()
  }

  const editar = (c: Coordenacao) => {
    setEditId(c.id)
    setForm({ area: c.area, servoId: c.servoId ?? '', obrigacoes: c.obrigacoes })
  }

  const excluir = (id: string) => {
    patch({ coordenacoes: coordenacoes.filter((c) => c.id !== id) })
    setAExcluir(null)
    toast('Coordenação removida.')
  }

  const paraExcluir = aExcluir ? coordenacoes.find((c) => c.id === aExcluir) ?? null : null
  const ordenadas = coordenacoes
    .slice()
    .sort(
      (a, b) =>
        a.area.localeCompare(b.area) ||
        (nomeServo(a.servoId) ?? '').localeCompare(nomeServo(b.servoId) ?? ''),
    )

  const imprimir = () => {
    let html = cabecalho('Coordenadores — ' + s.retiro.nome, appConfig.nomeIgrejaCompleto)
    html += '<table><thead><tr><th style="width:24%">Área</th><th style="width:26%">Coordenador</th><th>Obrigações</th></tr></thead><tbody>'
    ordenadas.forEach((c) => {
      const nome = nomeServo(c.servoId)
      html +=
        '<tr><td><b>' + esc(c.area) + '</b></td><td>' +
        (nome ? esc(nome) : '<i>a definir</i>') +
        '</td><td style="white-space:pre-wrap">' + (c.obrigacoes ? esc(c.obrigacoes) : '<i>—</i>') +
        '</td></tr>'
    })
    html += '</tbody></table>'
    imprimirHtml('Coordenadores', html)
  }

  return (
    <div data-screen-label="Coordenadores">
      <div className="crumbs">
        <span>Operação</span>
        <span className="last">Coordenadores</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Coordenadores</h1>
          <div className="desc">
            Defina quem coordena cada área do evento e o que é esperado de cada um. A lista de nomes
            traz os servos inscritos.
          </div>
        </div>
        <div className="actions">
          <button
            className="btn btn-default btn-sm"
            onClick={imprimir}
            disabled={coordenacoes.length === 0}
            title={coordenacoes.length ? undefined : 'Cadastre ao menos uma coordenação para imprimir.'}
            style={coordenacoes.length ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
          >
            🖨 Gerar PDF
          </button>
        </div>
      </div>

      {servos.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--status-progress-bg)', color: 'var(--status-progress-fg)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
          Nenhum servo inscrito ainda — cadastre as inscrições para poder escolher os coordenadores.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: s.narrow ? '1fr' : '360px 1fr', gap: 14, alignItems: 'start' }}>
        {/* Formulário */}
        <div className="panel" style={{ position: s.narrow ? undefined : 'sticky', top: 16 }}>
          <div className="head" style={{ marginBottom: 12 }}>
            <div>
              <h3>{editId ? 'Editar coordenação' : 'Nova coordenação'}</h3>
              <div className="sub">
                {editId ? 'Alterando um cadastro existente' : 'Área, responsável e obrigações'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={label}>Área / ação</label>
              <select className="input" value={form.area} onChange={(e) => set({ area: e.target.value })}>
                <option value="">— selecione a área —</option>
                {areasDisponiveis.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Coordenador</label>
              <select className="input" value={form.servoId} onChange={(e) => set({ servoId: e.target.value })}>
                <option value="">— definir depois —</option>
                {servos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Obrigações</label>
              <textarea
                className="input"
                rows={5}
                value={form.obrigacoes}
                onChange={(e) => set({ obrigacoes: e.target.value })}
                placeholder="O que essa pessoa precisa garantir. Ex.: montar a alocação dos quartos, conferir as roupas de cama e receber os encontristas."
                style={{ resize: 'vertical', minHeight: 96 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            {editId && (
              <button className="btn btn-default btn-sm" onClick={cancelar}>
                Cancelar
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={salvar}>
              {editId ? 'Salvar alterações' : '+ Cadastrar'}
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="tbl-wrap">
          <div className="tbl-head-bar">
            <h3>Coordenações cadastradas</h3>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {coordenacoes.length} cadastrada(s)
            </span>
          </div>
          {ordenadas.length === 0 ? (
            <div style={{ padding: '18px 16px', fontSize: 13, color: 'var(--fg-muted)' }}>
              Nenhuma coordenação cadastrada ainda. Use o formulário ao lado para começar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ordenadas.map((c) => {
                const nome = nomeServo(c.servoId)
                // O servo pode ter sido cancelado ou excluído depois do cadastro.
                const orfao = !!c.servoId && !nome
                return (
                  <div
                    key={c.id}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-default)', background: editId === c.id ? 'var(--color-sage-soft)' : undefined }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: nome ? 'var(--color-primary)' : 'var(--bg-muted)', color: nome ? '#fff' : 'var(--fg-muted)', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {nome ? initials(nome) : '—'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 14 }}>{c.area}</strong>
                        {nome ? (
                          <span className="chip-mini" style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}>
                            {nome}
                          </span>
                        ) : orfao ? (
                          <span className="chip-mini" style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-fg)' }}>
                            Servo não está mais no evento
                          </span>
                        ) : (
                          <span className="chip-mini" style={{ background: 'var(--status-progress-bg)', color: 'var(--status-progress-fg)' }}>
                            A definir
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: c.obrigacoes ? 'var(--fg-default)' : 'var(--fg-muted)', marginTop: 5, whiteSpace: 'pre-wrap' }}>
                        {c.obrigacoes || 'Sem obrigações descritas.'}
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-outline btn-xs" onClick={() => editar(c)}>
                        Editar
                      </button>
                      <button className="btn btn-default btn-xs" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => setAExcluir(c.id)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {paraExcluir && (
        <div
          onClick={() => setAExcluir(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 440, animation: 'popIn .18s var(--ease-default)' }}
          >
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Remover coordenação</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Remover a coordenação de <b>{paraExcluir.area}</b>? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" onClick={() => setAExcluir(null)}>
                  Cancelar
                </button>
                <button
                  className="btn"
                  style={{ background: 'var(--status-rejected-fg)', color: '#fff' }}
                  onClick={() => excluir(paraExcluir.id)}
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
