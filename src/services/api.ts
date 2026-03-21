import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

// Sessions API
export const sessions = {
    list: async () => {
        const response = await api.get('/sessions');
        return response.data;
    },

    get: async (id: string) => {
        const response = await api.get(`/sessions/${id}`);
        return response.data;
    },

    create: async (title: string) => {
        const response = await api.post('/sessions', { title });
        return response.data;
    },

    update: async (id: string, updates: { title?: string }) => {
        const response = await api.patch(`/sessions/${id}`, updates);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/sessions/${id}`);
        return response.data;
    },
};

// Turns API
export const turns = {
    list: async (sessionId: string) => {
        const response = await api.get(`/sessions/${sessionId}/turns`);
        return response.data;
    },

    /**
     * Create a turn and stream the AI response.
     * Returns { userTurn, assistantTurn, sessionTitle } after streaming completes.
     */
    create: async (
        sessionId: string,
        content: string,
        parentTurnId: string | null,
        position: { x: number; y: number },
        provider: string,
        model: string,
        apiKey: string,
        onToken?: (token: string) => void,
    ): Promise<{ userTurn: any; assistantTurn: any; sessionTitle?: string }> => {
        const token = localStorage.getItem('accessToken');

        const response = await fetch(`${API_URL}/sessions/${sessionId}/turns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
            body: JSON.stringify({ content, parentTurnId, position, provider, model, apiKey }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || err.message || 'Failed to create turn');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let result: any = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr === '[DONE]') continue;
                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.type === 'token' && onToken) {
                            onToken(data.content);
                        } else if (data.type === 'done') {
                            result = data;
                        } else if (data.type === 'error') {
                            throw new Error(data.content);
                        }
                    } catch (e: any) {
                        if (e.message && !e.message.includes('JSON')) throw e;
                    }
                }
            }
        }

        if (!result) throw new Error('Stream ended without completion');

        return {
            userTurn: result.userTurn,
            assistantTurn: result.assistantTurn,
            sessionTitle: result.sessionTitle,
        };
    },

    updatePosition: async (sessionId: string, turnId: string, position: { x: number; y: number }) => {
        const response = await api.patch(`/sessions/${sessionId}/turns/${turnId}/position`, {
            position,
        });
        return response.data;
    },
};
