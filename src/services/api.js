import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.mosap3.yetuware.it.ao/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        const { access_token: newToken, user: newUser } = response.data;
        sessionStorage.setItem('token', newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        return response.data;
    },
    logout: async () => {
        try { await api.post('/logout'); } catch (e) { /* ignore */ }
        finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('apiPermissions');
            sessionStorage.removeItem('token');
        }
    },
    verifyEmail: async (email, code) => {
        const response = await api.post('/email/verify', { email, code });
        return response.data;
    },
    resendEmailVerification: async () => {
        const response = await api.post('/email/resend-verification');
        return response.data;
    },
    forgotPassword: async (email) => {
        const response = await api.post('/password/forgot', { email });
        return response.data;
    },
    verifyPasswordCode: async (email, code) => {
        const response = await api.post('/password/verify-code', { email, code });
        return response.data;
    },
    resetPassword: async ({ email, code, token, password, password_confirmation }) => {
        const response = await api.post('/password/reset', { email, code, token, password, password_confirmation });
        return response.data;
    },
};

export const permissionsAPI = {
    _cache: new Map(),
    getMyPermissions: async () => {
        const cacheKey = 'my-permissions';
        const cached = permissionsAPI._cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 120000) {
            return cached.data;
        }
        const response = await api.get('/user/permissions');
        permissionsAPI._cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
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

export const usersAPI = {
    _cache: new Map(),
    getAll: async (perPage = 100) => {
        const cacheKey = `users-all-${perPage}`;
        const cached = usersAPI._cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 120000) {
            return cached.data;
        }
        const all = [];
        let currentPage = 1;
        let lastPage = 1;
        do {
            const response = await api.get(`/users?page=${currentPage}&per_page=${perPage}`);
            const payload = response.data;
            const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
            all.push(...items);
            lastPage = payload?.last_page ?? payload?.meta?.last_page ?? currentPage;
            currentPage += 1;
        } while (currentPage <= lastPage);
        const result = all;
        usersAPI._cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    },
    create: async (userData) => {
        const response = await api.post('/users', userData);
        usersAPI._cache.clear();
        return response.data;
    },
    update: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        usersAPI._cache.clear();
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/users/${id}`);
        usersAPI._cache.clear();
        return response.data;
    },
    resendVerification: async (userId) => {
        const response = await api.post(`/users/${userId}/resend-verification`);
        return response.data;
    },
};

export const suppliersAPI = {
    _cache: new Map(),
    getAll: async (perPage = 100) => {
        const cacheKey = `suppliers-all-${perPage}`;
        const cached = suppliersAPI._cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 120000) {
            return cached.data;
        }
        const all = [];
        let currentPage = 1;
        let lastPage = 1;
        do {
            const response = await api.get(`/suppliers?page=${currentPage}&per_page=${perPage}`);
            const payload = response.data;
            const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
            all.push(...items);
            lastPage = payload?.last_page ?? payload?.meta?.last_page ?? currentPage;
            currentPage += 1;
        } while (currentPage <= lastPage);
        const result = all;
        suppliersAPI._cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    },
    create: async (supplierData) => {
        const response = await api.post('/suppliers', supplierData);
        suppliersAPI._cache.clear();
        return response.data;
    },
    update: async (id, supplierData) => {
        const response = await api.put(`/suppliers/${id}`, supplierData);
        suppliersAPI._cache.clear();
        return response.data;
    },
    delete: async (id, reason = '') => {
        const config = reason ? { data: { reason } } : undefined;
        const response = await api.delete(`/suppliers/${id}`, config);
        suppliersAPI._cache.clear();
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
    getDocument: async (id, documentType, params = {}) => {
        const response = await api.get(`/suppliers/${id}/documents/${documentType}`, { params, responseType: 'blob', headers: { 'Accept': 'application/pdf, image/*' } });
        return response;
    },
};

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
        const response = await api.post('/quotation-requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    send: async (id) => {
        const response = await api.post(`/quotation-requests/${id}/send`);
        return response.data;
    },
    cancel: async (id) => {
        const response = await api.post(`/quotation-requests/${id}/cancel`);
        return response.data;
    },
};

export const quotationResponsesAPI = {
    getAll: async (params = {}) => {
        const response = await api.get('/quotation-responses', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/quotation-responses/${id}`);
        return response.data;
    },
    approve: async (id, notes) => {
        const response = await api.post(`/quotation-responses/${id}/approve`, { notes });
        return response.data;
    },
    reject: async (id, notes) => {
        const response = await api.post(`/quotation-responses/${id}/reject`, { notes });
        return response.data;
    },
    requestRevision: async (id, reason, message) => {
        const response = await api.post(`/quotation-responses/${id}/request-revision`, { reason, message });
        return response.data;
    },
    createAcquisition: async (id, expected_delivery_date, justification) => {
        const response = await api.post(`/quotation-responses/${id}/create-acquisition`, { expected_delivery_date, justification });
        return response.data;
    },
};

export const categoriesAPI = {
    _cache: new Map(),
    getAll: async () => {
        const cacheKey = 'categories-all';
        const cached = categoriesAPI._cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached.data;
        }
        const response = await api.get('/categories');
        categoriesAPI._cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
        return response.data;
    },
    create: async (categoryData) => {
        const response = await api.post('/categories', categoryData);
        categoriesAPI._cache.clear();
        return response.data;
    },
    update: async (id, categoryData) => {
        const response = await api.put(`/categories/${id}`, categoryData);
        categoriesAPI._cache.clear();
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        categoriesAPI._cache.clear();
        return response.data;
    },
};

export const dashboardAPI = {
    _cache: new Map(),
    getData: async () => {
        const cacheKey = 'dashboard-data';
        const cached = dashboardAPI._cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 30000) {
            return cached.data;
        }
        const response = await api.get('/dashboard');
        dashboardAPI._cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
        return response.data;
    },
};

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

export const reportsAPI = {
    getSummary: async (params) => {
        const response = await api.get('/reports/summary', { params });
        return response.data;
    },
};

export const auditLogsAPI = {
    _cache: new Map(),
    getAll: async (params = {}) => {
        const cacheKey = `audit-logs-${JSON.stringify(params)}`;
        const cached = auditLogsAPI._cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 30000) {
            return cached.data;
        }
        const response = await api.get('/audit-logs', { params });
        auditLogsAPI._cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
        return response.data;
    },
};

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

export const menusAPI = {
    _cache: new Map(),
    getAll: async () => {
        const cacheKey = 'menus-all';
        const cached = menusAPI._cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached.data;
        }
        const response = await api.get('/menus');
        menusAPI._cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
        return response.data;
    },
    create: async (menuData) => {
        const response = await api.post('/menus', menuData);
        menusAPI._cache.clear();
        return response.data;
    }
};

export default api;
