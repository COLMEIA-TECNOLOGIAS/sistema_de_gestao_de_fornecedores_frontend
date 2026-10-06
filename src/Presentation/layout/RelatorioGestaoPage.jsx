import { useMemo, useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileType, AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import RefreshButton from '../Components/ui/RefreshButton';
import { ErrorState, StaleDataBanner } from '../Components/ui/StateViews';
import { useManagementReport } from '../../hooks/queries';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/apiHelpers';
import { exportarPDF, exportarCSV, exportarDocx, exportarXlsx, cellValue, colunasVisiveis, formatarDesvio } from '../../utils/relatorioGestao';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Estados que o relatório aceita. "atrasado" não é um estado guardado: é uma
// condição sobre a data de entrega prevista, traduzida pelo backend.
const ESTADOS = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'sent', label: 'Em Cotação' },
    { value: 'in_progress', label: 'Em Execução' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'atrasado', label: 'Em Atraso' },
];

const TIPOS_PERIODO = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' },
];

const anoActual = new Date().getFullYear();
const ANOS = Array.from({ length: 6 }, (_, i) => anoActual - 4 + i);

// Número da semana ISO da data de hoje, para abrir o selector no sítio certo
const semanaISOActual = () => {
    const d = new Date();
    const alvo = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    alvo.setUTCDate(alvo.getUTCDate() + 4 - (alvo.getUTCDay() || 7));
    const inicioAno = new Date(Date.UTC(alvo.getUTCFullYear(), 0, 1));
    return Math.ceil(((alvo - inicioAno) / 86400000 + 1) / 7);
};

const FILTER_DEFAULTS = {
    periodo: 'monthly',
    ano: String(anoActual),
    mes: String(new Date().getMonth() + 1),
    semana: String(semanaISOActual()),
    estados: '',
};

export default function RelatorioGestaoPage() {
    const toast = useToast();
    const { user, userRoleName } = useAuth();
    const { filters, setFilters } = useUrlFilters(FILTER_DEFAULTS);
    const [aExportar, setAExportar] = useState(null);

    const periodo = TIPOS_PERIODO.some((t) => t.value === filters.periodo) ? filters.periodo : 'monthly';
    const estados = useMemo(
        () => (filters.estados ? filters.estados.split(',').filter(Boolean) : []),
        [filters.estados],
    );

    const params = useMemo(() => ({
        period: periodo,
        year: Number(filters.ano) || anoActual,
        ...(periodo === 'monthly' ? { month: Number(filters.mes) || 1 } : {}),
        ...(periodo === 'weekly' ? { week: Number(filters.semana) || 1 } : {}),
        ...(estados.length ? { status: estados } : {}),
    }), [periodo, filters.ano, filters.mes, filters.semana, estados]);

    const {
        data: report, isLoading, isFetching, isError, error, refetch, dataUpdatedAt, isPlaceholderData,
    } = useManagementReport(params);

    // Primeiro signatário do documento — quem está a emitir o relatório.
    const signatario = useMemo(
        () => (user?.name ? { nome: user.name, cargo: userRoleName } : null),
        [user?.name, userRoleName],
    );

    const alternarEstado = (valor) => {
        const novos = estados.includes(valor)
            ? estados.filter((e) => e !== valor)
            : [...estados, valor];
        setFilters({ ...filters, estados: novos.join(',') });
    };

    const exportar = async (formato) => {
        if (aExportar) return;
        setAExportar(formato);
        try {
            // Reconfirma os dados para o período e filtros em ecrã antes de gerar
            const resultado = await refetch();
            if (resultado.isError) throw resultado.error;
            const dados = resultado.data;

            if (!dados?.summary) throw new Error('Não há dados para exportar.');

            if (formato === 'pdf') await exportarPDF(dados, signatario);
            else if (formato === 'docx') await exportarDocx(dados, signatario);
            else if (formato === 'xlsx') await exportarXlsx(dados, signatario);
            else exportarCSV(dados, signatario);

            toast.success(`Relatório exportado em ${formato.toUpperCase()}.`);
        } catch (err) {
            console.error('Erro ao exportar o relatório:', err);
            toast.error(
                err?.isAxiosError || err?.response
                    ? getErrorMessage(err, 'Erro ao exportar o relatório.')
                    : (err?.message || 'Erro ao exportar o relatório.'),
            );
        } finally {
            setAExportar(null);
        }
    };

    const temDados = !!report?.summary;
    const ocupado = isFetching || !!aExportar;
    const seccoes = Object.entries(report?.categories || {}).filter(([, c]) => (c.rows || []).length > 0);
    const porClassificar = report?.performance?.attention_points?.unclassified_processes || 0;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Cabeçalho */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Relatório de Gestão</h1>
                    <p className="text-gray-500 mt-2">
                        Pequenas aquisições por categoria — {report?.report?.period?.label || 'a carregar...'}
                    </p>
                    {report?.report?.scope && (
                        <p className="text-xs text-gray-400 mt-1">Âmbito: {report.report.scope}</p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <RefreshButton onClick={() => !ocupado && refetch()} isFetching={isFetching} updatedAt={dataUpdatedAt} />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportar('pdf')}
                            disabled={ocupado || !temDados}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm disabled:opacity-60"
                        >
                            <Download size={16} />
                            {aExportar === 'pdf' ? 'A gerar...' : 'PDF'}
                        </button>
                        <button
                            onClick={() => exportar('docx')}
                            disabled={ocupado || !temDados}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm disabled:opacity-60"
                        >
                            <FileText size={16} />
                            {aExportar === 'docx' ? 'A gerar...' : 'Word'}
                        </button>
                        <button
                            onClick={() => exportar('xlsx')}
                            disabled={ocupado || !temDados}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm disabled:opacity-60"
                        >
                            <FileSpreadsheet size={16} />
                            {aExportar === 'xlsx' ? 'A gerar...' : 'Excel'}
                        </button>
                        <button
                            onClick={() => exportar('csv')}
                            disabled={ocupado || !temDados}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm disabled:opacity-60"
                        >
                            <FileType size={16} />
                            {aExportar === 'csv' ? 'A gerar...' : 'CSV'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Período e filtros */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-200 flex items-center">
                        {TIPOS_PERIODO.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setFilters({ ...filters, periodo: t.value })}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${periodo === t.value ? 'bg-[#44B16F] text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* O documento pede que cada opção abra um calendário para
                        escolher exactamente o período pretendido. */}
                    {periodo === 'weekly' && (
                        <label className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Semana</span>
                            <input
                                type="number" min={1} max={53} value={filters.semana}
                                onChange={(e) => setFilters({ ...filters, semana: e.target.value })}
                                className="w-20 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#44B16F]"
                            />
                        </label>
                    )}

                    {periodo === 'monthly' && (
                        <select
                            value={filters.mes}
                            onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#44B16F]"
                        >
                            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                    )}

                    <select
                        value={filters.ano}
                        onChange={(e) => setFilters({ ...filters, ano: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#44B16F]"
                    >
                        {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm text-gray-500 mr-1">Estado:</span>
                    {ESTADOS.map((e) => (
                        <button
                            key={e.value}
                            onClick={() => alternarEstado(e.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${estados.includes(e.value)
                                ? 'bg-[#44B16F] text-white border-[#44B16F]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {e.label}
                        </button>
                    ))}
                    {estados.length > 0 && (
                        <button
                            onClick={() => setFilters({ ...filters, estados: '' })}
                            className="text-xs text-gray-500 underline ml-1"
                        >
                            limpar
                        </button>
                    )}
                </div>
            </div>

            {isError && temDados && <StaleDataBanner onRetry={refetch} isRetrying={isFetching} />}

            {isError && !temDados && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <ErrorState
                        message={getErrorMessage(error, 'Falha ao carregar o relatório.')}
                        onRetry={refetch}
                        isRetrying={isFetching}
                    />
                </div>
            )}

            {isLoading && (
                <div className="space-y-6">
                    <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
                    <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
                </div>
            )}

            {!isLoading && temDados && (
                <div className={`space-y-8 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>

                    {porClassificar > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <strong>{porClassificar}</strong>{' '}
                                {porClassificar === 1 ? 'processo está' : 'processos estão'} por classificar e
                                {porClassificar === 1 ? ' aparece' : ' aparecem'} em “Sem categoria”.
                                Classifique-{porClassificar === 1 ? 'o' : 'os'} para que entre
                                {porClassificar === 1 ? '' : 'm'} nas estatísticas por categoria.
                            </div>
                        </div>
                    )}

                    {/* 1. Resumo executivo */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Resumo Executivo</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {report.summary.total_processes}{' '}
                                {report.summary.total_processes === 1 ? 'processo' : 'processos'} no período
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="text-left font-semibold px-6 py-3">Categoria</th>
                                        <th className="text-right font-semibold px-4 py-3">Concluídos</th>
                                        <th className="text-right font-semibold px-4 py-3">Em Curso</th>
                                        <th className="text-right font-semibold px-6 py-3">Em Atraso</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {report.summary.by_category.map((linha) => (
                                        <tr key={linha.category || 'sem-categoria'} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium text-gray-900">{linha.label}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{linha.completed}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{linha.in_progress}</td>
                                            <td className={`px-6 py-3 text-right font-medium ${linha.late > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                {linha.late}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold text-gray-900">
                                        <td className="px-6 py-3">TOTAL GLOBAL</td>
                                        <td className="px-4 py-3 text-right">{report.summary.total.completed}</td>
                                        <td className="px-4 py-3 text-right">{report.summary.total.in_progress}</td>
                                        <td className="px-6 py-3 text-right">{report.summary.total.late}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 2. Detalhe por categoria */}
                    {seccoes.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                            <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Não há processos no período e filtros seleccionados.</p>
                        </div>
                    ) : seccoes.map(([chave, cat]) => {
                        const colunas = colunasVisiveis(cat.columns);
                        return (
                            <section key={chave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">{cat.label}</h2>
                                            <p className="text-sm text-gray-500 mt-1 max-w-3xl">{cat.description}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                {colunas.map(([k, titulo]) => (
                                                    <th key={k} className="text-left font-semibold px-4 py-3 whitespace-nowrap">
                                                        {titulo}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {cat.rows.map((linha) => (
                                                <tr key={linha.id} className="hover:bg-gray-50">
                                                    {colunas.map(([k]) => (
                                                        <td
                                                            key={k}
                                                            className={`px-4 py-3 text-left ${k === 'code' ? 'font-mono text-xs text-gray-500 whitespace-nowrap' : 'text-gray-700'}`}
                                                        >
                                                            {k === 'status' ? (
                                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${linha.is_late ? 'bg-red-50 text-red-700'
                                                                    : linha.status === 'completed' ? 'bg-green-50 text-green-700'
                                                                        : linha.status === 'cancelled' ? 'bg-gray-100 text-gray-500'
                                                                            : 'bg-blue-50 text-blue-700'
                                                                    }`}>
                                                                    {linha.is_late ? <Clock size={12} />
                                                                        : linha.status === 'completed' ? <CheckCircle2 size={12} /> : null}
                                                                    {cellValue(linha, k)}
                                                                </span>
                                                            ) : cellValue(linha, k)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        );
                    })}

                    {/* 3. Análise de desempenho */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-5">Análise de Desempenho e Conformidade</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Aderência aos prazos</h3>
                                <dl className="space-y-2 text-sm">
                                    <Indicador rotulo="Dias médios até à aprovação" valor={report.performance.deadlines.avg_days_to_approval} />
                                    <Indicador
                                        rotulo="Desvio médio na entrega"
                                        valor={formatarDesvio(report.performance.deadlines.avg_delivery_deviation_days)}
                                    />
                                    <Indicador rotulo="Entregas dentro do prazo" valor={report.performance.deadlines.delivered_on_time} />
                                    <Indicador rotulo="Entregas fora do prazo" valor={report.performance.deadlines.delivered_late} />
                                </dl>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Pontos de atenção</h3>
                                <dl className="space-y-2 text-sm">
                                    <Indicador rotulo="Processos em atraso" valor={report.performance.attention_points.late_processes} alerta />
                                    <Indicador rotulo="Processos cancelados" valor={report.performance.attention_points.cancelled_processes} />
                                    <Indicador rotulo="Sem adjudicação" valor={report.performance.attention_points.without_award} />
                                    <Indicador rotulo="Por classificar" valor={report.performance.attention_points.unclassified_processes} alerta />
                                </dl>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Rastreabilidade</h3>
                                <dl className="space-y-2 text-sm">
                                    <Indicador
                                        rotulo="Cobertura documental"
                                        valor={report.performance.traceability.attachment_coverage_pct}
                                        sufixo="%"
                                    />
                                    <Indicador rotulo="Processos com documentos" valor={report.performance.traceability.processes_with_attachments} />
                                    <Indicador rotulo="Total de processos" valor={report.performance.traceability.processes_total} />
                                </dl>
                            </div>
                        </div>
                    </section>

                    {/* Proveniência: é esta a assinatura que sai nos ficheiros. */}
                    {signatario && (
                        <p className="text-xs text-gray-400 text-right pb-2">
                            Emitido por <span className="font-medium text-gray-500">{signatario.nome}</span>
                            {signatario.cargo ? ` · ${signatario.cargo}` : ''}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function Indicador({ rotulo, valor, sufixo = '', alerta = false }) {
    const vazio = valor === null || valor === undefined;
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="text-gray-500">{rotulo}</dt>
            <dd className={`font-semibold ${alerta && Number(valor) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {vazio ? '—' : `${valor}${sufixo}`}
            </dd>
        </div>
    );
}
