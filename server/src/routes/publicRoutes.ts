// ============================================================================
// Rotas PÚBLICAS (sem autenticação) para o formulário de inscrição.
//
// Montadas ANTES do requireAuth. Expõem apenas o mínimo necessário para uma
// pessoa anônima: ver os dados públicos do retiro, ver o banner, enviar uma
// inscrição e (opcionalmente) anexar o comprovante. Tudo é validado contra o
// slug do retiro atual e só funciona com o link de inscrição aberto.
// ============================================================================

import express, { Router } from 'express'
import { arquivoService } from '../services/arquivoService.js'
import { inscritoRepository } from '../repositories/inscritoRepository.js'
import { conducaoRepository, lideresRepository } from '../repositories/listaRepository.js'
import { lojaRepository } from '../repositories/lojaRepository.js'
import { retiroRepository } from '../repositories/retiroRepository.js'
import { inscritoService } from '../services/inscritoService.js'
import type { Inscrito, LojaPedido } from '../types.js'

export const publicRoutes = Router()

function uid(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** Conta inscrições que ocupam vaga (todas menos as canceladas) no retiro. */
async function ocupadas(retiroId: string): Promise<number> {
  const lista = await inscritoRepository.list(retiroId)
  return lista.filter((i) => i.statusInscricao !== 'cancelada').length
}

/** Carrega o retiro pelo slug (multi-retiro). */
async function retiroPorSlug(slug: string) {
  return retiroRepository.getBySlug(slug)
}

// ---- Dados públicos do retiro (por slug) -----------------------------------
publicRoutes.get('/retiro/:slug', async (req, res, next) => {
  try {
    const r = await retiroPorSlug(req.params.slug)
    if (!r) return res.status(404).json({ error: 'Formulário não encontrado.' })
    const vagasRestantes = Math.max(0, r.max - (await ocupadas(r.id)))
    const [lideres, predios, conducoes] = await Promise.all([
      lideresRepository.list(r.id),
      retiroRepository.getPredios(r.id),
      conducaoRepository.list(r.id),
    ])
    // Nunca devolvemos dados sensíveis — só o que a landing precisa exibir.
    res.json({
      nome: r.nome,
      inicio: r.inicio,
      fim: r.fim,
      valor: r.valor,
      max: r.max,
      local: r.local,
      saida: r.saida,
      tipo: r.tipo,
      descricao: r.descricao,
      linkPagamento: r.linkPagamento,
      mostrarLider: r.mostrarLider,
      mostrarPredio: r.mostrarPredio,
      mostrarConducao: r.mostrarConducao,
      slug: r.slug,
      bannerId: r.bannerId,
      lideres,
      predios,
      conducoes,
      // "aberto" efetivo: flag do admin E ainda há vaga.
      aberto: r.aberto && vagasRestantes > 0,
      vagasRestantes,
    })
  } catch (e) {
    next(e)
  }
})

// ---- Loja: detalhes públicos de um produto (por id) ------------------------
publicRoutes.get('/loja/:id', async (req, res, next) => {
  try {
    const p = await lojaRepository.getProduto(req.params.id)
    if (!p || !p.ativo) return res.status(404).json({ error: 'Produto não encontrado.' })
    const evento = p.retiroId ? await retiroRepository.get(p.retiroId) : null
    res.json({
      id: p.id,
      categoria: p.categoria,
      nome: p.nome,
      descricao: p.descricao,
      valor: p.valor,
      fotos: p.fotos,
      linkPagamento: evento?.linkPagamento ?? '',
      eventoNome: evento?.nome ?? '',
      bannerId: evento?.bannerId ?? null,
    })
  } catch (e) {
    next(e)
  }
})

// ---- Loja: upload de comprovante do pedido ---------------------------------
publicRoutes.post(
  '/loja/:id/arquivo',
  express.raw({ type: () => true, limit: '15mb' }),
  async (req, res, next) => {
    try {
      const p = await lojaRepository.getProduto(req.params.id)
      if (!p || !p.ativo) return res.status(404).json({ error: 'Produto não encontrado.' })
      const nome = decodeURIComponent(String(req.header('x-file-name') || 'comprovante'))
      const mime = req.header('content-type') || 'application/octet-stream'
      const dados = req.body as Buffer
      const meta = await arquivoService.upload({ nome, mime, dados })
      res.status(201).json(meta)
    } catch (e) {
      next(e)
    }
  },
)

// ---- Loja: envio do pedido -------------------------------------------------
publicRoutes.post('/loja/:id/pedido', async (req, res, next) => {
  try {
    const p = await lojaRepository.getProduto(req.params.id)
    if (!p || !p.ativo) return res.status(404).json({ error: 'Produto não encontrado.' })

    const b = req.body ?? {}
    const quantidade = Math.max(1, Math.floor(Number(b.quantidade) || 0))
    const forma = String(b.forma || '').trim()
    const comprovanteId = b.comprovanteId ? String(b.comprovanteId) : null
    const vestimenta = p.categoria === 'vestimenta'
    const nome = String(b.nome || '').trim()
    const genero = b.genero === 'M' || b.genero === 'F' ? b.genero : ''
    const tamanho = String(b.tamanho || '').trim()

    if (!(quantidade >= 1)) return res.status(400).json({ error: 'Informe a quantidade.' })
    if (!forma) return res.status(400).json({ error: 'Selecione a forma de pagamento.' })
    if (vestimenta) {
      if (nome.split(/\s+/).length < 2) return res.status(400).json({ error: 'Informe o nome completo.' })
      if (!genero) return res.status(400).json({ error: 'Selecione o gênero.' })
      if (!tamanho) return res.status(400).json({ error: 'Selecione o tamanho.' })
    }

    const pedido: LojaPedido = {
      id: uid('lo'),
      retiroId: p.retiroId,
      produtoId: p.id,
      produtoNome: p.nome,
      categoria: p.categoria,
      nome: vestimenta ? nome : '',
      genero: vestimenta ? genero : '',
      tamanho: vestimenta ? tamanho : '',
      quantidade,
      valorUnit: p.valor,
      valorTotal: p.valor * quantidade,
      forma,
      comprovante: !!comprovanteId,
      comprovanteId,
      status: 'pendente',
      criadoEm: new Date().toISOString(),
    }
    await lojaRepository.createPedido(pedido)
    res.status(201).json({ ok: true, produto: p.nome, total: pedido.valorTotal })
  } catch (e) {
    next(e)
  }
})

// ---- Banner do formulário (imagem pública) ---------------------------------
publicRoutes.get('/banner/:id', async (req, res, next) => {
  try {
    const a = await arquivoService.get(req.params.id)
    if (!a) return res.status(404).json({ error: 'Imagem não encontrada.' })
    res.setHeader('Content-Type', a.mime)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(a.dados)
  } catch (e) {
    next(e)
  }
})

// ---- Upload de comprovante pelo inscrito (só com o link aberto) ------------
publicRoutes.post(
  '/arquivo/:slug',
  express.raw({ type: () => true, limit: '15mb' }),
  async (req, res, next) => {
    try {
      const r = await retiroPorSlug(req.params.slug)
      if (!r || !r.aberto)
        return res.status(403).json({ error: 'Inscrições encerradas.' })
      const nome = decodeURIComponent(String(req.header('x-file-name') || 'comprovante'))
      const mime = req.header('content-type') || 'application/octet-stream'
      const dados = req.body as Buffer
      const meta = await arquivoService.upload({ nome, mime, dados })
      res.status(201).json(meta)
    } catch (e) {
      next(e)
    }
  },
)

// ---- Envio da inscrição -----------------------------------------------------
publicRoutes.post('/inscricao/:slug', async (req, res, next) => {
  try {
    const r = await retiroPorSlug(req.params.slug)
    if (!r) return res.status(404).json({ error: 'Formulário não encontrado.' })

    const vagasRestantes = Math.max(0, r.max - (await ocupadas(r.id)))
    if (!r.aberto || vagasRestantes <= 0)
      return res.status(409).json({ error: 'Inscrições encerradas.' })

    const b = req.body ?? {}
    const nome = String(b.nome || '').trim()
    const tel = String(b.tel || '').trim()
    const genero = b.genero === 'M' || b.genero === 'F' ? b.genero : null
    const tipo = b.tipo === 'Servo' ? 'Servo' : 'Encontrista'
    const idade = Number(b.idade) > 0 ? Math.floor(Number(b.idade)) : null
    const dataNascimento = String(b.dataNascimento || '').trim()
    // "Vez" só se aplica a convidados (Encontrista).
    const vez = tipo === 'Encontrista' ? String(b.vez || '').trim() : ''
    const lider = String(b.lider || '').trim()
    const predio = String(b.predio || '').trim()
    const conducao = String(b.conducao || '').trim()
    const forma = String(b.forma || '').trim()
    const comprovanteId = b.comprovanteId ? String(b.comprovanteId) : null

    // Validações espelham as do formulário (nome com 2+ palavras, etc.).
    if (nome.split(/\s+/).length < 2) return res.status(400).json({ error: 'Informe o nome completo.' })
    if (!idade) return res.status(400).json({ error: 'Informe a idade.' })
    if (!genero) return res.status(400).json({ error: 'Selecione o gênero.' })
    if (!tel) return res.status(400).json({ error: 'Informe o telefone.' })
    if (!dataNascimento) return res.status(400).json({ error: 'Informe a data de nascimento.' })
    if (r.tipo !== 'avulso' && tipo === 'Encontrista' && !vez) return res.status(400).json({ error: 'Selecione se é a 1ª, 2ª ou mais vezes.' })
    // Campos condicionais: só são obrigatórios se o evento os exibe.
    if (r.mostrarLider && !lider) return res.status(400).json({ error: 'Informe quem convidou.' })
    if (r.mostrarPredio && !predio) return res.status(400).json({ error: 'Selecione o prédio.' })
    if (r.mostrarConducao && !conducao) return res.status(400).json({ error: 'Selecione a condução.' })
    if (!forma) return res.status(400).json({ error: 'Selecione a forma de pagamento.' })

    const inscrito: Inscrito = {
      id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
      nome,
      genero,
      tipo,
      idade,
      dataNascimento,
      valor: r.valor,
      vez,
      lider,
      predio,
      conducao,
      forma,
      tel,
      statusInscricao: 'pendente',
      cancelInfo: '',
      comprovante: !!comprovanteId,
      comprovanteId,
      quarto: null,
      criadoEm: new Date().toISOString(),
      pagamentos: [],
    }
    await inscritoService.create(inscrito, r.id)
    res.status(201).json({ ok: true, nome: inscrito.nome })
  } catch (e) {
    next(e)
  }
})
