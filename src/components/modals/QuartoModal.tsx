import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { Genero, ModalQuarto } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function QuartoModal({ modal }: { modal: ModalQuarto }) {
  const { patchModal, closeModal } = useRetiro()
  const { salvarQuarto, ocupacaoQuarto } = useActions()

  const editando = !!modal.qid
  
  const ocupacao = modal.qid ? ocupacaoQuarto(modal.qid) : 0

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 16 }}>{editando ? 'Editar quarto' : 'Novo quarto'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label}>Nome / número do quarto</label>
          <input className="input" value={modal.nome} onChange={(e) => patchModal({ nome: e.target.value })} placeholder="Ex.: Quarto 7 — Hermom" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Gênero</label>
            <select
              className="input"
              value={modal.genero}
              disabled={ocupacao > 0}
              title={ocupacao > 0 ? 'Remova as pessoas do quarto para trocar o gênero.' : undefined}
              onChange={(e) => patchModal({ genero: e.target.value as Genero })}
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div>
            <label style={label}>Capacidade (camas)</label>
            <input className="input" type="number" min={ocupacao > 0 ? ocupacao : 1} value={modal.cap} onChange={(e) => patchModal({ cap: e.target.value })} />
          </div>
        </div>
        {ocupacao > 0 && (
          <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {ocupacao === 1 ? '1 pessoa alocada' : ocupacao + ' pessoas alocadas'} neste quarto — a
            capacidade não pode ficar abaixo disso e o gênero não pode ser trocado.
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={salvarQuarto}>Salvar quarto</button>
      </div>
    </div>
  )
}
