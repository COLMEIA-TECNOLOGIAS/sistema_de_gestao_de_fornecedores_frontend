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
        const response = await api.post('/suppliers', supplierData);
        return response.data;
    },
    update: async (id, supplierData) => {
        const response = await api.put(`/suppliers/${id}`, supplierData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data;
    },
};

export default api;
