// ============================================================================
// Sincronização offline-first — POR RETIRO.
//
// O syncManager opera sobre UM retiro por vez (configure(retiroId)). Cada retiro
// tem sua própria pendência (meta) e cache. Ao trocar de retiro, o RetiroProvider
// remonta e chama configure() com o novo id.
//
// - localStorage é o cache imediato; alterações incrementam uma sequência.
// - Havendo internet, envia o snapshot mais recente para PUT /snapshot/:retiroId.
// - Envios serializados; last-write-wins por snapshot (uso administrativo).
// ============================================================================

import { apiClient } from '../api/apiClient'
import type { DomainSnapshot } from './snapshot'

export type SyncStatus = 'offline' | 'synced' | 'pending' | 'syncing' | 'error'

interface SyncMeta {
  dirty: boolean
  lastSyncedAt: string | null
}

const META_PREFIX = 'retiros-sync-meta-v5:'
const DEBOUNCE_MS = 800

function metaKey(retiroId: string) {
  return META_PREFIX + retiroId
}
function loadMeta(retiroId: string): SyncMeta {
  try {
    const raw = localStorage.getItem(metaKey(retiroId))
    if (raw) return JSON.parse(raw) as SyncMeta
  } catch {
    /* noop */
  }
  return { dirty: false, lastSyncedAt: null }
}
function saveMeta(retiroId: string, m: SyncMeta) {
  try {
    localStorage.setItem(metaKey(retiroId), JSON.stringify(m))
  } catch {
    /* noop */
  }
}

let currentRetiroId: string | null = null
let meta: SyncMeta = { dirty: false, lastSyncedAt: null }
let queuedSeq = 0
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
  if (!currentRetiroId) return
  meta = { ...meta, dirty }
  saveMeta(currentRetiroId, meta)
}

/** Envio serializado do retiro corrente. */
async function sync(): Promise<void> {
  if (pushing || !navigator.onLine || !provider || !currentRetiroId) return
  if (!isDirty()) {
    refreshStatus()
    return
  }
  pushing = true
  try {
    while (isDirty() && navigator.onLine && currentRetiroId) {
      const seq = queuedSeq
      const snap = provider()
      setStatus('syncing')
      await apiClient.put('/snapshot/' + currentRetiroId, snap)
      syncedSeq = seq
      lastPushedJson = JSON.stringify(snap)
      persistDirty(isDirty())
      meta = { ...meta, lastSyncedAt: new Date().toISOString() }
      if (currentRetiroId) saveMeta(currentRetiroId, meta)
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

  /** Passa a operar sobre um retiro específico (reinicia a pendência local). */
  configure(retiroId: string) {
    if (currentRetiroId === retiroId) return
    currentRetiroId = retiroId
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    meta = loadMeta(retiroId)
    queuedSeq = meta.dirty ? 1 : 0
    syncedSeq = 0
    lastPushedJson = null
    pushing = false
    refreshStatus()
  },

  subscribe(cb: (s: SyncStatus) => void): () => void {
    listeners.add(cb)
    cb(status)
    return () => listeners.delete(cb)
  },

  setSnapshotProvider(fn: () => DomainSnapshot) {
    provider = fn
  },

  /** Puxa o estado do retiro corrente (null se vazio/offline). */
  async pull(): Promise<DomainSnapshot | null> {
    if (!navigator.onLine || !currentRetiroId) return null
    try {
      return await apiClient.get<DomainSnapshot | null>('/snapshot/' + currentRetiroId)
    } catch {
      setStatus('error')
      return null
    }
  },

  markSynced(snap: DomainSnapshot) {
    syncedSeq = queuedSeq
    lastPushedJson = JSON.stringify(snap)
    persistDirty(false)
    meta = { ...meta, lastSyncedAt: new Date().toISOString() }
    if (currentRetiroId) saveMeta(currentRetiroId, meta)
    refreshStatus()
  },

  notifyChange(snap: DomainSnapshot) {
    const json = JSON.stringify(snap)
    if (json === lastPushedJson && !isDirty()) return
    queuedSeq++
    persistDirty(true)
    setStatus(navigator.onLine ? 'pending' : 'offline')
    if (timer) clearTimeout(timer)
    if (navigator.onLine) timer = setTimeout(() => void sync(), DEBOUNCE_MS)
  },

  sync,
}
