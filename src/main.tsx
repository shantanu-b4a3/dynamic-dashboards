import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import MuuriDashboard from './MuriDashboard'
import GridStackDashboard from './GridStackDashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GridStackDashboard />
  </StrictMode>,
)
