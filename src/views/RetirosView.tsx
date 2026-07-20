import { useState } from 'react'
import { fmt, fmtData } from '../lib/format'
import { useRetiro } from '../store/RetiroContext'
import { useRetiroSelection } from '../store/RetiroSelection'
import { useActions } from '../store/useActions'
import {
  ativos,
  linkAbertoEfetivo,
  linkPublico,
  periodo as periodoSel,
  vagasRestantes,
} from '../store/selectors'
import type { Lider } from '../types'

export function RetirosView() {
  const { state, patch, toast } = useRetiro()
  const { toggleLink, setModal } = useActions()
  const { retiros, select } = useRetiroSelection()
  const [novoLiderNome, setNovoLiderNome] = useState('')
  const [novoLiderPredio, setNovoLiderPredio] = useState('')
  const [novoPredio, setNovoPredio] = useState('')
  const [novaConducao, setNovaConducao] = useState('')

  const valor = state.retiro.valor
  const atv = ativos(state)
  const linkAberto = linkAbertoEfetivo(state)
  const vagasRest = vagasRestantes(state)
  const periodo = periodoSel(state)
  const link = linkPublico(state)
  const outros = retiros.filter((r) => r.id !== state.retiro.id)
  const copiarLink = () => {
    navigator.clipboard?.writeText(link).catch(() => {})
    toast('Link copiado: ' + link)
  }
  const abrirFormulario = () => window.open(link, '_blank', 'noopener')
  const pctIns =
    state.retiro.max > 0
      ? Math.min(100, Math.round((atv.length / state.retiro.max) * 100))
      : 0

  const addLider = () => {
    const nome = novoLiderNome.trim()
    if (!nome) return
    const predio = novoLiderPredio
    if (state.lideres.some((l) => l.nome.toLowerCase() === nome.toLowerCase() && l.predio === predio)) {
      toast('Esse líder já está cadastrado nesse prédio.')
      return
    }
    patch({ lideres: [...state.lideres, { nome, predio }] })
    setNovoLiderNome('')
  }
  const removeLider = (idx: number) =>
    patch({ lideres: state.lideres.filter((_, i) => i !== idx) })

  const addPredio = () => {
    const nome = novoPredio.trim()
    if (!nome) return
    if (state.predios.some((p) => p.toLowerCase() === nome.toLowerCase())) {
      toast('Esse prédio já está cadastrado.')
      return
    }
    patch({ predios: [...state.predios, nome] })
    setNovoPredio('')
  }
  const removePredio = (nome: string) =>
    patch({ predios: state.predios.filter((p) => p !== nome) })

  const addConducao = () => {
    const nome = novaConducao.trim()
    if (!nome) return
    if (state.conducoes.some((c) => c.toLowerCase() === nome.toLowerCase())) {
      toast('Essa condução já está cadastrada.')
      return
    }
    patch({ conducoes: [...state.conducoes, nome] })
    setNovaConducao('')
  }
  const removeConducao = (nome: string) =>
    patch({ conducoes: state.conducoes.filter((c) => c !== nome) })

  const abrirNovoRetiro = () =>
    setModal({ type: 'retiro', novo: true, nome: '', inicio: '', fim: '', valor: '260', max: '45', local: '', saida: '', bannerId: null })

  const editarRetiro = () =>
    setModal({
      type: 'retiro',
      novo: false,
      nome: state.retiro.nome,
      inicio: state.retiro.inicio,
      fim: state.retiro.fim,
      valor: String(valor),
      max: String(state.retiro.max),
      local: state.retiro.local,
      saida: state.retiro.saida,
      bannerId: state.retiro.bannerId,
    })

  return (
    <div data-screen-label="Retiros">
      <div className="crumbs">
        <span>Eventos</span>
        <span className="last">Gestão de eventos</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Eventos</h1>
          <div className="desc">Cadastro, link de inscrição e listas do evento (líderes, prédios, conduções).</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={abrirNovoRetiro}>
            + Criar evento
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
                onClick={copiarLink}
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
                Editar evento
              </button>
              <button className="btn btn-default btn-sm" onClick={abrirFormulario}>
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

      {/* Outros retiros (trocar) */}
      {outros.length > 0 && (
        <div className="tbl-wrap" style={{ marginBottom: 12 }}>
          <div className="tbl-head-bar">
            <h3>Outros eventos</h3>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{outros.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {outros.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                    {r.inicio ? fmtData(r.inicio) + ' a ' + fmtData(r.fim) : 'sem datas'} ·{' '}
                    {r.aberto ? 'inscrições abertas' : 'inscrições fechadas'}
                  </div>
                </div>
                <button className="btn btn-outline btn-xs" onClick={() => select(r.id)}>
                  Selecionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Líderes (por prédio) */}
      <div className="tbl-wrap" style={{ marginTop: 8 }}>
        <div className="tbl-head-bar">
          <h3>Líderes</h3>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{state.lideres.length} cadastrado(s)</span>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 10 }}>
            Aparecem no campo “Quem lhe convidou?” do formulário, filtrados pelo prédio escolhido.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', maxWidth: 560 }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: 180 }}
              value={novoLiderNome}
              onChange={(e) => setNovoLiderNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addLider()
              }}
              placeholder="Nome do líder"
            />
            <select
              className="input"
              style={{ width: 'auto', minWidth: 150 }}
              value={novoLiderPredio}
              onChange={(e) => setNovoLiderPredio(e.target.value)}
            >
              <option value="">Sem prédio</option>
              {state.predios.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={addLider}>
              Adicionar
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {state.lideres.map((l: Lider, i) => (
              <span
                key={i}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-muted)', borderRadius: 999, padding: '4px 6px 4px 12px', fontSize: 13 }}
              >
                {l.nome}
                {l.predio ? <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>· {l.predio}</span> : null}
                <button
                  onClick={() => removeLider(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: '0 3px', fontSize: 14, lineHeight: 1 }}
                  title="Remover"
                >
                  ×
                </button>
              </span>
            ))}
            {state.lideres.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Nenhum líder cadastrado ainda.</span>
            )}
          </div>
        </div>
      </div>

      <ListaChips
        titulo="Prédios"
        descricao="Prédios participando deste evento (campo “Qual prédio?” do formulário)."
        itens={state.predios}
        valor={novoPredio}
        setValor={setNovoPredio}
        onAdd={addPredio}
        onRemove={removePredio}
        placeholder="Nome do prédio"
        vazio="Nenhum prédio cadastrado ainda."
      />

      <ListaChips
        titulo="Conduções"
        descricao="Opções do campo “Como pretende ir?” no formulário de inscrição."
        itens={state.conducoes}
        valor={novaConducao}
        setValor={setNovaConducao}
        onAdd={addConducao}
        onRemove={removeConducao}
        placeholder="Ex.: Ônibus do Encontro"
        vazio="Nenhuma condução cadastrada ainda."
      />
    </div>
  )
}

/** Lista simples editável (chips): usada para prédios e conduções. */
function ListaChips({
  titulo,
  descricao,
  itens,
  valor,
  setValor,
  onAdd,
  onRemove,
  placeholder,
  vazio,
}: {
  titulo: string
  descricao: string
  itens: string[]
  valor: string
  setValor: (v: string) => void
  onAdd: () => void
  onRemove: (nome: string) => void
  placeholder: string
  vazio: string
}) {
  return (
    <div className="tbl-wrap" style={{ marginTop: 8 }}>
      <div className="tbl-head-bar">
        <h3>{titulo}</h3>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{itens.length} cadastrado(s)</span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 10 }}>{descricao}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, maxWidth: 420 }}>
          <input
            className="input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAdd()
            }}
            placeholder={placeholder}
          />
          <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={onAdd}>
            Adicionar
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {itens.map((item) => (
            <span
              key={item}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-muted)', borderRadius: 999, padding: '4px 6px 4px 12px', fontSize: 13 }}
            >
              {item}
              <button
                onClick={() => onRemove(item)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: '0 3px', fontSize: 14, lineHeight: 1 }}
                title="Remover"
              >
                ×
              </button>
            </span>
          ))}
          {itens.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{vazio}</span>
          )}
        </div>
      </div>
    </div>
  )
}
