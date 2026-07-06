import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { stateRepository } from '../services/stateRepository'
import { snapshotToPatch, toSnapshot } from '../services/sync/snapshot'
import { syncManager, type SyncStatus } from '../services/sync/syncManager'
import type { AppState, Modal } from '../types'
import { init, reducer } from './reducer'

interface RetiroContextValue {
  state: AppState
  /** Merge raso no estado (equivalente ao setState do protótipo). */
  patch: (partial: Partial<AppState>) => void
  setModal: (modal: Modal) => void
  /** Merge no modal atualmente aberto. */
  patchModal: (partial: Record<string, unknown>) => void
  closeModal: () => void
  toast: (msg: string) => void
  resetAll: () => void
  /** Estado da sincronização com o banco. */
  syncStatus: SyncStatus
  /** Força um envio imediato ao banco. */
  forceSync: () => void
}

const RetiroContext = createContext<RetiroContextValue | null>(null)

export function RetiroProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bootstrapped = useRef(false)
  const bootstrapStarted = useRef(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus())

  const patch = useCallback((partial: Partial<AppState>) => {
    dispatch({ type: 'PATCH', patch: partial })
  }, [])

  const setModal = useCallback((modal: Modal) => {
    dispatch({ type: 'PATCH', patch: { modal } })
  }, [])

  const closeModal = useCallback(() => {
    dispatch({ type: 'PATCH', patch: { modal: null } })
  }, [])

  const stateRef = useRef(state)
  stateRef.current = state
  // Provider do snapshot atual para o syncManager (sempre o estado mais recente).
  syncManager.setSnapshotProvider(() => toSnapshot(stateRef.current))

  const patchModal = useCallback((partial: Record<string, unknown>) => {
    const current = stateRef.current.modal
    if (!current) return
    dispatch({
      type: 'PATCH',
      patch: { modal: { ...current, ...partial } as Modal },
    })
  }, [])

  const toast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    dispatch({ type: 'PATCH', patch: { toast: msg } })
    toastTimer.current = setTimeout(() => {
      dispatch({ type: 'PATCH', patch: { toast: null } })
    }, 2600)
  }, [])

  const resetAll = useCallback(() => {
    stateRepository.clear()
    dispatch({ type: 'RESET' })
  }, [])

  // Persistência: cache local imediato a cada mudança + enfileira sync com o
  // banco (só depois do bootstrap, para não sobrescrever o que vier do banco).
  useEffect(() => {
    stateRepository.save(state)
    if (bootstrapped.current) syncManager.notifyChange(toSnapshot(state))
  }, [state])

  // Assina o status da sincronização (online/pendente/sincronizado/...).
  useEffect(() => syncManager.subscribe(setSyncStatus), [])

  // Bootstrap offline-first: decide entre puxar do banco ou subir o local.
  // Roda UMA única vez (guard sobrevive ao double-invoke do StrictMode), para
  // que um pull atrasado nunca sobrescreva uma alteração local do usuário.
  useEffect(() => {
    if (bootstrapStarted.current) return
    bootstrapStarted.current = true
    ;(async () => {
      if (syncManager.isOnline()) {
        if (syncManager.getMeta().dirty) {
          // Há alterações locais não enviadas → sobe o local.
          bootstrapped.current = true
          await syncManager.sync()
        } else {
          const antes = JSON.stringify(toSnapshot(stateRef.current))
          const remote = await syncManager.pull()
          const mudouDuranteLoad = JSON.stringify(toSnapshot(stateRef.current)) !== antes
          if (remote && !mudouDuranteLoad) {
            // Aplica o estado do banco (fonte de verdade no load).
            dispatch({ type: 'PATCH', patch: snapshotToPatch(remote) })
            syncManager.markSynced(remote)
            bootstrapped.current = true
          } else {
            // Banco vazio, ou o usuário alterou algo durante o load → sobe o local.
            bootstrapped.current = true
            syncManager.notifyChange(toSnapshot(stateRef.current))
            await syncManager.sync()
          }
        }
      }
      bootstrapped.current = true
    })()
  }, [])

  // Ao reconectar, envia o que estiver pendente.
  useEffect(() => {
    const onOnline = () => void syncManager.sync()
    window.addEventListener('online', onOnline)
    // Retry periódico: não dependemos só do evento 'online' (que nem sempre
    // dispara). Enquanto houver pendência e internet, tenta reenviar.
    const id = setInterval(() => {
      if (syncManager.isOnline() && syncManager.getMeta().dirty) {
        void syncManager.sync()
      }
    }, 4000)
    return () => {
      window.removeEventListener('online', onOnline)
      clearInterval(id)
    }
  }, [])

  // Responsividade: atualiza narrow/sbOpen ao redimensionar.
  useEffect(() => {
    const onResize = () => {
      const n = window.innerWidth < 900
      if (n !== stateRef.current.narrow) {
        dispatch({ type: 'PATCH', patch: { narrow: n, sbOpen: !n } })
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const forceSync = useCallback(() => {
    void syncManager.sync()
  }, [])

  const value: RetiroContextValue = {
    state,
    patch,
    setModal,
    patchModal,
    closeModal,
    toast,
    resetAll,
    syncStatus,
    forceSync,
  }

  return (
    <RetiroContext.Provider value={value}>{children}</RetiroContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRetiro(): RetiroContextValue {
  const ctx = useContext(RetiroContext)
  if (!ctx) throw new Error('useRetiro deve ser usado dentro de <RetiroProvider>')
  return ctx
}
