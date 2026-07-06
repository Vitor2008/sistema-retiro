import { appConfig } from '../config'
import { useRetiro } from '../store/RetiroContext'

export function MobileTopbar() {
  const { state, patch } = useRetiro()
  if (!state.narrow) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <button
        className="btn btn-default btn-sm"
        onClick={() => patch({ sbOpen: !state.sbOpen })}
      >
        ☰ Menu
      </button>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-primary)' }}>
        Retiros · {appConfig.nomeIgreja}
      </div>
    </div>
  )
}
