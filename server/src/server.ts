import { createApp } from './app.js'
import { runMigrations } from './db/migrator.js'
import { env } from './env.js'

async function start() {
  // Aplica migrações pendentes antes de servir (idempotente). Se falhar, não
  // sobe com schema desatualizado — o deploy no Render é marcado como falho.
  // (As listas padrão — categorias/conduções — são semeadas por retiro, na
  //  criação de cada retiro; não há mais seed global no start.)
  try {
    await runMigrations()
  } catch (e) {
    console.error('[start] falha ao aplicar migrações:', e)
    process.exit(1)
  }

  const app = createApp()
  app.listen(env.port, () => {
    console.log(`API do Sistema de Retiros ouvindo em http://localhost:${env.port}`)
    console.log(`CORS liberado para ${env.corsOrigin}`)
  })
}

void start()
