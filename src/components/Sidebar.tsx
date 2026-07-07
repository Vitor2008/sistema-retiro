import { NavLink } from 'react-router-dom'
import { canAccess } from '../acessos'
import { appConfig } from '../config'
import { NAV } from '../navigation'
import { useAuth } from '../store/AuthContext'
import { useRetiro } from '../store/RetiroContext'

export function Sidebar() {
  const { state, patch } = useRetiro()
  const { user, logout } = useAuth()
  const nomeIgreja = appConfig.nomeIgreja
  const igrejaCurta = nomeIgreja.split(' ').slice(-1)[0]
  const iniciais = (user?.nome || user?.username || 'AD')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Ao navegar em telas estreitas, recolhe a sidebar.
  const onNavigate = () => {
    if (state.narrow) patch({ sbOpen: false })
  }

  const itens = NAV.filter((item) => canAccess(user?.acessos, item.key))

  return (
    <div className="sb" data-screen-label="Sidebar">
      <div className="brand">
        <div className="mark">R</div>
        <div className="name">
          Retiros <b>{igrejaCurta}</b>
        </div>
      </div>

      {itens.map((item) => (
        <div key={item.key}>
          {item.section && <div className="section">{item.section}</div>}
          <NavLink
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => 'item' + (isActive ? ' active' : '')}
            style={{ textDecoration: 'none' }}
          >
            {item.icon}
            {item.label}
          </NavLink>
        </div>
      ))}

      <div className="user">
        <div className="av">{iniciais}</div>
        <div className="info">
          {user?.nome || 'Administrador'}
          <br />
          <span className="em">@{user?.username || 'adm'}</span>
        </div>
        <button
          onClick={logout}
          title="Sair"
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--fg-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}
