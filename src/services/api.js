import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.mosap3.yetuware.it.ao/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    // Evita pedidos pendurados indefinidamente em redes instáveis
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Endpoints públicos: um 401 aqui significa credenciais/código inválidos,
// não sessão expirada — o erro deve chegar ao formulário.
const PUBLIC_ENDPOINTS = ['/login', '/password/', '/email/'];

// Interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) => url.startsWith(endpoint));

        if (error.response?.status === 401 && !isPublicEndpoint && localStorage.getItem('token')) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('apiPermissions');
            if (window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

// Limite de segurança para não entrar em ciclo se o backend devolver metadados inválidos
const MAX_PAGES = 200;

/**
 * Percorre todas as páginas de um endpoint paginado (Laravel) e devolve um array único.
 * Aceita respostas em array simples ou { data, last_page } / { data, meta: { last_page } }.
 */
async function fetchAllPages(url, { perPage = 100, params = {} } = {}) {
    const all = [];
    let currentPage = 1;
    let lastPage = 1;
    do {
        const response = await api.get(url, { params: { ...params, page: currentPage, per_page: perPage } });
        const payload = response.data;
        const items = Array.isArray(payload)
            ? payload
            : (Array.isArray(payload?.data) ? payload.data : []);
        all.push(...items);
        // Resposta não paginada: já temos tudo
        if (Array.isArray(payload)) break;
        lastPage = Number(payload?.last_page ?? payload?.meta?.last_page ?? currentPage) || currentPage;
        currentPage += 1;
    } while (currentPage <= lastPage && currentPage <= MAX_PAGES);
    return all;
}

// Auth API
export const authAPI = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/logout');
        return response.data;
    },
    // Confirmação de email por código de 6 dígitos
    verifyEmail: async (email, code) => {
        const response = await api.post('/email/verify', { email, code });
        return response.data;
    },
    // Reenviar o código de confirmação de email
    // O utilizador pode não ter sessão iniciada, por isso o email é enviado no corpo
    resendEmailVerification: async (email) => {
        const response = await api.post('/email/resend-verification', email ? { email } : undefined);
        return response.data;
    },
    // Recuperação de senha
    forgotPassword: async (email) => {
        const response = await api.post('/password/forgot', { email });
        return response.data;
    },
    // Validar o código de recuperação (devolve token de curta duração)
    verifyPasswordCode: async (email, code) => {
        const response = await api.post('/password/verify-code', { email, code });
        return response.data;
    },
    // Definir nova senha (aceita código directamente ou o token do verify-code)
    resetPassword: async ({ email, code, token, password, password_confirmation }) => {
        const response = await api.post('/password/reset', {
            email,
            code,
            token,
            password,
            password_confirmation,
        });
        return response.data;
    },
};

// Users API
export const usersAPI = {
    getAll: (perPage = 100) => fetchAllPages('/users', { perPage }),
    create: async (userData) => {
        const response = await api.post('/users', userData);
        return response.data;
    },
    update: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    // Reenviar o código de confirmação (Admin)
    resendVerification: async (userId) => {
        const response = await api.post(`/users/${userId}/resend-verification`);
        return response.data;
    },
};

// Permissions API
export const permissionsAPI = {
    getMyPermissions: async () => {
        const response = await api.get('/user/permissions');
        return response.data;
    },
    getUserPermissions: async (userId) => {
        const response = await api.get(`/users/${userId}/permissions`);
        return response.data;
    },
    updateUserPermissions: async (userId, permissions) => {
        const response = await api.put(`/users/${userId}/permissions`, permissions);
        return response.data;
    },
};

// Suppliers API
export const suppliersAPI = {
    // Busca TODOS os fornecedores, percorrendo todas as páginas da paginação do backend
    getAll: (perPage = 100) => fetchAllPages('/suppliers', { perPage }),
    create: async (supplierData) => {
        // When sending FormData, do NOT set Content-Type manually.
        // Axios will auto-detect FormData and set the correct multipart/form-data boundary.
        const response = await api.post('/suppliers', supplierData, {
            headers: {
                'Content-Type': undefined, // Let axios set it with the proper boundary
            },
        });
        return response.data;
    },
    update: async (id, supplierData) => {
        const response = await api.put(`/suppliers/${id}`, supplierData);
        return response.data;
    },
    updateMultipart: async (id, supplierData) => {
        // For file uploads in PUT, we must use POST with _method=PUT (Laravel/PHP convention)
        // Do NOT set Content-Type manually — axios auto-detects FormData and sets boundary.
        const response = await api.post(`/suppliers/${id}`, supplierData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        return response.data;
    },
    delete: async (id, reason = '') => {
        // Sem motivo (admin): DELETE simples, eliminação directa (204).
        // Com motivo (não-admin): envia { reason } para criar pedido pendente (201).
        const config = reason ? { data: { reason } } : undefined;
        const response = await api.delete(`/suppliers/${id}`, config);
        return { data: response.data, status: response.status };
    },
    getClassification: async (id) => {
        const response = await api.get(`/suppliers/${id}/classification`);
        return response.data;
    },
    invite: async (inviteData) => {
        const response = await api.post('/suppliers/invite', inviteData);
        return response.data;
    },
    approve: async (id) => {
        const response = await api.post(`/suppliers/${id}/approve`);
        return response.data;
    },
    // Visualizar documento do fornecedor (PDF ou imagem)
    getDocument: async (id, documentType, params = {}) => {
        const response = await api.get(`/suppliers/${id}/documents/${documentType}`, {
            params,
            responseType: 'blob',
            headers: { 'Accept': 'application/pdf, image/*' },
        });
        return response;
    },
};

// Quotation Requests API
export const quotationRequestsAPI = {
    getAll: async () => {
        const response = await api.get('/quotation-requests');
        return response.data;
    },
    // Todas as páginas, como array
    listAll: () => fetchAllPages('/quotation-requests'),
    getById: async (id) => {
        const response = await api.get(`/quotation-requests/${id}`);
        return response.data;
    },
    create: async (quotationData) => {
        const response = await api.post('/quotation-requests', quotationData);
        return response.data;
    },
    createWithDocuments: async (formData) => {
        // Axios define multipart/form-data com o boundary correcto para FormData
        const response = await api.post('/quotation-requests', formData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        return response.data;
    },
    update: async (id, quotationData) => {
        const response = await api.put(`/quotation-requests/${id}`, quotationData);
        return response.data;
    },
    delete: async (id, reason = '') => {
        const config = reason ? { data: { reason } } : undefined;
        const response = await api.delete(`/quotation-requests/${id}`, config);
        return { data: response.data, status: response.status };
    },
    // Enviar convites aos fornecedores (só funciona para status 'draft')
    send: async (id) => {
        const response = await api.post(`/quotation-requests/${id}/send`);
        return response.data;
    },
    // Cancelar pedido de cotação
    cancel: async (id) => {
        const response = await api.post(`/quotation-requests/${id}/cancel`);
        return response.data;
    },
};

// Quotation Responses API
export const quotationResponsesAPI = {
    // Listar todas as respostas de cotação
    getAll: async (params = {}) => {
        const response = await api.get('/quotation-responses', { params });
        return response.data;
    },
    // Obter resposta por ID
    getById: async (id) => {
        const response = await api.get(`/quotation-responses/${id}`);
        return response.data;
    },
    // Todas as páginas (cada revisão do fornecedor é uma resposta nova), da mais recente para a mais antiga
    listAll: (params = {}) => fetchAllPages('/quotation-responses', { params }),
    // Aprovar proposta = gerar aquisição, concluir o pedido e rejeitar as restantes propostas em aberto
    approve: async (id, { expected_delivery_date, justification, notes } = {}) => {
        const response = await api.post(`/quotation-responses/${id}/approve`, { expected_delivery_date, justification, notes });
        return response.data;
    },
    // Rejeitar proposta
    reject: async (id, notes) => {
        const response = await api.post(`/quotation-responses/${id}/reject`, { notes });
        return response.data;
    },
    // Solicitar revisão
    requestRevision: async (id, reason, message) => {
        const response = await api.post(`/quotation-responses/${id}/request-revision`, {
            reason,
            message
        });
        return response.data;
    },
    // Gerar aquisição
    createAcquisition: async (id, expected_delivery_date, justification) => {
        const response = await api.post(`/quotation-responses/${id}/create-acquisition`, {
            expected_delivery_date,
            justification
        });
        return response.data;
    },
};

// Categories API
export const categoriesAPI = {
    getAll: async () => {
        const response = await api.get('/categories');
        return response.data;
    },
    create: async (categoryData) => {
        const response = await api.post('/categories', categoryData);
        return response.data;
    },
    update: async (id, categoryData) => {
        const response = await api.put(`/categories/${id}`, categoryData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },
};

// Dashboard API
export const dashboardAPI = {
    getData: async () => {
        const response = await api.get('/dashboard');
        return response.data;
    },
};

// Notifications API
export const notificationsAPI = {
    getAll: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/notifications/${id}`);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },
    markAsRead: async (id) => {
        const response = await api.post(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.post('/notifications/mark-all-read');
        return response.data;
    },
};

// Products API
export const productsAPI = {
    getAll: async (page = 1) => {
        const response = await api.get('/products', { params: { page } });
        return response.data;
    },
    create: async (productData) => {
        const response = await api.post('/products', productData);
        return response.data;
    },
    update: async (id, productData) => {
        const response = await api.put(`/products/${id}`, productData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },
    search: async (query, page = 1) => {
        const response = await api.get('/products', { params: { search: query, page } });
        return response.data;
    },
    getAnalytics: async (id) => {
        const response = await api.get(`/products/${id}/analytics`);
        return response.data;
    },
};

// Acquisitions API
export const acquisitionsAPI = {
    getAll: async (page = 1) => {
        const response = await api.get('/acquisitions', { params: { page } });
        return response.data;
    },
    // Todas as páginas, como array
    listAll: () => fetchAllPages('/acquisitions'),
    getById: async (id) => {
        const response = await api.get(`/acquisitions/${id}`);
        return response.data;
    },
    getStatsProducts: async () => {
        const response = await api.get('/acquisitions/stats/products');
        return response.data;
    },
    confirmDelivery: async (id) => {
        const response = await api.post(`/acquisitions/${id}/confirm-delivery`);
        return response.data;
    },
};

// Reports API
export const reportsAPI = {
    getSummary: async (params) => {
        // params: { period: 'weekly'|'monthly'|'yearly', start_date, end_date }
        const response = await api.get('/reports/summary', { params });
        return response.data;
    },
};

// Audit Logs API
export const auditLogsAPI = {
    getAll: async (params = {}) => {
        const response = await api.get('/audit-logs', { params });
        return response.data;
    },
};

// Pending Deletions API
export const pendingDeletionsAPI = {
    getAll: async (page = 1) => {
        const response = await api.get('/deletion-requests', { params: { page } });
        return response.data;
    },
    // Todas as páginas, como array
    listAll: () => fetchAllPages('/deletion-requests'),
    getById: async (id) => {
        const response = await api.get(`/deletion-requests/${id}`);
        return response.data;
    },
    requestDelete: async (type, id, reason = '') => {
        // O backend usa o mesmo endpoint DELETE do recurso para ambos os casos:
        // - Admin: elimina directamente (204)
        // - Não-admin: cria pedido pendente (201)
        const endpointMap = {
            supplier: `/suppliers/${id}`,
            quotation_request: `/quotation-requests/${id}`,
        };
        const endpoint = endpointMap[type];
        if (!endpoint) throw new Error(`Tipo desconhecido: ${type}`);
        const config = reason ? { data: { reason } } : undefined;
        const response = await api.delete(endpoint, config);
        return { data: response.data, status: response.status };
    },
    approve: async (id) => {
        const response = await api.post(`/deletion-requests/${id}/approve`);
        return response.data;
    },
    reject: async (id, reason = '') => {
        const response = await api.post(`/deletion-requests/${id}/reject`, { rejection_reason: reason });
        return response.data;
    }
};

// Menus API
export const menusAPI = {
    getAll: async () => {
        const response = await api.get('/menus');
        return response.data;
    },
    create: async (menuData) => {
        const response = await api.post('/menus', menuData);
        return response.data;
    }
};

export default api;
