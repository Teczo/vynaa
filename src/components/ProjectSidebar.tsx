import React, { useState, useEffect } from 'react';
import { projects, sessions } from '../services/api';

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

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ onSelectConversation, activeConversationId }) => {
    const [projectList, setProjectList] = useState<Project[]>([]);
    const [sessionsByProject, setSessionsByProject] = useState<Record<string, Session[]>>({});
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
                sessions.list()
            ]);

            setProjectList(fetchedProjects);

            // Group sessions by project
            const grouped: Record<string, Session[]> = {};
            const ungrouped: Session[] = [];

            allSessions.forEach((session: Session) => {
                if (session.projectId) {
                    if (!grouped[session.projectId]) {
                        grouped[session.projectId] = [];
                    }
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
            setProjectList(prev => [...prev, newProject]);
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
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedProjects(newSet);
    };

    const renderSession = (session: Session) => (
        <div
            key={session._id}
            onClick={() => onSelectConversation(session._id)}
            className={`p-2 hover:bg-gray-800 rounded mb-1 text-sm cursor-pointer ${activeConversationId === session._id ? 'bg-gray-800 border-l-2 border-blue-500' : ''
                }`}
        >
            💬 {session.title}
        </div>
    );

    return (
        <div className="w-64 bg-gray-900 text-white h-full flex flex-col border-r border-gray-800">
            <div className="p-4 border-b border-gray-800 space-y-3">
                <h2 className="text-lg font-bold">Vynaa AI</h2>
                <button
                    onClick={() => createSession()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2 rounded transition-colors"
                >
                    + New Canvas
                </button>
                <button
                    onClick={createProject}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-sm py-2 rounded transition-colors"
                >
                    + New Project
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="p-4 text-gray-500 text-sm text-center">Loading...</div>
                ) : (
                    <>
                        {/* Projects */}
                        {projectList.map(project => (
                            <div key={project._id} className="mb-2">
                                <div
                                    className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                                    onClick={() => toggleProject(project._id)}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-xs">{expandedProjects.has(project._id) ? '▼' : '▶'}</span>
                                        📁 {project.name}
                                    </span>
                                </div>

                                {expandedProjects.has(project._id) && (
                                    <div className="pl-6 border-l border-gray-800 ml-3">
                                        {sessionsByProject[project._id]?.map(renderSession)}
                                        {(!sessionsByProject[project._id] || sessionsByProject[project._id].length === 0) && (
                                            <div className="text-xs text-gray-500 italic p-2">No canvases</div>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); createSession(project._id); }}
                                            className="text-xs text-gray-500 hover:text-gray-300 mt-1"
                                        >
                                            + New Canvas
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Ungrouped */}
                        <div className="mt-4">
                            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Ungrouped</h3>
                            {ungroupedSessions.map(renderSession)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProjectSidebar;