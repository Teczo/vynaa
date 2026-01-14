import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setStatus('error');
                setMessage('No token provided');
                return;
            }

            try {
                await api.post('/auth/verify-email', { token });
                setStatus('success');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed');
            }
        };

        verify();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl backdrop-blur-xl text-center">
                {status === 'verifying' && (
                    <div className="animate-pulse text-indigo-400">Verifying your email...</div>
                )}
                {status === 'success' && (
                    <div>
                        <h2 className="text-2xl font-bold text-green-400 mb-4">Email Verified!</h2>
                        <p className="text-slate-300 mb-6">Your account has been successfully verified.</p>
                        <Link to="/login" className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg text-white font-medium transition-colors">
                            Continue to Login
                        </Link>
                    </div>
                )}
                {status === 'error' && (
                    <div>
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Verification Failed</h2>
                        <p className="text-slate-300 mb-6">{message}</p>
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
