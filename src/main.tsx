import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Ordem importa: tokens do design system primeiro, depois o kit de dashboard,
// por fim os resets/animações globais do app.
import './styles/colors_and_type.css'
import './styles/dashboard.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
