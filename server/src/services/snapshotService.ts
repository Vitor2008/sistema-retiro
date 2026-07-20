import { snapshotRepository } from '../repositories/snapshotRepository.js'
import type { DomainSnapshot } from '../types.js'

/** Orquestra o carregamento e a gravação do estado de UM retiro.
 *  Usado pela sincronização offline-first do frontend. */
export const snapshotService = {
  load: (retiroId: string) => snapshotRepository.loadAll(retiroId),

  async save(retiroId: string, snap: DomainSnapshot): Promise<void> {
    if (!snap || !snap.retiro) throw new Error('Snapshot inválido: retiro ausente.')
    await snapshotRepository.replaceAll(retiroId, snap)
  },
}
