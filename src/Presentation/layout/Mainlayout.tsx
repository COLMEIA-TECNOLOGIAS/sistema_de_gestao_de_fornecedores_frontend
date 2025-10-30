import Fornecedores from "./FornecedoresCard";

function MainContent() {
  return (
    <main className="flex-1 bg-gray-50 p-8 mt-[65px]">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl p-8 mb-8 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Olá António,
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem vindo de volta!
          </h2>
          <p className="text-gray-600">Continue com as suas atividades</p>
        </div>
        <img
          src="/public/tea.png"
          alt="Team"
          className="w-96 h-48 object-cover rounded-xl"
        />
      </div>

      {/* Fornecedores Table */}
      <Fornecedores />
    </main>
  );
}

export default MainContent;