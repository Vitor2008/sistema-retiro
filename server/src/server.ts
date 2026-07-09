import { createApp } from './app.js'
import { runMigrations } from './db/migrator.js'
import { env } from './env.js'
import { categoriaRepository } from './repositories/listaRepository.js'

async function start() {
  // 1) Aplica migrações pendentes antes de servir (idempotente). Se falhar, não
  //    sobe com schema desatualizado — o deploy no Render é marcado como falho.
  try {
    await runMigrations()
  } catch (e) {
    console.error('[start] falha ao aplicar migrações:', e)
    process.exit(1)
  }

  // 2) Garante as categorias de despesa padrão (cria só as que faltam).
  try {
    const criadas = await categoriaRepository.ensureDefaults()
    if (criadas.length) console.log('Categorias padrão criadas:', criadas.join(', '))
  } catch (e) {
    console.error('[start] falha ao garantir categorias padrão:', e)
  }

  // 3) Sobe o servidor.
  const app = createApp()
  app.listen(env.port, () => {
    console.log(`API do Sistema de Retiros ouvindo em http://localhost:${env.port}`)
    console.log(`CORS liberado para ${env.corsOrigin}`)
  })
}

void start()
