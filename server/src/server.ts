import { createApp } from './app.js'
import { runMigrations } from './db/migrator.js'
import { env } from './env.js'
import {
  categoriaRepository,
  conducaoRepository,
  predioRepository,
} from './repositories/listaRepository.js'

async function start() {
  // 1) Aplica migrações pendentes antes de servir (idempotente). Se falhar, não
  //    sobe com schema desatualizado — o deploy no Render é marcado como falho.
  try {
    await runMigrations()
  } catch (e) {
    console.error('[start] falha ao aplicar migrações:', e)
    process.exit(1)
  }

  // 2) Garante listas padrão (categorias, prédios, conduções) — cria só as que
  //    faltam, sem apagar nenhuma existente.
  try {
    const [cats, preds, conds] = await Promise.all([
      categoriaRepository.ensureDefaults(),
      predioRepository.ensureDefaults(),
      conducaoRepository.ensureDefaults(),
    ])
    if (cats.length) console.log('Categorias padrão criadas:', cats.join(', '))
    if (preds.length) console.log('Prédios padrão criados:', preds.join(', '))
    if (conds.length) console.log('Conduções padrão criadas:', conds.join(', '))
  } catch (e) {
    console.error('[start] falha ao garantir listas padrão:', e)
  }

  // 3) Sobe o servidor.
  const app = createApp()
  app.listen(env.port, () => {
    console.log(`API do Sistema de Retiros ouvindo em http://localhost:${env.port}`)
    console.log(`CORS liberado para ${env.corsOrigin}`)
  })
}

void start()
