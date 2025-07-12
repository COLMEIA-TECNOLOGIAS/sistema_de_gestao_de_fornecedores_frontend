// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import LoginPage from './Presentation/Pages/Login/LoginPage.jsx'
// import RegisterPage from './Presentation/Pages/Register/RegisterPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}
    </Routes>
  )
}

export default App
