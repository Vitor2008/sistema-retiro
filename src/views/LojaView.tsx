import { useCallback, useEffect, useState } from 'react'
import { AttachmentLink } from '../components/AttachmentLink'
import { fmt } from '../lib/format'
import { apiClient, ApiError } from '../services/api/apiClient'
import { fileService } from '../services/fileService'
import { exportPedidosLoja } from '../services/lojaReport'
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

/** Situação de pagamento exibida (derivada dos lançamentos; 'cancelado' vem do
 *  campo status). */
type SituacaoPedido = 'pendente' | 'parcial' | 'pago' | 'cancelado'
const STATUS_INFO: Record<SituacaoPedido, { label: string; bg: string; fg: string }> = {
  pendente: { label: 'Pendente', bg: 'var(--status-progress-bg)', fg: 'var(--status-progress-fg)' },
  parcial: { label: 'Pago Parcial', bg: 'var(--status-interview-bg)', fg: 'var(--status-interview-fg)' },
  pago: { label: 'Pago', bg: 'var(--status-final-bg)', fg: 'var(--status-final-fg)' },
  cancelado: { label: 'Cancelado', bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)' },
}
const somaPago = (p: LojaPedido) => (p.pagamentos ?? []).reduce((a, x) => a + (x.valor || 0), 0)
function situacaoPedido(p: LojaPedido): SituacaoPedido {
  if (p.status === 'cancelado') return 'cancelado'
  const pg = somaPago(p)
  if (p.valorTotal > 0 && pg >= p.valorTotal - 0.005) return 'pago'
  if (pg > 0) return 'parcial'
  return 'pendente'
}

interface ProdutoForm {
  id: string | null
  categoria: LojaCategoria
  nome: string
  descricao: string
  valor: string
  conta: 'imel' | 'outra'
  pixChave: string
  pixNome: string
  pixBanco: string
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
  conta: 'imel',
  pixChave: '',
  pixNome: '',
  pixBanco: '',
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
  const [aExcluirPedido, setAExcluirPedido] = useState<LojaPedido | null>(null)
  // Pedido aberto no modal de pagamento.
  const [pagPedido, setPagPedido] = useState<LojaPedido | null>(null)

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
    setForm({ id: p.id, categoria: p.categoria, nome: p.nome, descricao: p.descricao, valor: String(p.valor), conta: p.conta, pixChave: p.pixChave, pixNome: p.pixNome, pixBanco: p.pixBanco, linkPagamento: p.linkPagamento, fotos: [...p.fotos], ativo: p.ativo })
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
    if (form.conta === 'outra' && !form.pixChave.trim()) { setErro('Informe a chave PIX do recebedor (conta externa).'); return }
    setErro('')
    setSalvando(true)
    const payload = {
      retiroId,
      categoria: form.categoria,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      valor: Number(form.valor) || 0,
      conta: form.conta,
      pixChave: form.conta === 'outra' ? form.pixChave.trim() : '',
      pixNome: form.conta === 'outra' ? form.pixNome.trim() : '',
      pixBanco: form.conta === 'outra' ? form.pixBanco.trim() : '',
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

  // Aplica a versão atualizada de um pedido na lista e no modal aberto.
  const aplicarPedido = (p: LojaPedido) => {
    setPedidos((lista) => lista.map((x) => (x.id === p.id ? p : x)))
    setPagPedido((cur) => (cur && cur.id === p.id ? p : cur))
  }

  const registrarPagamento = async (ped: LojaPedido, valor: number, obs: string, dataPrevista: string | null) => {
    try {
      const atualizado = await apiClient.post<LojaPedido>('/loja/pedidos/' + ped.id + '/pagamentos', { valor, obs, dataPrevista })
      aplicarPedido(atualizado)
      toast('Pagamento registrado.')
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Não foi possível registrar o pagamento.')
    }
  }

  const removerPagamento = async (ped: LojaPedido, idx: number) => {
    try {
      await apiClient.delete('/loja/pedidos/' + ped.id + '/pagamentos/' + idx)
      aplicarPedido({ ...ped, pagamentos: ped.pagamentos.filter((_, i) => i !== idx) })
    } catch {
      toast('Não foi possível remover o lançamento.')
    }
  }

  const mudarStatusPedido = async (ped: LojaPedido, status: string) => {
    try {
      await apiClient.put('/loja/pedidos/' + ped.id + '/status', { status })
      aplicarPedido({ ...ped, status })
      toast(status === 'cancelado' ? 'Pedido cancelado.' : 'Pedido reaberto.')
    } catch {
      toast('Não foi possível atualizar o pedido.')
    }
  }

  const anexarComprovantePedido = async (ped: LojaPedido, file: File) => {
    try {
      const att = await fileService.save(file)
      await apiClient.put('/loja/pedidos/' + ped.id + '/comprovante', { comprovanteId: att.fileId })
      aplicarPedido({ ...ped, comprovante: true, comprovanteId: att.fileId })
      toast('Comprovante anexado ao pedido.')
    } catch {
      toast('Não foi possível anexar o comprovante.')
    }
  }

  const confirmarExcluirPedido = async () => {
    if (!aExcluirPedido) return
    try {
      await apiClient.delete('/loja/pedidos/' + aExcluirPedido.id)
      setPedidos((lista) => lista.filter((x) => x.id !== aExcluirPedido.id))
      setAExcluirPedido(null)
      toast('Pedido excluído.')
    } catch (e) {
      setAExcluirPedido(null)
      toast(e instanceof ApiError ? e.message : 'Não foi possível excluir o pedido.')
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
        {aba === 'produtos' ? (
          <div className="actions">
            <button className="btn btn-primary" onClick={abrirNovo}>+ Novo produto</button>
          </div>
        ) : (
          <div className="actions">
            <button
              className="btn btn-outline"
              disabled={pedidos.length === 0}
              onClick={() => {
                exportPedidosLoja(pedidos, state.retiro.nome, state.retiro.slug).catch(() =>
                  toast('Não foi possível gerar o relatório.'),
                )
              }}
            >
              Exportar relatório
            </button>
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
        <PedidosTab pedidos={pedidos} total={totalPedidos} onAnexar={anexarComprovantePedido} onExcluir={setAExcluirPedido} onPagamento={setPagPedido} />
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
                  <label style={labelStyle}>Conta de recebimento</label>
                  <select className="input" value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value as 'imel' | 'outra' })}>
                    <option value="imel">IMEL (igreja) — padrão</option>
                    <option value="outra">Outra conta (recebedor externo)</option>
                  </select>
                </div>

                {form.conta === 'outra' && (
                  <>
                    <div>
                      <label style={labelStyle}>Chave PIX do recebedor</label>
                      <input className="input" value={form.pixChave} onChange={(e) => setForm({ ...form, pixChave: e.target.value })} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>
                        Exibida no formulário público quando o comprador escolher PIX (no lugar da chave do IMEL).
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Nome recebedor</label>
                        <input className="input" value={form.pixNome} onChange={(e) => setForm({ ...form, pixNome: e.target.value })} placeholder="Nome de quem recebe" />
                      </div>
                      <div>
                        <label style={labelStyle}>Banco recebedor</label>
                        <input className="input" value={form.pixBanco} onChange={(e) => setForm({ ...form, pixBanco: e.target.value })} placeholder="Ex.: Nubank, Sicredi…" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label style={labelStyle}>Link de pagamento (cartão){form.conta === 'outra' ? ' — recebedor' : ''}</label>
                  <input className="input" value={form.linkPagamento} onChange={(e) => setForm({ ...form, linkPagamento: e.target.value })} placeholder="https://… (exibido quando o comprador escolher Cartão)" />
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>
                    Opcional. {form.conta === 'outra' ? 'Link de pagamento por cartão do recebedor externo.' : 'Se vazio, usa o link de pagamento do evento.'}
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

      {/* Modal excluir pedido (só cancelados) */}
      {aExcluirPedido && (
        <div onClick={() => setAExcluirPedido(null)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...cardModal, maxWidth: 440 }}>
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Excluir pedido</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Excluir definitivamente o pedido de <b>{aExcluirPedido.produtoNome}</b>
                {aExcluirPedido.nome ? <> — {aExcluirPedido.nome}</> : null}? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" onClick={() => setAExcluirPedido(null)}>Cancelar</button>
                <button className="btn" style={{ background: 'var(--status-rejected-fg)', color: '#fff' }} onClick={confirmarExcluirPedido}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pagamento do pedido */}
      {pagPedido && (
        <PagamentoPedidoModal
          pedido={pagPedido}
          onRegistrar={registrarPagamento}
          onRemover={removerPagamento}
          onStatus={mudarStatusPedido}
          onClose={() => setPagPedido(null)}
        />
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
function PedidosTab({ pedidos, total, onAnexar, onExcluir, onPagamento }: {
  pedidos: LojaPedido[]
  total: number
  onAnexar: (p: LojaPedido, file: File) => void
  onExcluir: (p: LojaPedido) => void
  onPagamento: (p: LojaPedido) => void
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
            <th style={{ textAlign: 'right' }}>Ações</th>
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
              <td style={{ fontSize: 12, textAlign: 'right', fontWeight: 600 }}>
                {fmt(p.valorTotal)}
                {somaPago(p) > 0 && situacaoPedido(p) !== 'pago' && (
                  <div className="vaga-id" style={{ fontWeight: 400 }}>pago {fmt(somaPago(p))}</div>
                )}
              </td>
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
                {(() => {
                  const info = STATUS_INFO[situacaoPedido(p)]
                  return <span className="chip-mini" style={{ background: info.bg, color: info.fg }}>{info.label}</span>
                })()}
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', gap: 6 }}>
                  <button className="btn btn-outline btn-xs" onClick={() => onPagamento(p)}>
                    {p.status === 'cancelado' ? 'Ver' : 'Pagamento'}
                  </button>
                  {p.status === 'cancelado' && (
                    <button className="btn btn-default btn-xs" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => onExcluir(p)}>
                      Excluir
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- Modal de pagamento do pedido -----------------------------------------
function PagamentoPedidoModal({ pedido, onRegistrar, onRemover, onStatus, onClose }: {
  pedido: LojaPedido
  onRegistrar: (p: LojaPedido, valor: number, obs: string, dataPrevista: string | null) => void
  onRemover: (p: LojaPedido, idx: number) => void
  onStatus: (p: LojaPedido, status: string) => void
  onClose: () => void
}) {
  const pago = somaPago(pedido)
  const restante = Math.max(0, pedido.valorTotal - pago)
  const sit = situacaoPedido(pedido)
  const cancelado = pedido.status === 'cancelado'
  const info = STATUS_INFO[sit]

  const [valor, setValor] = useState(restante > 0 ? String(restante.toFixed(2)) : '')
  const [obs, setObs] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const valorN = Number(valor) || 0
  const parcial = valorN > 0 && valorN < restante - 0.005

  const registrar = () => {
    if (!(valorN > 0)) return
    onRegistrar(pedido, valorN, obs.trim(), parcial && dataPrevista ? dataPrevista : null)
    setValor('')
    setObs('')
    setDataPrevista('')
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...cardModal, maxWidth: 520 }}>
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h3>Pagamento do pedido</h3>
            <span className="chip-mini" style={{ background: info.bg, color: info.fg }}>{info.label}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 14 }}>
            {pedido.produtoNome}{pedido.nome ? ' — ' + pedido.nome : ''}
            {pedido.tamanho ? ' · ' + pedido.tamanho : ''}{pedido.tipoCamiseta ? ' (' + pedido.tipoCamiseta + ')' : ''} · {pedido.quantidade} un
          </p>

          {/* Resumo financeiro */}
          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
              <div><div style={labelStyle}>Total</div><div style={{ fontWeight: 700 }}>{fmt(pedido.valorTotal)}</div></div>
              <div><div style={labelStyle}>Pago</div><div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(pago)}</div></div>
              <div><div style={labelStyle}>Restante</div><div style={{ fontWeight: 700, color: restante > 0 ? 'var(--status-rejected-fg)' : 'var(--status-final-fg)' }}>{fmt(restante)}</div></div>
            </div>
            {pedido.pagamentos.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {pedido.pagamentos.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg-muted)', borderTop: '1px dashed var(--border-default)', paddingTop: 6, marginTop: 6 }}>
                    <span>
                      {dataHoraBR(h.data)}{h.obs ? ' — ' + h.obs : ''}{h.dataPrevista ? ' · restante previsto p/ ' + h.dataPrevista : ''}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ color: 'var(--color-primary)' }}>{fmt(h.valor)}</b>
                      {!cancelado && (
                        <button onClick={() => onRemover(pedido, i)} title="Remover lançamento" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-rejected-fg)', fontSize: 13, lineHeight: 1 }}>×</button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registrar pagamento (oculto se cancelado ou já quitado) */}
          {!cancelado && restante > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Valor pago agora (R$)</label>
                  <input className="input" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
                </div>
                {parcial && (
                  <div>
                    <label style={labelStyle}>Restante previsto para</label>
                    <input className="input" type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} />
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Observação</label>
                <input className="input" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: pagou metade, resto na entrega…" />
              </div>
              <div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!(valorN > 0)} onClick={registrar}>
                  {parcial ? 'Registrar pagamento parcial' : 'Registrar pagamento'}
                </button>
              </div>
            </div>
          )}

          {/* Ações do pedido */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            {cancelado ? (
              <button className="btn btn-default btn-sm" onClick={() => onStatus(pedido, 'pendente')}>Reabrir pedido</button>
            ) : (
              <button className="btn btn-default btn-sm" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => onStatus(pedido, 'cancelado')}>Cancelar pedido</button>
            )}
            <button className="btn btn-default" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }
const cardModal: React.CSSProperties = { background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxHeight: '92vh', overflowY: 'auto', animation: 'popIn .18s var(--ease-default)' }
