import { fmt } from '../../lib/format'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { ItemVenda, ModalEditarConta } from '../../types'

export function EditarContaModal({ modal }: { modal: ModalEditarConta }) {
  const { state, patchModal, closeModal } = useRetiro()
  const { salvarEdicaoConta } = useActions()

  const venda = state.vendas.find((v) => v.id === modal.vid)
  const itens = modal.itens
  const total = itens.reduce((a, i) => a + i.valor * i.qtd, 0)

  const setItens = (novos: ItemVenda[]) => patchModal({ itens: novos })
  const setQtd = (id: string, qtd: number) =>
    setItens(itens.map((i) => (i.id === id ? { ...i, qtd } : i)))
  const remover = (id: string) => setItens(itens.filter((i) => i.id !== id))

  // Estoque disponível para AUMENTAR = estoque atual do produto (o que já estava
  // na conta não conta, pois já foi baixado). Máx. por item = qtd original + estoque.
  const estoque = (id: string) => state.produtos.find((p) => p.id === id)?.estoque ?? 0
  const qtdOriginal = (id: string) => venda?.itens.find((i) => i.id === id)?.qtd ?? 0
  const maxQtd = (id: string) => qtdOriginal(id) + estoque(id)

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 4 }}>Editar conta</h3>
      <p style={{ fontSize: 13, marginBottom: 14 }}>
        {venda?.cliente ?? ''} — corrija os itens lançados.
      </p>

      {itens.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', padding: '12px 0' }}>
          Nenhum item. Feche a conta ou adicione itens pela aba de venda.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {itens.map((i) => {
          const atingiuMax = i.qtd >= maxQtd(i.id)
          return (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{fmt(i.valor)} · un.</div>
              </div>
              <button
                className="btn btn-default btn-xs"
                style={{ padding: '2px 9px' }}
                onClick={() => setQtd(i.id, Math.max(0, i.qtd - 1))}
              >
                −
              </button>
              <b style={{ width: 22, textAlign: 'center' }}>{i.qtd}</b>
              <button
                className="btn btn-default btn-xs"
                style={{ padding: '2px 9px', opacity: atingiuMax ? 0.5 : 1 }}
                disabled={atingiuMax}
                title={atingiuMax ? 'Sem estoque disponível' : ''}
                onClick={() => setQtd(i.id, i.qtd + 1)}
              >
                +
              </button>
              <span style={{ width: 78, textAlign: 'right', fontWeight: 600 }}>{fmt(i.valor * i.qtd)}</span>
              <button
                onClick={() => remover(i.id)}
                title="Remover item"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 15, padding: '0 2px' }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 12, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
        <span>Total</span>
        <span style={{ color: 'var(--color-primary)' }}>{fmt(total)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-default" onClick={closeModal}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvarEdicaoConta}>Salvar alterações</button>
      </div>
    </div>
  )
}
