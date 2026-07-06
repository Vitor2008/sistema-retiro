import { useRetiro } from '../store/RetiroContext'

export function Toast() {
  const { state } = useRetiro()
  if (!state.toast) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 200,
        background: 'var(--color-primary)',
        color: '#fff',
        borderRadius: 8,
        padding: '12px 18px',
        fontSize: 13,
        fontWeight: 500,
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        animation: 'toastIn .2s var(--ease-default)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage-tint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 7"></path>
      </svg>
      {state.toast}
    </div>
  )
}
