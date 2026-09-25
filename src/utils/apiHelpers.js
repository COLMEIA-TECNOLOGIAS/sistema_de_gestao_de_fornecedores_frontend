/**
 * Utilitários partilhados para lidar com as respostas e erros da API.
 */

/**
 * Normaliza uma resposta de lista para array.
 * Aceita: [...], { data: [...] }, { data: { data: [...] } }.
 */
export function toArray(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.data?.data)) return value.data.data;
    return [];
}

/**
 * Desembrulha um objecto que pode vir como { data: {...} }.
 */
export function unwrap(value) {
    if (value && typeof value === 'object' && !Array.isArray(value) && value.data && typeof value.data === 'object' && !Array.isArray(value.data)) {
        return value.data;
    }
    return value;
}

/**
 * Extrai os metadados de paginação de uma resposta paginada (Laravel).
 * @returns {{ currentPage: number, lastPage: number, total: number, perPage: number } | null}
 */
export function getPagination(value) {
    const source = value?.meta ?? value;
    if (!source || typeof source !== 'object' || source.last_page === undefined) return null;
    return {
        currentPage: Number(source.current_page) || 1,
        lastPage: Number(source.last_page) || 1,
        total: Number(source.total) || 0,
        perPage: Number(source.per_page) || 0,
    };
}

/**
 * Erros de validação (422) por campo, já convertidos para string.
 * @returns {Record<string, string>}
 */
export function getFieldErrors(error) {
    const errors = error?.response?.data?.errors;
    if (!errors || typeof errors !== 'object') return {};
    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages[0] : String(messages),
        ])
    );
}

/**
 * Mensagem de erro legível (pt-PT) para qualquer erro de pedido.
 */
export function getErrorMessage(error, fallback = 'Ocorreu um erro inesperado. Tente novamente.') {
    if (!error) return fallback;

    // Sem resposta do servidor: rede em baixo, timeout ou CORS
    if (!error.response) {
        if (error.code === 'ECONNABORTED') return 'O servidor demorou demasiado a responder. Tente novamente.';
        if (error.code === 'ERR_CANCELED') return 'Pedido cancelado.';
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return 'Sem ligação à Internet. Verifique a sua ligação.';
        }
        if (error.request) return 'Não foi possível contactar o servidor. Verifique a sua ligação.';
        return error.message || fallback;
    }

    const { status, data } = error.response;

    // Validação: mostrar o primeiro erro de campo (mais útil que a mensagem genérica do Laravel)
    const fieldErrors = Object.values(getFieldErrors(error));
    if (status === 422 && fieldErrors.length > 0) return fieldErrors[0];

    const serverMessage = typeof data === 'string' ? null : (data?.message || data?.error);
    if (serverMessage && typeof serverMessage === 'string') return serverMessage;

    switch (status) {
        case 400: return 'Pedido inválido.';
        case 401: return 'Sessão expirada. Inicie sessão novamente.';
        case 403: return 'Não tem permissão para realizar esta acção.';
        case 404: return 'O registo não foi encontrado.';
        case 409: return 'Conflito: o registo foi alterado entretanto.';
        case 413: return 'O ficheiro é demasiado grande.';
        case 419: return 'Sessão expirada. Actualize a página.';
        case 429: return 'Demasiados pedidos. Aguarde um momento e tente novamente.';
        default:
            if (status >= 500) return 'Erro no servidor. Tente novamente dentro de instantes.';
            return fallback;
    }
}

/**
 * Normaliza texto para pesquisa: minúsculas, sem acentos, espaços colapsados.
 * Ex.: "Luanda São Paulo" → "luanda sao paulo"
 */
export function normalizeText(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Verifica se algum dos campos contém TODOS os termos da pesquisa
 * (sem acentos, sem distinção de maiúsculas, termos em qualquer ordem).
 */
export function matchesSearch(query, ...fields) {
    const terms = normalizeText(query).split(' ').filter(Boolean);
    if (terms.length === 0) return true;
    const haystack = fields.map(normalizeText).join(' ');
    return terms.every((term) => haystack.includes(term));
}
