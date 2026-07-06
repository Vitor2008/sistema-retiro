import { despesaRepository } from '../repositories/despesaRepository.js'
import type { Despesa } from '../types.js'

export const despesaService = {
  list: () => despesaRepository.list(),
  get: (id: string) => despesaRepository.get(id),

  async create(dto: Despesa): Promise<Despesa> {
    if (!dto.id) throw new Error('Despesa exige id.')
    if (!dto.descricao?.trim() || !(dto.valor > 0))
      throw new Error('Despesa exige descrição e valor.')
    return despesaRepository.create(dto)
  },

  async update(id: string, dto: Despesa): Promise<Despesa> {
    const existente = await despesaRepository.get(id)
    if (!existente) throw new Error(`Despesa ${id} não encontrada.`)
    return despesaRepository.update(id, { ...dto, id })
  },

  remove: (id: string) => despesaRepository.remove(id),
}
