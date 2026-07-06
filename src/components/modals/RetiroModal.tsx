import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { ModalRetiro } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function RetiroModal({ modal }: { modal: ModalRetiro }) {
  const { patchModal, closeModal } = useRetiro()
  const { salvarRetiro } = useActions()

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 16 }}>{modal.novo ? 'Criar retiro' : 'Editar retiro'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label}>Nome / edição do retiro</label>
          <input className="input" value={modal.nome} onChange={(e) => patchModal({ nome: e.target.value })} placeholder="Ex.: Retiro Renovo — Edição 42" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Data de início</label>
            <input className="input" type="date" value={modal.inicio} onChange={(e) => patchModal({ inicio: e.target.value })} />
          </div>
          <div>
            <label style={label}>Data de fim</label>
            <input className="input" type="date" value={modal.fim} onChange={(e) => patchModal({ fim: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Valor da inscrição (R$)</label>
            <input className="input" type="number" min="0" value={modal.valor} onChange={(e) => patchModal({ valor: e.target.value })} />
          </div>
          <div>
            <label style={label}>Máximo de inscrições</label>
            <input className="input" type="number" min="1" value={modal.max} onChange={(e) => patchModal({ max: e.target.value })} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          Ao salvar, um link público único de inscrição é gerado automaticamente. O link fecha sozinho quando as vagas acabarem.
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={salvarRetiro}>Salvar retiro</button>
      </div>
    </div>
  )
}
