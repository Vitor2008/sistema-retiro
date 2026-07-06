import { vendaRepository } from '../repositories/vendaRepository.js'
import type { Venda } from '../types.js'

export const vendaService = {
  list: () => vendaRepository.list(),
  get: (id: string) => vendaRepository.get(id),

  async create(dto: Venda): Promise<Venda> {
    if (!dto.id) throw new Error('Venda exige id.')
    if (!dto.itens.length) throw new Error('Venda sem itens.')
    if (dto.tipo === 'anotada' && !dto.cliente.trim())
      throw new Error('Venda anotada exige cliente.')
    return vendaRepository.create(dto)
  },

  async update(id: string, dto: Venda): Promise<Venda> {
    const existente = await vendaRepository.get(id)
    if (!existente) throw new Error(`Venda ${id} não encontrada.`)
    return vendaRepository.update(id, { ...dto, id })
  },

  remove: (id: string) => vendaRepository.remove(id),
}
