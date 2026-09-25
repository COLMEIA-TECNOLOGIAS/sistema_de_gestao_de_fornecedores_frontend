/**
 * Notificações do processo de negociação (propostas, revisões, aprovações).
 * O backend envia título e mensagem completos para estes tipos — devem ser mostrados tal como vêm.
 */
export const NEGOTIATION_NOTIFICATION_TYPES = {
    quotation_response_submitted: 'Nova proposta',
    quotation_response_revised: 'Proposta revista',
    quotation_declined: 'Convite declinado',
    revision_requested: 'Revisão solicitada',
    proposal_approved: 'Proposta aprovada',
    proposal_rejected: 'Proposta rejeitada',
};

export function isNegotiationNotification(notification) {
    const type = String(notification?.type || notification?.data?.type || '');
    return type in NEGOTIATION_NOTIFICATION_TYPES;
}

export function getNegotiationLabel(notification) {
    const type = String(notification?.type || notification?.data?.type || '');
    return NEGOTIATION_NOTIFICATION_TYPES[type] || 'Negociação';
}

/**
 * Ligação interna do painel para o pedido de cotação da notificação (ou null).
 */
export function getNotificationLink(notification) {
    const data = notification?.data || {};
    const requestId = data.quotation_request_id ?? data.quotation_id;
    if (requestId === undefined || requestId === null || requestId === '') return null;
    return `/aquisicoes?pedido=${encodeURIComponent(requestId)}`;
}
