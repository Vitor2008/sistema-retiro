import { Router } from 'express'
import { despesaService } from '../services/despesaService.js'
import { inscritoService } from '../services/inscritoService.js'
import { produtoService } from '../services/produtoService.js'
import { quartoService } from '../services/quartoService.js'
import { retiroService } from '../services/retiroService.js'
import { vendaService } from '../services/vendaService.js'
import { arquivoRoutes } from './arquivoRoutes.js'
import { requireAuth } from './authMiddleware.js'
import { authRoutes } from './authRoutes.js'
import { crudRouter } from './crudRouter.js'
import { snapshotRoutes } from './snapshotRoutes.js'
import { usuarioRoutes } from './usuarioRoutes.js'

/** Agrega todas as rotas da API sob /api. */
export const apiRouter = Router()

// ---- Rotas públicas (antes do middleware de autenticação) ----
apiRouter.use('/auth', authRoutes)
apiRouter.get('/health', (_req, res) => res.json({ ok: true }))

// ---- A partir daqui, tudo exige Bearer token válido ----
apiRouter.use(requireAuth)

// CRUD por entidade
apiRouter.use('/inscritos', crudRouter(inscritoService))
apiRouter.use('/quartos', crudRouter(quartoService))
apiRouter.use('/produtos', crudRouter(produtoService))
apiRouter.use('/vendas', crudRouter(vendaService))
apiRouter.use('/despesas', crudRouter(despesaService))

// Retiro atual (recurso único)
apiRouter.get('/retiro', async (_req, res, next) => {
  try {
    const r = await retiroService.getAtual()
    if (!r) return res.status(404).json({ error: 'Retiro não configurado.' })
    res.json(r)
  } catch (e) {
    next(e)
  }
})
apiRouter.put('/retiro', async (req, res, next) => {
  try {
    res.json(await retiroService.saveAtual(req.body))
  } catch (e) {
    next(e)
  }
})

// Sincronização completa
apiRouter.use('/snapshot', snapshotRoutes)

// Comprovantes/notas (bytea no Postgres)
apiRouter.use('/arquivos', arquivoRoutes)

// Gestão de usuários (somente ADM)
apiRouter.use('/usuarios', usuarioRoutes)
