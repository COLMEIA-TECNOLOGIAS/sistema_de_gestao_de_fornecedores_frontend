export default function RelatoriosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Relatórios & Análises</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Desempenho Mensal</h3>
          <div className="h-48 flex items-end justify-around gap-2">
            {[65, 45, 80, 55, 90, 70].map((height, i) => (
              <div key={i} className="flex-1 bg-[#44B16F] rounded-t hover:bg-[#3a9d5f] transition-colors" style={{height: `${height}%`}}></div>
            ))}
          </div>
          <div className="flex justify-around mt-2 text-xs text-gray-600">
            <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Status de Cotações</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Aprovadas</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{width: "75%"}}></div>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pendentes</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{width: "15%"}}></div>
                </div>
                <span className="text-sm font-medium">15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rejeitadas</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{width: "10%"}}></div>
                </div>
                <span className="text-sm font-medium">10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Nova cotação criada</p>
              <p className="text-xs text-gray-600">Tech Solutions Lda - há 2 horas</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Pendente</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Cotação aprovada</p>
              <p className="text-xs text-gray-600">Global Imports - há 5 horas</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Aprovado</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">Fornecedor cadastrado</p>
              <p className="text-xs text-gray-600">Angola Tech Group - há 1 dia</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Completo</span>
          </div>
        </div>
      </div>
    </div>
  );
}