import { isAcessoValido } from '../acessos.js'
import {
  usuarioRepository,
  type UsuarioPublico,
} from '../repositories/usuarioRepository.js'
import { authService } from './authService.js'

function validarAcessos(acessos: unknown): string[] {
  if (!Array.isArray(acessos) || acessos.length === 0)
    throw new Error('Selecione pelo menos um acesso.')
  const limpos = Array.from(new Set(acessos.map(String)))
  for (const a of limpos) {
    if (!isAcessoValido(a)) throw new Error(`Acesso inválido: ${a}`)
  }
  return limpos
}

export const usuarioService = {
  list: (): Promise<UsuarioPublico[]> => usuarioRepository.list(),

  async create(input: {
    username: string
    password: string
    nome: string
    acessos: string[]
    predioId?: number | null
  }): Promise<UsuarioPublico> {
    const username = input.username?.trim().toLowerCase()
    if (!username) throw new Error('Informe o usuário.')
    if (!input.password || input.password.length < 6)
      throw new Error('A senha deve ter ao menos 6 caracteres.')
    const acessos = validarAcessos(input.acessos)
    if (await usuarioRepository.findByUsername(username))
      throw new Error('Já existe um usuário com esse nome.')
    const senhaHash = await authService.hash(input.password)
    return usuarioRepository.create({
      username,
      senhaHash,
      nome: input.nome?.trim() || username,
      acessos,
      predioId: input.predioId ?? null,
    })
  },

  async update(
    id: number,
    input: { nome?: string; password?: string; acessos?: string[]; predioId?: number | null },
  ): Promise<UsuarioPublico> {
    const atual = await usuarioRepository.findById(id)
    if (!atual) throw new Error('Usuário não encontrado.')

    const patch: { nome?: string; acessos?: string[]; senhaHash?: string; predioId?: number | null } = {}
    if (input.nome !== undefined) patch.nome = input.nome.trim()
    if (input.predioId !== undefined) patch.predioId = input.predioId
    if (input.acessos !== undefined) {
      const acessos = validarAcessos(input.acessos)
      // Não permitir remover o último admin do sistema.
      if ((atual.acessos ?? []).includes('adm') && !acessos.includes('adm')) {
        if ((await usuarioRepository.countAdmins()) <= 1)
          throw new Error('Não é possível remover o acesso ADM do último administrador.')
      }
      patch.acessos = acessos
    }
    if (input.password) {
      if (input.password.length < 6)
        throw new Error('A senha deve ter ao menos 6 caracteres.')
      patch.senhaHash = await authService.hash(input.password)
    }
    const atualizado = await usuarioRepository.update(id, patch)
    if (!atualizado) throw new Error('Usuário não encontrado.')
    return atualizado
  },

  async remove(id: number, solicitanteId: number): Promise<void> {
    const alvo = await usuarioRepository.findById(id)
    if (!alvo) throw new Error('Usuário não encontrado.')
    if (id === solicitanteId) throw new Error('Você não pode excluir o próprio usuário.')
    if ((alvo.acessos ?? []).includes('adm') && (await usuarioRepository.countAdmins()) <= 1)
      throw new Error('Não é possível excluir o último administrador.')
    await usuarioRepository.remove(id)
  },
}
