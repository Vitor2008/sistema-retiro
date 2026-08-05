import { fmt } from '../../lib/format'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import { porId } from '../../store/selectors'
import type { FormaPagamento, ModalEditarPagamento, Pagamento } from '../../types'

const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }

/** Edição administrativa dos lançamentos de pagamento de uma inscrição.
 *  Permite corrigir valor, oferta, forma e observação de cada lançamento e
 *  remover linhas lançadas por engano. */
export function EditarPagamentoModal({ modal }: { modal: ModalEditarPagamento }) {
  const { state, patchModal, closeModal } = useRetiro()
  const { salvarEdicaoPagamento } = useActions()

  const p = porId(state)[modal.pid]
  const linhas = modal.linhas
  const totalPago = linhas.reduce((a, l) => a + (Number(l.valor) || 0), 0)
  const totalOferta = linhas.reduce((a, l) => a + (Number(l.oferta) || 0), 0)

  const setLinhas = (novas: Pagamento[]) => patchModal({ linhas: novas })
  const setCampo = (i: number, campo: Partial<Pagamento>) =>
    setLinhas(linhas.map((l, idx) => (idx === i ? { ...l, ...campo } : l)))
  const remover = (i: number) => setLinhas(linhas.filter((_, idx) => idx !== i))

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 4 }}>Editar pagamento</h3>
      <p style={{ fontSize: 13, marginBottom: 14 }}>
        {p?.nome ?? ''} — corrija os lançamentos registrados. Linhas zeradas (valor e oferta 0) são removidas ao salvar.
      </p>

      {linhas.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', padding: '12px 0' }}>
          Nenhum lançamento registrado nesta inscrição.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {linhas.map((l, i) => (
            <div key={i} style={{ border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                  {l.data}{l.usuario ? ' · ' + l.usuario : ''}
                </span>
                <button
                  onClick={() => remover(i)}
                  title="Remover lançamento"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-rejected-fg)', fontSize: 12, fontWeight: 600 }}
                >
                  Remover
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={label}>Valor pago (R$)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(l.valor ?? 0)}
                    onChange={(e) => setCampo(i, { valor: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={label}>Oferta (R$)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(l.oferta ?? 0)}
                    onChange={(e) => setCampo(i, { oferta: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={label}>Forma</label>
                  <select
                    className="input"
                    value={l.forma}
                    onChange={(e) => setCampo(i, { forma: e.target.value as FormaPagamento })}
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Pix">Pix</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Débito">Débito</option>
                    <option value="Crédito à vista">Crédito à vista</option>
                    <option value="Crédito parcelado">Crédito parcelado</option>
                  </select>
                </div>
                <div>
                  <label style={label}>Observação</label>
                  <input
                    className="input"
                    value={l.obs}
                    onChange={(e) => setCampo(i, { obs: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 12, fontSize: 13, marginBottom: 16 }}>
        <span style={{ fontWeight: 600 }}>Total</span>
        <span>
          <b style={{ color: 'var(--color-primary)' }}>{fmt(totalPago)}</b> pago
          {totalOferta > 0 && <span style={{ color: 'var(--color-sage)' }}> · {fmt(totalOferta)} oferta</span>}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-default" onClick={closeModal}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvarEdicaoPagamento}>Salvar alterações</button>
      </div>
    </div>
  )
}
