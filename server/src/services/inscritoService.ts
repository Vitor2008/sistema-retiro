import { inscritoRepository } from '../repositories/inscritoRepository.js'
import type { Inscrito } from '../types.js'

/** Regras de negócio de inscritos. Hoje delega ao repositório; validações
 *  específicas (limite de vagas, duplicidade, etc.) entram aqui. */
export const inscritoService = {
  list: (retiroId?: string) => inscritoRepository.list(retiroId),
  get: (id: string) => inscritoRepository.get(id),

  async create(dto: Inscrito, retiroId: string): Promise<Inscrito> {
    if (!dto.id || !dto.nome?.trim()) throw new Error('Inscrito exige id e nome.')
    const existente = await inscritoRepository.get(dto.id)
    if (existente) throw new Error(`Inscrito ${dto.id} já existe.`)
    return inscritoRepository.create(dto, retiroId)
  },

  async update(id: string, dto: Inscrito): Promise<Inscrito> {
    const existente = await inscritoRepository.get(id)
    if (!existente) throw new Error(`Inscrito ${id} não encontrado.`)
    return inscritoRepository.update(id, { ...dto, id })
  },

  remove: (id: string) => inscritoRepository.remove(id),
}
