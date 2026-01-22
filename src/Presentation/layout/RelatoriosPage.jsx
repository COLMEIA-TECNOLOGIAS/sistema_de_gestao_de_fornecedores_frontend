import { Package, Zap, Users, FileText } from 'lucide-react';

export default function RelatoriosPage() {
  // Dados de exemplo para os cards
  const statsCards = [
    {
      id: 1,
      title: 'Total de serviços',
      value: '3560',
      icon: Package,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      id: 2,
      title: 'Receita Mensal',
      value: '€360,32',
      icon: Zap,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      id: 3,
      title: 'Avaliações de clientes',
      value: '3560',
      icon: FileText,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      id: 4,
      title: 'Total de clientes',
      value: '23k',
      icon: Users,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Relatórios
          </h1>
          <p className="text-gray-600">Acompanhe o desempenho das atividades realizadas</p>
        </div>
        <div className="hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop"
            alt="Analytics"
            className="w-96 h-32 object-cover rounded-xl"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-xl`}>
                  <Icon className={`${card.iconColor} w-6 h-6`} />
                </div>
                <button className="px-4 py-1.5 bg-[#44B16F] text-white text-sm rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium">
                  Gerar relatório
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">Desempenho Mensal</h3>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20">
              <option>2024</option>
              <option>2023</option>
              <option>2022</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-around gap-2">
            {[
              { month: 'Jan', height: 65, value: 2300 },
              { month: 'Fev', height: 45, value: 1600 },
              { month: 'Mar', height: 80, value: 2900 },
              { month: 'Abr', height: 55, value: 1950 },
              { month: 'Mai', height: 90, value: 3200 },
              { month: 'Jun', height: 70, value: 2500 },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full group">
                  <div
                    className="w-full bg-gradient-to-t from-[#44B16F] to-[#5ac785] rounded-t-lg hover:from-[#3a9d5f] hover:to-[#4ab675] transition-all cursor-pointer"
                    style={{ height: `${item.height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.value}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status de Cotações */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-6 text-lg">Status de Cotações</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Aprovadas</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 min-w-[45px] text-right">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Pendentes</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 min-w-[45px] text-right">15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Rejeitadas</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '10%' }}></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 min-w-[45px] text-right">10%</span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">225</p>
              <p className="text-xs text-gray-600 mt-1">Aprovadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">45</p>
              <p className="text-xs text-gray-600 mt-1">Pendentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">30</p>
              <p className="text-xs text-gray-600 mt-1">Rejeitadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-6 text-lg">Atividades Recentes</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 px-4 rounded-lg transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Nova cotação criada</p>
                <p className="text-xs text-gray-500">Tech Solutions Lda - há 2 horas</p>
              </div>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">Pendente</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 px-4 rounded-lg transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Cotação aprovada</p>
                <p className="text-xs text-gray-500">Global Imports - há 5 horas</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">Aprovado</span>
          </div>
          <div className="flex items-center justify-between py-3 hover:bg-gray-50 px-4 rounded-lg transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Fornecedor cadastrado</p>
                <p className="text-xs text-gray-500">Angola Tech Group - há 1 dia</p>
              </div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">Completo</span>
          </div>
        </div>
      </div>
    </div>
  );
}