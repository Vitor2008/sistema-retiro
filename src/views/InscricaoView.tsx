import { appConfig } from '../config'
import { FileDropField } from '../components/FileDropField'
import { attachLabel, fmt } from '../lib/format'
import { seedForm } from '../data/seed'
import { useRetiro } from '../store/RetiroContext'
import { useActions } from '../store/useActions'
import {
  linkAbertoEfetivo,
  linkPublico,
  periodo as periodoSel,
  vagasRestantes,
} from '../store/selectors'
import type { FormInscricao } from '../types'

export function InscricaoView() {
  const { state, patch } = useRetiro()
  const { enviarInscricao } = useActions()

  const f = state.form
  const err = f.erros || {}
  const narrow = state.narrow
  const linkAberto = linkAbertoEfetivo(state)
  const vagasRest = vagasRestantes(state)
  const form2col = narrow ? '1fr' : '1fr 1fr'

  const setF = (partial: Partial<FormInscricao>) =>
    patch({ form: { ...f, ...partial } })
  const clearErr = (k: string) => ({ ...err, [k]: 0 })
  const btnSel = (on: boolean) => (on ? 'btn-primary' : 'btn-default')

  const formAberto = linkAberto && !f.enviado
  const formEnviado = f.enviado
  const formFechado = !linkAberto && !f.enviado

  return (
    <div data-screen-label="Formulário de inscrição" style={{ maxWidth: 620, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border-default)', borderRadius: 999, padding: '6px 14px', marginBottom: 16, boxShadow: 'var(--shadow-xs)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="2.4" strokeLinecap="round">
          <rect x="5" y="11" width="14" height="9" rx="2"></rect>
          <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
        </svg>
        <span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          {linkPublico(state, appConfig.nomeIgreja)}
        </span>
        <span className="chip-mini" style={{ marginLeft: 'auto', background: 'var(--color-sage-soft)', color: 'var(--color-primary)' }}>
          Visão do inscrito
        </span>
      </div>

      {formFechado && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22, fontWeight: 700 }}>
            ✕
          </div>
          <h3>Inscrições encerradas</h3>
          <p style={{ marginTop: 8 }}>
            {vagasRest === 0
              ? 'As vagas do ' + state.retiro.nome + ' esgotaram. Fale com seu líder para entrar na lista de espera.'
              : 'As inscrições do ' + state.retiro.nome + ' estão temporariamente fechadas.'}
          </p>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 20 }} onClick={() => patch({ view: 'retiros' })}>
            Voltar para retiros (admin)
          </button>
        </div>
      )}

      {formEnviado && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-sage-soft)', color: 'var(--color-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7"></path>
            </svg>
          </div>
          <h3>Inscrição recebida</h3>
          <p style={{ marginTop: 8 }}>
            Sua inscrição está <b>pendente de confirmação</b>. A confirmação acontece no check-in presencial do retiro.
          </p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => patch({ form: { ...seedForm(), enviado: false } })}>
            Fazer outra inscrição
          </button>
        </div>
      )}

      {formAberto && (
        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-secondary)', fontWeight: 700 }}>
              {appConfig.nomeIgreja}
            </div>
            <h2 style={{ marginTop: 4 }}>{state.retiro.nome}</h2>
            <p className="dim" style={{ marginTop: 6, fontSize: 13 }}>
              {periodoSel(state)} · Inscrição {fmt(state.retiro.valor)} · <b>{vagasRest}</b> vagas restantes
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nome completo *</label>
              <input className="input" value={f.nome} onChange={(e) => setF({ nome: e.target.value, erros: clearErr('nome') })} placeholder="Seu nome completo" />
              {err.nome ? <ErroMsg>Informe o nome completo.</ErroMsg> : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: form2col, gap: 12 }}>
              <div>
                <label style={labelStyle}>Telefone / WhatsApp *</label>
                <input className="input" value={f.tel} onChange={(e) => setF({ tel: e.target.value, erros: clearErr('tel') })} placeholder="(11) 99999-9999" />
                {err.tel ? <ErroMsg>Informe o telefone.</ErroMsg> : null}
              </div>
              <div>
                <label style={labelStyle}>Sexo *</label>
                <select className="input" value={f.genero} onChange={(e) => setF({ genero: e.target.value as FormInscricao['genero'], erros: clearErr('genero') })}>
                  <option value="">Selecione…</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
                {err.genero ? <ErroMsg>Selecione o sexo.</ErroMsg> : null}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Tipo de inscrição *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={'btn ' + btnSel(f.tipo === 'Encontrista') + ' btn-sm'} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setF({ tipo: 'Encontrista', dia: '' })}>
                  Encontrista (convidado)
                </button>
                <button className={'btn ' + btnSel(f.tipo === 'Servo') + ' btn-sm'} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setF({ tipo: 'Servo' })}>
                  Servo
                </button>
              </div>
            </div>

            {f.tipo === 'Servo' && (
              <div>
                <label style={labelStyle}>Em qual dia você vai servir? *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={'btn ' + btnSel(f.dia === '1º dia') + ' btn-sm'} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setF({ dia: '1º dia', erros: clearErr('dia') })}>
                    1º dia
                  </button>
                  <button className={'btn ' + btnSel(f.dia === '2º dia') + ' btn-sm'} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setF({ dia: '2º dia', erros: clearErr('dia') })}>
                    2º dia
                  </button>
                </div>
                {err.dia ? <ErroMsg>Selecione o dia de serviço.</ErroMsg> : null}
              </div>
            )}

            <div>
              <label style={labelStyle}>Líder / quem convidou *</label>
              <select className="input" value={f.lider} onChange={(e) => setF({ lider: e.target.value, erros: clearErr('lider') })}>
                <option value="">Selecione o líder…</option>
                {state.lideres.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {err.lider ? <ErroMsg>Selecione o líder.</ErroMsg> : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: form2col, gap: 12 }}>
              <div>
                <label style={labelStyle}>Forma de pagamento *</label>
                <select className="input" value={f.forma} onChange={(e) => setF({ forma: e.target.value as FormInscricao['forma'], erros: clearErr('forma') })}>
                  <option value="">Selecione…</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Pix">Pix</option>
                  <option value="Débito">Débito</option>
                  <option value="Crédito à vista">Crédito à vista</option>
                  <option value="Crédito parcelado">Crédito parcelado</option>
                </select>
                {err.forma ? <ErroMsg>Selecione a forma de pagamento.</ErroMsg> : null}
              </div>
              {f.forma === 'Crédito parcelado' && (
                <div>
                  <label style={labelStyle}>Número de parcelas *</label>
                  <select className="input" value={f.parcelas} onChange={(e) => setF({ parcelas: e.target.value })}>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                    <option value="4">4x</option>
                    <option value="5">5x</option>
                    <option value="6">6x</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Comprovante de pagamento (imagem ou PDF)</label>
              <FileDropField
                label={attachLabel(f.comprovante, 'Anexar comprovante (opcional se pagar no check-in)')}
                onFile={(a) => setF({ comprovante: a })}
              />
            </div>

            <button className="btn btn-primary" style={{ justifyContent: 'center', padding: 12, fontSize: 15, marginTop: 6 }} onClick={enviarInscricao}>
              Enviar inscrição
            </button>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center' }}>
              A inscrição fica pendente de confirmação até o check-in presencial.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  display: 'block',
  marginBottom: 5,
}

function ErroMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: 'var(--status-rejected-fg)', marginTop: 3 }}>
      {children}
    </div>
  )
}
