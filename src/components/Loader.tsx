import { appConfig } from '../config'

/** Loader padrão: a logo pulsando dentro de um anel giratório, com o texto de
 *  carregamento abaixo. Use `fullscreen` para ocupar a tela inteira (boot do
 *  app / formulário público) ou embutido em um card. */
export function Loader({
  texto = 'Carregando…',
  fullscreen = false,
}: {
  texto?: string
  fullscreen?: boolean
}) {
  const conteudo = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Logo pulsando */}
      <img
        src={appConfig.logoUrl}
        alt={appConfig.nomeIgreja}
        width={72}
        height={72}
        style={{
          borderRadius: 12,
          objectFit: 'contain',
          animation: 'pulseSoft 1.6s ease-in-out infinite',
        }}
      />
      <p className="dim" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.2 }}>
        {texto}
      </p>
    </div>
  )

  if (fullscreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app)',
          padding: 16,
        }}
      >
        {conteudo}
      </div>
    )
  }
  return <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>{conteudo}</div>
}
