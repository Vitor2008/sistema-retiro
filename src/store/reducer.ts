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
    case 'RESET':
      return init()
    default:
      return state
  }
}

/** Monta o estado inicial: seed + o que estiver salvo no repositório. */
export function init(): AppState {
  const base = seedState()
  const saved = stateRepository.load()
  const narrow =
    typeof window !== 'undefined' && window.innerWidth < 900
  const merged: AppState = saved
    ? { ...base, ...saved, modal: null, toast: null, dragId: null, selId: null }
    : base
  merged.narrow = narrow
  merged.sbOpen = !narrow
  return merged
}
