import { Router } from 'express'
import { cantinaCatalogoRepository } from '../repositories/cantinaCatalogoRepository.js'
import { requireAdmin } from './authMiddleware.js'

/** Catálogo global de produtos da cantina. Leitura para qualquer autenticado;
 *  escrita restrita ao ADM. requireAuth já aplicado antes de montar. */
export const cantinaCatalogoRoutes = Router()

cantinaCatalogoRoutes.get('/', async (_req, res, next) => {
  try {
    res.json(await cantinaCatalogoRepository.list())
  } catch (e) {
    next(e)
  }
})

cantinaCatalogoRoutes.use(requireAdmin)

cantinaCatalogoRoutes.post('/', async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim()
    if (!nome) throw new Error('Informe o nome do produto.')
    const valor = Math.max(0, Number(req.body?.valor) || 0)
    res.status(201).json(await cantinaCatalogoRepository.create(nome, valor))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao cadastrar produto.' })
  }
})

cantinaCatalogoRoutes.put('/:id', async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim()
    if (!nome) throw new Error('Informe o nome do produto.')
    const valor = Math.max(0, Number(req.body?.valor) || 0)
    await cantinaCatalogoRepository.update(Number(req.params.id), nome, valor)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao atualizar produto.' })
  }
})

cantinaCatalogoRoutes.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (await cantinaCatalogoRepository.ativoEmAlgumEvento(id))
      return res.status(409).json({
        error: 'Não é possível excluir: o produto ainda está ativo em algum evento. Desative-o em todos os eventos antes.',
      })
    await cantinaCatalogoRepository.remove(id)
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao excluir produto.' })
  }
})
