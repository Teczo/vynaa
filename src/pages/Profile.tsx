import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [message, setMessage] = useState('');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.patch('/user/me', { name });
            setMessage('Profile updated successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Failed to update profile');
        }
    };

    const handleExport = async () => {
        if (!confirm('Download all your data as JSON?')) return;
        setIsExporting(true);
        try {
            const response = await api.post('/user/export', {}, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `vynaa-export-${Date.now()}.json`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            setMessage('Export started');
        } catch (err) {
            console.error(err);
            setMessage('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE your account and ALL data? This cannot be undone.')) return;
        setIsDeleting(true);
        try {
            await api.delete('/user/me');
            await logout();
            window.location.href = '/';
        } catch (err) {
            console.error(err);
            setIsDeleting(false);
            setMessage('Failed to delete account');
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                    <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Canvas</Link>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl space-y-8">

                    {/* Profile Section */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-indigo-400">Profile</h2>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email</label>
                                <div className="text-slate-200 font-mono bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5">{user?.email}</div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium transition-colors">
                                    Save Changes
                                </button>
                                {message && <span className="text-sm text-green-400">{message}</span>}
                            </div>
                        </form>
                    </section>

                    <hr className="border-white/10" />

                    {/* Data Ownership */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-cyan-400">Data Ownership</h2>
                        <p className="text-slate-400 mb-4 text-sm">Download a copy of all your projects, conversations, and account data.</p>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="border border-white/20 hover:bg-white/5 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {isExporting ? 'Exporting...' : 'Export All Data'}
                        </button>
                    </section>

                    <hr className="border-white/10" />

                    {/* Danger Zone */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-red-500">Danger Zone</h2>
                        <p className="text-slate-400 mb-4 text-sm">Permanently delete your account and all associated data.</p>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </button>
                    </section>

                    <hr className="border-white/10" />

                    <section>
                        <button onClick={() => logout()} className="text-slate-400 hover:text-white transition-colors">
                            Log Out
                        </button>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default Profile;
