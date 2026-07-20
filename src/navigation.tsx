import type { ReactElement } from 'react'
import { CantinaView } from './views/CantinaView'
import { CheckinView } from './views/CheckinView'
import { ContasView } from './views/ContasView'
import { EscalasView } from './views/EscalasView'
import { QuartosView } from './views/QuartosView'
import { RetirosView } from './views/RetirosView'
import { UsuariosView } from './views/UsuariosView'

/** Item de navegação = uma página/rota. Fonte única usada pela Sidebar e pelo
 *  roteador. O campo `key` identifica a página (útil para o futuro controle de
 *  acesso por rota). */
export interface NavItem {
  key: string
  path: string
  label: string
  section?: string
  icon: ReactElement
  element: ReactElement
}

export const NAV: NavItem[] = [
  {
    key: 'retiros',
    path: '/retiros',
    label: 'Eventos',
    section: 'Administração',
    element: <RetirosView />,
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
    key: 'checkin',
    path: '/check-in',
    label: 'Check-in',
    section: 'Operação',
    element: <CheckinView />,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3l8-8"></path>
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path>
      </svg>
    ),
  },
  {
    key: 'quartos',
    path: '/quartos',
    label: 'Quartos',
    element: <QuartosView />,
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
    path: '/escalas',
    label: 'Escalas de serviço',
    element: <EscalasView />,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"></circle>
        <polyline points="12 7 12 12 15 15"></polyline>
      </svg>
    ),
  },
  {
    key: 'contas',
    path: '/contas',
    label: 'Prestação de contas',
    section: 'Financeiro',
    element: <ContasView />,
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
    path: '/cantina',
    label: 'Cantina',
    element: <CantinaView />,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="19" r="2"></circle>
        <circle cx="17" cy="19" r="2"></circle>
        <path d="M3 3h2l2.5 12h10l2-8H6"></path>
      </svg>
    ),
  },
  {
    key: 'usuarios',
    path: '/usuarios',
    label: 'Usuários',
    section: 'Sistema',
    element: <UsuariosView />,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
]

/** Rota padrão ao entrar. */
export const DEFAULT_PATH = '/check-in'
