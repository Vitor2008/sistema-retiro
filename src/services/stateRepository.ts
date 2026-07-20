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
  load(retiroId: string): Partial<AppState> | null
  save(retiroId: string, state: AppState): void
  clear(retiroId: string): void
}

// Cache por retiro (multi-retiro): uma chave de localStorage por retiroId.
const PREFIX = 'retiros-app-v5:'
const keyFor = (retiroId: string) => PREFIX + retiroId

class LocalStorageStateRepository implements StateRepository {
  load(retiroId: string): Partial<AppState> | null {
    try {
      const raw = localStorage.getItem(keyFor(retiroId))
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<AppState>
      // Só consideramos válido se tiver a coleção principal.
      return parsed && parsed.inscritos ? parsed : null
    } catch {
      return null
    }
  }

  save(retiroId: string, state: AppState): void {
    const { modal, toast, dragId, narrow, sbOpen, ...persistable } =
      state as AppState
    void modal
    void toast
    void dragId
    void narrow
    void sbOpen
    const payload: Persistable = persistable
    try {
      localStorage.setItem(keyFor(retiroId), JSON.stringify(payload))
    } catch {
      // storage cheio ou indisponível — ignora silenciosamente.
    }
  }

  clear(retiroId: string): void {
    try {
      localStorage.removeItem(keyFor(retiroId))
    } catch {
      /* noop */
    }
  }
}

/** Instância única usada pelo app. Troque aqui para mudar o backend. */
export const stateRepository: StateRepository = new LocalStorageStateRepository()
