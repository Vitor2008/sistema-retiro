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
import { lideresRepository } from '../repositories/listaRepository.js'
import { inscritoService } from '../services/inscritoService.js'
import { retiroService } from '../services/retiroService.js'
import type { Inscrito } from '../types.js'

export const publicRoutes = Router()

/** Conta inscrições que ocupam vaga (todas menos as canceladas). */
async function ocupadas(): Promise<number> {
  const lista = await inscritoRepository.list()
  return lista.filter((i) => i.statusInscricao !== 'cancelada').length
}

/** Carrega o retiro atual só se o slug bater; senão null. */
async function retiroPorSlug(slug: string) {
  const r = await retiroService.getAtual()
  if (!r || !r.slug || r.slug !== slug) return null
  return r
}

// ---- Dados públicos do retiro (por slug) -----------------------------------
publicRoutes.get('/retiro/:slug', async (req, res, next) => {
  try {
    const r = await retiroPorSlug(req.params.slug)
    if (!r) return res.status(404).json({ error: 'Formulário não encontrado.' })
    const vagasRestantes = Math.max(0, r.max - (await ocupadas()))
    const lideres = await lideresRepository.list()
    // Nunca devolvemos dados sensíveis — só o que a landing precisa exibir.
    res.json({
      nome: r.nome,
      inicio: r.inicio,
      fim: r.fim,
      valor: r.valor,
      max: r.max,
      slug: r.slug,
      bannerId: r.bannerId,
      lideres,
      // "aberto" efetivo: flag do admin E ainda há vaga.
      aberto: r.aberto && vagasRestantes > 0,
      vagasRestantes,
    })
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

    const vagasRestantes = Math.max(0, r.max - (await ocupadas()))
    if (!r.aberto || vagasRestantes <= 0)
      return res.status(409).json({ error: 'Inscrições encerradas.' })

    const b = req.body ?? {}
    const nome = String(b.nome || '').trim()
    const tel = String(b.tel || '').trim()
    const genero = b.genero === 'M' || b.genero === 'F' ? b.genero : null
    const tipo = b.tipo === 'Servo' ? 'Servo' : 'Encontrista'
    const diaServir = tipo === 'Servo' ? String(b.diaServir || '') : ''
    const lider = String(b.lider || '').trim()
    const forma = String(b.forma || '').trim()
    const comprovanteId = b.comprovanteId ? String(b.comprovanteId) : null

    // Validações espelham as do formulário (nome com 2+ palavras, etc.).
    if (nome.split(/\s+/).length < 2) return res.status(400).json({ error: 'Informe o nome completo.' })
    if (!tel) return res.status(400).json({ error: 'Informe o telefone.' })
    if (!genero) return res.status(400).json({ error: 'Selecione o sexo.' })
    if (!lider) return res.status(400).json({ error: 'Selecione o líder.' })
    if (!forma) return res.status(400).json({ error: 'Selecione a forma de pagamento.' })
    if (tipo === 'Servo' && !diaServir) return res.status(400).json({ error: 'Selecione o dia de serviço.' })

    const parcelas =
      forma === 'Crédito parcelado' && Number(b.parcelas) > 0 ? Number(b.parcelas) : null

    const inscrito: Inscrito = {
      id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
      nome,
      genero,
      tipo,
      diaServir,
      lider,
      forma,
      parcelas,
      tel,
      statusInscricao: 'pendente',
      cancelInfo: '',
      comprovante: !!comprovanteId,
      comprovanteId,
      quarto: null,
      pagamentos: [],
    }
    await inscritoService.create(inscrito)
    res.status(201).json({ ok: true, nome: inscrito.nome })
  } catch (e) {
    next(e)
  }
})
