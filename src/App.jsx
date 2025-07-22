// src/App.jsx
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import SplashScreen from './Presentation/Components/SplashScreen.jsx'
import LoginPage from './Presentation/Pages/Login/LoginPage.jsx'
// import RegisterPage from './Presentation/Pages/Register/RegisterPage.jsx'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000) // 3 segundos de splash

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}
    </Routes>
  )
}

export default App
