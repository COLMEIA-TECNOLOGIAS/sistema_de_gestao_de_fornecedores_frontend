import { useMemo, useState } from 'react';
import { Zap, Users, FileText, Calendar, Download, AlertCircle, ShoppingCart, RefreshCw } from 'lucide-react';
import RefreshButton from '../Components/ui/RefreshButton';
import { ErrorState, StaleDataBanner } from '../Components/ui/StateViews';
import { useReportSummary } from '../../hooks/queries';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/apiHelpers';

// Formata uma data como YYYY-MM-DD no fuso horário local.
// (toISOString() converte para UTC e, em Angola (UTC+1), recua um dia às 00:00.)
const toLocalISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Converte YYYY-MM-DD para dd/mm/aaaa sem passar por UTC
const formatISODate = (iso) => {
  if (!iso) return '-';
  const [y, m, d] = String(iso).split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(iso);
};

const PERIOD_LABELS = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
  custom: 'Personalizado',
};

const PERIODS = ['weekly', 'monthly', 'yearly', 'custom'];

// Período e intervalo personalizado guardados no URL (?periodo=custom&de=2026-01-01&ate=2026-01-31)
const FILTER_DEFAULTS = { periodo: 'monthly', de: '', ate: '' };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isISODate = (value) => ISO_DATE_RE.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

const getPeriodRange = (p) => {
  const today = new Date();
  let start = new Date(today);
  let end = new Date(today);

  if (p === 'weekly') {
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Semana começa à segunda-feira
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  } else if (p === 'monthly') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (p === 'yearly') {
    start = new Date(today.getFullYear(), 0, 1);
    end = new Date(today.getFullYear(), 11, 31);
  }

  return {
    start: toLocalISODate(start),
    end: toLocalISODate(end)
  };
};

// Desenha o título do cabeçalho do PDF (usado quando o logótipo não pode ser carregado)
const drawHeaderTitle = (doc, x, titleY, subtitleY) => {
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("MOSAP3", x, titleY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text("Sistema de Gestão de Fornecedores", x, subtitleY);
};

export default function RelatoriosPage() {
  const toast = useToast();
  const { filters, setFilters } = useUrlFilters(FILTER_DEFAULTS);
  const [isExporting, setIsExporting] = useState(false);

  const period = PERIODS.includes(filters.periodo) ? filters.periodo : FILTER_DEFAULTS.periodo;

  // Para períodos pré-definidos o intervalo é calculado; no personalizado usa as datas do URL
  const presetRange = getPeriodRange(period === 'custom' ? 'monthly' : period);
  const effectiveRange = period === 'custom'
    ? { start: filters.de || presetRange.start, end: filters.ate || presetRange.end }
    : presetRange;
  const isRangeInvalid = !isISODate(effectiveRange.start) || !isISODate(effectiveRange.end) || effectiveRange.start > effectiveRange.end;
  const rangeError = isRangeInvalid
    ? (effectiveRange.start > effectiveRange.end
      ? "A data de início não pode ser posterior à data de fim."
      : "Seleccione um intervalo de datas válido.")
    : null;

  const params = useMemo(() => ({
    ...(period === 'custom' ? {} : { period }),
    start_date: effectiveRange.start,
    end_date: effectiveRange.end,
  }), [period, effectiveRange.start, effectiveRange.end]);

  const {
    data: reportData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    dataUpdatedAt,
    isPlaceholderData,
  } = useReportSummary(params, { enabled: !isRangeInvalid });

  const handleSelectPeriod = (p) => {
    if (p === period) return;
    if (p === 'custom') {
      // Ao mudar para personalizado, parte do intervalo actualmente visível
      setFilters({ periodo: 'custom', de: effectiveRange.start, ate: effectiveRange.end });
    } else {
      setFilters({ periodo: p, de: '', ate: '' });
    }
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    if (isRangeInvalid) {
      toast.error(rangeError);
      return;
    }
    setIsExporting(true);
    try {
      // Buscar dados actualizados do relatório para o período/filtros actualmente seleccionados
      const result = await refetch();
      if (result.isError) throw result.error;
      const data = result.data || {};

      // Bibliotecas de PDF (~400 KB) só são descarregadas quando se exporta
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF();

      // --- Header ---
      // Brand Colors
      const brandGreen = '#44B16F';
      const brandDark = '#111827';

      // Header Background
      doc.setFillColor(brandDark);
      doc.rect(0, 0, 210, 40, 'F');

      // Logo Loading
      await new Promise((resolve) => {
        const img = new Image();
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
            drawHeaderTitle(doc, 42, 19, 26);
          } catch {
            drawHeaderTitle(doc, 14, 20, 28);
          }
          resolve();
        };
        img.onerror = () => {
          drawHeaderTitle(doc, 14, 20, 28);
          resolve();
        };
        img.src = '/login1.svg';
      });

      // Report Info
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Relatório Executivo", 196, 20, { align: 'right' });

      const periodLabel = PERIOD_LABELS[period] || 'Personalizado';
      doc.setTextColor(brandGreen);
      doc.text(periodLabel.toUpperCase(), 196, 26, { align: 'right' });

      const dateStr = `${formatISODate(params.start_date)} - ${formatISODate(params.end_date)}`;
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
        ['Total de Cotações', data.metrics?.total_quotations || 0],
        ['Cotações Enviadas', data.metrics?.sent_quotations || 0],
        ['Licitantes Registados', data.metrics?.total_suppliers || 0],
        ['Total Aquisições', data.metrics?.total_acquisitions || 0],
        ['Pendentes', data.metrics?.pending_count || 0],
        ['Concluídas', data.metrics?.completed_count || 0]
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

      // --- Footer ---
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em ${new Date().toLocaleString('pt-AO')} - MOSAP3`, 105, pageHeight - 10, { align: 'center' });

      doc.save(`relatorio_${period}_${params.start_date}.pdf`);
      toast.success("Relatório PDF gerado com sucesso.");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast.error(err?.isAxiosError || err?.response ? getErrorMessage(err, "Erro ao gerar o PDF.") : "Erro ao gerar o PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      periodo: 'custom',
      de: name === 'start' ? value : effectiveRange.start,
      ate: name === 'end' ? value : effectiveRange.end,
    });
  };

  const hasData = !!reportData;
  const busy = isFetching || isExporting;

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
            disabled={busy || isRangeInvalid}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm disabled:opacity-60"
          >
            {isExporting ? '...' : <Download size={16} />}
            PDF
          </button>
        </div>


        <div className="flex flex-wrap items-center gap-3">
          <RefreshButton
            onClick={() => { if (!isRangeInvalid && !isExporting) refetch(); }}
            isFetching={isFetching}
            updatedAt={isRangeInvalid ? undefined : dataUpdatedAt}
          />

          <button
            onClick={handleExportPDF}
            disabled={busy || isRangeInvalid}
            className="hidden lg:flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium disabled:opacity-60"
          >
            {isExporting ? 'A gerar...' : (
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
                onClick={() => handleSelectPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p
                  ? 'bg-[#44B16F] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
              <input
                type="date"
                name="start"
                value={effectiveRange.start}
                max={effectiveRange.end || undefined}
                aria-label="Data de início"
                onChange={handleDateChange}
                className="border-none bg-transparent text-sm text-gray-700 focus:ring-0"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                name="end"
                value={effectiveRange.end}
                min={effectiveRange.start || undefined}
                aria-label="Data de fim"
                onChange={handleDateChange}
                className="border-none bg-transparent text-sm text-gray-700 focus:ring-0"
              />
            </div>
          )}
        </div>
      </div>

      {/* Intervalo de datas inválido */}
      {rangeError && (
        <div role="alert" className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          {rangeError}
        </div>
      )}

      {/* Falha numa actualização com dados antigos em ecrã */}
      {!isRangeInvalid && isError && hasData && (
        <StaleDataBanner onRetry={refetch} isRetrying={isFetching} />
      )}

      {/* Falha sem dados para mostrar */}
      {!isRangeInvalid && isError && !hasData && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <ErrorState message={getErrorMessage(error, "Falha ao carregar os dados do relatório.")} onRetry={refetch} isRetrying={isFetching} />
        </div>
      )}

      {/* LOADING STATE */}
      {!isRangeInvalid && isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
          <div className="h-96 md:col-span-2 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-96 md:col-span-2 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      )}

      {/* REPORT CONTENT */}
      {!isRangeInvalid && !isLoading && reportData && (
        <div
          className={`space-y-8 bg-transparent transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
          aria-busy={isPlaceholderData || undefined}
        >
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Total de Cotações */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <FileText size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total de Cotações</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {reportData.metrics?.total_quotations || 0}
              </h3>
            </div>

            {/* Cotações Enviadas */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <RefreshCw size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Cotações Enviadas</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {reportData.metrics?.sent_quotations || 0}
              </h3>
            </div>

            {/* Licitantes Registados */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Licitantes Registados</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {reportData.metrics?.total_suppliers || 0}
              </h3>
            </div>

            {/* Total Aquisições */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShoppingCart size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Aquisições</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {reportData.metrics?.total_acquisitions || 0}
              </h3>
            </div>

            {/* Pendentes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Calendar size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Pendentes</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {reportData.metrics?.pending_count || 0}
              </h3>
            </div>

            {/* Concluídas */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <Zap size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Concluídas</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {reportData.metrics?.completed_count || 0}
              </h3>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}