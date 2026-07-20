import { seedState } from '../data/seed'
import { stateRepository } from '../services/stateRepository'
import type { AppState } from '../types'

export type Action =
  | { type: 'PATCH'; patch: Partial<AppState> }
  | { type: 'RESET' }

/** Redutor central. `PATCH` faz um merge raso — mesmo modelo mental do
 *  `setState(patch)` do protótipo original, o que mantém o porte fiel e as
 *  telas simples. */
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.patch }
    case 'RESET': {
      const base = seedState()
      base.narrow = typeof window !== 'undefined' && window.innerWidth < 900
      base.sbOpen = !base.narrow
      return base
    }
    default:
      return state
  }
}

/** Monta o estado inicial de um retiro: seed + cache local daquele retiro. */
export function init(retiroId: string): AppState {
  const base = seedState()
  const saved = retiroId ? stateRepository.load(retiroId) : null
  const narrow = typeof window !== 'undefined' && window.innerWidth < 900
  const merged: AppState = saved
    ? { ...base, ...saved, modal: null, toast: null, dragId: null, selId: null }
    : base
  merged.narrow = narrow
  merged.sbOpen = !narrow
  return merged
}
