import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { canAccess } from './acessos'
import { MobileTopbar } from './components/MobileTopbar'
import { Sidebar } from './components/Sidebar'
import { SyncBadge } from './components/SyncBadge'
import { Toast } from './components/Toast'
import { ModalHost } from './components/modals/ModalHost'
import { NAV } from './navigation'
import { AuthProvider, useAuth } from './store/AuthContext'
import { RetiroProvider, useRetiro } from './store/RetiroContext'
import { InscricaoPublica } from './views/InscricaoPublica'
import { LoginView } from './views/LoginView'

function SemAcesso() {
  return (
    <div className="card" style={{ maxWidth: 460, margin: '40px auto', textAlign: 'center', padding: 40 }}>
      <h3>Sem áreas liberadas</h3>
      <p style={{ marginTop: 8 }}>
        Seu usuário ainda não tem acesso a nenhuma área. Fale com o administrador.
      </p>
    </div>
  )
}

function Shell() {
  const { state } = useRetiro()
  const { user } = useAuth()
  const narrow = state.narrow
  const showSidebar = !narrow || state.sbOpen

  // Só as páginas que o usuário pode acessar viram rotas — deep-link a uma
  // rota não permitida cai no catch-all e volta pra página padrão dele.
  const permitidas = NAV.filter((item) => canAccess(user?.acessos, item.key))
  const defaultPath = permitidas[0]?.path

  return (
    <div className="shell" style={{ minHeight: '100vh', gridTemplateColumns: narrow ? '1fr' : '240px 1fr' }}>
      {showSidebar && <Sidebar />}

      <div className="main" style={{ padding: narrow ? '16px 14px 40px' : '22px 28px 40px' }}>
        <MobileTopbar />
        {defaultPath ? (
          <Routes>
            {permitidas.map((item) => (
              <Route key={item.key} path={item.path} element={item.element} />
            ))}
            <Route path="*" element={<Navigate to={defaultPath} replace />} />
          </Routes>
        ) : (
          <SemAcesso />
        )}
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
    <BrowserRouter>
      <Routes>
        {/* Formulário público de inscrição — fora do login e da sincronização. */}
        <Route path="/inscricao/:slug" element={<InscricaoPublica />} />
        {/* Todo o restante é o app autenticado. */}
        <Route
          path="*"
          element={
            <AuthProvider>
              <Gate />
            </AuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
