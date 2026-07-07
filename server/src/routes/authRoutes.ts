import { Router } from 'express'
import { authService } from '../services/authService.js'

export const authRoutes = Router()

// POST /api/auth/login -> { token, user }
authRoutes.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {}
    const result = await authService.login(username, password)
    res.json(result)
  } catch (e) {
    // Credenciais inválidas -> 401
    res.status(401).json({ error: e instanceof Error ? e.message : 'Falha no login.' })
  }
})
