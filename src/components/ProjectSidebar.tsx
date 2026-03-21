import React, { useState, useEffect } from 'react';
import { sessions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, MoreHorizontal, Trash2, Edit2, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';

interface Session {
    _id: string;
    title: string;
    updatedAt: string;
}

interface ProjectSidebarProps {
    onSelectConversation: (id: string) => void;
    activeConversationId?: string;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
    onSelectConversation,
    activeConversationId,
}) => {
    const { logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sessionList, setSessionList] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        loadSessions();
        const handleClickOutside = () => setMenuOpenId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Reload sessions when active conversation changes (to pick up title updates)
    useEffect(() => {
        if (activeConversationId) {
            loadSessions();
        }
    }, [activeConversationId]);

    const loadSessions = async () => {
        try {
            setIsLoading(true);
            const list = await sessions.list();
            setSessionList(list);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createSession = async () => {
        try {
            const newSession = await sessions.create('New Canvas');
            onSelectConversation(newSession._id);
            loadSessions();
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const deleteSession = async (id: string) => {
        if (!confirm('Delete this canvas?')) return;
        try {
            await sessions.delete(id);
            if (activeConversationId === id) {
                const remaining = sessionList.filter(s => s._id !== id);
                if (remaining.length > 0) {
                    onSelectConversation(remaining[0]._id);
                }
            }
            loadSessions();
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const renameSession = async (id: string, currentTitle: string) => {
        const newTitle = prompt('Rename canvas:', currentTitle);
        if (!newTitle || !newTitle.trim()) return;
        try {
            await sessions.update(id, { title: newTitle.trim() });
            loadSessions();
        } catch (error) {
            console.error('Failed to rename session:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const renderSession = (session: Session) => {
        const isActive = activeConversationId === session._id;
        const isMenuOpen = menuOpenId === session._id;

        return (
            <motion.div
                key={session._id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative group/item"
            >
                <div
                    onClick={() => onSelectConversation(session._id)}
                    className={[
                        'flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200',
                        isActive
                            ? 'bg-black/5 text-zinc-900 dark:bg-white/10 dark:text-white'
                            : 'text-zinc-600 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-200',
                    ].join(' ')}
                >
                    <div className="flex items-center gap-2.5 truncate flex-1">
                        <MessageSquare
                            size={14}
                            className={
                                isActive
                                    ? 'text-zinc-900 dark:text-white'
                                    : 'text-zinc-400 dark:text-zinc-600'
                            }
                        />
                        <span className="truncate font-medium">{session.title}</span>
                    </div>

                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(isMenuOpen ? null : session._id);
                            }}
                            className="p-1 hover:bg-black/10 rounded dark:hover:bg-white/10"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                </div>

                {/* Context Menu */}
                {isMenuOpen && (
                    <div
                        className="absolute right-2 top-8 z-[100] w-40 bg-white dark:bg-[#1a1a1e] border border-black/10 dark:border-white/10 rounded-xl shadow-xl py-1 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setMenuOpenId(null);
                                renameSession(session._id, session.title);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                            <Edit2 size={12} /> Rename
                        </button>
                        <button
                            onClick={() => {
                                setMenuOpenId(null);
                                deleteSession(session._id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                        >
                            <Trash2 size={12} /> Delete
                        </button>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <motion.div
            animate={{ width: isCollapsed ? 60 : 320 }}
            className="h-full flex flex-col border-r border-black/10 bg-white text-zinc-900 dark:border-white/[0.06] dark:bg-[#0e131a] dark:text-white overflow-visible z-50 relative"
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 z-50 bg-white dark:bg-[#0e131a] border border-black/10 dark:border-white/10 rounded-full p-1 shadow-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
                {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>

            {/* Header */}
            <div className={`p-6 shrink-0 ${isCollapsed ? 'items-center flex flex-col px-2' : ''}`}>
                <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-black text-white dark:bg-white dark:text-black shrink-0 shadow-lg">
                        <div className="w-3.5 h-3.5 rounded-sm bg-white dark:bg-black" />
                    </div>

                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold tracking-tight text-sm uppercase italic text-zinc-900 dark:text-white"
                        >
                            Vynaa Studio
                        </motion.span>
                    )}
                </div>

                <button
                    onClick={createSession}
                    className={`w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-zinc-800 text-xs font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200 ${isCollapsed ? 'px-0' : ''}`}
                    title="New Canvas"
                >
                    <Plus size={16} strokeWidth={3} /> {!isCollapsed && "New Canvas"}
                </button>
            </div>

            {/* Session List */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                    <div className="px-2 pb-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                        Canvases
                    </div>

                    <div className="space-y-0.5">
                        {sessionList.map(renderSession)}
                    </div>

                    {isLoading && (
                        <div className="px-3 py-2 text-xs text-zinc-500">Loading...</div>
                    )}

                    {!isLoading && sessionList.length === 0 && (
                        <div className="px-3 py-4 text-xs text-zinc-400 italic">No canvases yet. Create one above.</div>
                    )}
                </div>
            )}

            {/* Logout */}
            {!isCollapsed && (
                <div className="p-4 border-t border-black/5 dark:border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    >
                        <LogOut size={14} /> Log Out
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default ProjectSidebar;
