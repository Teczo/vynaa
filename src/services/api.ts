import axios from 'axios';

const apiStr = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const API_URL = apiStr;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Access Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
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

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
            originalRequest._retry = true;

            try {
                const { data } = await api.post('/auth/refresh');
                const newToken = data.token;
                localStorage.setItem('accessToken', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// Projects API
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

// Sessions API (replaces conversations)
export const sessions = {
    list: async (projectId?: string | null, status: string = 'active') => {
        const params = new URLSearchParams();
        params.append('status', status);
        if (projectId !== undefined) {
            params.append('projectId', projectId === null ? 'null' : projectId);
        }
        const response = await api.get(`/sessions?${params.toString()}`);
        return response.data;
    },

    get: async (id: string) => {
        const response = await api.get(`/sessions/${id}`);
        return response.data;
    },

    create: async (title: string, projectId: string | null = null) => {
        const response = await api.post('/sessions', { title, projectId });
        return response.data;
    },

    update: async (id: string, updates: {
        title?: string;
        projectId?: string | null;
        status?: string;
        summary?: string;
    }) => {
        const response = await api.patch(`/sessions/${id}`, updates);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/sessions/${id}`);
        return response.data;
    }
};

// Turns API
export const turns = {
    list: async (sessionId: string) => {
        const response = await api.get(`/sessions/${sessionId}/turns`);
        return response.data;
    },

    create: async (sessionId: string, content: string, position?: { x: number; y: number }) => {
        const response = await api.post(`/sessions/${sessionId}/turns`, {
            content,
            position
        });
        return response.data;
    }
};

// Search API
// Search API
export const search = {
    query: async (q: string) => {
        const response = await api.get(`/search?q=${encodeURIComponent(q)}`);
        return response.data;
    }
};

// TTS API
export const tts = {
    generate: async (text: string) => {
        const response = await api.post('/tts/generate', { text });
        return response.data;
    }
};