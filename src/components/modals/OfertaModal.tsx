import { fmt } from '../../lib/format'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import { ofertado } from '../../store/selectors'
import type { ModalOferta } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function OfertaModal({ modal }: { modal: ModalOferta }) {
  const { state, patchModal, closeModal } = useRetiro()
  const { salvarOferta } = useActions()

  const utilizada = state.inscritos.reduce((a, p) => a + ofertado(p), 0)
  const novoTotal = Number(modal.valor) || 0
  const disponivel = novoTotal - utilizada

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 16 }}>Cadastrar oferta recebida</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label}>Total de oferta recebida (R$)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={modal.valor}
            onChange={(e) => patchModal({ valor: e.target.value })}
            placeholder="Ex.: 500,00"
            autoFocus
          />
        </div>
        <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--fg-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Já abatido em inscrições</span>
            <span style={{ fontWeight: 600, color: 'var(--color-sage)' }}>{fmt(utilizada)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span>Saldo disponível após salvar</span>
            <span style={{ fontWeight: 700, color: disponivel < 0 ? 'var(--status-rejected-fg)' : 'var(--color-primary)' }}>
              {fmt(disponivel)}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
          Este valor é o total de oferta que o retiro recebeu. Ele é abatido conforme você
          marca inscrições como oferta na tela de Check-in.
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={salvarOferta}>Salvar oferta</button>
      </div>
    </div>
  )
}
