import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import { porId } from '../../store/selectors'
import type { ModalCancelar } from '../../types'

export function CancelarModal({ modal }: { modal: ModalCancelar }) {
  const { state, patchModal, closeModal } = useRetiro()
  const { confirmarCancelamento } = useActions()
  const nome = porId(state)[modal.pid]?.nome ?? ''

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 4 }}>Cancelar inscrição</h3>
      <p style={{ fontSize: 13, marginBottom: 16 }}>
        {nome} — esta ação marca a inscrição como <b>cancelada</b> e libera a vaga.
      </p>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Observação</label>
      <textarea
        className="input"
        rows={3}
        style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
        placeholder="Motivo do cancelamento…"
        value={modal.obs}
        onChange={(e) => patchModal({ obs: e.target.value })}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn" style={{ background: 'var(--status-rejected-fg)', color: '#fff' }} onClick={confirmarCancelamento}>
          Cancelar inscrição
        </button>
      </div>
    </div>
  )
}
