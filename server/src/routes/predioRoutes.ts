import { Router } from 'express'
import { predioRepository } from '../repositories/listaRepository.js'
import { requireAdmin } from './authMiddleware.js'

/** Prédios persistentes (edifícios/igrejas). Gestão restrita ao ADM.
 *  requireAuth já aplicado antes de montar. */
export const predioRoutes = Router()

// GET /api/predios -> todos os prédios (com o retiro em que participam)
predioRoutes.get('/', async (_req, res, next) => {
  try {
    res.json(await predioRepository.listAll())
  } catch (e) {
    next(e)
  }
})

predioRoutes.use(requireAdmin)

// POST /api/predios -> cria um prédio (opcionalmente já vinculado a um retiro)
predioRoutes.post('/', async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim()
    if (!nome) throw new Error('Informe o nome do prédio.')
    const retiroId = req.body?.retiroId ? String(req.body.retiroId) : null
    res.status(201).json(await predioRepository.create(nome, retiroId))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao criar prédio.' })
  }
})

// PUT /api/predios/:id -> define/atualiza o retiro em que o prédio participa
predioRoutes.put('/:id', async (req, res) => {
  try {
    const retiroId = req.body?.retiroId ? String(req.body.retiroId) : null
    await predioRepository.setRetiro(Number(req.params.id), retiroId)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao atualizar prédio.' })
  }
})

predioRoutes.delete('/:id', async (req, res) => {
  try {
    await predioRepository.remove(Number(req.params.id))
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao excluir prédio.' })
  }
})
