import { Router } from 'express'
import { usuarioService } from '../services/usuarioService.js'
import { requireAdmin } from './authMiddleware.js'

/** Gestão de usuários — restrita ao ADM (requireAuth já aplicado antes). */
export const usuarioRoutes = Router()
usuarioRoutes.use(requireAdmin)

usuarioRoutes.get('/', async (_req, res, next) => {
  try {
    res.json(await usuarioService.list())
  } catch (e) {
    next(e)
  }
})

usuarioRoutes.post('/', async (req, res) => {
  try {
    res.status(201).json(await usuarioService.create(req.body))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao criar usuário.' })
  }
})

usuarioRoutes.put('/:id', async (req, res) => {
  try {
    res.json(await usuarioService.update(Number(req.params.id), req.body))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao atualizar usuário.' })
  }
})

usuarioRoutes.delete('/:id', async (req, res) => {
  try {
    await usuarioService.remove(Number(req.params.id), req.user!.sub)
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao excluir usuário.' })
  }
})
