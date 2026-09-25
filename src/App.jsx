import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminRoute } from './Presentation/Components/RoleProtectedRoute'
import SplashScreen from './Presentation/Components/SplashScreen.jsx'
import LoginPage from './Presentation/Pages/Login/LoginPage.jsx'
import SuccessPasswordReset from './Presentation/Pages/Login/SuccessPasswordReset..jsx'
import ForgotPasswordPage from './Presentation/Pages/Login/ForgotPasswordPage.jsx'
import VerifyCodePage from './Presentation/Pages/Login/VerifyCodePage.jsx'
import ResetPasswordPage from './Presentation/Pages/Login/ResetPasswordPage.jsx'
import EmailVerificationPage from './Presentation/Pages/Login/EmailVerificationPage.jsx'

// Carregadas sob demanda para reduzir o bundle inicial (ecrã de login)
const DashboardLayout = lazy(() => import('./DashboardLayout.jsx'))
const AddFornecedorPage = lazy(() => import('./Presentation/layout/AddFornecedor.jsx'))
const FornecedorFormStep1 = lazy(() => import('./Presentation/layout/FornecedorForm.jsx'))
const LandingPage = lazy(() => import('./Presentation/Pages/LandingPage.jsx'))

const SPLASH_SEEN_KEY = 'mosap3-splash-seen'

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#44B16F]"></div>
    </div>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Páginas de login não fazem sentido para quem já tem sessão iniciada
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function shouldShowSplash() {
  try {
    return !sessionStorage.getItem(SPLASH_SEEN_KEY)
  } catch {
    return true
  }
}

function AppRoutes() {
  // O splash só aparece na primeira abertura da sessão, não em cada refresh
  const [showSplash, setShowSplash] = useState(shouldShowSplash)

  useEffect(() => {
    if (!showSplash) return
    const timer = setTimeout(() => {
      try { sessionStorage.setItem(SPLASH_SEEN_KEY, '1') } catch { /* ignore */ }
      setShowSplash(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [showSplash])

  if (showSplash) {
    return <SplashScreen />
  }

  const dashboard = <ProtectedRoute><DashboardLayout /></ProtectedRoute>
  const adminDashboard = <ProtectedRoute><AdminRoute><DashboardLayout /></AdminRoute></ProtectedRoute>

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Login como página inicial */}
        <Route path="/" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/success-reset" element={<SuccessPasswordReset />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/confirm-email" element={<EmailVerificationPage />} />

        {/* Landing Page */}
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="/seja-fornecedor" element={<LandingPage />} />

        {/* Dashboard e páginas internas - Protected */}
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={dashboard} />
        <Route path="/fornecedores" element={dashboard} />
        <Route path="/usuarios" element={dashboard} />
        <Route path="/criar-utilizador" element={dashboard} />
        <Route path="/permissoes" element={dashboard} />
        <Route path="/relatorios" element={dashboard} />
        <Route path="/aquisicoes" element={dashboard} />
        <Route path="/produtos" element={dashboard} />
        <Route path="/logs-eventos" element={adminDashboard} />
        <Route path="/config" element={adminDashboard} />
        <Route path="/meu-perfil" element={dashboard} />
        <Route path="/AddFornecedorPage" element={<ProtectedRoute><AddFornecedorPage /></ProtectedRoute>} />
        <Route path="/FornecedorFormStep1" element={<ProtectedRoute><FornecedorFormStep1 /></ProtectedRoute>} />

        {/* Rota desconhecida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
