import { useEffect, useState } from 'react'
import { isAdmin } from '../acessos'
import { fmt, initials, uid } from '../lib/format'
import { apiClient, ApiError } from '../services/api/apiClient'
import { useAuth } from '../store/AuthContext'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { ativos } from '../store/selectors'
import { useViewport } from '../hooks/useViewport'
import type { CantinaCatalogoItem, CantinaTab, FormaPagamento, Produto, Venda } from '../types'

function estInfo(p: Produto): [string, string] {
  if (p.estoque === 0) return ['chip-rejected', 'esgotado']
  if (p.estoque <= 5) return ['chip-progress', p.estoque + ' un.']
  return ['chip-approved', p.estoque + ' un.']
}

export function CantinaView() {
  const { state, patch, toast } = useRetiro()
  const { addCart, finalizarVenda, setModal } = useActions()
  const { mid } = useViewport()
  const { user } = useAuth()
  const admin = isAdmin(user?.acessos)

  // Catálogo global de produtos (reutilizável entre eventos).
  const [catalogo, setCatalogo] = useState<CantinaCatalogoItem[]>([])
  useEffect(() => {
    apiClient.get<CantinaCatalogoItem[]>('/cantina-catalogo').then(setCatalogo).catch(() => setCatalogo([]))
  }, [])

  // Modal local de novo produto (com escolha global x só do evento).
  const [npOpen, setNpOpen] = useState(false)
  const [npNome, setNpNome] = useState('')
  const [npValor, setNpValor] = useState('')
  const [npEstoque, setNpEstoque] = useState('')
  const [npGlobal, setNpGlobal] = useState(true)
  const [npSalvando, setNpSalvando] = useState(false)
  // Confirmação de exclusão de item do catálogo.
  const [aExcluirCat, setAExcluirCat] = useState<CantinaCatalogoItem | null>(null)
  const [excluindoCat, setExcluindoCat] = useState(false)
  // Confirmação de exclusão de conta aberta (pendente).
  const [aExcluirConta, setAExcluirConta] = useState<Venda | null>(null)

  const s = state
  const narrow = s.narrow
  const seg = (on: boolean) => (on ? 'on' : '')
  const cart = s.carrinho
  // Só produtos ativos aparecem na venda e nas listas do evento.
  const produtosAtivos = s.produtos.filter((p) => p.ativo !== false)

  const trazerProduto = (cat: CantinaCatalogoItem) => {
    const ex = s.produtos.find((p) => p.catalogoId === cat.id)
    if (ex) {
      patch({ produtos: s.produtos.map((p) => (p.id === ex.id ? { ...p, ativo: true } : p)) })
    } else {
      patch({ produtos: s.produtos.concat([{ id: uid('pr'), nome: cat.nome, valor: cat.valor, estoque: 0, catalogoId: cat.id, ativo: true }]) })
    }
  }
  const removerDoEvento = (produtoId: string) =>
    patch({ produtos: s.produtos.map((p) => (p.id === produtoId ? { ...p, ativo: false } : p)) })

  const criarProduto = async () => {
    const nome = npNome.trim()
    if (!nome) { toast('Informe o nome do produto.'); return }
    const valor = Number(npValor) || 0
    const estoque = Number(npEstoque) || 0
    setNpSalvando(true)
    try {
      let catalogoId: number | null = null
      if (npGlobal) {
        const cat = await apiClient.post<CantinaCatalogoItem>('/cantina-catalogo', { nome, valor })
        setCatalogo((lista) => [...lista, cat].sort((a, b) => a.nome.localeCompare(b.nome)))
        catalogoId = cat.id
      }
      patch({ produtos: s.produtos.concat([{ id: uid('pr'), nome, valor, estoque, catalogoId, ativo: true }]) })
      setNpOpen(false); setNpNome(''); setNpValor(''); setNpEstoque(''); setNpGlobal(true)
      toast('Produto criado.')
    } catch {
      toast('Não foi possível cadastrar no catálogo.')
    } finally {
      setNpSalvando(false)
    }
  }

  // Exclui a conta aberta (venda pendente) e suas vendas relacionadas (mesmo
  // cliente, ainda pendentes). Só ADM.
  const confirmarExcluirConta = () => {
    if (!aExcluirConta) return
    const cliente = aExcluirConta.cliente.trim().toLowerCase()
    const removidas = s.vendas.filter(
      (v) => v.status === 'pendente' && v.cliente.trim().toLowerCase() === cliente,
    )
    // Devolve ao estoque as unidades dos itens das contas removidas.
    const restauro: Record<string, number> = {}
    removidas.forEach((v) => v.itens.forEach((it) => { restauro[it.id] = (restauro[it.id] || 0) + it.qtd }))
    patch({
      vendas: s.vendas.filter((v) => !removidas.includes(v)),
      produtos: s.produtos.map((p) => (restauro[p.id] ? { ...p, estoque: p.estoque + restauro[p.id] } : p)),
    })
    setAExcluirConta(null)
    toast('Conta excluída e estoque devolvido.')
  }

  const confirmarExcluirCatalogo = async () => {
    if (!aExcluirCat) return
    setExcluindoCat(true)
    try {
      await apiClient.delete('/cantina-catalogo/' + aExcluirCat.id)
      setCatalogo((lista) => lista.filter((c) => c.id !== aExcluirCat.id))
      setAExcluirCat(null)
      toast('Produto excluído do catálogo.')
    } catch (e) {
      setAExcluirCat(null)
      toast(e instanceof ApiError ? e.message : 'Não foi possível excluir do catálogo.')
    } finally {
      setExcluindoCat(false)
    }
  }
  const cartTotal = cart.reduce((a, i) => a + i.valor * i.qtd, 0)
  const contasPend = s.vendas.filter((v) => v.status === 'pendente')
  const vfBtn = (f: FormaPagamento) => (s.vendaForma === f ? 'btn-primary' : 'btn-default')
  const setVForma = (f: FormaPagamento) => patch({ vendaForma: f })

  const tab = (t: CantinaTab, label: string) => (
    <button className={seg(s.cantinaTab === t)} onClick={() => patch({ cantinaTab: t })}>
      {label}
    </button>
  )

  return (
    <div data-screen-label="Cantina">
      <div className="crumbs">
        <span>Financeiro</span>
        <span className="last">Cantina</span>
      </div>
      <div
        className="page-head"
        style={narrow ? { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12 } : undefined}
      >
        <div>
          <h1>Cantina</h1>
          <div className="desc">Vendas, estoque e contas abertas do evento.</div>
        </div>
        <div className="actions" style={narrow ? { flexWrap: 'wrap' } : undefined}>
          <div className="seg" style={narrow ? { flexWrap: 'wrap' } : undefined}>
            {tab('venda', 'Venda')}
            <button className={seg(s.cantinaTab === 'contas')} onClick={() => patch({ cantinaTab: 'contas' })}>
              Contas abertas
              {contasPend.length > 0 && (
                <span style={{ background: 'var(--color-secondary)', color: '#fff', borderRadius: 999, fontSize: 10, padding: '1px 6px', marginLeft: 4 }}>
                  {contasPend.length}
                </span>
              )}
            </button>
            {tab('produtos', 'Produtos')}
            {tab('resumo', 'Resumo')}
          </div>
        </div>
      </div>

      {s.cantinaTab === 'venda' && (
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 320px', gap: 14, alignItems: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr 1fr' : mid ? '1fr 1fr' : '1fr 1fr 1fr', gap: 10 }}>
            {produtosAtivos.length === 0 && (
              <div style={{ gridColumn: '1 / -1', fontSize: 13, color: 'var(--fg-muted)', padding: 16 }}>
                Nenhum produto ativo neste evento. Vá em <b>Produtos</b> e traga produtos do catálogo.
              </div>
            )}
            {produtosAtivos.map((p) => {
              const [, lbl] = estInfo(p)
              return (
                <button
                  key={p.id}
                  onClick={() => addCart(p)}
                  className="card"
                  style={{ textAlign: 'left', cursor: 'pointer', padding: 14, fontFamily: 'var(--font-sans)', border: '1px solid var(--border-default)', opacity: p.estoque === 0 ? 0.5 : 1 }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)' }}>{p.nome}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 15 }}>{fmt(p.valor)}</span>
                    <span
                      className="chip-mini"
                      style={{
                        background: p.estoque === 0 ? 'var(--status-rejected-bg)' : p.estoque <= 5 ? 'var(--status-progress-bg)' : 'var(--color-sage-soft)',
                        color: p.estoque === 0 ? 'var(--status-rejected-fg)' : p.estoque <= 5 ? 'var(--status-progress-fg)' : 'var(--status-final-fg)',
                      }}
                    >
                      {lbl}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="panel" style={{ position: 'sticky', top: 16 }}>
            <div className="head" style={{ marginBottom: 10 }}>
              <h3>Venda atual</h3>
              {cart.length > 0 && (
                <button className="btn btn-default btn-xs" onClick={() => patch({ carrinho: [] })}>Limpar</button>
              )}
            </div>
            {cart.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', padding: '18px 0', textAlign: 'center' }}>
                Toque nos produtos para adicionar.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cart.map((i) => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.nome}</span>
                  <button
                    className="btn btn-default btn-xs"
                    style={{ padding: '2px 8px' }}
                    onClick={() =>
                      patch({
                        carrinho:
                          i.qtd <= 1
                            ? cart.filter((x) => x.id !== i.id)
                            : cart.map((x) => (x.id === i.id ? { ...x, qtd: x.qtd - 1 } : x)),
                      })
                    }
                  >
                    −
                  </button>
                  <b style={{ width: 18, textAlign: 'center' }}>{i.qtd}</b>
                  <button className="btn btn-default btn-xs" style={{ padding: '2px 8px' }} onClick={() => addCart(s.produtos.find((p) => p.id === i.id)!)}>+</button>
                  <span style={{ width: 70, textAlign: 'right', fontWeight: 600 }}>{fmt(i.valor * i.qtd)}</span>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-sage)', marginTop: 12, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--color-primary)' }}>{fmt(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button className={'btn ' + (s.vendaTipo === 'avulsa' ? 'btn-primary' : 'btn-default') + ' btn-sm'} style={{ flex: 1, justifyContent: 'center' }} onClick={() => patch({ vendaTipo: 'avulsa' })}>
                    Venda avulsa
                  </button>
                  <button className={'btn ' + (s.vendaTipo === 'anotada' ? 'btn-secondary' : 'btn-default') + ' btn-sm'} style={{ flex: 1, justifyContent: 'center' }} onClick={() => patch({ vendaTipo: 'anotada' })}>
                    Anotar na conta
                  </button>
                </div>

                {s.vendaTipo === 'avulsa' && (
                  <>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Forma de pagamento</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                      <button className={'btn ' + vfBtn('Dinheiro') + ' btn-xs'} style={{ justifyContent: 'center' }} onClick={() => setVForma('Dinheiro')}>Dinheiro</button>
                      <button className={'btn ' + vfBtn('Pix') + ' btn-xs'} style={{ justifyContent: 'center' }} onClick={() => setVForma('Pix')}>Pix</button>
                      <button className={'btn ' + vfBtn('Débito') + ' btn-xs'} style={{ justifyContent: 'center' }} onClick={() => setVForma('Débito')}>Débito</button>
                      <button className={'btn ' + vfBtn('Crédito') + ' btn-xs'} style={{ justifyContent: 'center' }} onClick={() => setVForma('Crédito')}>Crédito</button>
                    </div>
                  </>
                )}

                {s.vendaTipo === 'anotada' && (
                  <>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Cliente (conta aberta)</label>
                    <input
                      className="input"
                      style={{ marginBottom: 6 }}
                      list="clientes-contas"
                      placeholder="Nome do cliente…"
                      value={s.vCliente}
                      onChange={(e) => patch({ vCliente: e.target.value })}
                    />
                    <datalist id="clientes-contas">
                      {Array.from(new Set(contasPend.map((v) => v.cliente).concat(ativos(s).map((p) => p.nome))))
                        .slice(0, 60)
                        .map((c) => (
                          <option key={c} value={c}></option>
                        ))}
                    </datalist>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 12 }}>
                      Itens entram como pendentes na conta do cliente, para fechamento posterior.
                    </div>
                  </>
                )}

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 11 }} onClick={finalizarVenda}>
                  {s.vendaTipo === 'anotada' ? 'Lançar na conta' : 'Finalizar venda — ' + fmt(cartTotal)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {s.cantinaTab === 'contas' && (
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 12, alignItems: 'start' }}>
          {contasPend.map((v) => {
            const total = v.itens.reduce((a, i) => a + i.valor * i.qtd, 0)
            return (
              <div key={v.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="avatar-initials" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(v.cliente)}</div>
                  <div>
                    <h3 style={{ fontSize: 14 }}>{v.cliente}</h3>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>aberta em {v.data}</div>
                  </div>
                  <span className="chip chip-progress" style={{ marginLeft: 'auto' }}>Pendente</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  {v.itens.map((i, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-default)' }}>
                      <span>{i.qtd}× {i.nome}</span>
                      <span>{fmt(i.valor * i.qtd)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-default)', paddingTop: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    Total <span style={{ color: 'var(--color-primary)' }}>{fmt(total)}</span>
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-default btn-xs" onClick={() => patch({ cantinaTab: 'venda', vendaTipo: 'anotada', vCliente: v.cliente })}>+ Itens</button>
                    <button className="btn btn-outline btn-xs" onClick={() => setModal({ type: 'editarConta', vid: v.id, itens: v.itens.map((i) => ({ ...i })) })}>Editar</button>
                    <button className="btn btn-primary btn-xs" onClick={() => setModal({ type: 'fecharConta', vid: v.id, pagamentos: [{ forma: 'Dinheiro', valor: String(total) }] })}>Receber</button>
                    {admin && (
                      <button className="btn btn-default btn-xs" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => setAExcluirConta(v)}>Excluir</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {contasPend.length === 0 && (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
              Nenhuma conta aberta no momento.
            </div>
          )}
        </div>
      )}

      {s.cantinaTab === 'produtos' && (
        <>
          {/* Catálogo global — marque o que este evento vai vender */}
          <div className="tbl-wrap" style={{ marginBottom: 14 }}>
            <div className="tbl-head-bar">
              <h3>Catálogo de produtos (global)</h3>
              <div className="actions">
                <button className="btn btn-primary btn-xs" onClick={() => setNpOpen(true)}>+ Novo produto</button>
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 10 }}>
                Marque os produtos que este evento vai vender. Desmarcar não apaga o estoque — só oculta do evento.
              </div>
              {catalogo.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Nenhum produto no catálogo ainda. Crie um em “+ Novo produto” marcando como global.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                  {catalogo.map((cat) => {
                    const evp = s.produtos.find((p) => p.catalogoId === cat.id)
                    const on = !!evp && evp.ativo !== false
                    return (
                      <label
                        key={cat.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '7px 10px', borderRadius: 8, border: '1px solid ' + (on ? 'var(--color-primary)' : 'var(--border-default)'), background: on ? 'var(--color-primary-tint)' : '#fff' }}
                      >
                        <input type="checkbox" checked={on} onChange={() => (on && evp ? removerDoEvento(evp.id) : trazerProduto(cat))} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                        <span style={{ flex: 1 }}>{cat.nome}</span>
                        <span style={{ color: 'var(--fg-muted)' }}>{fmt(cat.valor)}</span>
                        <button onClick={(e) => { e.preventDefault(); setAExcluirCat(cat) }} title="Excluir do catálogo" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1 }}>×</button>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Produtos ativos no evento (estoque) */}
          <div className="tbl-wrap">
            <div className="tbl-head-bar">
              <h3>Produtos deste evento</h3>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{produtosAtivos.length} ativo(s)</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th style={{ textAlign: 'right' }}>Valor unitário</th>
                    <th style={{ textAlign: 'right' }}>Estoque</th>
                    <th></th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosAtivos.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13, padding: 20 }}>Nenhum produto ativo. Traga do catálogo acima ou crie um novo.</td></tr>
                  )}
                  {produtosAtivos.map((p) => {
                    const [cls] = estInfo(p)
                    const estLabel = p.estoque === 0 ? 'Esgotado' : p.estoque <= 5 ? 'Estoque baixo' : 'OK'
                    return (
                      <tr key={p.id}>
                        <td className="vaga-name">
                          {p.nome}
                          {p.catalogoId == null && <span className="chip-mini" style={{ marginLeft: 6, background: 'var(--bg-muted)' }}>só deste evento</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>{fmt(p.valor)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.estoque}</td>
                        <td>
                          <span className={'chip-mini ' + cls}>{estLabel}</span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn btn-default btn-xs" onClick={() => patch({ produtos: s.produtos.map((x) => (x.id === p.id ? { ...x, estoque: Math.max(0, x.estoque - 1) } : x)) })}>− estoque</button>
                            <button className="btn btn-default btn-xs" onClick={() => patch({ produtos: s.produtos.map((x) => (x.id === p.id ? { ...x, estoque: x.estoque + 1 } : x)) })}>+ estoque</button>
                            <button className="btn btn-outline btn-xs" onClick={() => setModal({ type: 'produto', pid: p.id, nome: p.nome, valor: String(p.valor), estoque: String(p.estoque) })}>Editar</button>
                            <button className="btn btn-default btn-xs" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => removerDoEvento(p.id)}>Remover</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {s.cantinaTab === 'resumo' && <ResumoVendas />}

      {aExcluirConta && (
        <div
          onClick={() => setAExcluirConta(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 460, animation: 'popIn .18s var(--ease-default)' }}>
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Excluir conta aberta</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Excluir a conta de <b>{aExcluirConta.cliente}</b> e todos os itens lançados nela? A conta ainda não foi paga. Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" onClick={() => setAExcluirConta(null)}>Cancelar</button>
                <button className="btn" style={{ background: 'var(--status-rejected-fg)', color: '#fff' }} onClick={confirmarExcluirConta}>Excluir conta</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aExcluirCat && (
        <div
          onClick={() => !excluindoCat && setAExcluirCat(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 460, animation: 'popIn .18s var(--ease-default)' }}>
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Excluir produto do catálogo</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Excluir <b>{aExcluirCat.nome}</b> do catálogo? Só é permitido se ele não estiver ativo em nenhum evento. O histórico de vendas é mantido.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" disabled={excluindoCat} onClick={() => setAExcluirCat(null)}>Cancelar</button>
                <button className="btn" style={{ background: 'var(--status-rejected-fg)', color: '#fff' }} disabled={excluindoCat} onClick={confirmarExcluirCatalogo}>
                  {excluindoCat ? 'Excluindo…' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {npOpen && (
        <div
          onClick={() => !npSalvando && setNpOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 460, animation: 'popIn .18s var(--ease-default)' }}>
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 16 }}>Novo produto</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Nome do produto</label>
                  <input className="input" value={npNome} onChange={(e) => setNpNome(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Valor unitário (R$)</label>
                    <input className="input" type="number" min="0" step="0.5" value={npValor} onChange={(e) => setNpValor(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Estoque neste evento</label>
                    <input className="input" type="number" min="0" value={npEstoque} onChange={(e) => setNpEstoque(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Disponibilidade</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className={'btn btn-sm ' + (npGlobal ? 'btn-primary' : 'btn-default')} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setNpGlobal(true)}>
                      Global (catálogo)
                    </button>
                    <button type="button" className={'btn btn-sm ' + (!npGlobal ? 'btn-primary' : 'btn-default')} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setNpGlobal(false)}>
                      Só deste evento
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>
                    {npGlobal ? 'Fica disponível no catálogo para todos os eventos e já entra neste.' : 'Fica disponível apenas neste evento.'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                <button className="btn btn-default" disabled={npSalvando} onClick={() => setNpOpen(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={npSalvando} onClick={criarProduto}>{npSalvando ? 'Salvando…' : 'Salvar produto'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResumoVendas() {
  const { state, patch, toast } = useRetiro()
  const { user } = useAuth()
  const admin = isAdmin(user?.acessos)
  const s = state
  const narrow = s.narrow
  const contasPend = s.vendas.filter((v) => v.status === 'pendente')
  const avulsas = s.vendas.filter((v) => v.tipo === 'avulsa')
  const [aExcluirVenda, setAExcluirVenda] = useState<Venda | null>(null)

  const confirmarExcluirVenda = () => {
    if (!aExcluirVenda) return
    // Devolve ao estoque as unidades dos itens desta venda.
    const restauro: Record<string, number> = {}
    aExcluirVenda.itens.forEach((it) => { restauro[it.id] = (restauro[it.id] || 0) + it.qtd })
    patch({
      vendas: s.vendas.filter((v) => v.id !== aExcluirVenda.id),
      produtos: s.produtos.map((p) => (restauro[p.id] ? { ...p, estoque: p.estoque + restauro[p.id] } : p)),
    })
    setAExcluirVenda(null)
    toast('Venda avulsa excluída e estoque devolvido.')
  }
  const resumoItensVenda = (v: Venda) =>
    v.itens.map((i) => i.qtd + '× ' + i.nome).join(', ')

  const porItem: Record<string, { qtd: number; total: number }> = {}
  const porComprador: Record<
    string,
    { itens: number; pago: number; pendente: number; vendas: number }
  > = {}
  let rvTotal = 0
  let rvRecebido = 0
  let rvItensN = 0
  s.vendas.forEach((v) => {
    const t = v.itens.reduce((a, i) => a + i.valor * i.qtd, 0)
    rvTotal += t
    if (v.status === 'pago') rvRecebido += t

    const comprador = v.cliente.trim() || 'Vendas avulsas'
    const c = (porComprador[comprador] = porComprador[comprador] || {
      itens: 0,
      pago: 0,
      pendente: 0,
      vendas: 0,
    })
    c.vendas += 1
    if (v.status === 'pago') c.pago += t
    else c.pendente += t

    v.itens.forEach((i) => {
      rvItensN += i.qtd
      c.itens += i.qtd
      porItem[i.nome] = porItem[i.nome] || { qtd: 0, total: 0 }
      porItem[i.nome].qtd += i.qtd
      porItem[i.nome].total += i.valor * i.qtd
    })
  })
  const resumoItens = Object.keys(porItem)
    .sort((a, b) => porItem[b].total - porItem[a].total)
    .map((n) => ({ nome: n, qtd: porItem[n].qtd, totalFmt: fmt(porItem[n].total) }))
  const resumoCompradores = Object.keys(porComprador)
    .map((nome) => {
      const c = porComprador[nome]
      return { nome, ...c, total: c.pago + c.pendente }
    })
    // compradores nomeados primeiro (por total), "Vendas avulsas" por último
    .sort((a, b) => {
      if (a.nome === 'Vendas avulsas') return 1
      if (b.nome === 'Vendas avulsas') return -1
      return b.total - a.total
    })

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: narrow ? '1fr 1fr' : 'repeat(4, 1fr)' }}>
        <div className="kpi">
          <div className="topline">Total vendido</div>
          <div className="v" style={{ fontSize: 22, color: 'var(--color-primary)' }}>{fmt(rvTotal)}</div>
          <div className="meta">{s.vendas.length} vendas</div>
        </div>
        <div className="kpi">
          <div className="topline">Recebido</div>
          <div className="v" style={{ fontSize: 22 }}>{fmt(rvRecebido)}</div>
          <div className="meta">vendas pagas</div>
        </div>
        <div className="kpi">
          <div className="topline">Em contas abertas</div>
          <div className="v" style={{ fontSize: 22, color: 'var(--status-progress-fg)' }}>{fmt(rvTotal - rvRecebido)}</div>
          <div className="meta">{contasPend.length} contas</div>
        </div>
        <div className="kpi">
          <div className="topline">Itens vendidos</div>
          <div className="v" style={{ fontSize: 22 }}>{rvItensN}</div>
          <div className="meta">unidades</div>
        </div>
      </div>
      <div className="tbl-wrap">
        <div className="tbl-head-bar">
          <h3>Vendas por item</h3>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'right' }}>Quantidade</th>
              <th style={{ textAlign: 'right' }}>Valor total</th>
            </tr>
          </thead>
          <tbody>
            {resumoItens.map((i) => (
              <tr key={i.nome}>
                <td className="vaga-name" style={{ fontWeight: 500 }}>{i.nome}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{i.qtd}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>{i.totalFmt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tbl-wrap" style={{ marginTop: 14 }}>
        <div className="tbl-head-bar">
          <h3>Vendas por comprador</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Comprador</th>
                <th style={{ textAlign: 'right' }}>Itens</th>
                <th style={{ textAlign: 'right' }}>Pago</th>
                <th style={{ textAlign: 'right' }}>Em aberto</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {resumoCompradores.map((c) => (
                <tr key={c.nome}>
                  <td className="vaga-name" style={{ fontWeight: 500 }}>
                    {c.nome}
                    <div className="vaga-id">{c.vendas} {c.vendas === 1 ? 'venda' : 'vendas'}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{c.itens}</td>
                  <td style={{ textAlign: 'right' }}>{c.pago ? fmt(c.pago) : '—'}</td>
                  <td style={{ textAlign: 'right', color: c.pendente ? 'var(--status-progress-fg)' : 'var(--fg-muted)' }}>
                    {c.pendente ? fmt(c.pendente) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(c.total)}</td>
                </tr>
              ))}
              {resumoCompradores.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13, padding: 24 }}>
                    Nenhuma venda registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendas avulsas — com exclusão (somente ADM) */}
      <div className="tbl-wrap" style={{ marginTop: 14 }}>
        <div className="tbl-head-bar">
          <h3>Vendas avulsas</h3>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{avulsas.length} venda(s)</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Itens</th>
                <th>Forma</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                {admin && <th style={{ textAlign: 'right' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {avulsas.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontSize: 12 }}>{resumoItensVenda(v)}</td>
                  <td style={{ fontSize: 12 }}>{v.forma}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(v.itens.reduce((a, i) => a + i.valor * i.qtd, 0))}</td>
                  {admin && (
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-default btn-xs" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => setAExcluirVenda(v)}>Excluir</button>
                    </td>
                  )}
                </tr>
              ))}
              {avulsas.length === 0 && (
                <tr>
                  <td colSpan={admin ? 4 : 3} style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13, padding: 24 }}>
                    Nenhuma venda avulsa registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {aExcluirVenda && (
        <div
          onClick={() => setAExcluirVenda(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 460, animation: 'popIn .18s var(--ease-default)' }}>
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ marginBottom: 6 }}>Excluir venda avulsa</h3>
              <p style={{ fontSize: 13, marginBottom: 18 }}>
                Excluir esta venda avulsa ({resumoItensVenda(aExcluirVenda)})? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-default" onClick={() => setAExcluirVenda(null)}>Cancelar</button>
                <button className="btn" style={{ background: 'var(--status-rejected-fg)', color: '#fff' }} onClick={confirmarExcluirVenda}>Excluir venda</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
