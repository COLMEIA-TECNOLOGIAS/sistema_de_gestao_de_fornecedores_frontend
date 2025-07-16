import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Esquerda - Imagem com texto */}
      <div className="hidden md:flex items-center justify-center bg-gray-900 relative overflow-hidden">
        <img
          src="hero.jpg"
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 text-center text-white p-6">
          {/* Logo */}
          <div className="mb-12">
            <div className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium">
              Amp.js
            </div>
          </div>
          
          {/* Conteúdo principal */}
          <div className="max-w-md  mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold  leading-tight">
              Contracts automation
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">
              Have brands pitch collaboration ideas,<br />
              and you decide which accept or reject.
            </p>
          </div>
          
          {/* Indicadores de slide */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
            <div className="w-8 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-white bg-opacity-40 rounded-full"></div>
            <div className="w-2 h-2 bg-white bg-opacity-40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Direita - Formulário */}
      <div className="flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md">
          <h1 className="text-5xl font-bold mb-3 text-gray-900">Login</h1>
          <p className="text-gray-600 text-lg mb-10">
            Entre com as sua conta para continuar com as suas atividades
          </p>
          <LoginForm onSubmit={(data) => console.log(data)} />
        </div>
      </div>
    </div>
  )
}