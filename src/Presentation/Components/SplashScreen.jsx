// src/components/SplashScreen.jsx
import { useEffect } from "react";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish(); // chama a função para sair do splash
    }, 3000); // 3 segundos

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <img src= "/logo.svg" alt="Logo" className="w-60 h-60" />
    </div>
  );
}
