import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import './index.css'
import './styles/formValidation.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext.jsx'

// Set page title
document.title = 'Nuestras Artesanías | Handcrafted Jewelry & Artisan Products'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
)
