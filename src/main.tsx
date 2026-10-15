import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadBases } from './rig/helpers'

// As peças-base do Blender precisam estar na memória antes de qualquer cena
// ser montada: person() as usa de forma síncrona dentro de createScene().
loadBases().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
