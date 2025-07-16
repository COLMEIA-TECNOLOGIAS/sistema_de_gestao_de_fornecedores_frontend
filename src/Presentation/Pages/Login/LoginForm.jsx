import { useState } from "react"
import Button from "../../Components/Button"
import Input from "../../Components/Input"

export default function LoginForm({ onSubmit }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ username, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nome de usuário"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Digite o seu nome"
      />
      
      <Input
        label="Senha"
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Digite a sua senha"
      />
      
      <div className="flex justify-between items-center text-base">
        <span className="text-blue-500 italic">Empty text</span>
        <a href="#" className="text-blue-600 hover:underline">
          Esqueci minha senha
        </a>
      </div>
      
      <Button type="submit">Fazer Login</Button>
    </form>
  )
}