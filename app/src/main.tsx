import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import { AppProvider } from './context/AppContext'
import './index.css'
import App from './app.tsx'

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppProvider>,
)
