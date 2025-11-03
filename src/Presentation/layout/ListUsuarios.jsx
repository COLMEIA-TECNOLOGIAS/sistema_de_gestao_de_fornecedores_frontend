import { Plus, Search, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";
import { useState } from "react";

export default function UsuariosManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
    genero: "",
    numeroIdentificacao: "",
    tipoUsuario: "",
    statusConta: "Ativo"
  });

  const usuarios = [
    { id: 1, nome: "Alyvia Kelley", status: "Activo", statusColor: "green", email: "a.kelley@gmail.com", data: "06/18/1978" },
    { id: 2, nome: "Jaiden Nixon", status: "Activo", statusColor: "green", email: "jaiden.n@gmail.com", data: "09/30/1963" },
    { id: 3, nome: "Ace Foley", status: "Activo", statusColor: "red", email: "ace.fo@yahoo.com", data: "12/09/1985" },
    { id: 4, nome: "Nikolai Schmidt", status: "Inactivo", statusColor: "red", email: "nikolai.schmidt1964@outlook.com", data: "03/22/1956" },
    { id: 5, nome: "Clayton Charles", status: "Activo", statusColor: "green", email: "me@clayton.com", data: "10/14/1971" },
    { id: 6, nome: "Prince Chen", status: "Activo", statusColor: "green", email: "prince.chen1997@gmail.com", data: "07/05/1992" },
    { id: 7, nome: "Reece Duran", status: "Activo", statusColor: "green", email: "reece@yahoo.com", data: "05/26/1980" },
    { id: 8, nome: "Anastasia Mcdaniel", status: "Inactivo", statusColor: "red", email: "anastasia.spring@mcdaniel12.com", data: "02/11/1968" },
    { id: 9, nome: "Melvin Boyle", status: "Inativo", statusColor: "red", email: "Me.boyle@gmail.com", data: "08/03/1974" },
    { id: 10, nome: "Kailee Thomas", status: "Inativo", statusColor: "red", email: "Kailee.thomas@gmail.com", data: "11/28/1954" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("Dados do formulário:", formData);
    setShowModal(false);
    // Aqui você adicionaria a lógica para salvar o usuário
  };

  const handleCancel = () => {
    setShowModal(false);
    setFormData({
      nome: "",
      dataNascimento: "",
      genero: "",
      numeroIdentificacao: "",
      tipoUsuario: "",
      statusConta: "Ativo"
    });
  };

  return (
    <main className="flex-1 bg-gray-50 p-8 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Header com imagem */}
        <div className="bg-white rounded-2xl mb-6 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuários</h1>
              <p className="text-gray-600">Gerencie os usuários cadastrados</p>
            </div>
            <div className="w-96 h-32 bg-gradient-to-r from-teal-400 to-teal-600"></div>
          </div>
        </div>

        {/* Barra de ações */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#44B16F] text-[#44B16F] rounded-lg font-medium hover:bg-[#44B16F]/5 transition-colors"
          >
            <Plus size={20} />
            ADD NOVO USUÁRIO
          </button>

          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar usuário"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent w-80"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-16">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Nome completo
                    <div className="flex flex-col gap-0.5">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-300"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Estado
                    <div className="flex flex-col gap-0.5">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-300"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Email
                    <div className="flex flex-col gap-0.5">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-300"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Data de criação
                    <div className="flex flex-col gap-0.5">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-300"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{usuario.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{usuario.nome}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${usuario.statusColor === 'green' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm text-gray-700">{usuario.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{usuario.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{usuario.data}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Trash2 size={18} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>

            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#44B16F] text-white font-medium">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors">
                3
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors">
                4
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#44B16F]">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
              <span className="text-sm text-gray-600">/Páginas</span>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Adicionar Usuário */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop com blur */}
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={handleCancel}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
                <button 
                  onClick={handleCancel}
                  className="absolute left-8 top-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span className="text-lg">←</span>
                  <span className="font-medium">Voltar</span>
                </button>
                
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">Adicionar um novo usuário</h2>
                  <p className="text-gray-500 mt-1">crie o perfil do novo usuário</p>
                </div>
              </div>

              {/* Form */}
              <div className="px-8 py-8">
                <div className="grid grid-cols-2 gap-6">
                  {/* Nome completo */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Ex. Lavadeira de roupas"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                    />
                  </div>

                  {/* Data de nascimento */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de nascimento
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Gênero */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gênero
                    </label>
                    <select
                      name="genero"
                      value={formData.genero}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Selecione um gênero</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  {/* Tipo de usuário */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de usuário
                    </label>
                    <select
                      name="tipoUsuario"
                      value={formData.tipoUsuario}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Selecione um tipo</option>
                      <option value="admin">Administrador</option>
                      <option value="user">Usuário</option>
                      <option value="moderator">Moderador</option>
                    </select>
                  </div>

                  {/* Número de identificação */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de identificação (BI/CC)
                    </label>
                    <input
                      type="text"
                      name="numeroIdentificacao"
                      value={formData.numeroIdentificacao}
                      onChange={handleInputChange}
                      placeholder="234365PT46667"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                    />
                  </div>

                  {/* Status da conta */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status da conta
                    </label>
                    <select
                      name="statusConta"
                      value={formData.statusConta}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-[#44B16F] text-white rounded-lg font-medium hover:bg-[#3a9d5f] transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}