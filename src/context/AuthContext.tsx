import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
    _id: string;
    name: string;
    email: string;
    preferences?: any;
    isEmailVerified: boolean;
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

    // Check if user is logged in (via refresh token cookie) on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Try to refresh token immediately to get an access token
                const { data } = await api.post('/auth/refresh');
                if (data.token) {
                    localStorage.setItem('accessToken', data.token); // Store for axios interceptor

                    // Fetch user profile
                    const userRes = await api.get('/user/me');
                    setUser(userRes.data);
                }
            } catch (error: any) {
                // If 401, it just means not logged in.
                // We don't need to log this as an error.
                if (error.response && error.response.status === 401) {
                    setUser(null);
                } else {
                    console.error('Auth check failed:', error);
                    setUser(null);
                }
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
        setUser({
            _id: data._id,
            name: data.name,
            email: data.email,
            isEmailVerified: false // Default/Optimistic
        });
        // Fetch full profile to be sure
        const userRes = await api.get('/user/me');
        setUser(userRes.data);
    };

    const signup = async (name: string, email: string, password: string) => {
        await api.post('/auth/signup', { name, email, password });
        // Don't auto-login if verification required, or do?
        // Controller returns message. User needs to verify email or login.
        // For now, let's assume they need to login or we auto-login.
        // Our Signup controller just returns message.
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
            isAuthenticated: !!user
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
