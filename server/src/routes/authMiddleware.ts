import type { NextFunction, Request, Response } from 'express'
import { authService, type TokenPayload } from '../services/authService.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

/** Exige um Bearer token válido. Rotas montadas depois deste middleware
 *  ficam protegidas. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Não autenticado.' })
  try {
    req.user = authService.verify(token)
    next()
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' })
  }
}

/** Exige que o usuário autenticado tenha acesso ADM. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.acessos?.includes('adm'))
    return res.status(403).json({ error: 'Acesso restrito ao administrador.' })
  next()
}
