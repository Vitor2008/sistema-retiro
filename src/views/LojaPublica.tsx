// ============================================================================
// Página PÚBLICA da loja — renderizada FORA do login (link avulso do produto).
// Rota: /loja/:id. Mostra os detalhes do produto e o formulário de compra.
// Fala apenas com /api/public/loja/* (sem autenticação).
// ============================================================================

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { appConfig } from '../config'
import { fmt } from '../lib/format'
import type { Genero } from '../types'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api'

const TAMANHOS = ['P', 'M', 'G', 'GG']

interface ProdutoPublico {
  id: string
  categoria: 'vestimenta' | 'outros'
  nome: string
  descricao: string
  valor: number
  fotos: string[]
  linkPagamento: string
  eventoNome: string
  bannerId: string | null
}

type Fase = 'carregando' | 'erro' | 'aberto' | 'enviado'

export function LojaPublica() {
  const { id = '' } = useParams()
  const cfg = appConfig.formulario
  const [produto, setProduto] = useState<ProdutoPublico | null>(null)
  const [fase, setFase] = useState<Fase>('carregando')
  const [fotoAtiva, setFotoAtiva] = useState(0)

  const [nome, setNome] = useState('')
  const [genero, setGenero] = useState<Genero | ''>('')
  const [tamanho, setTamanho] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [forma, setForma] = useState<'Pix' | 'Cartão' | ''>('')
  const [comprovanteId, setComprovanteId] = useState<string | null>(null)
  const [comprovanteNome, setComprovanteNome] = useState('')
  const [erros, setErros] = useState<Record<string, boolean>>({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [pixCopiado, setPixCopiado] = useState(false)

  useEffect(() => {
    let vivo = true
    setFase('carregando')
    fetch(`${BASE_URL}/public/loja/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('nao-encontrado')
        return (await res.json()) as ProdutoPublico
      })
      .then((p) => {
        if (!vivo) return
        setProduto(p)
        setFase('aberto')
      })
      .catch(() => vivo && setFase('erro'))
    return () => {
      vivo = false
    }
  }, [id])

  const vestimenta = produto?.categoria === 'vestimenta'
  const total = (produto?.valor ?? 0) * quantidade

  const uploadComprovante = async (file: File) => {
    setErroEnvio(null)
    try {
      const res = await fetch(`${BASE_URL}/public/loja/${encodeURIComponent(id)}/arquivo`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) },
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
    if (!(quantidade >= 1)) e.quantidade = true
    if (!forma) e.forma = true
    if (vestimenta) {
      if (!nome.trim() || nome.trim().split(/\s+/).length < 2) e.nome = true
      if (!genero) e.genero = true
      if (!tamanho) e.tamanho = true
    }
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
      const res = await fetch(`${BASE_URL}/public/loja/${encodeURIComponent(id)}/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          genero,
          tamanho,
          quantidade,
          forma,
          comprovanteId,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Não foi possível enviar o pedido.')
      }
      setFase('enviado')
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Falha ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const resetForm = () => {
    setNome(''); setGenero(''); setTamanho(''); setQuantidade(1); setForma('')
    setComprovanteId(null); setComprovanteNome(''); setErros({}); setErroEnvio(null)
    setFase('aberto')
  }

  return (
    <div className="form-inscricao" style={{ minHeight: '100vh', background: 'var(--bg-app)', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Hero
          igreja={appConfig.nomeIgreja}
          nome={produto?.nome}
          evento={produto?.eventoNome}
          bannerUrl={produto?.bannerId ? `${BASE_URL}/public/banner/${produto.bannerId}` : null}
        />

        {fase === 'carregando' && <Cartao><Loader /></Cartao>}

        {fase === 'erro' && (
          <Cartao>
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <IconeCirculo tipo="erro">✕</IconeCirculo>
              <h3 style={{ marginTop: 8 }}>Produto não encontrado</h3>
              <p style={{ marginTop: 8 }}>O link pode estar incorreto ou o produto não está mais disponível.</p>
            </div>
          </Cartao>
        )}

        {fase === 'enviado' && produto && (
          <Cartao>
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <IconeCirculo tipo="ok">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg>
              </IconeCirculo>
              <h3 style={{ marginTop: 8 }}>Pedido recebido!</h3>
              <p style={{ marginTop: 8 }}>
                Seu pedido de <b>{produto.nome}</b> foi registrado e está <b>pendente de confirmação</b>.
                A retirada/entrega é combinada com a organização.
              </p>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 20 }} onClick={resetForm}>Fazer outro pedido</button>
            </div>
          </Cartao>
        )}

        {fase === 'aberto' && produto && (
          <>
            {/* Detalhes do produto */}
            <Cartao>
              {produto.fotos.length > 0 && (
                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', maxWidth: 360, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-muted)', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={`${BASE_URL}/public/banner/${produto.fotos[fotoAtiva] ?? produto.fotos[0]}`} alt={produto.nome} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  {produto.fotos.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {produto.fotos.map((fid, i) => (
                        <button key={fid} onClick={() => setFotoAtiva(i)} type="button"
                          style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '2px solid ' + (i === fotoAtiva ? 'var(--color-primary)' : 'var(--border-default)'), padding: 0, cursor: 'pointer', background: 'none' }}>
                          <img src={`${BASE_URL}/public/banner/${fid}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <h2 style={{ marginBottom: 6, textAlign: 'center' }}>{produto.nome}</h2>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10, textAlign: 'center' }}>{fmt(produto.valor)}</div>
              {produto.descricao && <p style={{ whiteSpace: 'pre-wrap' }}>{produto.descricao}</p>}
            </Cartao>

            {/* Formulário de compra */}
            <div style={{ marginTop: 16 }}>
              <Cartao>
                <h3 style={{ marginBottom: 4 }}>Fazer pedido</h3>
                <p className="dim" style={{ fontSize: 12, marginBottom: 18 }}>Campos com * são obrigatórios.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {vestimenta && (
                    <>
                      <Campo label="Nome completo *" erro={erros.nome ? 'Informe o nome completo.' : ''}>
                        <input className="input" value={nome} placeholder="Seu nome completo" onChange={(e) => setNome(e.target.value)} />
                      </Campo>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
                        <Campo label="Gênero *" erro={erros.genero ? 'Selecione o gênero.' : ''}>
                          <select className="input" value={genero} onChange={(e) => setGenero(e.target.value as Genero | '')}>
                            <option value="">Selecione…</option>
                            <option value="M">Homem</option>
                            <option value="F">Mulher</option>
                          </select>
                        </Campo>
                        <Campo label="Tamanho da camisa *" erro={erros.tamanho ? 'Selecione o tamanho.' : ''}>
                          <select className="input" value={tamanho} onChange={(e) => setTamanho(e.target.value)}>
                            <option value="">Selecione…</option>
                            {TAMANHOS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </Campo>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
                    <Campo label="Quantidade *" erro={erros.quantidade ? 'Informe a quantidade.' : ''}>
                      <input className="input" type="number" min="1" inputMode="numeric" value={quantidade}
                        onChange={(e) => setQuantidade(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
                    </Campo>
                    <Campo label="Valor total">
                      <input className="input" value={fmt(total)} readOnly style={{ fontWeight: 700, background: 'var(--bg-app)' }} />
                    </Campo>
                  </div>
                </div>
              </Cartao>
            </div>

            {/* Pagamento */}
            <div style={{ marginTop: 16 }}>
              <Cartao>
                <h3 style={{ marginBottom: 12 }}>Pagamento</h3>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                  Total: <span style={{ color: 'var(--color-primary)' }}>{fmt(total)}</span>
                </div>

                <Campo label="Forma de pagamento *" erro={erros.forma ? 'Selecione a forma de pagamento.' : ''}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <BotaoSel on={forma === 'Pix'} onClick={() => setForma('Pix')}>PIX</BotaoSel>
                    <BotaoSel on={forma === 'Cartão'} onClick={() => setForma('Cartão')}>Cartão</BotaoSel>
                  </div>
                </Campo>

                {forma === 'Pix' && (
                  <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>Chave PIX {cfg.pixInfo ? `(${cfg.pixInfo})` : ''}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 600, flex: 1, wordBreak: 'break-all' }}>{cfg.pixChave}</span>
                      <button className="btn btn-default btn-xs" style={{ flexShrink: 0 }} onClick={copiarPix}>{pixCopiado ? 'Copiado!' : 'Copiar'}</button>
                    </div>
                    {cfg.qrCodeUrl && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>Aponte a câmera do celular para o QR Code</div>
                        <img src={cfg.qrCodeUrl} alt="QR Code PIX" style={{ width: 200, height: 200, objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                )}

                {forma === 'Cartão' && (
                  <div style={{ marginTop: 14 }}>
                    {produto.linkPagamento || cfg.linkPagamento ? (
                      <a href={produto.linkPagamento || cfg.linkPagamento} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                        Pagar com cartão (débito/crédito)
                      </a>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px' }}>
                        Link de pagamento por cartão ainda não configurado.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Comprovante de pagamento (imagem ou PDF)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', background: 'var(--bg-app)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="2" strokeLinecap="round"><path d="M15 7l-6.5 6.5a2.1 2.1 0 0 0 3 3L18 10a4.2 4.2 0 0 0-6-6L5.5 10.5"></path></svg>
                    <span style={{ fontSize: 12, color: 'var(--fg-default)' }}>{comprovanteNome || 'Anexar comprovante do pagamento'}</span>
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadComprovante(f) }} />
                  </label>
                </div>

                {erroEnvio && (
                  <div style={{ fontSize: 12, color: 'var(--status-rejected-fg)', background: 'var(--status-rejected-bg)', padding: '8px 12px', borderRadius: 8, marginTop: 14 }}>{erroEnvio}</div>
                )}

                <button className="btn btn-primary" disabled={enviando} style={{ justifyContent: 'center', padding: 12, fontSize: 15, marginTop: 16, width: '100%', opacity: enviando ? 0.7 : 1 }} onClick={enviar}>
                  {enviando ? 'Enviando…' : 'Enviar pedido'}
                </button>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 8 }}>
                  O pedido fica pendente até a confirmação da organização.
                </div>
              </Cartao>
            </div>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-muted)', marginTop: 20 }}>{appConfig.nomeIgrejaCompleto}</p>
      </div>
    </div>
  )
}

// ---- Subcomponentes ---------------------------------------------------------
function Hero({ igreja, nome, evento, bannerUrl }: { igreja: string; nome?: string; evento?: string; bannerUrl?: string | null }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        minHeight: bannerUrl ? 200 : 130,
        display: 'flex',
        alignItems: 'flex-end',
        background: bannerUrl ? undefined : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {bannerUrl && (
        <img src={bannerUrl} alt={nome || 'Banner do evento'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
          {igreja}{evento ? ' · ' + evento : ''} · Loja
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, marginTop: 4 }}>{nome || 'Produto'}</div>
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
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
      {erro ? <div style={{ fontSize: 11, color: 'var(--status-rejected-fg)', marginTop: 3 }}>{erro}</div> : null}
    </div>
  )
}

function BotaoSel({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={'btn btn-sm ' + (on ? 'btn-primary' : 'btn-default')} style={{ flex: 1, justifyContent: 'center' }} onClick={onClick} type="button">
      {children}
    </button>
  )
}

function IconeCirculo({ tipo, children }: { tipo: 'ok' | 'erro'; children: React.ReactNode }) {
  const cor = tipo === 'ok' ? { bg: 'var(--color-sage-soft)', fg: 'var(--color-sage)' } : { bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)' }
  return (
    <div style={{ width: 52, height: 52, borderRadius: '50%', background: cor.bg, color: cor.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 22, fontWeight: 700 }}>
      {children}
    </div>
  )
}
