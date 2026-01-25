import axios from 'axios';

const API_BASE_URL = 'https://mosap3-api.yetuware.com/api';

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

// Suppliers API
export const suppliersAPI = {
    getAll: async () => {
        const response = await api.get('/suppliers');
        return response.data;
    },
    create: async (supplierData) => {
        const response = await api.post('/suppliers', supplierData, {
            headers: {
                'Content-Type': 'multipart/form-data',
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
        const response = await api.post(`/suppliers/${id}`, supplierData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data;
    },
    getClassification: async (id) => {
        const response = await api.get(`/suppliers/${id}/classification`);
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
    update: async (id, quotationData) => {
        const response = await api.put(`/quotation-requests/${id}`, quotationData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/quotation-requests/${id}`);
        return response.data;
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
    getAll: async () => {
        const response = await api.get('/quotation-responses');
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
};

// Acquisitions API
export const acquisitionsAPI = {
    getStatsProducts: async () => {
        const response = await api.get('/acquisitions/stats/products');
        return response.data;
    },
};

export default api;
