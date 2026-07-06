import { quartoRepository } from '../repositories/quartoRepository.js'
import type { Quarto } from '../types.js'

export const quartoService = {
  list: () => quartoRepository.list(),
  get: (id: string) => quartoRepository.get(id),

  async create(dto: Quarto): Promise<Quarto> {
    if (!dto.id || !dto.nome?.trim()) throw new Error('Quarto exige id e nome.')
    if (dto.lideres.length > 2) throw new Error('Máximo de 2 líderes por quarto.')
    return quartoRepository.create(dto)
  },

  async update(id: string, dto: Quarto): Promise<Quarto> {
    if (dto.lideres.length > 2) throw new Error('Máximo de 2 líderes por quarto.')
    const existente = await quartoRepository.get(id)
    if (!existente) throw new Error(`Quarto ${id} não encontrado.`)
    return quartoRepository.update(id, { ...dto, id })
  },

  remove: (id: string) => quartoRepository.remove(id),
}
