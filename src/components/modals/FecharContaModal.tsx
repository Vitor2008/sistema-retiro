import { fmt } from '../../lib/format'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { FormaPagamento, ModalFecharConta, PagamentoLinha } from '../../types'

const FORMAS: FormaPagamento[] = ['Dinheiro', 'Pix', 'Débito', 'Crédito']

export function FecharContaModal({ modal }: { modal: ModalFecharConta }) {
  const { state, patchModal, closeModal } = useRetiro()
  const { confirmarFecharConta } = useActions()

  const venda = state.vendas.find((v) => v.id === modal.vid)
  const total = venda ? venda.itens.reduce((a, i) => a + i.valor * i.qtd, 0) : 0
  const linhas = modal.pagamentos

  const setLinhas = (novas: PagamentoLinha[]) => patchModal({ pagamentos: novas })
  const updateLinha = (idx: number, patch: Partial<PagamentoLinha>) =>
    setLinhas(linhas.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  const addLinha = () => setLinhas([...linhas, { forma: 'Pix', valor: '' }])
  const removeLinha = (idx: number) => setLinhas(linhas.filter((_, i) => i !== idx))

  const soma = linhas.reduce((a, l) => a + (Number(l.valor) || 0), 0)
  const naoDinheiro = linhas
    .filter((l) => l.forma !== 'Dinheiro')
    .reduce((a, l) => a + (Number(l.valor) || 0), 0)
  const restante = total - soma
  const troco = Math.max(0, soma - total)
  const excedeCartao = naoDinheiro > total + 0.005
  const valido = soma + 0.005 >= total && !excedeCartao && soma > 0

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 4 }}>Receber conta</h3>
      <p style={{ fontSize: 13, marginBottom: 14 }}>
        {venda?.cliente ?? ''} — total de <b>{fmt(total)}</b>.
      </p>

      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
        Pagamento(s)
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {linhas.map((l, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="input"
              style={{ flex: 1 }}
              value={l.forma}
              onChange={(e) => updateLinha(idx, { forma: e.target.value as FormaPagamento })}
            >
              {FORMAS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <input
              className="input"
              style={{ width: 120 }}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder={l.forma === 'Dinheiro' ? 'Recebido' : '0,00'}
              value={l.valor}
              onChange={(e) => updateLinha(idx, { valor: e.target.value })}
            />
            {linhas.length > 1 && (
              <button
                onClick={() => removeLinha(idx)}
                title="Remover"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 16, padding: '0 4px' }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-default btn-xs" style={{ marginBottom: 14 }} onClick={addLinha}>
        + Combinar outra forma
      </button>

      {/* Resumo */}
      <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--fg-muted)' }}>Total da conta</span>
          <span style={{ fontWeight: 600 }}>{fmt(total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: 'var(--fg-muted)' }}>Informado</span>
          <span style={{ fontWeight: 600 }}>{fmt(soma)}</span>
        </div>
        {restante > 0.005 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--status-rejected-fg)', fontWeight: 700 }}>
            <span>Falta</span>
            <span>{fmt(restante)}</span>
          </div>
        )}
        {troco > 0.005 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--color-secondary-hover)', fontWeight: 700 }}>
            <span>Troco</span>
            <span>{fmt(troco)}</span>
          </div>
        )}
        {excedeCartao && (
          <div style={{ marginTop: 6, color: 'var(--status-rejected-fg)', fontSize: 12 }}>
            Só o dinheiro pode passar do total (troco). Ajuste os valores.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={confirmarFecharConta} disabled={!valido}>
          Confirmar recebimento
        </button>
      </div>
    </div>
  )
}
