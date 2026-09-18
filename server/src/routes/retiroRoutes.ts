import { Router } from 'express'
import { retiroService } from '../services/retiroService.js'
import { requireAdmin } from './authMiddleware.js'

/** Retiros (requireAuth já aplicado antes). Lista filtrada por perfil;
 *  criação/edição/remoção restritas ao ADM. */
export const retiroRoutes = Router()

// GET /api/retiros -> retiros visíveis ao usuário (adm=todos; demais=do prédio)
retiroRoutes.get('/', async (req, res, next) => {
  try {
    res.json(await retiroService.listForUser(req.user!))
  } catch (e) {
    next(e)
  }
})

retiroRoutes.get('/:id', async (req, res, next) => {
  try {
    // Mesma regra da listagem: não basta saber o id para abrir o evento.
    if (!(await retiroService.podeAcessar(req.user!, req.params.id)))
      return res.status(403).json({ error: 'Você não tem acesso a este evento.' })
    const r = await retiroService.get(req.params.id)
    if (!r) return res.status(404).json({ error: 'Retiro não encontrado.' })
    res.json(r)
  } catch (e) {
    next(e)
  }
})

// GET /api/retiros/:id/acesso -> ids com acesso liberado ([] = regra por prédio)
retiroRoutes.get('/:id/acesso', requireAdmin, async (req, res, next) => {
  try {
    res.json({ usuariosPermitidos: await retiroService.getAcesso(req.params.id) })
  } catch (e) {
    next(e)
  }
})

// PUT /api/retiros/:id/acesso -> define a lista (vazia volta à regra por prédio).
// Fora do snapshot de propósito: o snapshot é gravado pelo cliente de qualquer
// usuário, e isso aqui é controle de acesso — só o ADM muda.
retiroRoutes.put('/:id/acesso', requireAdmin, async (req, res) => {
  try {
    const ids = await retiroService.setAcesso(req.params.id, req.body?.usuariosPermitidos)
    res.json({ usuariosPermitidos: ids })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao salvar o acesso.' })
  }
})

retiroRoutes.post('/', requireAdmin, async (req, res) => {
  try {
    res.status(201).json(await retiroService.create(req.body))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao criar retiro.' })
  }
})

retiroRoutes.put('/:id', requireAdmin, async (req, res) => {
  try {
    res.json(await retiroService.update(req.params.id, req.body))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao atualizar retiro.' })
  }
})

retiroRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await retiroService.remove(req.params.id)
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao excluir retiro.' })
  }
})
