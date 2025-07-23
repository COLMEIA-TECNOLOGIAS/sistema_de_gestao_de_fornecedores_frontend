// src/routes/Route.jsx
import { Routes, Route } from 'react-router-dom'
import LoginPage from '../Presentation/Pages/Login/LoginPage.jsx'
import ResetPasswordPage from '..../Presentation/Pages/ResetPassword/ResetPasswordPage.jsx'

// import RegisterPage from '../Presentation/Pages/Register/RegisterPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/home" element={<HomePage />} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}
    </Routes>
  )
}
