import { AttachmentLink } from '../AttachmentLink'
import { FileDropField } from '../FileDropField'
import { fmt, initials } from '../../lib/format'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import { ofertado, pago, porId, statusPag } from '../../store/selectors'
import type { ModalDetalhes } from '../../types'

/** 'YYYY-MM-DD' → 'DD/MM/AAAA'. */
function dataBR(s: string): string {
  if (!s) return ''
  const [y, m, d] = s.slice(0, 10).split('-')
  return d && m && y ? `${d}/${m}/${y}` : s
}
/** ISO → 'DD/MM/AAAA HH:mm' (fuso local). */
function dataHoraBR(iso: string): string {
  if (!iso) return ''
  const dt = new Date(iso)
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
/** Fallback: extrai o timestamp do id da inscrição pública ('p' + Date.now()). */
function isoDoId(id: string): string {
  const m = /^p(\d{13})/.exec(id)
  return m ? new Date(Number(m[1])).toISOString() : ''
}

const pagInfo: Record<string, [string, string]> = {
  confirmado: ['chip-approved', 'Pago'],
  parcial: ['chip-progress', 'Parcial'],
  pendente: ['chip-closed', 'Pendente'],
}
const insInfo: Record<string, [string, string]> = {
  confirmada: ['chip-final', 'Confirmada'],
  pendente: ['chip-progress', 'Pendente'],
  cancelada: ['chip-rejected', 'Cancelada'],
}

const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--fg-muted)' }
const valorStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500 }

function Campo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valorStyle}>{valor || '—'}</div>
    </div>
  )
}

export function DetalhesModal({ modal }: { modal: ModalDetalhes }) {
  const { state, setModal, closeModal } = useRetiro()
  const { anexarComprovante } = useActions()

  const p = porId(state)[modal.pid]
  if (!p) return null

  const valor = state.retiro.valor
  const pg = pago(p)
  const of = ofertado(p)
  const saldo = Math.max(0, valor - pg - of)
  const sp = statusPag(state, p)
  const cancelada = p.statusInscricao === 'cancelada'
  const genero = p.genero === 'M' ? 'Homem' : p.genero === 'F' ? 'Mulher' : '—'
  const avulso = state.retiro.tipo === 'avulso'
  const dataInscricao = dataHoraBR(p.criadoEm || isoDoId(p.id))
  const quitado = p.statusInscricao === 'confirmada' && sp === 'confirmado'

  return (
    <div style={{ padding: '22px 24px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div className="avatar-initials" style={{ width: 40, height: 40 }}>{initials(p.nome)}</div>
        <div style={{ flex: 1 }}>
          <h3>{p.nome}</h3>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {!avulso && (
              <span className="chip-mini" style={{ background: p.tipo === 'Servo' ? 'var(--color-primary-tint)' : 'var(--color-secondary-tint)', color: p.tipo === 'Servo' ? 'var(--color-primary)' : 'var(--color-secondary-hover)' }}>
                {p.tipo === 'Servo' ? 'Servo' : 'Convidado'}
              </span>
            )}
            <span className={'chip-mini ' + (insInfo[p.statusInscricao]?.[0] ?? '')}>{insInfo[p.statusInscricao]?.[1] ?? p.statusInscricao}</span>
            <span className={'chip-mini ' + (pagInfo[sp]?.[0] ?? '')}>{pagInfo[sp]?.[1] ?? sp}</span>
          </div>
        </div>
      </div>

      {/* Dados da inscrição */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Campo label="Telefone / WhatsApp" valor={p.tel} />
        <Campo label="Gênero" valor={genero} />
        <Campo label="Idade" valor={p.idade != null ? String(p.idade) : ''} />
        <Campo label="Data de nascimento" valor={dataBR(p.dataNascimento)} />
        {!avulso && p.tipo === 'Encontrista' && <Campo label="Participação" valor={p.vez} />}
        <Campo label="Quem convidou / líder" valor={p.lider} />
        <Campo label="Prédio" valor={p.predio} />
        <Campo label="Condução" valor={p.conducao} />
        <Campo label="Forma de pagamento" valor={p.forma} />
        {p.quarto && <Campo label="Quarto" valor={p.quarto} />}
        <Campo label="Inscrição feita em" valor={dataInscricao} />
      </div>

      {cancelada && p.cancelInfo && (
        <div style={{ fontSize: 12, color: 'var(--status-rejected-fg)', background: 'var(--status-rejected-bg)', padding: '8px 12px', borderRadius: 8, marginBottom: 16 }}>
          {p.cancelInfo}
        </div>
      )}

      {/* Financeiro */}
      <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
          <div>
            <div style={labelStyle}>Inscrição</div>
            <div style={{ fontWeight: 700 }}>{fmt(valor)}</div>
          </div>
          <div>
            <div style={labelStyle}>Pago</div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(pg)}</div>
          </div>
          <div>
            <div style={labelStyle}>Oferta</div>
            <div style={{ fontWeight: 700, color: 'var(--color-sage)' }}>{fmt(of)}</div>
          </div>
          <div>
            <div style={labelStyle}>Saldo</div>
            <div style={{ fontWeight: 700, color: saldo > 0 ? 'var(--status-rejected-fg)' : 'var(--status-final-fg)' }}>{fmt(saldo)}</div>
          </div>
        </div>

        {p.pagamentos.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {p.pagamentos.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-muted)', borderTop: '1px dashed var(--border-default)', paddingTop: 6, marginTop: 6 }}>
                <span>
                  {(h.oferta && !h.valor ? 'Oferta' : h.forma) + ' · ' + h.data + (h.usuario ? ' · ' + h.usuario : '')}
                  {h.obs ? ' — ' + h.obs : ''}
                  {h.dataPrevista ? ' · previsto p/ ' + h.dataPrevista : ''}
                </span>
                <span style={{ fontWeight: 600, color: h.oferta && !h.valor ? 'var(--color-sage)' : 'var(--color-primary)' }}>
                  {h.valor ? fmt(h.valor) : 'oferta ' + fmt(h.oferta)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comprovante — sempre disponível, mesmo após confirmação/pagamento */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>Comprovante de pagamento</div>
        {p.comprovanteId && (
          <div style={{ marginBottom: 8 }}>
            <AttachmentLink fileId={p.comprovanteId} label="📎 Ver comprovante atual" style={{ fontSize: 12 }} />
          </div>
        )}
        <FileDropField
          label={p.comprovanteId ? 'Anexar outro comprovante' : 'Anexar comprovante'}
          onFile={(a) => a && anexarComprovante(p.id, a)}
        />
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        {!cancelada ? (
          <button
            className="btn btn-default btn-sm"
            style={{ color: 'var(--status-rejected-fg)' }}
            onClick={() => setModal({ type: 'cancelar', pid: p.id, obs: '' })}
          >
            Cancelar inscrição
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-default" onClick={closeModal}>Fechar</button>
          <button
            className="btn btn-outline"
            onClick={() =>
              setModal({
                type: 'editarInscricao',
                pid: p.id,
                nome: p.nome,
                tel: p.tel,
                genero: p.genero,
                idade: p.idade != null ? String(p.idade) : '',
                dataNascimento: p.dataNascimento,
                tipo: p.tipo,
                vez: p.vez,
                lider: p.lider,
                predio: p.predio,
                conducao: p.conducao,
                forma: p.forma,
              })
            }
          >
            Editar inscrição
          </button>
          {!cancelada && !quitado && (
            <button
              className="btn btn-primary"
              onClick={() =>
                setModal({
                  type: 'pagamento',
                  pid: p.id,
                  valorPago: String(saldo),
                  forma: p.forma || 'Dinheiro',
                  obs: '',
                  oferta: false,
                  dataPrevista: '',
                  comprovante: null,
                })
              }
            >
              Registrar pagamento
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
