import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { env } from './env.js'
import { apiRouter } from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.corsOrigin }))
  app.use(express.json({ limit: '5mb' })) // snapshot pode ser grande

  app.use('/api', apiRouter)

  // Handler de erros global -> resposta JSON consistente
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Erro interno.'
    console.error('[api] erro:', message)
    res.status(400).json({ error: message })
  })

  return app
}
