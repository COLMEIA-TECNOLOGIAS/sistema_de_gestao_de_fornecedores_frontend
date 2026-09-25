/**
 * Utilitários partilhados sobre aquisições e entregas.
 */

export const getSupplierDisplayName = (s) => s?.company_name || s?.commercial_name || s?.legal_name || s?.name || '';

/** Referência PP do pedido de cotação (a referência mostrada ao utilizador; nunca o id do sistema). */
export const getRequestPpRef = (request) => request?.reference || request?.activity_description || '';

/** A aquisição ainda aguarda a confirmação de entrega? */
export const isAwaitingDelivery = (acq) =>
    !!acq && !acq.actual_delivery_date && !['completed', 'delivered', 'cancelled'].includes(acq.status);

/** Data local de hoje (YYYY-MM-DD). */
export const todayISO = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Dias até à entrega prevista (negativo = atrasada), ou null sem data.
 */
export const daysUntilDelivery = (acq) => {
    const raw = acq?.expected_delivery_date;
    if (!raw) return null;
    const [y, m, d] = String(raw).slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    const expected = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((expected - today) / 86400000);
};

/** Texto e estilo do prazo de entrega (ex.: "Atrasada 3 dias", "Hoje", "Faltam 5 dias"). */
export const getDeliveryDeadlineInfo = (acq) => {
    const days = daysUntilDelivery(acq);
    if (days === null) return { label: 'Sem data prevista', tone: 'neutral', days };
    if (days < 0) {
        const n = Math.abs(days);
        return { label: `Atrasada ${n} ${n === 1 ? 'dia' : 'dias'}`, tone: 'danger', days };
    }
    if (days === 0) return { label: 'Entrega prevista hoje', tone: 'warning', days };
    if (days <= 3) return { label: `Faltam ${days} ${days === 1 ? 'dia' : 'dias'}`, tone: 'warning', days };
    return { label: `Faltam ${days} dias`, tone: 'neutral', days };
};

export const DEADLINE_TONE_CLASSES = {
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-gray-50 text-gray-600 border-gray-200',
};
