import { useCallback, useEffect, useState } from 'react'
import { AttachmentLink } from '../components/AttachmentLink'
import { fmt } from '../lib/format'
import { apiClient, ApiError } from '../services/api/apiClient'
import { fileService } from '../services/fileService'
import { useRetiro } from '../store/RetiroContext'
import type { LojaCategoria, LojaPedido, LojaProduto } from '../types'

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api'

/** URL pública (sem auth) para exibir a foto de um produto. */
const fotoUrl = (id: string) => `${API_BASE}/public/banner/${id}`

const CATEGORIAS: { id: LojaCategoria; label: string }[] = [
  { id: 'vestimenta', label: 'Vestimentas' },
  { id: 'outros', label: 'Outros' },
]
const labelCategoria = (c: string) => CATEGORIAS.find((x) => x.id === c)?.label ?? c

const STATUS: { id: string; label: string; cls: string }[] = [
  { id: 'pendente', label: 'Pendente', cls: 'chip-pending' },
  { id: 'pago', label: 'Pago', cls: 'chip-approved' },
  { id: 'entregue', label: 'Entregue', cls: 'chip-approved' },
  { id: 'cancelado', label: 'Cancelado', cls: 'chip-rejected' },
]

interface ProdutoForm {
  id: string | null
  categoria: LojaCategoria
  nome: string
  descricao: string
  valor: string
  linkPagamento: string
  fotos: string[]
  ativo: boolean
}
const formVazio: ProdutoForm = {
  id: null,
  categoria: 'vestimenta',
  nome: '',
  descricao: '',
  valor: '',
  linkPagamento: '',
  fotos: [],
  ativo: true,
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

function dataHoraBR(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function LojaView() {
  const { state, toast } = useRetiro()
  const retiroId = state.retiro.id

  const [aba, setAba] = useState<'produtos' | 'pedidos'>('produtos')
  const [produtos, setProdutos] = useState<LojaProduto[]>([])
  const [pedidos, setPedidos] = useState<LojaPedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState<ProdutoForm | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)
  const [aExcluir, setAExcluir] = useState<LojaProduto | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [prs, peds] = await Promise.all([
        apiClient.get<LojaProduto[]>('/loja/produtos/' + retiroId),
        apiClient.get<LojaPedido[]>('/loja/pedidos/' + retiroId),
      ])
      setProdutos(prs)
      setPedidos(peds)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao carregar a loja.')
    } finally {
      setCarregando(false)
    }
  }, [retiroId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  // ---- Produto: criar / editar ----
  const abrirNovo = () => { setErro(''); setForm({ ...formVazio }) }
  const abrirEdicao = (p: LojaProduto) => {
    setErro('')
    setForm({ id: p.id, categoria: p.categoria, nome: p.nome, descricao: p.descricao, valor: String(p.valor), linkPagamento: p.linkPagamento, fotos: [...p.fotos], ativo: p.ativo })
  }

  const anexarFoto = async (file: File) => {
    if (!form || form.fotos.length >= 4) return
    setSubindoFoto(true)
    try {
      const att = await fileService.save(file)
      setForm((f) => (f ? { ...f, fotos: [...f.fotos, att.fileId] } : f))
    } catch {
      setErro('Não foi possível enviar a foto.')
    } finally {
      setSubindoFoto(false)
    }
  }
  const removerFoto = (id: string) =>
    setForm((f) => (f ? { ...f, fotos: f.fotos.filter((x) => x !== id) } : f))

  const salvar = async () => {
    if (!form || salvando) return
    if (!form.nome.trim()) { setErro('Informe o nome do produto.'); return }
    setErro('')
    setSalvando(true)
    const payload = {
      retiroId,
      categoria: form.categoria,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      valor: Number(form.valor) || 0,
      linkPagamento: form.linkPagamento.trim(),
      fotos: form.fotos,
      ativo: form.ativo,
    }
    try {
      if (form.id === null) await apiClient.post('/loja/produtos', payload)
      else await apiClient.put('/loja/produtos/' + form.id, payload)
      setForm(null)
      await carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao salvar produto.')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!aExcluir) return
    try {
      await apiClient.delete('/loja/produtos/' + aExcluir.id)
      setAExcluir(null)
      await carregar()
    } catch (e) {
      setAExcluir(null)
      setErro(e instanceof ApiError ? e.message : 'Erro ao excluir produto.')
    }
  }

  const copiarLink = (p: LojaProduto) => {
    const link = window.location.origin + '/loja/' + p.id
    navigator.clipboard?.writeText(link).catch(() => {})
    toast('Link copiado: ' + link)
  }

  const mudarStatus = async (ped: LojaPedido, status: string) => {
    setPedidos((lista) => lista.map((x) => (x.id === ped.id ? { ...x, status } : x)))
    try {
      await apiClient.put('/loja/pedidos/' + ped.id + '/status', { status })
    } catch {
      toast('Não foi possível atualizar o status.')
      void carregar()
    }
  }

  const anexarComprovantePedido = async (ped: LojaPedido, file: File) => {
    try {
      const att = await fileService.save(file)
      await apiClient.put('/loja/pedidos/' + ped.id + '/comprovante', { comprovanteId: att.fileId })
      setPedidos((lista) => lista.map((x) => (x.id === ped.id ? { ...x, comprovante: true, comprovanteId: att.fileId } : x)))
      toast('Comprovante anexado ao pedido.')
    } catch {
      toast('Não foi possível anexar o comprovante.')
    }
  }

  const totalPedidos = pedidos.reduce((a, p) => a + p.valorTotal, 0)

  return (
    <div data-screen-label="Loja">
      <div className="crumbs">
        <span>Administração</span>
        <span className="last">Loja</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Loja — {state.retiro.nome}</h1>
          <div className="desc">Cadastre produtos à venda (camisetas etc.) e acompanhe os pedidos. Cada produto tem um link público próprio.</div>
        </div>
        {aba === 'produtos' && (
          <div className="actions">
            <button className="btn btn-primary" onClick={abrirNovo}>+ Novo produto</button>
          </div>
        )}
      </div>

      {erro && (
        <div style={{ fontSize: 13, color: 'var(--status-rejected-fg)', background: 'var(--status-rejected-bg)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
          {erro}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button className={'btn btn-sm ' + (aba === 'produtos' ? 'btn-primary' : 'btn-default')} onClick={() => setAba('produtos')}>
          Produtos ({produtos.length})
        </button>
        <button className={'btn btn-sm ' + (aba === 'pedidos' ? 'btn-primary' : 'btn-default')} onClick={() => setAba('pedidos')}>
          Pedidos ({pedidos.length})
        </button>
      </div>

      {carregando ? (
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', padding: 20 }}>Carregando…</div>
      ) : aba === 'produtos' ? (
        <ProdutosTab produtos={produtos} onEditar={abrirEdicao} onExcluir={setAExcluir} onCopiarLink={copiarLink} />
      ) : (
        <PedidosTab pedidos={pedidos} total={totalPedidos} onStatus={mudarStatus} onAnexar={anexarComprovantePedido} />
      )}

      {/* Modal criar/editar produto */}
      {form && (
        <div onClick={() => !salvando && setForm(null)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...cardModal, maxWidth: 560 }}>
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 16 }}>{form.id === null ? 'Novo produto' : 'Editar produto'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Categoria</label>
                    <select className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as LojaCategoria })}>
                      {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Valor (R$)</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Nome do produto</label>
                  <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Camiseta do Encontro 2026" />
                </div>
                <div>
                  <label style={labelStyle}>Descrição</label>
                  <textarea className="input" rows={3} style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes do produto (tecido, cores, observações)…" />
                </div>

                <div>
                  <label style={labelStyle}>Link de pagamento (cartão)</label>
                  <input className="input" value={form.linkPagamento} onChange={(e) => setForm({ ...form, linkPagamento: e.target.value })} placeholder="https://… (exibido quando o comprador escolher Cartão)" />
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>
                    Opcional. Se vazio, usa o link de pagamento do evento.
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Fotos do produto (até 4)</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {form.fotos.map((id) => (
                      <div key={id} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                        <img src={fotoUrl(id)} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => removerFoto(id)}
                          title="Remover foto"
                          style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', fontSize: 11, lineHeight: 1 }}
                        >×</button>
                      </div>
                    ))}
                    {form.fotos.length < 4 && (
                      <label style={{ width: 72, height: 72, borderRadius: 8, border: '1px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 22, background: 'var(--bg-app)' }}>
                        {subindoFoto ? '…' : '+'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void anexarFoto(f); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                  Produto ativo (visível no link público)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button className="btn btn-default" disabled={salvando} onClick={() => setForm(null)}>Cancelar</button>
                <button className="btn btn-primary" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar produto'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal excluir produto */}
      {aExcluir && (
        <div onClick={() => setAExcluir(null)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...cardModal, maxWidth: 440 }}>
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Excluir produto</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Excluir o produto <b>{aExcluir.nome}</b>? Os pedidos já feitos são mantidos no histórico. Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" onClick={() => setAExcluir(null)}>Cancelar</button>
                <button className="btn" style={{ background: 'var(--status-rejected-fg)', color: '#fff' }} onClick={confirmarExclusao}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Aba Produtos ----------------------------------------------------------
function ProdutosTab({ produtos, onEditar, onExcluir, onCopiarLink }: {
  produtos: LojaProduto[]
  onEditar: (p: LojaProduto) => void
  onExcluir: (p: LojaProduto) => void
  onCopiarLink: (p: LojaProduto) => void
}) {
  if (produtos.length === 0)
    return <div className="tbl-wrap" style={{ padding: 24, fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum produto cadastrado. Clique em “+ Novo produto”.</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {produtos.map((p) => (
        <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: p.ativo ? 1 : 0.6 }}>
          <div style={{ height: 150, background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {p.fotos[0] ? (
              <img src={fotoUrl(p.fotos[0])} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>sem foto</span>
            )}
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
              <span className="chip-mini" style={{ background: 'var(--bg-muted)' }}>{labelCategoria(p.categoria)}</span>
              {!p.ativo && <span className="chip-mini chip-rejected">inativo</span>}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>{fmt(p.valor)}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-default btn-xs" onClick={() => onCopiarLink(p)}>Copiar link</button>
              <button className="btn btn-outline btn-xs" onClick={() => onEditar(p)}>Editar</button>
              <button className="btn btn-default btn-xs" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => onExcluir(p)}>Excluir</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Aba Pedidos -----------------------------------------------------------
function PedidosTab({ pedidos, total, onStatus, onAnexar }: {
  pedidos: LojaPedido[]
  total: number
  onStatus: (p: LojaPedido, status: string) => void
  onAnexar: (p: LojaPedido, file: File) => void
}) {
  if (pedidos.length === 0)
    return <div className="tbl-wrap" style={{ padding: 24, fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum pedido recebido ainda.</div>

  return (
    <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
      <div className="tbl-head-bar">
        <h3>Pedidos</h3>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{pedidos.length} pedido(s) · {fmt(total)}</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Data</th>
            <th>Produto</th>
            <th>Comprador</th>
            <th>Tam.</th>
            <th style={{ textAlign: 'center' }}>Qtd</th>
            <th style={{ textAlign: 'right' }}>Total</th>
            <th>Forma</th>
            <th>Comprovante</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{dataHoraBR(p.criadoEm)}</td>
              <td style={{ fontSize: 12 }}>{p.produtoNome}</td>
              <td style={{ fontSize: 12 }}>
                {p.categoria === 'vestimenta' ? (
                  <>
                    <div className="vaga-name">{p.nome || '—'}</div>
                    <div className="vaga-id">{p.genero === 'M' ? 'Homem' : p.genero === 'F' ? 'Mulher' : ''}</div>
                  </>
                ) : (
                  <span style={{ color: 'var(--fg-muted)' }}>—</span>
                )}
              </td>
              <td style={{ fontSize: 12 }}>
                {p.tamanho || '—'}
                {p.tipoCamiseta && <div className="vaga-id">{p.tipoCamiseta}</div>}
              </td>
              <td style={{ fontSize: 12, textAlign: 'center' }}>{p.quantidade}</td>
              <td style={{ fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{fmt(p.valorTotal)}</td>
              <td style={{ fontSize: 12 }}>{p.forma}</td>
              <td style={{ fontSize: 12 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {p.comprovanteId
                    ? <AttachmentLink fileId={p.comprovanteId} label="📎 ver" style={{ fontSize: 11 }} />
                    : <span style={{ color: 'var(--fg-muted)' }}>—</span>}
                  <label style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} title="Anexar comprovante de pagamento">
                    {p.comprovanteId ? 'trocar' : 'anexar'}
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onAnexar(p, f); e.target.value = '' }} />
                  </label>
                </div>
              </td>
              <td>
                <select className="input" style={{ width: 'auto', fontSize: 12, padding: '4px 6px' }} value={p.status} onChange={(e) => onStatus(p, e.target.value)}>
                  {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }
const cardModal: React.CSSProperties = { background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxHeight: '92vh', overflowY: 'auto', animation: 'popIn .18s var(--ease-default)' }
