import { useEffect, useState } from 'react'
import { appConfig } from '../config'
import { initials, uid } from '../lib/format'
import { cabecalho, esc, imprimirHtml } from '../lib/print'
import { ApiError, apiClient } from '../services/api/apiClient'
import { useRetiro } from '../store/RetiroContext'
import { servosServico } from '../store/selectors'
import type { Coordenacao } from '../types'

/** Área do catálogo global de coordenações — nome + obrigações. O texto é
 *  institucional: vale para todos os eventos, não por retiro. */
interface Area {
  id: number
  nome: string
  obrigacoes: string
  ordem: number
}

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function CoordenacoesView() {
  const { state, patch, toast } = useRetiro()
  const s = state
  const coordenacoes = s.coordenacoes ?? []
  const servos = servosServico(s).slice().sort((a, b) => a.nome.localeCompare(b.nome))

  const [aba, setAba] = useState<'coordenadores' | 'areas'>('coordenadores')
  const [areas, setAreas] = useState<Area[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregarAreas = async () => {
    try {
      setAreas(await apiClient.get<Area[]>('/coordenacao-areas'))
      setErro('')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao carregar as áreas.')
    } finally {
      setCarregando(false)
    }
  }
  useEffect(() => {
    void carregarAreas()
  }, [])

  // -------------------------------------------------------------- coordenações
  const vazio = { area: '', servoId: '' }
  const [form, setForm] = useState(vazio)
  const [editId, setEditId] = useState<string | null>(null)
  const [aExcluir, setAExcluir] = useState<string | null>(null)

  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }))
  const cancelar = () => {
    setEditId(null)
    setForm(vazio)
  }

  const nomeServo = (id: string | null) => (id ? servos.find((x) => x.id === id)?.nome ?? null : null)
  /** Obrigações vêm do catálogo — nunca são digitadas por coordenação. */
  const obrigacoesDe = (area: string) => areas.find((a) => a.nome === area)?.obrigacoes ?? ''

  const nomesAreas = areas.map((a) => a.nome)
  // Cadastro apontando para área que saiu do catálogo: a opção é mantida
  // enquanto está em edição, senão o select abriria vazio e perderia o valor.
  const areasDoSelect =
    form.area && !nomesAreas.includes(form.area) ? [form.area, ...nomesAreas] : nomesAreas

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
    const dados = { area, servoId: form.servoId || null }

    if (editId) {
      patch({ coordenacoes: coordenacoes.map((c) => (c.id === editId ? { ...c, ...dados } : c)) })
      toast('Coordenação atualizada.')
    } else {
      patch({ coordenacoes: coordenacoes.concat([{ id: uid('co'), ...dados, obrigacoes: '' }]) })
      toast('Coordenação cadastrada.')
    }
    cancelar()
  }

  const editar = (c: Coordenacao) => {
    setAba('coordenadores')
    setEditId(c.id)
    setForm({ area: c.area, servoId: c.servoId ?? '' })
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
    ordenadas.forEach((c) => {
      const nome = nomeServo(c.servoId)
      const obr = obrigacoesDe(c.area)
      html +=
        '<div class="card" style="margin-bottom:12px">' +
        '<h3><span>' + esc(c.area) + '</span><span>' +
        (nome ? esc(nome) : '<i>a definir</i>') +
        '</span></h3><div style="font-size:12px;white-space:pre-wrap">' +
        (obr ? esc(obr) : '<i>Obrigações não cadastradas para esta área.</i>') +
        '</div></div>'
    })
    imprimirHtml('Coordenadores', html)
  }

  // --------------------------------------------------------------------- áreas
  const areaVazia = { nome: '', obrigacoes: '' }
  const [formArea, setFormArea] = useState(areaVazia)
  const [editArea, setEditArea] = useState<Area | null>(null)
  const [areaExcluir, setAreaExcluir] = useState<Area | null>(null)
  const [salvandoArea, setSalvandoArea] = useState(false)

  const cancelarArea = () => {
    setEditArea(null)
    setFormArea(areaVazia)
  }

  const salvarArea = async () => {
    const nome = formArea.nome.trim()
    if (!nome) {
      toast('Informe o nome da área.')
      return
    }
    setSalvandoArea(true)
    setErro('')
    try {
      if (editArea) {
        const r = await apiClient.put<{ renomeou: boolean; nomeAntigo: string }>(
          '/coordenacao-areas/' + editArea.id,
          { nome, obrigacoes: formArea.obrigacoes },
        )
        // O servidor já renomeou a área nas coordenações gravadas. O estado
        // local precisa acompanhar, senão a próxima sincronização regravaria o
        // nome antigo por cima.
        if (r?.renomeou)
          patch({
            coordenacoes: coordenacoes.map((c) =>
              c.area === r.nomeAntigo ? { ...c, area: nome } : c,
            ),
          })
        toast('Área atualizada.')
      } else {
        await apiClient.post('/coordenacao-areas', { nome, obrigacoes: formArea.obrigacoes })
        toast('Área cadastrada.')
      }
      cancelarArea()
      await carregarAreas()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao salvar a área.')
    } finally {
      setSalvandoArea(false)
    }
  }

  const excluirArea = async () => {
    if (!areaExcluir) return
    setSalvandoArea(true)
    setErro('')
    try {
      await apiClient.delete('/coordenacao-areas/' + areaExcluir.id)
      setAreaExcluir(null)
      toast('Área excluída.')
      await carregarAreas()
    } catch (e) {
      setAreaExcluir(null)
      setErro(e instanceof ApiError ? e.message : 'Erro ao excluir a área.')
    } finally {
      setSalvandoArea(false)
    }
  }

  const seg = (on: boolean) => (on ? 'on' : '')

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
            Defina quem coordena cada área do evento — a lista de nomes traz os servos inscritos. As
            obrigações são fixas por área e valem para todos os eventos.
          </div>
        </div>
        <div className="actions">
          <button
            className="btn btn-default btn-sm"
            onClick={imprimir}
            disabled={coordenacoes.length === 0}
            title={coordenacoes.length ? undefined : 'Cadastre ao menos um coordenador para imprimir.'}
            style={coordenacoes.length ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
          >
            🖨 Gerar PDF
          </button>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={seg(aba === 'coordenadores')} onClick={() => setAba('coordenadores')}>
          Coordenadores
        </button>
        <button className={seg(aba === 'areas')} onClick={() => setAba('areas')}>
          Áreas e obrigações
        </button>
      </div>

      {erro && (
        <div style={{ fontSize: 13, color: 'var(--status-rejected-fg)', background: 'var(--status-rejected-bg)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
          {erro}
        </div>
      )}

      {aba === 'coordenadores' && servos.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--status-progress-bg)', color: 'var(--status-progress-fg)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
          Nenhum servo inscrito ainda — cadastre as inscrições para poder escolher os coordenadores.
        </div>
      )}

      {aba === 'coordenadores' ? (
        <div style={{ display: 'grid', gridTemplateColumns: s.narrow ? '1fr' : '360px 1fr', gap: 14, alignItems: 'start' }}>
          {/* Formulário de coordenação */}
          <div className="panel" style={{ position: s.narrow ? undefined : 'sticky', top: 16 }}>
            <div className="head" style={{ marginBottom: 12 }}>
              <div>
                <h3>{editId ? 'Editar coordenação' : 'Nova coordenação'}</h3>
                <div className="sub">
                  {editId ? 'Alterando um cadastro existente' : 'Escolha a área e o responsável'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={label}>Área / ação</label>
                <select className="input" value={form.area} onChange={(e) => set({ area: e.target.value })}>
                  <option value="">— selecione a área —</option>
                  {areasDoSelect.map((a) => (
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
                <label style={label}>Obrigações da área</label>
                <div style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px', maxHeight: 240, overflowY: 'auto', color: obrigacoesDe(form.area) ? 'var(--fg-default)' : 'var(--fg-muted)' }}>
                  {!form.area
                    ? 'Selecione a área para ver as obrigações.'
                    : obrigacoesDe(form.area) ||
                      'Esta área ainda não tem obrigações cadastradas — preencha na aba "Áreas e obrigações".'}
                </div>
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

          {/* Lista de coordenações */}
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
                  const obr = obrigacoesDe(c.area)
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
                        <div style={{ fontSize: 12, color: obr ? 'var(--fg-default)' : 'var(--fg-muted)', marginTop: 5, whiteSpace: 'pre-wrap' }}>
                          {obr || 'Obrigações desta área ainda não cadastradas.'}
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
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: s.narrow ? '1fr' : '400px 1fr', gap: 14, alignItems: 'start' }}>
          {/* Formulário de área */}
          <div className="panel" style={{ position: s.narrow ? undefined : 'sticky', top: 16 }}>
            <div className="head" style={{ marginBottom: 12 }}>
              <div>
                <h3>{editArea ? 'Editar área' : 'Nova área'}</h3>
                <div className="sub">O texto vale para todos os eventos</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={label}>Nome da área</label>
                <input
                  className="input"
                  value={formArea.nome}
                  onChange={(e) => setFormArea((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex.: Correios"
                />
              </div>
              <div>
                <label style={label}>Obrigações</label>
                <textarea
                  className="input"
                  rows={12}
                  value={formArea.obrigacoes}
                  onChange={(e) => setFormArea((f) => ({ ...f, obrigacoes: e.target.value }))}
                  placeholder={'1. Primeira obrigação\n2. Segunda obrigação'}
                  style={{ resize: 'vertical', minHeight: 180, lineHeight: 1.5 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              {editArea && (
                <button className="btn btn-default btn-sm" disabled={salvandoArea} onClick={cancelarArea}>
                  Cancelar
                </button>
              )}
              <button className="btn btn-primary btn-sm" disabled={salvandoArea} onClick={salvarArea}>
                {salvandoArea ? 'Salvando…' : editArea ? 'Salvar alterações' : '+ Cadastrar área'}
              </button>
            </div>
          </div>

          {/* Lista de áreas */}
          <div className="tbl-wrap">
            <div className="tbl-head-bar">
              <h3>Áreas do catálogo</h3>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{areas.length} área(s)</span>
            </div>
            {carregando ? (
              <div style={{ padding: '18px 16px', fontSize: 13, color: 'var(--fg-muted)' }}>Carregando…</div>
            ) : areas.length === 0 ? (
              <div style={{ padding: '18px 16px', fontSize: 13, color: 'var(--fg-muted)' }}>
                Nenhuma área cadastrada.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {areas.map((a) => {
                  const usos = coordenacoes.filter((c) => c.area === a.nome).length
                  return (
                    <div
                      key={a.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-default)', background: editArea?.id === a.id ? 'var(--color-sage-soft)' : undefined }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 14 }}>{a.nome}</strong>
                          {!a.obrigacoes && (
                            <span className="chip-mini" style={{ background: 'var(--status-progress-bg)', color: 'var(--status-progress-fg)' }}>
                              Sem obrigações
                            </span>
                          )}
                          {usos > 0 && (
                            <span className="chip-mini" style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}>
                              {usos === 1 ? '1 coordenador neste evento' : usos + ' coordenadores neste evento'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: a.obrigacoes ? 'var(--fg-default)' : 'var(--fg-muted)', marginTop: 5, whiteSpace: 'pre-wrap' }}>
                          {a.obrigacoes || 'Preencha as obrigações desta área.'}
                        </div>
                      </div>
                      <div style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            setEditArea(a)
                            setFormArea({ nome: a.nome, obrigacoes: a.obrigacoes })
                            setErro('')
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-default btn-xs"
                          style={{ color: usos ? 'var(--fg-muted)' : 'var(--status-rejected-fg)' }}
                          disabled={usos > 0}
                          title={usos ? 'Remova os coordenadores desta área antes de excluí-la.' : 'Excluir área'}
                          onClick={() => {
                            setAreaExcluir(a)
                            setErro('')
                          }}
                        >
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
      )}

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

      {areaExcluir && (
        <div
          onClick={() => !salvandoArea && setAreaExcluir(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 440, animation: 'popIn .18s var(--ease-default)' }}
          >
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Excluir área</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Excluir a área <b>{areaExcluir.nome}</b> do catálogo? Ela deixa de aparecer em todos
                os eventos, junto com o texto das obrigações.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" disabled={salvandoArea} onClick={() => setAreaExcluir(null)}>
                  Cancelar
                </button>
                <button
                  className="btn"
                  style={{ background: 'var(--status-rejected-fg)', color: '#fff' }}
                  disabled={salvandoArea}
                  onClick={excluirArea}
                >
                  {salvandoArea ? 'Excluindo…' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
