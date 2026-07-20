import { Router } from 'express'
import { snapshotService } from '../services/snapshotService.js'
import type { DomainSnapshot } from '../types.js'

/** Sincronização de estado por retiro (offline-first do frontend). */
export const snapshotRoutes = Router()

// GET /api/snapshot/:retiroId -> estado do retiro (ou 204 se não existir)
snapshotRoutes.get('/:retiroId', async (req, res, next) => {
  try {
    const snap = await snapshotService.load(req.params.retiroId)
    if (!snap) return res.status(204).end()
    res.json(snap)
  } catch (e) {
    next(e)
  }
})

// PUT /api/snapshot/:retiroId -> substitui o estado do retiro (last-write-wins)
snapshotRoutes.put('/:retiroId', async (req, res, next) => {
  try {
    await snapshotService.save(req.params.retiroId, req.body as DomainSnapshot)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
