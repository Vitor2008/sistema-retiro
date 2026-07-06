import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { Genero, ModalQuarto } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function QuartoModal({ modal }: { modal: ModalQuarto }) {
  const { patchModal, closeModal } = useRetiro()
  const { salvarQuarto } = useActions()

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 16 }}>Novo quarto</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label}>Nome / número do quarto</label>
          <input className="input" value={modal.nome} onChange={(e) => patchModal({ nome: e.target.value })} placeholder="Ex.: Quarto 7 — Hermom" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Gênero</label>
            <select className="input" value={modal.genero} onChange={(e) => patchModal({ genero: e.target.value as Genero })}>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div>
            <label style={label}>Capacidade (camas)</label>
            <input className="input" type="number" min="1" value={modal.cap} onChange={(e) => patchModal({ cap: e.target.value })} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={salvarQuarto}>Salvar quarto</button>
      </div>
    </div>
  )
}
