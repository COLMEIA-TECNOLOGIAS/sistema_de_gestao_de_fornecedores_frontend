
import { useState, useEffect } from 'react';
import { Package, Zap, Users, FileText, Calendar, Download, TrendingUp, AlertCircle, ShoppingCart, RefreshCw } from 'lucide-react';
import { reportsAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RelatoriosPage() {
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize dates based on period
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    let end = new Date(today);

    if (period === 'weekly') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
    } else if (period === 'monthly') {
      start.setDate(1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'yearly') {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  }, [period]);

  // Fetch report data
  useEffect(() => {
    fetchReport();
  }, [dateRange, period]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        period: period === 'custom' ? undefined : period,
        start_date: dateRange.start, // Send anyway for confirmation or custom
        end_date: dateRange.end
      };

      const data = await reportsAPI.getSummary(params);
      setReportData(data);
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
      setError("Falha ao carregar os dados do relatório.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData) return;

    setIsLoading(true);
    try {
      const doc = new jsPDF();

      // --- Header ---
      // Brand Colors
      const brandGreen = '#44B16F';
      const brandDark = '#111827';

      // Header Background
      doc.setFillColor(brandDark);
      doc.rect(0, 0, 210, 40, 'F');

      // Logo Loading
      try {
        const logoUrl = '/login1.svg';
        await new Promise((resolve) => {
          const img = new Image();
          img.src = logoUrl;
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = 500;
              canvas.height = 500;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, 500, 500);
              const dataUrl = canvas.toDataURL('image/png');
              doc.addImage(dataUrl, 'PNG', 14, 8, 24, 24);

              // Text drawn next to logo
              doc.setFontSize(22);
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.text("MOSAP3", 42, 19);

              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(200, 200, 200);
              doc.text("Sistema de Gestão de Fornecedores", 42, 26);
            } catch (err) {
              // Fallback
              doc.setFontSize(22);
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.text("MOSAP3", 14, 20);

              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(200, 200, 200);
              doc.text("Sistema de Gestão de Fornecedores", 14, 28);
            }
            resolve();
          };
          img.onerror = () => {
            // Fallback
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text("MOSAP3", 14, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 200, 200);
            doc.text("Sistema de Gestão de Fornecedores", 14, 28);
            resolve();
          };
        });
      } catch (e) {
        // Fallback
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text("MOSAP3", 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 200, 200);
        doc.text("Sistema de Gestão de Fornecedores", 14, 28);
      }

      // Report Info
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Relatório Executivo", 196, 20, { align: 'right' });

      const periodLabel = period === 'weekly' ? 'Semanal' : period === 'monthly' ? 'Mensal' : period === 'yearly' ? 'Anual' : 'Personalizado';
      doc.setTextColor(brandGreen);
      doc.text(periodLabel.toUpperCase(), 196, 26, { align: 'right' });

      const dateStr = `${new Date(reportData.period?.start || dateRange.start).toLocaleDateString('pt-AO')} - ${new Date(reportData.period?.end || dateRange.end).toLocaleDateString('pt-AO')}`;
      doc.setTextColor(156, 163, 175);
      doc.text(dateStr, 196, 32, { align: 'right' });

      let currentY = 50;

      // --- Metrics Table ---
      doc.setFontSize(14);
      doc.setTextColor(brandDark);
      doc.setFont('helvetica', 'bold');
      doc.text("Métricas Gerais", 14, currentY);
      currentY += 5;

      const metricsData = [
        ['Total Gasto', formatCurrency(reportData.metrics?.total_spent)],
        ['Total Aquisições', reportData.metrics?.total_acquisitions || 0],
        ['Ticket Médio', formatCurrency(reportData.metrics?.avg_ticket)],
        ['Pendentes', reportData.metrics?.pending_count || 0]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [68, 177, 111], textColor: 255, fontStyle: 'bold' }, // Brand Green
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { halign: 'right' }
        }
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // --- Top Products Table ---
      doc.setFontSize(14);
      doc.setTextColor(brandDark);
      doc.text("Top Produtos Adquiridos", 14, currentY);
      currentY += 5;

      const productsData = reportData.top_products?.map(p => [
        p.name,
        p.quantity,
        formatCurrency(p.total)
      ]) || [];

      if (productsData.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Produto', 'Qtd', 'Total']],
          body: productsData,
          theme: 'striped',
          headStyles: { fillColor: [17, 24, 39], textColor: 255 }, // Dark
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' }
          }
        });
        currentY = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text("Nenhum produto registrado neste período.", 14, currentY + 10);
        currentY += 20;
      }

      // --- Footer ---
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em ${new Date().toLocaleString('pt-AO')} - MOSAP3`, 105, pageHeight - 10, { align: 'center' });

      doc.save(`relatorio_${period}_${dateRange.start}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setError("Erro ao gerar PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    if (period !== 'custom') setPeriod('custom');
  };

  // Helper for currency formatting
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Header and Controls (Visible on Screen) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Relatórios</h1>
            <p className="text-gray-500 mt-2">Análise detalhada e métricas de desempenho</p>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm"
          >
            {isLoading ? '...' : <Download size={16} />}
            PDF
          </button>
        </div>


        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="hidden lg:flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium"
          >
            {isLoading ? 'Gerando...' : (
              <>
                <Download size={18} />
                Exportar PDF
              </>
            )}
          </button>

          <div className="w-px h-8 bg-gray-300 mx-2 hidden lg:block"></div>

          <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex items-center shadow-sm">
            {['weekly', 'monthly', 'yearly', 'custom'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p
                  ? 'bg-[#44B16F] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {p === 'weekly' ? 'Semanal' :
                  p === 'monthly' ? 'Mensal' :
                    p === 'yearly' ? 'Anual' : 'Personalizado'}
              </button>
            ))}
          </div>

          {(period === 'custom' || true) && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
              <input
                type="date"
                name="start"
                value={dateRange.start}
                onChange={handleDateChange}
                className="border-none bg-transparent text-sm text-gray-700 focus:ring-0"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                name="end"
                value={dateRange.end}
                onChange={handleDateChange}
                className="border-none bg-transparent text-sm text-gray-700 focus:ring-0"
              />
            </div>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
          <div className="h-96 md:col-span-2 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-96 md:col-span-2 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      )}

      {/* REPORT CONTENT */}
      {!isLoading && reportData && (
        <div className="space-y-8 bg-transparent">


          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Gasto</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(reportData.metrics?.total_spent)}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <ShoppingCart size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Aquisições</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {reportData.metrics?.total_acquisitions || 0}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <Zap size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Ticket Médio</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(reportData.metrics?.avg_ticket)}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <FileText size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Pendentes</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {reportData.metrics?.pending_count || 0}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Over Time (Placeholder logic since API return empty for now) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Evolução de Gastos</h3>
              {reportData.charts?.spending_over_time?.length > 0 ? (
                <div className="h-64 flex items-end justify-center gap-4">
                  {/* Simple Bar Chart Implementation */}
                  {reportData.charts.spending_over_time.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className="w-12 bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors"
                        style={{ height: `${((item.value || 0) / (Math.max(...reportData.charts.spending_over_time.map(i => i.value || 0)) || 1)) * 100}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">{item.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Sem dados para o período
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Top Produtos</h3>
              <div className="space-y-4">
                {reportData.top_products?.length > 0 ? (
                  reportData.top_products.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{prod.name}</p>
                          <p className="text-xs text-gray-500">{prod.quantity} unidades</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(prod.total)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}