import { MobileTopbar } from './components/MobileTopbar'
import { Sidebar } from './components/Sidebar'
import { SyncBadge } from './components/SyncBadge'
import { Toast } from './components/Toast'
import { ModalHost } from './components/modals/ModalHost'
import { AuthProvider, useAuth } from './store/AuthContext'
import { RetiroProvider, useRetiro } from './store/RetiroContext'
import { CantinaView } from './views/CantinaView'
import { CheckinView } from './views/CheckinView'
import { ContasView } from './views/ContasView'
import { EscalasView } from './views/EscalasView'
import { InscricaoView } from './views/InscricaoView'
import { LoginView } from './views/LoginView'
import { QuartosView } from './views/QuartosView'
import { RetirosView } from './views/RetirosView'

function Shell() {
  const { state } = useRetiro()
  const narrow = state.narrow
  const showSidebar = !narrow || state.sbOpen

  return (
    <div className="shell" style={{ minHeight: '100vh', gridTemplateColumns: narrow ? '1fr' : '240px 1fr' }}>
      {showSidebar && <Sidebar />}

      <div className="main" style={{ padding: narrow ? '16px 14px 40px' : '22px 28px 40px' }}>
        <MobileTopbar />
        {state.view === 'retiros' && <RetirosView />}
        {state.view === 'inscricao' && <InscricaoView />}
        {state.view === 'checkin' && <CheckinView />}
        {state.view === 'quartos' && <QuartosView />}
        {state.view === 'escalas' && <EscalasView />}
        {state.view === 'contas' && <ContasView />}
        {state.view === 'cantina' && <CantinaView />}
      </div>

      <ModalHost />
      <Toast />
      <SyncBadge />
    </div>
  )
}

function Gate() {
  const { isAuthenticated } = useAuth()
  // Só monta o app (e a sincronização) depois de autenticado.
  if (!isAuthenticated) return <LoginView />
  return (
    <RetiroProvider>
      <Shell />
    </RetiroProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
