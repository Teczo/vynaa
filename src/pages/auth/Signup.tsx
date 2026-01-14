import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Signup: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await signup(name, email, password);
            setMessage('Account created! Please check your email to verify.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create account');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl backdrop-blur-xl">
                <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Join Vynaa</h2>

                {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                {message && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mb-4 text-sm">{message}</div>}

                {!message && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-lg transition-all shadow-lg hover:shadow-purple-500/20 mt-4"
                        >
                            Create Account
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-sm text-slate-400">
                    Already have an account? <Link to="/login" className="text-white hover:underline">Log in</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
