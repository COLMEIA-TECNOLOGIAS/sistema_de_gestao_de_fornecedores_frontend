import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.mosap3.yetuware.it.ao/api';

const api = axios.create({
    baseURL: API_BASE_URL,
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

// Interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

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
};

// Users API
export const usersAPI = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },
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
    getAll: async () => {
        const response = await api.get('/suppliers');
        return response.data;
    },
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
        const response = await api.delete(`/suppliers/${id}`, { data: { reason } });
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
};

// Quotation Requests API
export const quotationRequestsAPI = {
    getAll: async () => {
        const response = await api.get('/quotation-requests');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/quotation-requests/${id}`);
        return response.data;
    },
    create: async (quotationData) => {
        const response = await api.post('/quotation-requests', quotationData);
        return response.data;
    },
    createWithDocuments: async (formData) => {
        const response = await api.post('/quotation-requests', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    update: async (id, quotationData) => {
        const response = await api.put(`/quotation-requests/${id}`, quotationData);
        return response.data;
    },
    delete: async (id, reason = '') => {
        const response = await api.delete(`/quotation-requests/${id}`, { data: { reason } });
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
    // Aprovar proposta
    approve: async (id, notes) => {
        const response = await api.post(`/quotation-responses/${id}/approve`, { notes });
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
        const response = await api.get(`/products?page=${page}`);
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
        const response = await api.get(`/products?search=${query}&page=${page}`);
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
        const response = await api.get(`/acquisitions?page=${page}`);
        return response.data;
    },
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
        const response = await api.get(`/deletion-requests?page=${page}`);
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/deletion-requests/${id}`);
        return response.data;
    },
    requestDelete: async (type, id, reason = '') => {
        const modelMap = {
            supplier: 'App\\Models\\Supplier',
            quotation_request: 'App\\Models\\QuotationRequest',
        };
        const response = await api.post('/deletion-requests', {
            requestable_type: modelMap[type] || type,
            requestable_id: id,
            reason
        });
        return response.data;
    },
    approve: async (id) => {
        const response = await api.post(`/deletion-requests/${id}/approve`);
        return response.data;
    },
    reject: async (id) => {
        const response = await api.post(`/deletion-requests/${id}/reject`);
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
