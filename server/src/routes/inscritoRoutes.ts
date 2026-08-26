import { Router } from 'express'
import { inscritoRepository } from '../repositories/inscritoRepository.js'
import { requireAdmin } from './authMiddleware.js'

/** Ações administrativas sobre inscritos (requireAuth já aplicado antes).
 *  Exclusão restrita ao ADM e apenas para inscrições canceladas. */
export const inscritoRoutes = Router()

inscritoRoutes.use(requireAdmin)

inscritoRoutes.delete('/:id', async (req, res) => {
  try {
    const insc = await inscritoRepository.get(req.params.id)
    if (!insc) return res.status(404).json({ error: 'Inscrição não encontrada.' })
    if (insc.statusInscricao !== 'cancelada')
      return res.status(409).json({ error: 'Só é possível excluir inscrições canceladas.' })
    await inscritoRepository.remove(req.params.id)
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao excluir inscrição.' })
  }
})
