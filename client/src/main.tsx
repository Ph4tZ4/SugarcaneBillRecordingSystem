import axios from 'axios';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Set global base URL for axios
// In Dev: Uses relative path '/api' which goes through Vite Proxy
// In Prod: Uses VITE_API_URL if set, or relative path
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
