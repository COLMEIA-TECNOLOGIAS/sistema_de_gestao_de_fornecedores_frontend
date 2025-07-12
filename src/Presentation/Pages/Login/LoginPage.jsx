import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 ">
      {/* Esquerda - Imagem com texto */}
      <div className="hidden m-2 md:flex items-center justify-center bg-gray-900 relative overflow-hidden">
        <img
          src="hero.jpg" 
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover  opacity-40"
        />
        <div className="relative z-10 text-center text-white p-6">
          <h2 className=" text-4xl md:text-6xl font-bold mb-2">
            Contracts automation
          </h2>
          <p className="text-sm md:text-2xl font-semibold">
            Have brands pitch collaboration ideas,<br />
            and you decide which accept or reject.
          </p>
        </div>
      </div>

      {/* Direita - Formulário */}
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-6xl font-bold  mb-2">Login</h1>
          <p className="text-gray-600 text-2xl  mb-6">
            Entre com as sua conta para continuar com as suas atividades
          </p>
          <LoginForm onSubmit={(data) => console.log(data)} />
        </div>
      </div>
    </div>
  )
}
