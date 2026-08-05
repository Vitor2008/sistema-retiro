import { Router } from 'express'
import { lojaRepository } from '../repositories/lojaRepository.js'
import type { LojaProduto } from '../types.js'
import { requireAdmin } from './authMiddleware.js'

/** Loja (admin). Leitura liberada a qualquer usuário autenticado; escrita
 *  restrita ao ADM. requireAuth já aplicado antes de montar. */
export const lojaRoutes = Router()

function uid(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function normCategoria(c: unknown): LojaProduto['categoria'] {
  return c === 'vestimenta' ? 'vestimenta' : 'outros'
}

function normFotos(f: unknown): string[] {
  return Array.isArray(f) ? f.map(String).slice(0, 4) : []
}

// ---- Produtos --------------------------------------------------------------
lojaRoutes.get('/produtos/:retiroId', async (req, res, next) => {
  try {
    res.json(await lojaRepository.listProdutos(req.params.retiroId))
  } catch (e) {
    next(e)
  }
})

lojaRoutes.get('/pedidos/:retiroId', async (req, res, next) => {
  try {
    res.json(await lojaRepository.listPedidos(req.params.retiroId))
  } catch (e) {
    next(e)
  }
})

lojaRoutes.use(requireAdmin)

lojaRoutes.post('/produtos', async (req, res) => {
  try {
    const b = req.body ?? {}
    const nome = String(b.nome || '').trim()
    const retiroId = String(b.retiroId || '').trim()
    if (!nome) throw new Error('Informe o nome do produto.')
    if (!retiroId) throw new Error('Evento não informado.')
    const produto: LojaProduto = {
      id: uid('lp'),
      retiroId,
      categoria: normCategoria(b.categoria),
      nome,
      descricao: String(b.descricao || '').trim(),
      valor: Math.max(0, Number(b.valor) || 0),
      fotos: normFotos(b.fotos),
      ativo: b.ativo !== false,
      criadoEm: new Date().toISOString(),
    }
    res.status(201).json(await lojaRepository.createProduto(produto))
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao cadastrar produto.' })
  }
})

lojaRoutes.put('/produtos/:id', async (req, res) => {
  try {
    const b = req.body ?? {}
    const patch: Partial<LojaProduto> = {}
    if (b.categoria !== undefined) patch.categoria = normCategoria(b.categoria)
    if (b.nome !== undefined) patch.nome = String(b.nome).trim()
    if (b.descricao !== undefined) patch.descricao = String(b.descricao).trim()
    if (b.valor !== undefined) patch.valor = Math.max(0, Number(b.valor) || 0)
    if (b.fotos !== undefined) patch.fotos = normFotos(b.fotos)
    if (b.ativo !== undefined) patch.ativo = !!b.ativo
    await lojaRepository.updateProduto(req.params.id, patch)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao atualizar produto.' })
  }
})

lojaRoutes.delete('/produtos/:id', async (req, res) => {
  try {
    await lojaRepository.removeProduto(req.params.id)
    res.status(204).end()
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao excluir produto.' })
  }
})

// ---- Pedidos ---------------------------------------------------------------
lojaRoutes.put('/pedidos/:id/status', async (req, res) => {
  try {
    const status = String(req.body?.status || '').trim()
    if (!['pendente', 'pago', 'entregue', 'cancelado'].includes(status))
      throw new Error('Status inválido.')
    await lojaRepository.updatePedidoStatus(req.params.id, status)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao atualizar pedido.' })
  }
})

// Anexar/atualizar o comprovante de um pedido (quando o comprador esqueceu).
lojaRoutes.put('/pedidos/:id/comprovante', async (req, res) => {
  try {
    const comprovanteId = String(req.body?.comprovanteId || '').trim()
    if (!comprovanteId) throw new Error('Comprovante não informado.')
    await lojaRepository.updatePedidoComprovante(req.params.id, comprovanteId)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro ao anexar comprovante.' })
  }
})
