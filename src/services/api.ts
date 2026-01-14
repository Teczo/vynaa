import axios from 'axios';

const apiStr = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const API_URL = apiStr;

const api = axios.create({
    baseURL: API_URL, // Changed to use API_URL
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Access Token
api.interceptors.request.use(
    (config) => {
        // We don't store access token in localStorage for security (it's in memory).
        // The AuthContext will inject it via the Authorization header if we stored it there?
        // Actually, usually we store it in memory variable in api.ts or context.
        // For this implementation, we'll let the AuthContext handle setting the header 
        // OR we can store it in a closure here if we export a setToken function.

        // Better approach: AuthContext manages the token and we can set existing header.
        const token = localStorage.getItem('accessToken'); // Fallback if we decide to use LS, but planned for memory
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for refreshing token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
            originalRequest._retry = true;

            try {
                const { data } = await api.post('/auth/refresh');
                const newToken = data.token;

                // Update local storage or memory (Context should handle this ideally, but for axios interceptor to work independently...)
                localStorage.setItem('accessToken', newToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed (token expired or invalid)
                // Redirect to login or clear state
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export const projects = {
    list: async () => {
        const response = await api.get('/projects');
        return response.data;
    },
    create: async (name: string) => {
        const response = await api.post('/projects', { name });
        return response.data;
    },
    update: async (id: string, updates: { name?: string; order?: number; isExpanded?: boolean }) => {
        const response = await api.patch(`/projects/${id}`, updates);
        return response.data;
    },
    delete: async (id: string, mode: 'soft' | 'hard' = 'soft') => {
        const response = await api.delete(`/projects/${id}?mode=${mode}`);
        return response.data;
    }
};

export const conversations = {
    listByProject: async (projectId: string | null) => {
        const param = projectId === null ? 'null' : projectId;
        const response = await api.get(`/conversations?projectId=${param}`);
        return response.data;
    },
    get: async (id: string) => {
        const response = await api.get(`/conversations/${id}`);
        return response.data;
    },
    create: async (title: string, projectId: string | null) => {
        const response = await api.post('/conversations', { title, projectId });
        return response.data;
    },
    update: async (id: string, updates: { title?: string; projectId?: string | null; deletedAt?: Date | null }) => {
        const response = await api.patch(`/conversations/${id}`, updates);
        return response.data;
    },
    sync: async (id: string, data: { nodes?: any[]; viewport?: any; version?: number }) => {
        const response = await api.post(`/conversations/${id}/sync`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/conversations/${id}`);
        return response.data;
    }
};

export const search = {
    query: async (q: string) => {
        const response = await api.get(`/search?q=${encodeURIComponent(q)}`);
        return response.data;
    }
};
