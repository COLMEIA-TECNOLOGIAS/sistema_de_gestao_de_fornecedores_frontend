import Sidebar from '../layout/sidebar';

export default function Home() {
  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Seu conteúdo da página aqui */}
        <h1 className="text-2xl font-bold">Bem-vindo ao Dashboard</h1>
        {/* ... */}
      </main>
    </div>
  );
}