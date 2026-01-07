import { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import ModalNovoUsuario from "../Components/ModalNovoUsuario";

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const usuarios = [
    { id: 1, nome: "Alyvia Kelley", estado: "Activo", email: "a.kelley@gmail.com", dataCriacao: "06/18/1978", statusColor: "green" },
    { id: 2, nome: "Jaiden Nixon", estado: "Activo", email: "jaiden.n@gmail.com", dataCriacao: "09/30/1963", statusColor: "green" },
    { id: 3, nome: "Ace Foley", estado: "Activo", email: "ace.fo@yahoo.com", dataCriacao: "12/09/1985", statusColor: "red" },
    { id: 4, nome: "Nikolai Schmidt", estado: "Inactivo", email: "nikolai.schmidt1964@outlook.com", dataCriacao: "03/22/1956", statusColor: "red" },
    { id: 5, nome: "Clayton Charles", estado: "Activo", email: "me@clayton.com", dataCriacao: "10/14/1971", statusColor: "green" },
    { id: 6, nome: "Prince Chen", estado: "Activo", email: "prince.chen1997@gmail.com", dataCriacao: "07/05/1992", statusColor: "green" },
    { id: 7, nome: "Reece Duran", estado: "Activo", email: "reece@yahoo.com", dataCriacao: "05/26/1980", statusColor: "green" },
    { id: 8, nome: "Anastasia Mcdaniel", estado: "Inactivo", email: "anastasia.spring@mcdaniel12.com", dataCriacao: "02/11/1968", statusColor: "red" },
    { id: 9, nome: "Melvin Boyle", estado: "Inativo", email: "Me.boyle@gmail.com", dataCriacao: "08/03/1974", statusColor: "red" },
    { id: 10, nome: "Kalise Thomas", estado: "Inativo", email: "Kalise.thomas@gmail.com", dataCriacao: "11/28/1954", statusColor: "red" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section - Same style as Dashboard */}
      <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Usuários
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Gestão de Usuários
          </h2>
          <p className="text-gray-600">Gerencie os usuários cadastrados no sistema</p>
        </div>
        <div className="hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop"
            alt="Team collaboration"
            className="w-96 h-32 object-cover rounded-xl"
          />
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 text-[#44B16F] border border-[#44B16F] rounded-lg hover:bg-[#44B16F]/5 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ADD NOVO USUÁRIO
        </button>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Pesquisar usuário"
            className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    Nome completo
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    Estado
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Telefone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    Data da criação
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-700">{u.id}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{u.nome}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${u.statusColor === 'green' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-gray-700">{u.estado}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{u.email}</td>
                  <td className="px-6 py-4 text-gray-700">{u.dataCriacao}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ver detalhes">
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                        <Edit size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-[#44B16F] text-white rounded-lg">1</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">2</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">3</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">4</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">...</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">10</button>
            <span className="text-sm text-gray-600 ml-2">/Páginas</span>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal Novo Usuário */}
      <ModalNovoUsuario isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}