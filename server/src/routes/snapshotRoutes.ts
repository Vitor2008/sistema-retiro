import { Router } from 'express'
import { snapshotService } from '../services/snapshotService.js'
import type { DomainSnapshot } from '../types.js'

/** Rotas de sincronização de estado completo (offline-first do frontend). */
export const snapshotRoutes = Router()

// GET /api/snapshot -> estado completo (ou 204 se banco vazio)
snapshotRoutes.get('/', async (_req, res, next) => {
  try {
    const snap = await snapshotService.load()
    if (!snap) return res.status(204).end()
    res.json(snap)
  } catch (e) {
    next(e)
  }
})

// PUT /api/snapshot -> substitui o estado completo (last-write-wins)
snapshotRoutes.put('/', async (req, res, next) => {
  try {
    await snapshotService.save(req.body as DomainSnapshot)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
