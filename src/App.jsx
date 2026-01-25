import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import SplashScreen from './Presentation/Components/SplashScreen.jsx'
import LoginPage from './Presentation/Pages/Login/LoginPage.jsx'
import SuccessPasswordReset from './Presentation/Pages/Login/SuccessPasswordReset..jsx'
import Home from './Presentation/Pages/Home.jsx'
import DashboardLayout from './ DashboardLayout.jsx'
import AddFornecedorPage from './Presentation/layout/AddFornecedor.jsx'
import FornecedorFormStep1 from './Presentation/layout/FornecedorForm.jsx'
import LandingPage from './Presentation/Pages/LandingPage.jsx'
import ProdutosPage from './Presentation/layout/ProdutosPage.jsx'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#44B16F]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <Routes>
      {/* Login como página inicial */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/success-reset" element={<SuccessPasswordReset />} />

      {/* Landing Page */}
      <Route path="/landingpage" element={<LandingPage />} />
      <Route path="/seja-fornecedor" element={<LandingPage />} />

      {/* Dashboard e páginas internas - Protected */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/fornecedores" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/aquisicoes" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/categorias" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/produtos" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/meu-perfil" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/AddFornecedorPage" element={<ProtectedRoute><AddFornecedorPage /></ProtectedRoute>} />
      <Route path="/FornecedorFormStep1" element={<ProtectedRoute><FornecedorFormStep1 /></ProtectedRoute>} />

    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
