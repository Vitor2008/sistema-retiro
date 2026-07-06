import { snapshotRepository } from '../repositories/snapshotRepository.js'
import type { DomainSnapshot } from '../types.js'

/** Orquestra o carregamento e a gravação do estado completo do domínio.
 *  Usado pela sincronização offline-first do frontend. */
export const snapshotService = {
  load: () => snapshotRepository.loadAll(),

  async save(snap: DomainSnapshot): Promise<void> {
    if (!snap || !snap.retiro) throw new Error('Snapshot inválido: retiro ausente.')
    await snapshotRepository.replaceAll(snap)
  },
}
