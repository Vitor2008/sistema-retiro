// ============================================================================
// Formulário PÚBLICO de inscrição — renderizado FORA do login (landing page).
//
// Totalmente autossuficiente: não usa o store offline nem o token de sessão.
// Fala apenas com as rotas /api/public/* (sem autenticação). Estrutura:
//  - carrega os dados do retiro pelo slug da URL (/inscricao/:slug)
//  - exibe banner + informações + formulário
//  - envia a inscrição direto ao backend (uma linha, sem snapshot)
// ============================================================================

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { appConfig } from '../config'
import { fmt, fmtData } from '../lib/format'
import type { FormaPagamento, Genero, TipoInscricao } from '../types'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api'

interface RetiroPublico {
  nome: string
  inicio: string
  fim: string
  valor: number
  max: number
  slug: string
  bannerId: string | null
  lideres: string[]
  aberto: boolean
  vagasRestantes: number
}

interface FormState {
  nome: string
  tel: string
  genero: Genero | ''
  tipo: TipoInscricao
  dia: '' | '1º dia' | '2º dia'
  lider: string
  forma: FormaPagamento
  parcelas: string
}

const formInicial: FormState = {
  nome: '',
  tel: '',
  genero: '',
  tipo: 'Encontrista',
  dia: '',
  lider: '',
  forma: '',
  parcelas: '3',
}

type Fase = 'carregando' | 'erro' | 'fechado' | 'aberto' | 'enviado'

export function InscricaoPublica() {
  const { slug = '' } = useParams()
  const [retiro, setRetiro] = useState<RetiroPublico | null>(null)
  const [fase, setFase] = useState<Fase>('carregando')
  const [form, setForm] = useState<FormState>(formInicial)
  const [erros, setErros] = useState<Record<string, boolean>>({})
  const [comprovanteId, setComprovanteId] = useState<string | null>(null)
  const [comprovanteNome, setComprovanteNome] = useState<string>('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    setFase('carregando')
    fetch(`${BASE_URL}/public/retiro/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('nao-encontrado')
        return (await res.json()) as RetiroPublico
      })
      .then((r) => {
        if (!vivo) return
        setRetiro(r)
        setFase(r.aberto ? 'aberto' : 'fechado')
      })
      .catch(() => vivo && setFase('erro'))
    return () => {
      vivo = false
    }
  }, [slug])

  const bannerUrl = retiro?.bannerId
    ? `${BASE_URL}/public/banner/${retiro.bannerId}`
    : null

  const setF = (partial: Partial<FormState>) => setForm((f) => ({ ...f, ...partial }))

  const uploadComprovante = async (file: File) => {
    try {
      const res = await fetch(`${BASE_URL}/public/arquivo/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: file,
      })
      if (!res.ok) throw new Error()
      const meta = (await res.json()) as { id: string }
      setComprovanteId(meta.id)
      setComprovanteNome(file.name)
    } catch {
      setErroEnvio('Não foi possível anexar o comprovante. Tente novamente.')
    }
  }

  const validar = (): boolean => {
    const e: Record<string, boolean> = {}
    if (!form.nome.trim() || form.nome.trim().split(/\s+/).length < 2) e.nome = true
    if (!form.tel.trim()) e.tel = true
    if (!form.genero) e.genero = true
    if (form.tipo === 'Servo' && !form.dia) e.dia = true
    if (!form.lider) e.lider = true
    if (!form.forma) e.forma = true
    setErros(e)
    return Object.keys(e).length === 0
  }

  const enviar = async () => {
    setErroEnvio(null)
    if (!validar()) return
    setEnviando(true)
    try {
      const res = await fetch(`${BASE_URL}/public/inscricao/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          tel: form.tel.trim(),
          genero: form.genero,
          tipo: form.tipo,
          diaServir: form.tipo === 'Servo' ? form.dia : '',
          lider: form.lider,
          forma: form.forma,
          parcelas: form.forma === 'Crédito parcelado' ? Number(form.parcelas) : null,
          comprovanteId,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Não foi possível enviar a inscrição.')
      }
      setFase('enviado')
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Falha ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const periodo = useMemo(() => {
    if (!retiro) return ''
    return `${fmtData(retiro.inicio)} a ${fmtData(retiro.fim)}`
  }, [retiro])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ---- Hero / banner ---- */}
        <Hero bannerUrl={bannerUrl} igreja={appConfig.nomeIgreja} nome={retiro?.nome} />

        {fase === 'carregando' && (
          <Cartao>
            <p className="dim" style={{ textAlign: 'center' }}>Carregando…</p>
          </Cartao>
        )}

        {fase === 'erro' && (
          <Cartao>
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <IconeCirculo tipo="erro">✕</IconeCirculo>
              <h3 style={{ marginTop: 8 }}>Formulário não encontrado</h3>
              <p style={{ marginTop: 8 }}>
                O link de inscrição pode estar incorreto ou o retiro não está mais disponível.
              </p>
            </div>
          </Cartao>
        )}

        {fase === 'fechado' && retiro && (
          <Cartao>
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <IconeCirculo tipo="erro">✕</IconeCirculo>
              <h3 style={{ marginTop: 8 }}>Inscrições encerradas</h3>
              <p style={{ marginTop: 8 }}>
                {retiro.vagasRestantes === 0
                  ? `As vagas do ${retiro.nome} esgotaram. Fale com seu líder para entrar na lista de espera.`
                  : `As inscrições do ${retiro.nome} estão temporariamente fechadas.`}
              </p>
            </div>
          </Cartao>
        )}

        {fase === 'enviado' && (
          <Cartao>
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <IconeCirculo tipo="ok">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7"></path>
                </svg>
              </IconeCirculo>
              <h3 style={{ marginTop: 8 }}>Inscrição recebida!</h3>
              <p style={{ marginTop: 8 }}>
                Sua inscrição está <b>pendente de confirmação</b>. A confirmação acontece no
                check-in presencial do retiro. 
              </p>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 20 }}
                onClick={() => {
                  setForm(formInicial)
                  setComprovanteId(null)
                  setComprovanteNome('')
                  setErros({})
                  setFase('aberto')
                }}
              >
                Fazer outra inscrição
              </button>
            </div>
          </Cartao>
        )}

        {fase === 'aberto' && retiro && (
          <Cartao>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <p className="dim" style={{ fontSize: 13 }}>
                {periodo} · Inscrição <b>{fmt(retiro.valor)}</b> ·{' '}
                {/* <b>{retiro.vagasRestantes}</b> vagas restantes */}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Campo label="Nome completo *" erro={erros.nome ? 'Informe o nome completo.' : ''}>
                <input className="input" value={form.nome} placeholder="Seu nome completo"
                  onChange={(e) => setF({ nome: e.target.value })} />
              </Campo>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Campo label="Telefone / WhatsApp *" erro={erros.tel ? 'Informe o telefone.' : ''}>
                  <input className="input" value={form.tel} placeholder="(65) 99999-9999"
                    onChange={(e) => setF({ tel: e.target.value })} />
                </Campo>
                <Campo label="Sexo *" erro={erros.genero ? 'Selecione o sexo.' : ''}>
                  <select className="input" value={form.genero}
                    onChange={(e) => setF({ genero: e.target.value as Genero | '' })}>
                    <option value="">Selecione…</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </Campo>
              </div>

              <Campo label="Tipo de inscrição *">
                <div style={{ display: 'flex', gap: 8 }}>
                  <BotaoSel on={form.tipo === 'Encontrista'} onClick={() => setF({ tipo: 'Encontrista', dia: '' })}>
                    Encontrista (convidado)
                  </BotaoSel>
                  <BotaoSel on={form.tipo === 'Servo'} onClick={() => setF({ tipo: 'Servo' })}>
                    Servo
                  </BotaoSel>
                </div>
              </Campo>

              {form.tipo === 'Servo' && (
                <Campo label="Em qual dia você vai servir? *" erro={erros.dia ? 'Selecione o dia de serviço.' : ''}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <BotaoSel on={form.dia === '1º dia'} onClick={() => setF({ dia: '1º dia' })}>1º dia</BotaoSel>
                    <BotaoSel on={form.dia === '2º dia'} onClick={() => setF({ dia: '2º dia' })}>2º dia</BotaoSel>
                  </div>
                </Campo>
              )}

              <Campo label="Líder / quem convidou *" erro={erros.lider ? 'Selecione o líder.' : ''}>
                <select className="input" value={form.lider} onChange={(e) => setF({ lider: e.target.value })}>
                  <option value="">Selecione o líder…</option>
                  {retiro.lideres.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </Campo>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Campo label="Forma de pagamento *" erro={erros.forma ? 'Selecione a forma de pagamento.' : ''}>
                  <select className="input" value={form.forma}
                    onChange={(e) => setF({ forma: e.target.value as FormaPagamento })}>
                    <option value="">Selecione…</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Pix">Pix</option>
                    <option value="Débito">Débito</option>
                    <option value="Crédito à vista">Crédito à vista</option>
                    <option value="Crédito parcelado">Crédito parcelado</option>
                  </select>
                </Campo>
                {form.forma === 'Crédito parcelado' && (
                  <Campo label="Número de parcelas *">
                    <select className="input" value={form.parcelas} onChange={(e) => setF({ parcelas: e.target.value })}>
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </Campo>
                )}
              </div>

              <Campo label="Comprovante de pagamento (imagem ou PDF)">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', background: 'var(--bg-app)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="2" strokeLinecap="round">
                    <path d="M15 7l-6.5 6.5a2.1 2.1 0 0 0 3 3L18 10a4.2 4.2 0 0 0-6-6L5.5 10.5"></path>
                  </svg>
                  <span style={{ fontSize: 12, color: 'var(--fg-default)' }}>
                    {comprovanteNome || 'Anexar comprovante (opcional se pagar no check-in)'}
                  </span>
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadComprovante(file)
                    }} />
                </label>
              </Campo>

              {erroEnvio && (
                <div style={{ fontSize: 12, color: 'var(--status-rejected-fg)', background: 'var(--status-rejected-bg)', padding: '8px 12px', borderRadius: 8 }}>
                  {erroEnvio}
                </div>
              )}

              <button className="btn btn-primary" disabled={enviando}
                style={{ justifyContent: 'center', padding: 12, fontSize: 15, marginTop: 6, opacity: enviando ? 0.7 : 1 }}
                onClick={enviar}>
                {enviando ? 'Enviando…' : 'Enviar inscrição'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center' }}>
                A inscrição fica pendente de confirmação até o check-in presencial.
              </div>
            </div>
          </Cartao>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-muted)', marginTop: 20 }}>
          {appConfig.nomeIgrejaCompleto}
        </p>
      </div>
    </div>
  )
}

// ---- Subcomponentes ---------------------------------------------------------

function Hero({ bannerUrl, igreja, nome }: { bannerUrl: string | null; igreja: string; nome?: string }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        minHeight: bannerUrl ? 200 : 150,
        display: 'flex',
        alignItems: 'flex-end',
        background: bannerUrl
          ? undefined
          : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {bannerUrl && (
        <img
          src={bannerUrl}
          alt={nome || 'Banner do retiro'}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          padding: '20px 24px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, opacity: 0.9 }}>
          {igreja}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, marginTop: 4 }}>
          {nome || 'Inscrição'}
        </div>
      </div>
    </div>
  )
}

function Cartao({ children }: { children: React.ReactNode }) {
  return <div className="card" style={{ padding: '28px 28px 24px' }}>{children}</div>
}

function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
      {erro ? <div style={{ fontSize: 11, color: 'var(--status-rejected-fg)', marginTop: 3 }}>{erro}</div> : null}
    </div>
  )
}

function BotaoSel({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={'btn btn-sm ' + (on ? 'btn-primary' : 'btn-default')}
      style={{ flex: 1, justifyContent: 'center' }}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function IconeCirculo({ tipo, children }: { tipo: 'ok' | 'erro'; children: React.ReactNode }) {
  const cor =
    tipo === 'ok'
      ? { bg: 'var(--color-sage-soft)', fg: 'var(--color-sage)' }
      : { bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)' }
  return (
    <div style={{ width: 52, height: 52, borderRadius: '50%', background: cor.bg, color: cor.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 22, fontWeight: 700 }}>
      {children}
    </div>
  )
}
