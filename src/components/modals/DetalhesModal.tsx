import { useState } from 'react'
import { isAdmin } from '../../acessos'
import { AttachmentLink } from '../AttachmentLink'
import { FileDropField } from '../FileDropField'
import { fmt, initials } from '../../lib/format'
import { useAuth } from '../../store/AuthContext'
import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import { ofertado, pago, porId, statusPag, valorInscricao } from '../../store/selectors'
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

/** Monta o link wa.me a partir do telefone digitado. Remove máscara e prefixa
 *  o DDI 55 (Brasil) quando o número vier só com DDD + número. Retorna '' se
 *  não houver dígitos suficientes para um número válido. */
function whatsappHref(tel: string): string {
  const dig = (tel || '').replace(/\D/g, '')
  if (dig.length < 10) return ''
  const comDDI = dig.startsWith('55') && dig.length >= 12 ? dig : '55' + dig
  return 'https://wa.me/' + comDDI
}

/** Telefone como link para abrir a conversa no WhatsApp. Cor padrão do texto;
 *  fica verde só no hover. Ícone à direita. */
function TelefoneWhatsApp({ tel }: { tel: string }) {
  const [hover, setHover] = useState(false)
  const href = whatsappHref(tel)
  if (!tel) return <>—</>
  if (!href) return <>{tel}</>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: hover ? '#25D366' : 'inherit', textDecoration: 'none' }}
      title="Abrir conversa no WhatsApp"
    >
      {tel}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.46-.15-.65.15-.2.3-.75.94-.92 1.13-.17.2-.34.22-.63.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.5.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.65-1.57-.9-2.15-.24-.57-.48-.5-.65-.5l-.56-.01c-.2 0-.5.07-.77.37-.26.3-1 .98-1 2.4 0 1.4 1.02 2.76 1.17 2.96.14.2 2 3.05 4.85 4.28.68.3 1.2.47 1.62.6.68.22 1.3.19 1.78.11.54-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.56-.34zM12 2a10 10 0 0 0-8.6 15.06L2 22l5.06-1.33A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3 .79.8-2.93-.2-.3A8.2 8.2 0 1 1 12 20.2z"/>
      </svg>
    </a>
  )
}

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
  const { user } = useAuth()
  const admin = isAdmin(user?.acessos)

  const p = porId(state)[modal.pid]
  if (!p) return null

  const valor = valorInscricao(state, p)
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
        <Campo label="Telefone / WhatsApp" valor={<TelefoneWhatsApp tel={p.tel} />} />
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
                valor: String(valorInscricao(state, p)),
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
          {admin && p.pagamentos.length > 0 && (
            <button
              className="btn btn-outline"
              title="Corrigir os lançamentos de pagamento (somente administrador)"
              onClick={() =>
                setModal({
                  type: 'editarPagamento',
                  pid: p.id,
                  linhas: p.pagamentos.map((h) => ({ ...h })),
                })
              }
            >
              Editar pagamento
            </button>
          )}
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
