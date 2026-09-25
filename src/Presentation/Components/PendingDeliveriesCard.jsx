import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, ArrowRight, PackageCheck } from "lucide-react";
import { useAcquisitions } from "../../hooks/queries";
import { getErrorMessage } from "../../utils/apiHelpers";
import {
    getSupplierDisplayName,
    getRequestPpRef,
    isAwaitingDelivery,
    daysUntilDelivery,
    getDeliveryDeadlineInfo,
    DEADLINE_TONE_CLASSES,
} from "../../utils/acquisitions";
import ModalConfirmarEntrega from "./ModalConfirmarEntrega";
import { ErrorState } from "./ui/StateViews";

const MAX_ITEMS = 5;

const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-PT");
};

/**
 * Painel: aquisições a aguardar entrega, das mais urgentes (atrasadas) para as menos urgentes,
 * com confirmação de entrega directa.
 */
export default function PendingDeliveriesCard({ refetchInterval }) {
    const navigate = useNavigate();
    const [target, setTarget] = useState(null);
    const { data: acquisitions = [], isLoading, isError, error, refetch, isFetching } = useAcquisitions({
        refetchInterval,
        refetchIntervalInBackground: false,
    });

    const pending = useMemo(() => acquisitions
        .filter(isAwaitingDelivery)
        .sort((a, b) => (daysUntilDelivery(a) ?? Infinity) - (daysUntilDelivery(b) ?? Infinity)),
    [acquisitions]);

    const overdueCount = pending.filter((a) => (daysUntilDelivery(a) ?? 0) < 0).length;

    return (
        <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                <div className="flex items-center gap-2">
                    <Truck size={18} className="text-orange-500" />
                    <h3 className="font-bold" style={{ color: "var(--color-text-primary)" }}>Entregas Pendentes</h3>
                    {pending.length > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            {pending.length}
                        </span>
                    )}
                    {overdueCount > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            {overdueCount} {overdueCount === 1 ? "atrasada" : "atrasadas"}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => navigate("/aquisicoes?tab=lista_aquisicoes&sort=prevista&dir=asc")}
                    className="text-sm font-semibold flex items-center gap-1 hover:underline"
                    style={{ color: "var(--color-primary)" }}
                >
                    Ver todas <ArrowRight size={14} />
                </button>
            </div>

            {isLoading ? (
                <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--color-border-light)" }} />)}
                </div>
            ) : isError && acquisitions.length === 0 ? (
                <ErrorState message={getErrorMessage(error, "Erro ao carregar as entregas pendentes.")} onRetry={refetch} isRetrying={isFetching} />
            ) : pending.length === 0 ? (
                <div className="flex items-center gap-3 px-6 py-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <PackageCheck size={20} className="text-green-500" />
                    Não há entregas pendentes.
                </div>
            ) : (
                <ul>
                    {pending.slice(0, MAX_ITEMS).map((acq) => {
                        const deadline = getDeliveryDeadlineInfo(acq);
                        const requestId = acq.quotation_request_id ?? acq.quotation_request?.id;
                        return (
                            <li
                                key={acq.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5"
                                style={{ borderBottom: "1px solid var(--color-border-light)" }}
                            >
                                <button
                                    type="button"
                                    onClick={() => requestId != null && navigate(`/aquisicoes?pedido=${encodeURIComponent(requestId)}`)}
                                    className="text-left min-w-0 flex-1"
                                    title="Abrir o pedido de cotação"
                                >
                                    <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                                        {acq.quotation_request?.title || getRequestPpRef(acq.quotation_request) || "Aquisição"}
                                    </p>
                                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                                        {getRequestPpRef(acq.quotation_request) ? `Ref. PP: ${getRequestPpRef(acq.quotation_request)} · ` : ""}
                                        {getSupplierDisplayName(acq.supplier) || "Fornecedor"}
                                        {" · prevista "}{formatDate(acq.expected_delivery_date)}
                                    </p>
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${DEADLINE_TONE_CLASSES[deadline.tone]}`}>
                                        {deadline.label}
                                    </span>
                                    <button
                                        onClick={() => setTarget(acq)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-700 hover:bg-orange-50 border border-orange-200 whitespace-nowrap"
                                    >
                                        <Truck size={14} />
                                        Confirmar entrega
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                    {pending.length > MAX_ITEMS && (
                        <li className="px-6 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                            e mais {pending.length - MAX_ITEMS} {pending.length - MAX_ITEMS === 1 ? "entrega" : "entregas"} pendentes…
                        </li>
                    )}
                </ul>
            )}

            <ModalConfirmarEntrega
                isOpen={!!target}
                acquisition={target}
                onClose={() => setTarget(null)}
            />
        </div>
    );
}
