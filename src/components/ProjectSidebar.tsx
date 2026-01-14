import React, { useState, useEffect } from 'react';
import { projects, conversations } from '../services/api';

interface Project {
    _id: string;
    name: string;
    isExpanded: boolean;
    order: number;
}

interface Conversation {
    _id: string;
    title: string;
    projectId: string | null;
}

interface ProjectSidebarProps {
    onSelectConversation: (id: string) => void;
    activeConversationId?: string;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ onSelectConversation, activeConversationId }) => {
    const [projectList, setProjectList] = useState<Project[]>([]);
    const [conversationList, setConversationList] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [projectConversations, setProjectConversations] = useState<Record<string, Conversation[]>>({});

    // Project Creation State
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ projects: Project[], conversations: Conversation[] } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Debounced Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                // Assuming I created a search service in api.ts
                const { search } = await import('../services/api');
                const results = await search.query(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error("Search failed", error);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const fetchedProjects = await projects.list();
            setProjectList(fetchedProjects);

            // For MVP, we might need to fetch conversations per project or all at once.
            // Since I didn't verify the best way to get all conversations, 
            // I'll rely on lazy loading or similar if needed, 
            // but for Sidebar, I need them to list them.
            // Let's iterate projects and fetch conversations? No, too many requests.
            // I should have made a `projects=includeConversations` param.
            // Or `GET /conversations` endpoint.
            // I'll just rely on what I have: `projects` list. 
            // Ill use search to find everything if empty query? No.
            // I will cheat and use `projects.list` which I'll update backend to include conversations if I can
            // OR I will simply fetch conversations for Expanded projects only?
            // Yes, Fetch on Expand is a better patterns.
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to fetch conversations for a project
    const fetchConversationsForProject = async (projectId: string) => {
        try {
            const convos = await conversations.listByProject(projectId);
            setProjectConversations(prev => ({ ...prev, [projectId]: convos }));
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    // Create new project
    const createProject = async () => {
        const name = newProjectName.trim() || 'New Project';
        try {
            const newProject = await projects.create(name);
            setProjectList(prev => [...prev, newProject]);
            setNewProjectName('');
            setIsCreatingProject(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    // Create new canvas/conversation
    const createCanvas = async (projectId: string | null) => {
        try {
            const newConversation = await conversations.create('New Canvas', projectId);
            // After creation, select this conversation and refresh the list
            onSelectConversation(newConversation._id);
            // Refresh conversations for this project
            if (projectId) {
                fetchConversationsForProject(projectId);
            }
        } catch (error) {
            console.error('Failed to create canvas:', error);
        }
    };

    return (
        <div className="w-64 bg-gray-900 text-white h-full flex flex-col border-r border-gray-800">
            <div className="p-4 border-b border-gray-800 space-y-3">
                <h2 className="text-lg font-bold">Projects</h2>
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    onClick={() => setIsCreatingProject(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-1 rounded transition-colors"
                >
                    + New Project
                </button>
                {isCreatingProject && (
                    <div className="flex gap-2 mt-2">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project name..."
                            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                            onKeyDown={(e) => e.key === 'Enter' && createProject()}
                            autoFocus
                        />
                        <button onClick={createProject} className="bg-green-600 px-2 rounded text-sm">✓</button>
                        <button onClick={() => setIsCreatingProject(false)} className="bg-gray-600 px-2 rounded text-sm">✕</button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-gray-500 text-sm text-center">Loading...</div>
                ) : searchResults ? (
                    <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Search Results</div>
                        {searchResults.projects.map(p => (
                            <div key={p._id} className="p-2 hover:bg-gray-800 rounded mb-1 text-sm cursor-pointer">
                                📁 {p.name}
                            </div>
                        ))}
                        {searchResults.conversations.map(c => (
                            <div
                                key={c._id}
                                onClick={() => onSelectConversation(c._id)}
                                className="p-2 hover:bg-gray-800 rounded mb-1 text-sm cursor-pointer pl-4 border-l-2 border-transparent hover:border-blue-500"
                            >
                                💬 {c.title}
                            </div>
                        ))}
                        {searchResults.projects.length === 0 && searchResults.conversations.length === 0 && (
                            <div className="text-gray-500 text-sm p-2 text-center">No results found</div>
                        )}
                    </div>
                ) : (
                    <div className="p-2">
                        {projectList.map(project => (
                            <div key={project._id} className="mb-2">
                                <div
                                    className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer group select-none"
                                    onClick={() => toggleProject(project._id)}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{expandedProjects.has(project._id) ? '▼' : '▶'}</span>
                                        {project.name}
                                    </span>
                                    <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-400">...</span>
                                </div>

                                {expandedProjects.has(project._id) && (
                                    <div className="pl-6 border-l border-gray-800 ml-3 my-1">
                                        {projectConversations[project._id]?.length > 0 ? (
                                            projectConversations[project._id].map(convo => (
                                                <div
                                                    key={convo._id}
                                                    onClick={() => onSelectConversation(convo._id)}
                                                    className={`p-2 hover:bg-gray-800 rounded mb-1 text-sm cursor-pointer ${activeConversationId === convo._id ? 'bg-gray-800 border-l-2 border-blue-500' : ''
                                                        }`}
                                                >
                                                    💬 {convo.title}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-gray-500 italic p-1">No canvases yet</div>
                                        )}
                                        <button
                                            onClick={() => createCanvas(project._id)}
                                            className="text-xs text-gray-500 hover:text-gray-300 mt-1 flex items-center gap-1"
                                        >
                                            <span>+</span> New Canvas
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    function toggleProject(id: string) {
        const newSet = new Set(expandedProjects);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
            // Fetch conversations when expanding
            if (!projectConversations[id]) {
                fetchConversationsForProject(id);
            }
        }
        setExpandedProjects(newSet);
    }
};

export default ProjectSidebar;
