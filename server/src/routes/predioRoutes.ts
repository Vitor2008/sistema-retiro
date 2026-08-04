import { Router } from 'express'
import { predioRepository } from '../repositories/listaRepository.js'
import { requireAdmin } from './authMiddleware.js'

/** Catálogo global de prédios. Leitura liberada a qualquer usuário autenticado
 *  (para os selects); criação/edição/exclusão restritas ao ADM. requireAuth já
 *  aplicado antes de montar. */
export const predioRoutes = Router()

// GET /api/predios -> catálogo completo
predioRoutes.get('/', async (_req, res, next) => {
  try {
    res.json(await predioRepository.listCatalogo())
  } catch (e) {
    next(e)
  }
})

predioRoutes.use(requireAdmin)

// POST /api/predios -> cadastra um prédio no catálogo
predioRoutes.post('/', async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim()
    if (!nome) throw new Error('Informe o nome do prédio.')
    if (await predioRepository.getByNome(nome)) throw new Error('Já existe um prédio com esse nome.')
    res.status(201).json(await predioRepository.create(nome))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao cadastrar prédio.' })
  }
})

// PUT /api/predios/:id -> renomeia
predioRoutes.put('/:id', async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim()
    if (!nome) throw new Error('Informe o nome do prédio.')
    const existente = await predioRepository.getByNome(nome)
    if (existente && existente.id !== Number(req.params.id))
      throw new Error('Já existe um prédio com esse nome.')
    await predioRepository.rename(Number(req.params.id), nome)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao renomear prédio.' })
  }
})

// DELETE /api/predios/:id -> exclui (bloqueado se estiver em uso)
predioRoutes.delete('/:id', async (req, res) => {
  try {
    const predio = await predioRepository.getById(Number(req.params.id))
    if (!predio) return res.status(404).json({ error: 'Prédio não encontrado.' })
    if (await predioRepository.emUso(predio.nome))
      return res.status(409).json({
        error: 'Não é possível excluir: há evento(s) ou inscritos usando este prédio.',
      })
    await predioRepository.remove(predio.id)
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao excluir prédio.' })
  }
})
