import { produtoRepository } from '../repositories/produtoRepository.js'
import type { Produto } from '../types.js'

export const produtoService = {
  list: () => produtoRepository.list(),
  get: (id: string) => produtoRepository.get(id),

  async create(dto: Produto): Promise<Produto> {
    if (!dto.id || !dto.nome?.trim()) throw new Error('Produto exige id e nome.')
    if (dto.valor < 0 || dto.estoque < 0) throw new Error('Valor/estoque inválidos.')
    return produtoRepository.create(dto)
  },

  async update(id: string, dto: Produto): Promise<Produto> {
    const existente = await produtoRepository.get(id)
    if (!existente) throw new Error(`Produto ${id} não encontrado.`)
    return produtoRepository.update(id, { ...dto, id })
  },

  remove: (id: string) => produtoRepository.remove(id),
}
