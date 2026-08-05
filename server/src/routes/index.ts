import { Router } from 'express'
import { arquivoRoutes } from './arquivoRoutes.js'
import { requireAuth } from './authMiddleware.js'
import { authRoutes } from './authRoutes.js'
import { lojaRoutes } from './lojaRoutes.js'
import { predioRoutes } from './predioRoutes.js'
import { publicRoutes } from './publicRoutes.js'
import { retiroRoutes } from './retiroRoutes.js'
import { snapshotRoutes } from './snapshotRoutes.js'
import { usuarioRoutes } from './usuarioRoutes.js'

/** Agrega todas as rotas da API sob /api. */
export const apiRouter = Router()

// ---- Rotas públicas (antes do middleware de autenticação) ----
apiRouter.use('/auth', authRoutes)
apiRouter.get('/health', (_req, res) => res.json({ ok: true }))
// Formulário público de inscrição (landing fora do login).
apiRouter.use('/public', publicRoutes)

// ---- A partir daqui, tudo exige Bearer token válido ----
apiRouter.use(requireAuth)

// Retiros (lista por perfil; CRUD do adm)
apiRouter.use('/retiros', retiroRoutes)

// Prédios persistentes (participação em retiros, gestão)
apiRouter.use('/predios', predioRoutes)

// Sincronização por retiro (/api/snapshot/:retiroId)
apiRouter.use('/snapshot', snapshotRoutes)

// Comprovantes/notas (bytea no Postgres)
apiRouter.use('/arquivos', arquivoRoutes)

// Gestão de usuários (somente ADM)
apiRouter.use('/usuarios', usuarioRoutes)

// Loja por evento (produtos e pedidos)
apiRouter.use('/loja', lojaRoutes)
