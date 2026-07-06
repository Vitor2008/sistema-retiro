import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { ModalProduto } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function ProdutoModal({ modal }: { modal: ModalProduto }) {
  const { patchModal, closeModal } = useRetiro()
  const { salvarProduto } = useActions()

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 16 }}>{modal.pid ? 'Editar produto' : 'Novo produto'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label}>Nome do produto</label>
          <input className="input" value={modal.nome} onChange={(e) => patchModal({ nome: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Valor unitário (R$)</label>
            <input className="input" type="number" min="0" step="0.5" value={modal.valor} onChange={(e) => patchModal({ valor: e.target.value })} />
          </div>
          <div>
            <label style={label}>Quantidade em estoque</label>
            <input className="input" type="number" min="0" value={modal.estoque} onChange={(e) => patchModal({ estoque: e.target.value })} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={salvarProduto}>Salvar produto</button>
      </div>
    </div>
  )
}
