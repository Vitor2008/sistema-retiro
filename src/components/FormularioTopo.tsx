// ============================================================================
// Topo do formulário público de inscrição (banner + apresentação do evento).
// Compartilhado entre o formulário público e a pré-visualização no modal de
// criar/editar evento, para os dois ficarem sempre iguais.
// ============================================================================

import type { ReactNode } from 'react'
import { appConfig } from '../config'

/** Dados do evento usados no topo do formulário. Textos vazios = padrão. */
export interface EventoTopo {
  nome: string
  tipo: string
  descricao: string
  local: string
  saida: string
  formTitulo?: string
  formDescricao?: string
  formVersiculo?: string
  formVersiculoRef?: string
}

export function Hero({ bannerUrl, igreja, nome }: { bannerUrl: string | null; igreja: string; nome?: string }) {
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

export function Cartao({ children }: { children: ReactNode }) {
  return <div className="card" style={{ padding: '28px 28px 24px' }}>{children}</div>
}

export function InfoLinha({ emoji, texto }: { emoji: string; texto: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{emoji}</span>
      <span>{texto}</span>
    </div>
  )
}

/** Cartão de apresentação: template do retiro (ou descrição livre do avulso),
 *  data/local/saída/vagas e versículo. */
export function ConteudoEvento({
  evento,
  periodo,
  vagasRestantes,
}: {
  evento: EventoTopo
  periodo: string
  vagasRestantes: number
}) {
  const cfg = appConfig.formulario
  const avulso = evento.tipo === 'avulso'
  return (
    <Cartao>
      {avulso ? (
        // Evento avulso: descrição livre informada pelo organizador.
        evento.descricao ? <p style={{ whiteSpace: 'pre-wrap' }}>{evento.descricao}</p> : null
      ) : (
        // Retiro: template (título, descrição, o que inclui).
        <>
          <h2 style={{ textAlign: 'center' }}>{evento.formTitulo || cfg.subtitulo}</h2>
          <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{evento.formDescricao || cfg.descricao}</p>
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
        {evento.local && <InfoLinha emoji="📍" texto={<><b>Local:</b> {evento.local}</>} />}
        {!avulso && evento.saida && <InfoLinha emoji="🚌" texto={<><b>Saída:</b> {evento.saida}</>} />}
        <InfoLinha emoji="📌" texto={<><b>{vagasRestantes}</b> vagas restantes — garanta a sua!</>} />
      </div>

      {!avulso && (evento.formVersiculo || cfg.versiculo) && (
        <blockquote style={{ marginTop: 16, padding: '10px 14px', borderLeft: '3px solid var(--color-secondary)', background: 'var(--color-secondary-tint)', borderRadius: 6, fontStyle: 'italic', fontSize: 13 }}>
          “{evento.formVersiculo || cfg.versiculo}”
          <div style={{ marginTop: 4, fontStyle: 'normal', fontWeight: 600, color: 'var(--color-secondary-hover)' }}>
            — {evento.formVersiculo ? evento.formVersiculoRef : cfg.versiculoRef}
          </div>
        </blockquote>
      )}
    </Cartao>
  )
}
