import { FileDropField } from '../FileDropField'
import { attachLabel, fmt, initials } from '../../lib/format'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import { ofertado, pago, porId } from '../../store/selectors'
import type { ModalPagamento } from '../../types'

export function PagamentoModal({ modal }: { modal: ModalPagamento }) {
  const { state, patchModal, setModal, closeModal } = useRetiro()
  const { salvarPagamento } = useActions()

  const valor = state.retiro.valor
  const mp = porId(state)[modal.pid]
  if (!mp) return null
  const mRestanteV = Math.max(0, valor - pago(mp) - ofertado(mp))
  const valorPagoN = Number(modal.valorPago) || 0
  const mostraDataPrevista = !modal.oferta && valorPagoN < mRestanteV

  // Saldo de oferta cadastrado (retiro) menos o que já foi abatido em inscrições.
  const ofertaRecebida = state.retiro.oferta || 0
  const ofertaUsada = state.inscritos.reduce((a, x) => a + ofertado(x), 0)
  const ofertaDisponivel = ofertaRecebida - ofertaUsada
  const abatimentoAgora = modal.oferta ? Math.max(0, mRestanteV - valorPagoN) : 0
  const ofertaApos = ofertaDisponivel - abatimentoAgora
  const salvarLabel = modal.oferta
    ? 'Registrar e abater oferta'
    : valorPagoN >= mRestanteV && mRestanteV > 0
      ? 'Confirmar pagamento total'
      : 'Registrar pagamento'

  const historico = mp.pagamentos.map((h, i) => ({
    key: i,
    desc:
      (h.oferta && !h.valor ? 'Oferta' : h.forma) +
      ' · ' +
      h.data +
      ' · ' +
      h.usuario +
      (h.obs ? ' — ' + h.obs : ''),
    valor: h.valor ? fmt(h.valor) : 'oferta ' + fmt(h.oferta),
    color: h.oferta && !h.valor ? 'var(--color-sage)' : 'var(--color-primary)',
  }))

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 14 }}>Confirmar pagamento</h3>
      <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar-initials" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(mp.nome)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{mp.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
              {mp.tipo} · {mp.forma}
              {mp.parcelas ? ' (' + mp.parcelas + 'x)' : ''} · inscrição {fmt(valor)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Restante</div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(mRestanteV)}</div>
          </div>
        </div>
        {historico.map((h) => (
          <div key={h.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-muted)', borderTop: '1px dashed var(--border-default)', marginTop: 8, paddingTop: 8 }}>
            <span>{h.desc}</span>
            <span style={{ fontWeight: 600, color: h.color }}>{h.valor}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Valor pago agora (R$)</label>
          <input className="input" type="number" min="0" step="0.01" value={modal.valorPago} onChange={(e) => patchModal({ valorPago: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Forma</label>
          <select className="input" value={modal.forma} onChange={(e) => patchModal({ forma: e.target.value })}>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Pix">Pix</option>
            <option value="Débito">Débito</option>
            <option value="Crédito à vista">Crédito à vista</option>
            <option value="Crédito parcelado">Crédito parcelado</option>
          </select>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={modal.oferta} onChange={(e) => patchModal({ oferta: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
        Abater o restante como <b>oferta</b>
      </label>

      {modal.oferta && (
        <div style={{ background: 'var(--color-sage-soft)', border: '1px solid var(--color-sage)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-default)' }}>
            <span>Saldo de oferta disponível</span>
            <span style={{ fontWeight: 600 }}>{fmt(ofertaDisponivel)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-default)', marginTop: 4 }}>
            <span>Abater desta inscrição</span>
            <span style={{ fontWeight: 600 }}>− {fmt(abatimentoAgora)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-sage)', marginTop: 6, paddingTop: 6 }}>
            <span style={{ fontWeight: 700 }}>Saldo após abater</span>
            <span style={{ fontWeight: 700, color: ofertaApos < 0 ? 'var(--status-rejected-fg)' : 'var(--color-primary)' }}>{fmt(ofertaApos)}</span>
          </div>
          {ofertaApos < 0 && (
            <div style={{ color: 'var(--status-rejected-fg)', marginTop: 6 }}>
              A oferta cadastrada não cobre este abatimento — o saldo ficará negativo. Cadastre mais oferta na Prestação de contas se necessário.
            </div>
          )}
          {ofertaRecebida === 0 && (
            <div style={{ color: 'var(--fg-muted)', marginTop: 6 }}>
              Nenhuma oferta cadastrada ainda. Cadastre o total recebido em Prestação de contas → “Cadastrar oferta”.
            </div>
          )}
        </div>
      )}

      {mostraDataPrevista && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Data prevista para pagar o restante</label>
          <input className="input" type="date" value={modal.dataPrevista} onChange={(e) => patchModal({ dataPrevista: e.target.value })} />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>Observação</label>
        <input className="input" placeholder="Ex.: pagou metade, restante na sexta…" value={modal.obs} onChange={(e) => patchModal({ obs: e.target.value })} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <FileDropField
          label={attachLabel(modal.comprovante, mp.comprovante ? 'Comprovante já enviado no formulário — anexar adicional' : 'Anexar comprovante de pagamento')}
          onFile={(a) => patchModal({ comprovante: a })}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <button className="btn btn-default btn-sm" style={{ color: 'var(--status-rejected-fg)' }} onClick={() => setModal({ type: 'cancelar', pid: modal.pid, obs: '' })}>
          Cancelar inscrição
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-default" onClick={closeModal}>Fechar</button>
          <button className="btn btn-primary" onClick={salvarPagamento}>{salvarLabel}</button>
        </div>
      </div>
    </div>
  )
}
