// ============================================================================
// Serviço de arquivos (comprovantes/notas).
//
// Os arquivos são armazenados no backend (Postgres, coluna bytea). Para
// preservar o comportamento offline-first:
//  - Ao salvar, o blob vai IMEDIATAMENTE para o IndexedDB (cache local durável)
//    e, se houver internet, é enviado ao backend; senão fica numa fila de
//    "uploads pendentes" reenviada ao reconectar.
//  - Ao ler, tenta o cache local; se não houver, baixa do backend.
// ============================================================================

import { idbDelete, idbGet, idbPut } from '../lib/idb'
import type { Attachment } from '../types'
import { session } from './auth/session'

function authHeader(): Record<string, string> {
  const token = session.getToken()
  return token ? { Authorization: 'Bearer ' + token } : {}
}

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api'
const PENDING_KEY = 'retiros-file-pending'

function loadPending(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') as string[]
  } catch {
    return []
  }
}
function savePending(ids: string[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(Array.from(new Set(ids))))
  } catch {
    /* noop */
  }
}
function addPending(id: string) {
  savePending([...loadPending(), id])
}
function removePending(id: string) {
  savePending(loadPending().filter((x) => x !== id))
}

function makeId(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9.-]+/g, '_').slice(0, 40)
  return 'f_' + Date.now().toString(36) + '_' + safe
}

async function uploadOne(fileId: string, blob: Blob, name: string): Promise<boolean> {
  if (!navigator.onLine) return false
  try {
    const res = await fetch(BASE_URL + '/arquivos', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(name),
        'X-File-Id': fileId,
        ...authHeader(),
      },
      body: blob,
    })
    if (!res.ok) return false
    removePending(fileId)
    return true
  } catch {
    return false
  }
}

export interface FileService {
  save(file: File): Promise<Attachment>
  toObjectURL(fileId: string): Promise<string | null>
  remove(fileId: string): Promise<void>
  flushPending(): Promise<void>
}

class ApiFileService implements FileService {
  async save(file: File): Promise<Attachment> {
    const fileId = makeId(file.name)
    // 1) cache local imediato (durável, funciona offline)
    await idbPut(fileId, file)
    addPending(fileId)
    // 2) tenta enviar ao backend agora (se online)
    await uploadOne(fileId, file, file.name)
    return { name: file.name, fileId }
  }

  async toObjectURL(fileId: string): Promise<string | null> {
    // cache local primeiro (rápido e offline)
    const cached = await idbGet(fileId)
    if (cached) return URL.createObjectURL(cached)
    // senão, baixa do backend
    try {
      const res = await fetch(BASE_URL + '/arquivos/' + fileId, { headers: authHeader() })
      if (!res.ok) return null
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }

  async remove(fileId: string): Promise<void> {
    await idbDelete(fileId)
    removePending(fileId)
    try {
      await fetch(BASE_URL + '/arquivos/' + fileId, { method: 'DELETE', headers: authHeader() })
    } catch {
      /* offline: o registro no banco pode ser limpo depois */
    }
  }

  /** Reenvia uploads que ficaram pendentes (feitos offline). */
  async flushPending(): Promise<void> {
    if (!navigator.onLine) return
    for (const fileId of loadPending()) {
      const blob = await idbGet(fileId)
      if (blob) await uploadOne(fileId, blob, (blob as File).name || fileId)
      else removePending(fileId)
    }
  }
}

export const fileService: FileService = new ApiFileService()

// Reenvia pendências ao recuperar a conexão.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void fileService.flushPending())
}
