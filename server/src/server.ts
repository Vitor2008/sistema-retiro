import { createApp } from './app.js'
import { env } from './env.js'
import { categoriaRepository } from './repositories/listaRepository.js'

const app = createApp()

app.listen(env.port, () => {
  console.log(`API do Sistema de Retiros ouvindo em http://localhost:${env.port}`)
  console.log(`CORS liberado para ${env.corsOrigin}`)

  // Garante as categorias de despesa padrão no banco (cria só as que faltam).
  // Não bloqueia o start: se o banco estiver fora, apenas registra o aviso.
  categoriaRepository
    .ensureDefaults()
    .then((criadas) => {
      if (criadas.length) console.log('Categorias padrão criadas:', criadas.join(', '))
    })
    .catch((e) => console.error('[start] falha ao garantir categorias padrão:', e))
})
