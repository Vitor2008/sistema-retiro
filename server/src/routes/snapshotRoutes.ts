import { Router, type Request, type Response } from 'express'
import { retiroService } from '../services/retiroService.js'
import { snapshotService } from '../services/snapshotService.js'
import type { DomainSnapshot } from '../types.js'

/** Sincronização de estado por retiro (offline-first do frontend). */
export const snapshotRoutes = Router()

/** O estado completo do evento só sai (e só entra) para quem enxerga o evento.
 *  Sem isso, a restrição por usuário valeria só para a lista de eventos, e
 *  bastaria o id na URL para ler ou sobrescrever os dados. */
async function semAcesso(req: Request, res: Response): Promise<boolean> {
  if (await retiroService.podeAcessar(req.user!, req.params.retiroId)) return false
  res.status(403).json({ error: 'Você não tem acesso a este evento.' })
  return true
}

// GET /api/snapshot/:retiroId -> estado do retiro (ou 204 se não existir)
snapshotRoutes.get('/:retiroId', async (req, res, next) => {
  try {
    if (await semAcesso(req, res)) return
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
    if (await semAcesso(req, res)) return
    await snapshotService.save(req.params.retiroId, req.body as DomainSnapshot)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
