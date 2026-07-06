// ============================================================================
// Sincronização offline-first.
//
// - O localStorage é o cache imediato (fonte de verdade local; funciona offline).
// - Cada alteração de domínio incrementa uma sequência (pendência). Havendo
//   internet, um envio SERIALIZADO manda sempre o snapshot mais recente ao banco
//   (PUT /snapshot). Sem internet, fica pendente; ao reconectar (evento 'online'
//   ou retry periódico), envia.
// - Envios são serializados (nunca concorrentes) e coalescem no estado atual, o
//   que evita que a conclusão tardia de um push antigo apague uma pendência nova.
//
// Conflito: last-write-wins por snapshot (uso administrativo, ~1 operador).
// ============================================================================

import { apiClient } from '../api/apiClient'
import type { DomainSnapshot } from './snapshot'

export type SyncStatus = 'offline' | 'synced' | 'pending' | 'syncing' | 'error'

interface SyncMeta {
  dirty: boolean
  lastSyncedAt: string | null
}

const META_KEY = 'retiros-sync-meta'
const DEBOUNCE_MS = 800

function loadMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (raw) return JSON.parse(raw) as SyncMeta
  } catch {
    /* noop */
  }
  return { dirty: false, lastSyncedAt: null }
}
function saveMeta(m: SyncMeta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m))
  } catch {
    /* noop */
  }
}

let meta = loadMeta()
// Sequência: dirty <=> syncedSeq < queuedSeq.
let queuedSeq = meta.dirty ? 1 : 0
let syncedSeq = 0
let lastPushedJson: string | null = null
let pushing = false
let timer: ReturnType<typeof setTimeout> | null = null
let provider: (() => DomainSnapshot) | null = null

let status: SyncStatus = navigator.onLine ? 'syncing' : 'offline'
const listeners = new Set<(s: SyncStatus) => void>()

function setStatus(s: SyncStatus) {
  status = s
  listeners.forEach((cb) => cb(s))
}
function isDirty() {
  return syncedSeq < queuedSeq
}
function refreshStatus() {
  if (!navigator.onLine) return setStatus('offline')
  setStatus(isDirty() ? 'pending' : 'synced')
}
function persistDirty(dirty: boolean) {
  meta = { ...meta, dirty }
  saveMeta(meta)
}

/** Envio serializado: enquanto houver pendência e internet, manda o snapshot
 *  ATUAL (coalescido) e só marca sincronizado a sequência efetivamente enviada. */
async function sync(): Promise<void> {
  if (pushing || !navigator.onLine || !provider) return
  if (!isDirty()) {
    refreshStatus()
    return
  }
  pushing = true
  try {
    while (isDirty() && navigator.onLine) {
      const seq = queuedSeq
      const snap = provider()
      setStatus('syncing')
      await apiClient.put('/snapshot', snap)
      syncedSeq = seq
      lastPushedJson = JSON.stringify(snap)
      persistDirty(isDirty())
      meta = { ...meta, lastSyncedAt: new Date().toISOString() }
      saveMeta(meta)
    }
    refreshStatus()
  } catch {
    persistDirty(true)
    setStatus(navigator.onLine ? 'error' : 'offline')
  } finally {
    pushing = false
  }
}

export const syncManager = {
  getStatus: () => status,
  getMeta: () => meta,
  isOnline: () => navigator.onLine,

  subscribe(cb: (s: SyncStatus) => void): () => void {
    listeners.add(cb)
    cb(status)
    return () => listeners.delete(cb)
  },

  /** O contexto informa como obter o snapshot atual do estado. */
  setSnapshotProvider(fn: () => DomainSnapshot) {
    provider = fn
  },

  /** Puxa o estado do banco (null se vazio/offline). */
  async pull(): Promise<DomainSnapshot | null> {
    if (!navigator.onLine) return null
    try {
      return await apiClient.get<DomainSnapshot | null>('/snapshot')
    } catch {
      setStatus('error')
      return null
    }
  },

  /** Marca o estado atual como já sincronizado (após aplicar o do banco). */
  markSynced(snap: DomainSnapshot) {
    syncedSeq = queuedSeq
    lastPushedJson = JSON.stringify(snap)
    persistDirty(false)
    meta = { ...meta, lastSyncedAt: new Date().toISOString() }
    saveMeta(meta)
    refreshStatus()
  },

  /** Registra uma alteração local (chamada a cada mudança de domínio). */
  notifyChange(snap: DomainSnapshot) {
    const json = JSON.stringify(snap)
    if (json === lastPushedJson && !isDirty()) return // nada mudou de fato
    queuedSeq++
    persistDirty(true)
    setStatus(navigator.onLine ? 'pending' : 'offline')
    if (timer) clearTimeout(timer)
    if (navigator.onLine) timer = setTimeout(() => void sync(), DEBOUNCE_MS)
  },

  /** Dispara o envio serializado (usado por reconexão, retry e botão manual). */
  sync,
}
