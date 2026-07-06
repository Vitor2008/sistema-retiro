import { useRetiro } from '../store/RetiroContext'
import type { SyncStatus } from '../services/sync/syncManager'

const INFO: Record<SyncStatus, { label: string; bg: string; fg: string; dot: string }> = {
  synced: { label: 'Sincronizado', bg: 'var(--color-sage-soft)', fg: 'var(--status-final-fg)', dot: 'var(--status-final-fg)' },
  pending: { label: 'Pendente', bg: 'var(--status-progress-bg)', fg: 'var(--status-progress-fg)', dot: 'var(--status-progress-fg)' },
  syncing: { label: 'Sincronizando…', bg: 'var(--status-interview-bg)', fg: 'var(--status-interview-fg)', dot: 'var(--status-interview-fg)' },
  offline: { label: 'Offline', bg: 'var(--status-closed-bg)', fg: 'var(--status-closed-fg)', dot: 'var(--status-closed-fg)' },
  error: { label: 'Erro ao sincronizar', bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)', dot: 'var(--status-rejected-fg)' },
}

/** Badge fixo mostrando o estado da sincronização com o banco.
 *  Clicar força um envio imediato. */
export function SyncBadge() {
  const { syncStatus, forceSync } = useRetiro()
  const info = INFO[syncStatus]

  return (
    <button
      onClick={forceSync}
      data-testid="sync-badge"
      title="Clique para sincronizar agora"
      style={{
        position: 'fixed',
        top: 14,
        right: 14,
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: info.bg,
        color: info.fg,
        border: 'none',
        borderRadius: 999,
        padding: '7px 14px',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: info.dot,
          animation: syncStatus === 'syncing' ? 'fadeIn .6s ease-in-out infinite alternate' : undefined,
        }}
      />
      {info.label}
    </button>
  )
}
