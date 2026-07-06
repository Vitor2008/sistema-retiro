// ============================================================================
// Repositório do estado da aplicação.
//
// Esta é a fronteira de persistência: hoje grava no localStorage, mas a
// interface `StateRepository` isola as telas dessa decisão. Para plugar uma
// API REST no futuro, basta criar um `ApiStateRepository implements
// StateRepository` e trocar a instância exportada em `stateRepository` —
// nenhuma view/hook precisa mudar.
// ============================================================================

import type { AppState } from '../types'

/** Campos transitórios que nunca são persistidos. */
type Persistable = Omit<AppState, 'modal' | 'toast' | 'dragId' | 'narrow' | 'sbOpen'>

export interface StateRepository {
  load(): Partial<AppState> | null
  save(state: AppState): void
  clear(): void
}

const KEY = 'retiros-app-v3'

class LocalStorageStateRepository implements StateRepository {
  load(): Partial<AppState> | null {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<AppState>
      // Só consideramos válido se tiver a coleção principal.
      return parsed && parsed.inscritos ? parsed : null
    } catch {
      return null
    }
  }

  save(state: AppState): void {
    const { modal, toast, dragId, narrow, sbOpen, ...persistable } =
      state as AppState
    void modal
    void toast
    void dragId
    void narrow
    void sbOpen
    const payload: Persistable = persistable
    try {
      localStorage.setItem(KEY, JSON.stringify(payload))
    } catch {
      // storage cheio ou indisponível — ignora silenciosamente.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* noop */
    }
  }
}

/** Instância única usada pelo app. Troque aqui para mudar o backend. */
export const stateRepository: StateRepository = new LocalStorageStateRepository()
