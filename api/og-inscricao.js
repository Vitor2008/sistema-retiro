// ============================================================================
// Pré-visualização de link (Open Graph) do formulário público de inscrição.
//
// O WhatsApp (e Facebook, Telegram etc.) não executa JavaScript: lê as tags
// <meta property="og:*"> do HTML. Como o app é uma SPA, todo caminho devolve o
// mesmo index.html — sem capa do evento. Esta função (Vercel) atende
// /inscricao/:slug (rewrite em vercel.json):
//  - robô de pré-visualização → busca o evento na API e injeta título + banner;
//  - pessoa → devolve o index.html sem consultar a API (sem atraso).
// ============================================================================

const ROBOS =
  /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|linkedinbot|discordbot|skypeuripreview|googlebot|bingbot|pinterest|embedly|vkshare|redditbot|applebot/i

const PADRAO_TITULO = 'Faça sua inscrição'
const PADRAO_DESCRICAO = 'Um Final de Semana para Ser Transformado!'

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function buscarJson(url, ms) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    return r.ok ? await r.json() : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origem = 'https://' + host
  const slug = String(req.query.slug || '')

  let html = await fetch(origem + '/index.html').then((r) => r.text())

  const ua = String(req.headers['user-agent'] || '')
  const api = (process.env.VITE_API_URL || '').replace(/\/$/, '')
  if (ROBOS.test(ua) && api && slug) {
    // Margem para o backend acordar (Render); sem resposta, segue sem capa.
    const ev = await buscarJson(api + '/public/retiro/' + encodeURIComponent(slug), 9000)
    if (ev) {
      const titulo = ev.nome || PADRAO_TITULO
      const descricao = ev.tipo === 'avulso' ? ev.descricao || PADRAO_TITULO : ev.formTitulo || PADRAO_DESCRICAO
      const imagem = ev.bannerId ? api + '/public/banner/' + encodeURIComponent(ev.bannerId) : origem + '/logo.png'
      const tags = [
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="IMEL Cuiabá" />`,
        `<meta property="og:title" content="${esc(titulo)}" />`,
        `<meta property="og:description" content="${esc(descricao.slice(0, 200))}" />`,
        `<meta property="og:url" content="${esc(origem + '/inscricao/' + slug)}" />`,
        `<meta property="og:image" content="${esc(imagem)}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
      ].join('\n    ')
      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(titulo)}</title>`)
        .replace('</head>', `    ${tags}\n  </head>`)
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(html)
}
