import { useRetiro } from '../../store/RetiroContext'
import { CancelarModal } from './CancelarModal'
import { PagamentoModal } from './PagamentoModal'
import { RetiroModal } from './RetiroModal'
import { QuartoModal } from './QuartoModal'
import { ProdutoModal } from './ProdutoModal'
import { DespesaModal } from './DespesaModal'
import { FecharContaModal } from './FecharContaModal'
import { EditarContaModal } from './EditarContaModal'

export function ModalHost() {
  const { state, closeModal } = useRetiro()
  const m = state.modal
  if (!m) return null

  const width = m.type === 'pagamento' ? '520px' : '460px'

  return (
    <div
      onClick={closeModal}
      style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s var(--ease-default)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: width, maxHeight: '92vh', overflowY: 'auto', animation: 'popIn .18s var(--ease-default)' }}
      >
        {m.type === 'cancelar' && <CancelarModal modal={m} />}
        {m.type === 'pagamento' && <PagamentoModal modal={m} />}
        {m.type === 'retiro' && <RetiroModal modal={m} />}
        {m.type === 'quarto' && <QuartoModal modal={m} />}
        {m.type === 'produto' && <ProdutoModal modal={m} />}
        {m.type === 'despesa' && <DespesaModal modal={m} />}
        {m.type === 'fecharConta' && <FecharContaModal modal={m} />}
        {m.type === 'editarConta' && <EditarContaModal modal={m} />}
      </div>
    </div>
  )
}
