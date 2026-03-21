import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
    _id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.post('/auth/refresh');
                if (data.token) {
                    localStorage.setItem('accessToken', data.token);
                    const userRes = await api.get('/user/me');
                    setUser(userRes.data);
                }
            } catch {
                setUser(null);
                localStorage.removeItem('accessToken');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.token);
        setUser({ _id: data._id, name: data.name, email: data.email });
    };

    const signup = async (name: string, email: string, password: string) => {
        const { data } = await api.post('/auth/signup', { name, email, password });
        localStorage.setItem('accessToken', data.token);
        setUser({ _id: data._id, name: data.name, email: data.email });
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setUser(null);
            localStorage.removeItem('accessToken');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            signup,
            logout,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
