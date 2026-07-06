import type { ReactElement } from 'react'
import { appConfig } from '../config'
import { useRetiro } from '../store/RetiroContext'
import type { View } from '../types'

const NAV: Array<{
  key: View
  label: string
  section?: string
  icon: ReactElement
}> = [
  {
    key: 'retiros',
    label: 'Retiros',
    section: 'Administração',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="16" rx="2"></rect>
        <line x1="16" y1="3" x2="16" y2="7"></line>
        <line x1="8" y1="3" x2="8" y2="7"></line>
        <line x1="4" y1="11" x2="20" y2="11"></line>
      </svg>
    ),
  },
  {
    key: 'inscricao',
    label: 'Formulário público',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path>
        <line x1="9" y1="13" x2="15" y2="13"></line>
        <line x1="9" y1="17" x2="13" y2="17"></line>
      </svg>
    ),
  },
  {
    key: 'checkin',
    label: 'Check-in',
    section: 'Operação',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3l8-8"></path>
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path>
      </svg>
    ),
  },
  {
    key: 'quartos',
    label: 'Quartos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v11"></path>
        <path d="M3 14h18"></path>
        <path d="M21 18v-8a2 2 0 0 0-2-2h-8v6"></path>
        <circle cx="7" cy="10" r="1.5"></circle>
      </svg>
    ),
  },
  {
    key: 'escalas',
    label: 'Escalas de serviço',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"></circle>
        <polyline points="12 7 12 12 15 15"></polyline>
      </svg>
    ),
  },
  {
    key: 'contas',
    label: 'Prestação de contas',
    section: 'Financeiro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14c0 1.1 1.3 2 3 2s3-.9 3-2s-1.3-2-3-2s-3-.9-3-2s1.3-2 3-2s3 .9 3 2"></path>
        <line x1="12" y1="6" x2="12" y2="18"></line>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    ),
  },
  {
    key: 'cantina',
    label: 'Cantina',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="19" r="2"></circle>
        <circle cx="17" cy="19" r="2"></circle>
        <path d="M3 3h2l2.5 12h10l2-8H6"></path>
      </svg>
    ),
  },
]

export function Sidebar() {
  const { state, patch } = useRetiro()
  const nomeIgreja = appConfig.nomeIgreja
  const igrejaCurta = nomeIgreja.split(' ').slice(-1)[0]

  const go = (key: View) => () =>
    patch({ view: key, sbOpen: !state.narrow ? state.sbOpen : false })

  return (
    <div className="sb" data-screen-label="Sidebar">
      <div className="brand">
        <div className="mark">R</div>
        <div className="name">
          Retiros <b>{igrejaCurta}</b>
        </div>
      </div>

      {NAV.map((item) => (
        <div key={item.key}>
          {item.section && <div className="section">{item.section}</div>}
          <div
            className={'item' + (state.view === item.key ? ' active' : '')}
            onClick={go(item.key)}
          >
            {item.icon}
            {item.label}
          </div>
        </div>
      ))}

      <div className="user">
        <div className="av">AD</div>
        <div className="info">
          Administrador
          <br />
          <span className="em">{nomeIgreja}</span>
        </div>
      </div>
    </div>
  )
}
