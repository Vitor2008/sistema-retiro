import { retiroRepository } from '../repositories/retiroRepository.js'
import type { Retiro, RetiroPassado } from '../types.js'

export const retiroService = {
  getAtual: () => retiroRepository.getAtual(),

  async saveAtual(dto: Retiro): Promise<Retiro> {
    if (!dto.nome?.trim()) throw new Error('Retiro exige nome.')
    return retiroRepository.saveAtual(dto)
  },

  listPassados: () => retiroRepository.listPassados(),
  replacePassados: (lista: RetiroPassado[]) => retiroRepository.replacePassados(lista),
}
