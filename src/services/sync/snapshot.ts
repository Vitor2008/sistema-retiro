import type { AppState } from '../../types'

/** Subconjunto do estado que representa o domínio (o que é persistido no banco).
 *  Espelha DomainSnapshot do backend. Campos de UI (view, modal, etc.) ficam
 *  de fora da sincronização. */
export interface DomainSnapshot {
  retiro: AppState['retiro']
  retirosPassados: AppState['retirosPassados']
  lideres: AppState['lideres']
  categorias: AppState['categorias']
  predios: AppState['predios']
  conducoes: AppState['conducoes']
  inscritos: AppState['inscritos']
  quartos: AppState['quartos']
  produtos: AppState['produtos']
  vendas: AppState['vendas']
  despesas: AppState['despesas']
  escala: AppState['escala']
}

/** Extrai o snapshot de domínio do estado completo. */
export function toSnapshot(state: AppState): DomainSnapshot {
  return {
    retiro: state.retiro,
    retirosPassados: state.retirosPassados,
    lideres: state.lideres,
    categorias: state.categorias,
    predios: state.predios,
    conducoes: state.conducoes,
    inscritos: state.inscritos,
    quartos: state.quartos,
    produtos: state.produtos,
    vendas: state.vendas,
    despesas: state.despesas,
    escala: state.escala,
  }
}

/** Aplica um snapshot vindo do banco sobre um Partial<AppState>. */
export function snapshotToPatch(snap: DomainSnapshot): Partial<AppState> {
  return { ...snap }
}
