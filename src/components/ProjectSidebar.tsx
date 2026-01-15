import React, { useState, useEffect } from 'react';
import { projects, sessions } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, ChevronRight } from 'lucide-react';

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
    const [projectList, setProjectList] = useState<Project[]>([]);
    const [sessionsByProject, setSessionsByProject] = useState<Record<string, Session[]>>(
        {}
    );
    const [ungroupedSessions, setUngroupedSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
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

    const createSession = async (projectId: string | null = null) => {
        try {
            const newSession = await sessions.create('New Canvas', projectId);
            onSelectConversation(newSession._id);
            loadData(); // Refresh
        } catch (error) {
            console.error('Failed to create session:', error);
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

        return (
            <motion.div
                key={session._id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelectConversation(session._id)}
                className={[
                    'group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200',
                    isActive
                        ? 'bg-black/5 text-zinc-900 dark:bg-white/10 dark:text-white'
                        : 'text-zinc-600 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-200',
                ].join(' ')}
            >
                <div className="flex items-center gap-2.5 truncate">
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
            </motion.div>
        );
    };

    return (
        <div className="w-72 h-full flex flex-col border-r border-black/10 bg-white text-zinc-900 dark:border-white/[0.06] dark:bg-[#0e131a] dark:text-white">
            {/* Header */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8 px-1">
                    <div className="w-7 h-7 rounded flex items-center justify-center bg-black text-white dark:bg-white dark:text-black">
                        <div className="w-3 h-3 rounded-sm bg-white dark:bg-black" />
                    </div>

                    <span className="font-bold tracking-tight text-sm uppercase italic text-zinc-900 dark:text-white">
                        Vynaa Studio
                    </span>
                </div>

                <button
                    onClick={() => createSession()}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-zinc-800 text-xs font-bold py-2.5 rounded-lg transition-all shadow-lg active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                    <Plus size={14} strokeWidth={3} /> New Canvas
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4">
                <div className="px-2 pb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                    Workspace
                </div>

                {projectList.map((project) => (
                    <div key={project._id} className="mb-1">
                        <div
                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5"
                            onClick={() => toggleProject(project._id)}
                        >
                            <span className="flex items-center gap-3 text-sm font-medium text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                                <ChevronRight
                                    size={14}
                                    className={[
                                        'transition-transform duration-200 text-zinc-400 dark:text-zinc-500',
                                        expandedProjects.has(project._id) ? 'rotate-90' : '',
                                    ].join(' ')}
                                />
                                {project.name}
                            </span>
                        </div>

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
                    <div className="mt-6">
                        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
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
        </div>
    );
};

export default ProjectSidebar;
