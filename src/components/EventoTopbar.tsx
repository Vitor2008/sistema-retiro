import { useRetiroSelection } from '../store/RetiroSelection'

/** Barra superior centralizada com o seletor de evento (destaque leve). */
export function EventoTopbar() {
  const { retiros, selectedId, select } = useRetiroSelection()
  if (retiros.length === 0) return null
  const unico = retiros.length <= 1

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        marginBottom: 16,
        background: 'var(--color-primary-tint)',
        border: '1px solid var(--color-primary)',
        borderRadius: 999,
      }}
    >
      <span
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          color: 'var(--color-primary)',
          fontWeight: 700,
        }}
      >
        Evento
      </span>
      <select
        className="input"
        value={selectedId ?? ''}
        onChange={(e) => select(e.target.value)}
        disabled={unico}
        title={unico ? undefined : 'Trocar de evento'}
        style={{
          width: 'auto',
          minWidth: 220,
          maxWidth: 420,
          fontSize: 14,
          fontWeight: 600,
          padding: '7px 12px',
          borderColor: 'var(--color-primary)',
          color: 'var(--color-primary-hover)',
          background: '#fff',
          cursor: unico ? 'default' : 'pointer',
        }}
      >
        {retiros.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nome}
          </option>
        ))}
      </select>
    </div>
  )
}
