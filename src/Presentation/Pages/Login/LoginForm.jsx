import { useState } from "react";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import ForgotPasswordModal from "../../Components/ForgetPasswordModal";


export default function LoginForm({ onSubmit }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ username, password });
  };

  const handleForgotPasswordSubmit = (data) => {
    console.log("Email para recuperação:", data.email);
    setShowForgotPassword(false); 
  };

  return (
    <div className="relative">
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

        <div className="flex justify-between items-center mt-4 text-base">
          <Button type="submit">Fazer Login</Button>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-green-400 hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>
      </form>

      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          onSubmit={handleForgotPasswordSubmit}
        />
      )}
    </div>
  );
}