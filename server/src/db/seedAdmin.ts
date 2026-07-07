// Cria/atualiza o usuário administrador a partir das variáveis de ambiente
// ADMIN_USERNAME / ADMIN_PASSWORD. Rode com: npm run db:seed-admin
import { pool } from './client.js'
import { env } from '../env.js'
import { authService } from '../services/authService.js'
import { usuarioRepository } from '../repositories/usuarioRepository.js'

const senhaHash = await authService.hash(env.adminPassword)
await usuarioRepository.upsert({
  username: env.adminUsername,
  senhaHash,
  nome: 'Administrador',
  role: 'admin',
  acessos: ['adm'],
})

console.log(`Admin "${env.adminUsername}" criado/atualizado com sucesso.`)
await pool.end()
