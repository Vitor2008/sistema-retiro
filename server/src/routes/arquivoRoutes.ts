import express, { Router } from 'express'
import { arquivoService } from '../services/arquivoService.js'

export const arquivoRoutes = Router()

// Upload: corpo binário cru. O cliente envia o arquivo direto no body, com
// Content-Type do arquivo e o nome em X-File-Name (evita dependência de multipart).
arquivoRoutes.post(
  '/',
  express.raw({ type: () => true, limit: '15mb' }),
  async (req, res, next) => {
    try {
      const nome = decodeURIComponent(String(req.header('x-file-name') || 'arquivo'))
      const mime = req.header('content-type') || 'application/octet-stream'
      const id = req.header('x-file-id') || undefined
      const dados = req.body as Buffer
      const meta = await arquivoService.upload({ id, nome, mime, dados })
      res.status(201).json(meta)
    } catch (e) {
      next(e)
    }
  },
)

// Download/visualização
arquivoRoutes.get('/:id', async (req, res, next) => {
  try {
    const a = await arquivoService.get(req.params.id)
    if (!a) return res.status(404).json({ error: 'Arquivo não encontrado.' })
    res.setHeader('Content-Type', a.mime)
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(a.nome)}"`)
    res.send(a.dados)
  } catch (e) {
    next(e)
  }
})

arquivoRoutes.delete('/:id', async (req, res, next) => {
  try {
    await arquivoService.remove(req.params.id)
    res.status(204).end()
  } catch (e) {
    next(e)
  }
})
