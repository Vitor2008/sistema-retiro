import { fmt } from '../../lib/format'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { FormaPagamento, ModalFecharConta } from '../../types'

export function FecharContaModal({ modal }: { modal: ModalFecharConta }) {
  const { state, patchModal, closeModal } = useRetiro()
  const { confirmarFecharConta } = useActions()

  const venda = state.vendas.find((v) => v.id === modal.vid)
  const total = venda ? venda.itens.reduce((a, i) => a + i.valor * i.qtd, 0) : 0
  const vfBtn = (f: FormaPagamento) => (modal.forma === f ? 'btn-primary' : 'btn-default')

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 4 }}>Receber conta</h3>
      <p style={{ fontSize: 13, marginBottom: 14 }}>
        {venda?.cliente ?? ''} — total de <b>{fmt(total)}</b>.
      </p>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Forma de pagamento</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
        <button className={'btn ' + vfBtn('Dinheiro') + ' btn-sm'} style={{ justifyContent: 'center' }} onClick={() => patchModal({ forma: 'Dinheiro' })}>Dinheiro</button>
        <button className={'btn ' + vfBtn('Pix') + ' btn-sm'} style={{ justifyContent: 'center' }} onClick={() => patchModal({ forma: 'Pix' })}>Pix</button>
        <button className={'btn ' + vfBtn('Débito') + ' btn-sm'} style={{ justifyContent: 'center' }} onClick={() => patchModal({ forma: 'Débito' })}>Débito</button>
        <button className={'btn ' + vfBtn('Crédito') + ' btn-sm'} style={{ justifyContent: 'center' }} onClick={() => patchModal({ forma: 'Crédito' })}>Crédito</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={confirmarFecharConta}>Confirmar recebimento</button>
      </div>
    </div>
  )
}
