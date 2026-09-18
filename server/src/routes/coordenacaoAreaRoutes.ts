import { Router } from 'express'
import { coordenacaoAreaRepository } from '../repositories/coordenacaoAreaRepository.js'
import { requireAdmin } from './authMiddleware.js'

/** Catálogo global de áreas de coordenação. Leitura liberada a qualquer usuário
 *  autenticado (a tela de Coordenadores precisa do select); criação/edição/
 *  exclusão restritas ao ADM. requireAuth já aplicado antes de montar. */
export const coordenacaoAreaRoutes = Router()

// GET /api/coordenacao-areas -> catálogo completo, na ordem de exibição
coordenacaoAreaRoutes.get('/', async (_req, res, next) => {
  try {
    res.json(await coordenacaoAreaRepository.list())
  } catch (e) {
    next(e)
  }
})

coordenacaoAreaRoutes.use(requireAdmin)

// POST /api/coordenacao-areas -> cadastra uma área
coordenacaoAreaRoutes.post('/', async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim()
    const obrigacoes = String(req.body?.obrigacoes ?? '').trim()
    if (!nome) throw new Error('Informe o nome da área.')
    if (await coordenacaoAreaRepository.getByNome(nome))
      throw new Error('Já existe uma área com esse nome.')
    res.status(201).json(await coordenacaoAreaRepository.create(nome, obrigacoes))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao cadastrar área.' })
  }
})

// PUT /api/coordenacao-areas/:id -> renomeia e/ou altera as obrigações
coordenacaoAreaRoutes.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const nome = String(req.body?.nome || '').trim()
    const obrigacoes = String(req.body?.obrigacoes ?? '').trim()
    if (!nome) throw new Error('Informe o nome da área.')
    const atual = await coordenacaoAreaRepository.getById(id)
    if (!atual) return res.status(404).json({ error: 'Área não encontrada.' })
    const homonima = await coordenacaoAreaRepository.getByNome(nome)
    if (homonima && homonima.id !== id) throw new Error('Já existe uma área com esse nome.')

    await coordenacaoAreaRepository.update(id, nome, obrigacoes)
    // As coordenações guardam a área por nome: sem isso, renomear deixaria os
    // cadastros existentes apontando para um nome fora do catálogo.
    if (atual.nome !== nome)
      await coordenacaoAreaRepository.renomearEmCoordenacoes(atual.nome, nome)
    res.json({ ok: true, renomeou: atual.nome !== nome, nomeAntigo: atual.nome })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao salvar área.' })
  }
})

// DELETE /api/coordenacao-areas/:id -> exclui (bloqueado se estiver em uso)
coordenacaoAreaRoutes.delete('/:id', async (req, res) => {
  try {
    const area = await coordenacaoAreaRepository.getById(Number(req.params.id))
    if (!area) return res.status(404).json({ error: 'Área não encontrada.' })
    if (await coordenacaoAreaRepository.emUso(area.nome))
      return res.status(409).json({
        error: 'Não é possível excluir: há coordenador(es) cadastrado(s) nesta área.',
      })
    await coordenacaoAreaRepository.remove(area.id)
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao excluir área.' })
  }
})
