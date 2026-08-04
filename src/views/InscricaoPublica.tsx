// ============================================================================
// Formulário PÚBLICO de inscrição — renderizado FORA do login (landing page).
//
// Totalmente autossuficiente: não usa o store offline nem o token de sessão.
// Fala apenas com as rotas /api/public/* (sem autenticação). Estrutura:
//  - carrega os dados do retiro pelo slug da URL (/inscricao/:slug)
//  - exibe banner + conteúdo institucional (fixo) + formulário
//  - envia a inscrição direto ao backend (uma linha, sem snapshot)
// ============================================================================

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { appConfig } from '../config'
import { fmt, fmtData } from '../lib/format'
import type { FormaPagamento, Genero, TipoInscricao, Vez } from '../types'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api'

interface RetiroPublico {
  nome: string
  inicio: string
  fim: string
  valor: number
  max: number
  local: string
  saida: string
  tipo: string
  descricao: string
  linkPagamento: string
  mostrarLider: boolean
  mostrarPredio: boolean
  mostrarConducao: boolean
  slug: string
  bannerId: string | null
  lideres: { nome: string; predio: string }[]
  predios: string[]
  conducoes: string[]
  aberto: boolean
  vagasRestantes: number
}

interface FormState {
  nome: string
  idade: string
  genero: Genero | ''
  tel: string
  dataNascimento: string
  tipo: TipoInscricao
  vez: Vez
  lider: string
  predio: string
  conducao: string
  forma: FormaPagamento
}

const formInicial: FormState = {
  nome: '',
  idade: '',
  genero: '',
  tel: '',
  dataNascimento: '',
  tipo: 'Encontrista',
  vez: '',
  lider: '',
  predio: '',
  conducao: '',
  forma: '',
}

type Fase = 'carregando' | 'erro' | 'fechado' | 'aberto' | 'enviado'

export function InscricaoPublica() {
  const { slug = '' } = useParams()
  const cfg = appConfig.formulario
  const [retiro, setRetiro] = useState<RetiroPublico | null>(null)
  const [fase, setFase] = useState<Fase>('carregando')
  const [form, setForm] = useState<FormState>(formInicial)
  const [erros, setErros] = useState<Record<string, boolean>>({})
  const [comprovanteId, setComprovanteId] = useState<string | null>(null)
  const [comprovanteNome, setComprovanteNome] = useState<string>('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [pixCopiado, setPixCopiado] = useState(false)

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
    setErroEnvio(null)
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

  const copiarPix = () => {
    navigator.clipboard?.writeText(cfg.pixChave).catch(() => {})
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 2000)
  }

  const validar = (): boolean => {
    const e: Record<string, boolean> = {}
    if (!form.nome.trim() || form.nome.trim().split(/\s+/).length < 2) e.nome = true
    if (!(Number(form.idade) > 0)) e.idade = true
    if (!form.genero) e.genero = true
    if (!form.tel.trim()) e.tel = true
    if (!form.dataNascimento) e.dataNascimento = true
    if (retiro?.tipo !== 'avulso' && form.tipo === 'Encontrista' && !form.vez) e.vez = true
    if (retiro?.mostrarLider !== false && !form.lider.trim()) e.lider = true
    if (retiro?.mostrarPredio !== false && !form.predio) e.predio = true
    if (retiro?.mostrarConducao !== false && !form.conducao) e.conducao = true
    if (!form.forma) e.forma = true
    setErros(e)
    return Object.keys(e).length === 0
  }

  const enviar = async () => {
    setErroEnvio(null)
    if (!validar()) {
      setErroEnvio('Revise os campos destacados.')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch(`${BASE_URL}/public/inscricao/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          idade: Number(form.idade),
          genero: form.genero,
          tel: form.tel.trim(),
          dataNascimento: form.dataNascimento,
          tipo: form.tipo,
          vez: form.tipo === 'Encontrista' ? form.vez : '',
          lider: form.lider.trim(),
          predio: form.predio,
          conducao: form.conducao,
          forma: form.forma,
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
    <div className="form-inscricao" style={{ minHeight: '100vh', background: 'var(--bg-app)', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ---- Hero / banner ---- */}
        <Hero bannerUrl={bannerUrl} igreja={appConfig.nomeIgreja} nome={retiro?.nome} />

        {fase === 'carregando' && (
          <Cartao>
            <Loader />
          </Cartao>
        )}

        {fase === 'erro' && (
          <Cartao>
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <IconeCirculo tipo="erro">✕</IconeCirculo>
              <h3 style={{ marginTop: 8 }}>Formulário não encontrado</h3>
              <p style={{ marginTop: 8 }}>
                O link de inscrição pode estar incorreto ou o evento não está mais disponível.
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
                check-in presencial do evento.
              </p>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 20 }}
                onClick={() => {
                  setForm(formInicial)
                  setComprovanteId(null)
                  setComprovanteNome('')
                  setErros({})
                  setErroEnvio(null)
                  setFase('aberto')
                }}
              >
                Fazer outra inscrição
              </button>
            </div>
          </Cartao>
        )}

        {fase === 'aberto' && retiro && (
          <>
            {/* ---- Conteúdo do evento ---- */}
            <Cartao>
              {retiro.tipo === 'avulso' ? (
                // Evento avulso: descrição livre informada pelo organizador.
                retiro.descricao ? (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{retiro.descricao}</p>
                ) : null
              ) : (
                // Retiro: template fixo (subtítulo, descrição, o que inclui).
                <>
                  <h2 style={{ textAlign: 'center' }}>{cfg.subtitulo}</h2>
                  <p style={{ marginTop: 12 }}>{cfg.descricao}</p>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {cfg.incluidos.map((item) => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                        <span style={{ color: 'var(--color-sage)' }}>✔️</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                <InfoLinha emoji="🗓" texto={<><b>Data:</b> {periodo}</>} />
                {retiro.local && <InfoLinha emoji="📍" texto={<><b>Local:</b> {retiro.local}</>} />}
                {retiro.tipo !== 'avulso' && retiro.saida && <InfoLinha emoji="🚌" texto={<><b>Saída:</b> {retiro.saida}</>} />}
                <InfoLinha emoji="📌" texto={<><b>{retiro.vagasRestantes}</b> vagas restantes — garanta a sua!</>} />
              </div>

              {retiro.tipo !== 'avulso' && cfg.versiculo && (
                <blockquote style={{ marginTop: 16, padding: '10px 14px', borderLeft: '3px solid var(--color-secondary)', background: 'var(--color-secondary-tint)', borderRadius: 6, fontStyle: 'italic', fontSize: 13 }}>
                  “{cfg.versiculo}”
                  <div style={{ marginTop: 4, fontStyle: 'normal', fontWeight: 600, color: 'var(--color-secondary-hover)' }}>— {cfg.versiculoRef}</div>
                </blockquote>
              )}
            </Cartao>

            {/* ---- Formulário ---- */}
            <div style={{ marginTop: 16 }}>
              <Cartao>
                <h3 style={{ marginBottom: 4 }}>Faça sua inscrição</h3>
                <p className="dim" style={{ fontSize: 12, marginBottom: 18 }}>
                  Campos com * são obrigatórios.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Campo label="Nome completo *" erro={erros.nome ? 'Informe o nome completo.' : ''}>
                    <input className="input" value={form.nome} placeholder="Seu nome completo"
                      onChange={(e) => setF({ nome: e.target.value })} />
                  </Campo>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
                    <Campo label="Idade *" erro={erros.idade ? 'Informe a idade.' : ''}>
                      <input className="input" type="number" min="0" inputMode="numeric" value={form.idade}
                        placeholder="Somente número" onChange={(e) => setF({ idade: e.target.value })} />
                    </Campo>
                    <Campo label="Gênero *" erro={erros.genero ? 'Selecione o gênero.' : ''}>
                      <select className="input" value={form.genero}
                        onChange={(e) => setF({ genero: e.target.value as Genero | '' })}>
                        <option value="">Selecione…</option>
                        <option value="M">Homem</option>
                        <option value="F">Mulher</option>
                      </select>
                    </Campo>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
                    <Campo label="Telefone / WhatsApp *" erro={erros.tel ? 'Informe o telefone.' : ''}>
                      <input className="input" value={form.tel} placeholder="(65) 99999-9999"
                        onChange={(e) => setF({ tel: e.target.value })} />
                    </Campo>
                    <Campo label="Data de nascimento *" erro={erros.dataNascimento ? 'Informe a data de nascimento.' : ''}>
                      <input className="input" type="date" value={form.dataNascimento}
                        onChange={(e) => setF({ dataNascimento: e.target.value })} />
                    </Campo>
                  </div>

                  {/* "Como está indo" e "vez" não se aplicam a eventos avulsos. */}
                  {retiro.tipo !== 'avulso' && (
                    <Campo label="Você está indo como? *">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <BotaoSel on={form.tipo === 'Encontrista'} onClick={() => setF({ tipo: 'Encontrista' })}>
                          Convidado
                        </BotaoSel>
                        <BotaoSel on={form.tipo === 'Servo'} onClick={() => setF({ tipo: 'Servo', vez: '' })}>
                          Servo
                        </BotaoSel>
                      </div>
                    </Campo>
                  )}

                  {retiro.tipo !== 'avulso' && form.tipo === 'Encontrista' && (
                    <Campo label="Se convidado, é a sua… *" erro={erros.vez ? 'Selecione uma opção.' : ''}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <BotaoSel on={form.vez === '1ª Vez'} onClick={() => setF({ vez: '1ª Vez' })}>1ª Vez</BotaoSel>
                        <BotaoSel on={form.vez === '2ª Vez'} onClick={() => setF({ vez: '2ª Vez' })}>2ª Vez</BotaoSel>
                        <BotaoSel on={form.vez === '+ de 2'} onClick={() => setF({ vez: '+ de 2' })}>+ de 2</BotaoSel>
                      </div>
                    </Campo>
                  )}

                  {retiro.mostrarLider && (
                    <Campo label="Quem lhe convidou? (líder) *" erro={erros.lider ? 'Selecione quem convidou.' : ''}>
                      <select className="input" value={form.lider} onChange={(e) => setF({ lider: e.target.value })}>
                        <option value="">
                          {!retiro.mostrarPredio || form.predio ? 'Selecione o líder…' : 'Escolha o prédio primeiro…'}
                        </option>
                        {retiro.lideres
                          .filter((l) => !form.predio || l.predio === form.predio || !l.predio)
                          .map((l) => (
                            <option key={l.nome + '|' + l.predio} value={l.nome}>{l.nome}</option>
                          ))}
                      </select>
                    </Campo>
                  )}

                  {(retiro.mostrarPredio || retiro.mostrarConducao) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
                      {retiro.mostrarPredio && (
                        <Campo label="Qual prédio? *" erro={erros.predio ? 'Selecione o prédio.' : ''}>
                          <select className="input" value={form.predio} onChange={(e) => setF({ predio: e.target.value })}>
                            <option value="">Selecione…</option>
                            {retiro.predios.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </Campo>
                      )}
                      {retiro.mostrarConducao && (
                        <Campo label="Como pretende ir? *" erro={erros.conducao ? 'Selecione a condução.' : ''}>
                          <select className="input" value={form.conducao} onChange={(e) => setF({ conducao: e.target.value })}>
                            <option value="">Selecione…</option>
                            {retiro.conducoes.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </Campo>
                      )}
                    </div>
                  )}
                </div>
              </Cartao>
            </div>

            {/* ---- Pagamento ---- */}
            <div style={{ marginTop: 16 }}>
              <Cartao>
                <h3 style={{ marginBottom: 12 }}>Pagamento</h3>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                  Investimento: <span style={{ color: 'var(--color-primary)' }}>{fmt(retiro.valor)}</span> por pessoa
                </div>

                <Campo label="Forma de pagamento *" erro={erros.forma ? 'Selecione a forma de pagamento.' : ''}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <BotaoSel on={form.forma === 'Pix'} onClick={() => setF({ forma: 'Pix' })}>PIX</BotaoSel>
                    <BotaoSel on={form.forma === 'Cartão'} onClick={() => setF({ forma: 'Cartão' })}>Cartão</BotaoSel>
                  </div>
                </Campo>

                {form.forma === 'Pix' && (
                  <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>
                      Chave PIX {cfg.pixInfo ? `(${cfg.pixInfo})` : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 600, flex: 1, wordBreak: 'break-all' }}>{cfg.pixChave}</span>
                      <button className="btn btn-default btn-xs" style={{ flexShrink: 0 }} onClick={copiarPix}>
                        {pixCopiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    {cfg.qrCodeUrl && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
                          Aponte a câmera do celular para o QR Code
                        </div>
                        <img src={cfg.qrCodeUrl} alt="QR Code PIX" style={{ width: 200, height: 200, objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                )}

                {form.forma === 'Cartão' && (
                  <div style={{ marginTop: 14 }}>
                    {retiro.linkPagamento || cfg.linkPagamento ? (
                      <a href={retiro.linkPagamento || cfg.linkPagamento} target="_blank" rel="noopener noreferrer"
                        className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                        Pagar com cartão (débito/crédito)
                      </a>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px' }}>
                        Link de pagamento por cartão ainda não configurado para este evento.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                    Comprovante de pagamento (imagem ou PDF)
                  </label>
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
                </div>

                {erroEnvio && (
                  <div style={{ fontSize: 12, color: 'var(--status-rejected-fg)', background: 'var(--status-rejected-bg)', padding: '8px 12px', borderRadius: 8, marginTop: 14 }}>
                    {erroEnvio}
                  </div>
                )}

                <button className="btn btn-primary" disabled={enviando}
                  style={{ justifyContent: 'center', padding: 12, fontSize: 15, marginTop: 16, width: '100%', opacity: enviando ? 0.7 : 1 }}
                  onClick={enviar}>
                  {enviando ? 'Enviando…' : 'Enviar inscrição'}
                </button>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 8 }}>
                  A inscrição fica pendente de confirmação até o check-in presencial.
                </div>
              </Cartao>
            </div>
          </>
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
          alt={nome || 'Banner do evento'}
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

function InfoLinha({ emoji, texto }: { emoji: string; texto: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{emoji}</span>
      <span>{texto}</span>
    </div>
  )
}

function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>
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
