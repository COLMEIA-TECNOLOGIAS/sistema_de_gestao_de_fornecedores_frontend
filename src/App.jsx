import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import SplashScreen from './Presentation/Components/SplashScreen.jsx'
import LoginPage from './Presentation/Pages/Login/LoginPage.jsx'
import RegisterPage from './Presentation/Pages/Login/RegisterPage.jsx'
import SuccessPasswordReset from './Presentation/Pages/Login/SuccessPasswordReset..jsx'
import Home from './Presentation/Pages/Home.jsx'
import DashboardLayout from './ DashboardLayout.jsx'
import AddFornecedorPage from './Presentation/layout/AddFornecedor.jsx'
import FornecedorFormStep1 from './Presentation/layout/FornecedorForm.jsx'
function App() {
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
      <Route path="/" element={<LoginPage />} />
       <Route path="/register" element={<RegisterPage />} /> 
       <Route path="/success-reset" element={<SuccessPasswordReset />} /> 
       <Route path="/home" element={ <Home />} /> 
       <Route path="/dashboard" element={ <DashboardLayout />} /> 
       <Route path="/AddFornecedorPage" element={ <AddFornecedorPage />} /> 
       <Route path="/FornecedorFormStep1" element={ <FornecedorFormStep1 />} /> 
      

    </Routes>
  )
}

export default App
