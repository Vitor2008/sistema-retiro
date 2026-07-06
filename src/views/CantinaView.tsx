import { fmt, initials } from '../lib/format'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import { ativos } from '../store/selectors'
import { useViewport } from '../hooks/useViewport'
import type { CantinaTab, FormaPagamento, Produto } from '../types'

function estInfo(p: Produto): [string, string] {
  if (p.estoque === 0) return ['chip-rejected', 'esgotado']
  if (p.estoque <= 5) return ['chip-progress', p.estoque + ' un.']
  return ['chip-approved', p.estoque + ' un.']
}

export function CantinaView() {
  const { state, patch } = useRetiro()
  const { addCart, finalizarVenda, setModal } = useActions()
  const { mid } = useViewport()

  const s = state
  const narrow = s.narrow
  const seg = (on: boolean) => (on ? 'on' : '')
  const cart = s.carrinho
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
          <div className="desc">Vendas, estoque e contas abertas do retiro.</div>
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
            {s.produtos.map((p) => {
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
                    <button className="btn btn-primary btn-xs" onClick={() => setModal({ type: 'fecharConta', vid: v.id, forma: 'Dinheiro' })}>Receber</button>
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
        <div className="tbl-wrap">
          <div className="tbl-head-bar">
            <h3>Produtos e estoque</h3>
            <div className="actions">
              <button className="btn btn-primary btn-xs" onClick={() => setModal({ type: 'produto', pid: null, nome: '', valor: '', estoque: '' })}>+ Novo produto</button>
            </div>
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
                {s.produtos.map((p) => {
                  const [cls] = estInfo(p)
                  const estLabel = p.estoque === 0 ? 'Esgotado' : p.estoque <= 5 ? 'Estoque baixo' : 'OK'
                  return (
                    <tr key={p.id}>
                      <td className="vaga-name">{p.nome}</td>
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
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {s.cantinaTab === 'resumo' && <ResumoVendas />}
    </div>
  )
}

function ResumoVendas() {
  const { state } = useRetiro()
  const s = state
  const narrow = s.narrow
  const contasPend = s.vendas.filter((v) => v.status === 'pendente')

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
    </>
  )
}
