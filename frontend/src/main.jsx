import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './style/pwa.css'
import App from './App.jsx'
import pwaService from './services/pwaService'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
