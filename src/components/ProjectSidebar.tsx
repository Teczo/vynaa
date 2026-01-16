import React, { useState, useEffect } from 'react';
import { projects, sessions } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, ChevronRight, MoreHorizontal, FolderInput, Trash2, Edit2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface Project {
    _id: string;
    name: string;
    isExpanded: boolean;
    order: number;
}

interface Session {
    _id: string;
    title: string;
    projectId: string | null;
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [projectList, setProjectList] = useState<Project[]>([]);
    const [sessionsByProject, setSessionsByProject] = useState<Record<string, Session[]>>(
        {}
    );
    const [ungroupedSessions, setUngroupedSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [moveToProjectId, setMoveToProjectId] = useState<string | null>(null); // Session ID being moved

    useEffect(() => {
        loadData();
        const handleClickOutside = () => setMenuOpenId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [fetchedProjects, allSessions] = await Promise.all([
                projects.list(),
                sessions.list(),
            ]);

            setProjectList(fetchedProjects);

            // Group sessions by project
            const grouped: Record<string, Session[]> = {};
            const ungrouped: Session[] = [];

            allSessions.forEach((session: Session) => {
                if (session.projectId) {
                    if (!grouped[session.projectId]) grouped[session.projectId] = [];
                    grouped[session.projectId].push(session);
                } else {
                    ungrouped.push(session);
                }
            });

            setSessionsByProject(grouped);
            setUngroupedSessions(ungrouped);
        } catch (error) {
            console.error('Failed to load sidebar data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createProject = async () => {
        const name = prompt('Project name:');
        if (!name?.trim()) return;

        try {
            const newProject = await projects.create(name.trim());
            setProjectList((prev) => [...prev, newProject]);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const deleteProject = async (id: string, name: string) => {
        if (!confirm(`Delete project "${name}"? Sessions will be ungrouped.`)) return;
        try {
            await projects.delete(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };

    const renameProject = async (id: string, currentName: string) => {
        const newName = prompt('New project name:', currentName);
        if (!newName || !newName.trim()) return;
        try {
            await projects.update(id, { name: newName.trim() });
            loadData();
        } catch (error) {
            console.error('Failed to rename project:', error);
        }
    };

    const createSession = async (projectId: string | null = null) => {
        try {
            const newSession = await sessions.create('New Canvas', projectId);
            if (projectId && !expandedProjects.has(projectId)) {
                toggleProject(projectId);
            }
            onSelectConversation(newSession._id);
            loadData(); // Refresh
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const deleteSession = async (id: string) => {
        if (!confirm('Delete this canvas?')) return;
        try {
            await sessions.delete(id);
            if (activeConversationId === id) {
                // If we deleted the active one, maybe clear it or select another?
                // For now just refresh
            }
            loadData();
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const moveSessionToProject = async (sessionId: string, newProjectId: string | null) => {
        try {
            await sessions.update(sessionId, { projectId: newProjectId });
            setMoveToProjectId(null);
            loadData();
        } catch (error) {
            console.error('Failed to move session:', error);
        }
    };

    const toggleProject = (id: string) => {
        const newSet = new Set(expandedProjects);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedProjects(newSet);
    };

    const renderSession = (session: Session) => {
        const isActive = activeConversationId === session._id;
        const isMenuOpen = menuOpenId === session._id;
        const isMoving = moveToProjectId === session._id;

        return (
            <motion.div
                key={session._id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative group/item"
            >
                <div
                    onClick={() => {
                        if (!isMoving) onSelectConversation(session._id);
                    }}
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

                {/* Session Context Menu */}
                {isMenuOpen && (
                    <div className="absolute right-2 top-8 z-[100] w-48 bg-white dark:bg-[#1a1a1e] border border-black/10 dark:border-white/10 rounded-xl shadow-xl py-1 overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                setMenuOpenId(null);
                                setMoveToProjectId(session._id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                            <FolderInput size={12} /> Move to Project
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

                {/* Move to Project Popover */}
                {isMoving && (
                    <div className="absolute left-0 top-full z-[101] w-full bg-white dark:bg-[#1a1a1e] border border-black/10 dark:border-white/10 rounded-xl shadow-xl py-1 mt-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-zinc-500">Move to...</div>
                        <button
                            onClick={() => moveSessionToProject(session._id, null)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 truncate"
                        >
                            (Ungrouped)
                        </button>
                        {projectList.map(p => (
                            <button
                                key={p._id}
                                onClick={() => moveSessionToProject(session._id, p._id)}
                                disabled={session.projectId === p._id}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 truncate disabled:opacity-50"
                            >
                                {p.name}
                            </button>
                        ))}
                        <button
                            onClick={() => setMoveToProjectId(null)}
                            className="w-full text-center py-1 text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white border-t border-white/5 mt-1"
                        >
                            Cancel
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

                <div className="space-y-2">
                    <button
                        onClick={() => createSession()}
                        className={`w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-zinc-800 text-xs font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200 ${isCollapsed ? 'px-0' : ''}`}
                        title="New Canvas"
                    >
                        <Plus size={16} strokeWidth={3} /> {!isCollapsed && "New Canvas"}
                    </button>

                    {!isCollapsed && (
                        <button
                            onClick={createProject}
                            className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-xs font-bold py-2.5 rounded-xl transition-all dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 border border-transparent dark:border-white/5"
                        >
                            <FolderInput size={14} /> New Project
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            {/* List */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                    <div className="px-2 pb-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 flex justify-between items-center">
                        <span>Projects</span>
                    </div>

                    {projectList.map((project) => (
                        <div key={project._id} className="mb-1">
                            <div
                                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group/proj hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                <div
                                    className="flex items-center gap-3 flex-1 overflow-hidden"
                                    onClick={() => toggleProject(project._id)}
                                >
                                    <ChevronRight
                                        size={14}
                                        className={[
                                            'transition-transform duration-200 text-zinc-400 dark:text-zinc-500 shrink-0',
                                            expandedProjects.has(project._id) ? 'rotate-90' : '',
                                        ].join(' ')}
                                    />
                                    <span className="text-sm font-semibold text-zinc-700 group-hover/proj:text-zinc-900 dark:text-zinc-400 dark:group-hover/proj:text-zinc-200 truncate">
                                        {project.name}
                                    </span>
                                </div>

                                <div className="opacity-0 group-hover/proj:opacity-100 flex items-center gap-1 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            createSession(project._id);
                                        }}
                                        className="p-1 hover:text-indigo-500 text-zinc-400"
                                        title="New Canvas in Project"
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === project._id ? null : project._id);
                                        }}
                                        className="p-1 hover:text-zinc-900 dark:hover:text-white text-zinc-400"
                                    >
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Project Context Menu */}
                            {menuOpenId === project._id && (
                                <div className="ml-10 mb-2 w-40 bg-white dark:bg-[#1a1a1e] border border-black/10 dark:border-white/10 rounded-lg shadow-xl overflow-hidden py-1">
                                    <button
                                        onClick={() => {
                                            setMenuOpenId(null);
                                            renameProject(project._id, project.name);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Edit2 size={12} /> Rename
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMenuOpenId(null);
                                            deleteProject(project._id, project.name);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            )}

                            <AnimatePresence>
                                {expandedProjects.has(project._id) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden pl-4 mt-1 space-y-0.5 border-l border-black/10 ml-5 dark:border-white/[0.06]"
                                    >
                                        {sessionsByProject[project._id]?.map(renderSession)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {/* Optional: ungrouped sessions (logic already computed; showing it is UI-only) */}
                    {ungroupedSessions.length > 0 && (
                        <div className="mt-8">
                            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                                Ungrouped
                            </div>
                            <div className="space-y-0.5">{ungroupedSessions.map(renderSession)}</div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-500">
                            Loading…
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default ProjectSidebar;
