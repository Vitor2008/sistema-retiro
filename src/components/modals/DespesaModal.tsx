import { FileDropField } from '../FileDropField'
import { attachLabel } from '../../lib/format'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { ModalDespesa } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function DespesaModal({ modal }: { modal: ModalDespesa }) {
  const { state, patchModal, closeModal } = useRetiro()
  const { salvarDespesa } = useActions()

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 16 }}>Lançar despesa</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label}>Categoria</label>
          <select className="input" value={modal.categoria} onChange={(e) => patchModal({ categoria: e.target.value })}>
            {state.categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={label}>Descrição</label>
          <input className="input" value={modal.descricao} onChange={(e) => patchModal({ descricao: e.target.value })} placeholder="Ex.: Compra do mês — hortifruti" />
        </div>
        <div>
          <label style={label}>Valor (R$)</label>
          <input className="input" type="number" min="0" step="0.01" value={modal.valor} onChange={(e) => patchModal({ valor: e.target.value })} />
        </div>
        <FileDropField
          label={attachLabel(modal.comprovante, 'Anexar comprovante / nota fiscal')}
          onFile={(a) => patchModal({ comprovante: a })}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={salvarDespesa}>Lançar despesa</button>
      </div>
    </div>
  )
}
