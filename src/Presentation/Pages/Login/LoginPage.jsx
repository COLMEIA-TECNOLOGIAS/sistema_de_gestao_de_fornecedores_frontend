import { Crown } from "lucide-react";
import LoginForm from "./LoginForm";
import { Headphones } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Esquerda - Imagem com texto */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
       
<img 
 src="/hero.jpg" 
 alt="Background" 
 className="absolute inset-0 w-full h-full object-cover opacity-40"
/>
        
       

        {/* Layout com flexbox */}
        <div className="relative z-10 w-full h-full flex flex-col">
          <div className="flex justify-between items-start p-6">
            <div className="flex items-center space-x-3">
              
              <img src="/login1.svg" className="w-24 h-24 " alt="" />
            </div>
            
            <div className="flex items-center mt-4 space-x-2 text-white">
              
               <button className=" flex items-center  gap-1  bg-green-500/15 text-white px-10 py-4 rounded-xl shadow-md text-lg">
                Ajuda
                <Headphones size={16 } />
               </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center text-white max-w-lg">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Contracts automation
              </h2>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                Have brands pitch collaboration ideas,<br />
                and you decide which accept or reject.
              </p>
            </div>
          </div>

          <div className="flex justify-center pb-8">
            <div className="flex space-x-2">
              <div className="w-8 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-white bg-opacity-40 rounded-full"></div>
              <div className="w-2 h-2 bg-white bg-opacity-40 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-8 py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-900 font-bold text-xl tracking-wide">MOSAP3</span>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900 leading-tight">
              Login
            </h1>
            <p className="text-gray-600 text-lg mb-12 leading-relaxed">
              Entre com a sua conta para continuar<br className="hidden sm:block" />
              <span className="text-green-600 font-medium">com as suas atividades</span>
            </p>
          </div>
          
          <LoginForm onSubmit={(data) => console.log(data)} />
        </div>
      </div>
    </div>
  );
}