import { createApp } from './app.js'
import { env } from './env.js'

const app = createApp()

app.listen(env.port, () => {
  console.log(`API do Sistema de Retiros ouvindo em http://localhost:${env.port}`)
  console.log(`CORS liberado para ${env.corsOrigin}`)
})
