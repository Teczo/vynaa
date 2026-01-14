
import React, { useState } from 'react';
import { Project, Conversation } from '../types';

interface SidebarProps {
  projects: Project[];
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: (projectId?: string) => void;
  onNewProject: () => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
  onToggleProject: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  onRenameConversation,
  onDeleteConversation,
  onToggleProject,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const ungroupedConversations = conversations.filter(c => !c.projectId);

  const handleRenameProject = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    const newName = prompt('Enter new project name:', currentName);
    if (newName && newName.trim()) onRenameProject(id, newName.trim());
  };

  const handleRenameConversation = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    const newTitle = prompt('Enter new conversation title:', currentTitle);
    if (newTitle && newTitle.trim()) onRenameConversation(id, newTitle.trim());
  };

  const renderConversationItem = (conv: Conversation) => (
    <div
      key={conv.id}
      onClick={() => onSelectConversation(conv.id)}
      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all mb-1 ${
        activeConversationId === conv.id 
          ? 'bg-indigo-600/30 border border-indigo-500/50 text-white' 
          : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <svg className="w-4 h-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="truncate text-sm font-medium">{conv.title || 'Untitled Canvas'}</span>
      </div>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => handleRenameConversation(e, conv.id, conv.title)}
          className="p-1 hover:text-white"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); if(confirm('Delete this conversation?')) onDeleteConversation(conv.id); }}
          className="p-1 hover:text-red-400"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );

  return (
    <aside className={`relative h-screen bg-slate-950/80 backdrop-blur-3xl border-r border-white/5 transition-all duration-300 z-[1000] flex flex-col ${isCollapsed ? 'w-0 overflow-hidden' : 'w-72'}`}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-slate-900 border border-white/10 p-1.5 rounded-full text-slate-400 hover:text-white transition-all shadow-xl z-[1001]"
      >
        <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
      </button>

      {/* Primary Actions */}
      <div className="p-6 shrink-0">
        <button 
          onClick={() => onNewConversation()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Canvas
        </button>
        <button 
          onClick={onNewProject}
          className="w-full bg-white/5 hover:bg-white/10 text-slate-200 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
          New Project
        </button>
      </div>

      {/* Projects and Conversations */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        <div className="mb-8">
          <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Projects</h3>
          {projects.length === 0 && (
            <div className="px-2 py-4 text-xs text-slate-600 italic">Create your first project</div>
          )}
          {projects.map(proj => (
            <div key={proj.id} className="mb-2">
              <div 
                onClick={() => onToggleProject(proj.id)}
                className="group flex items-center justify-between px-2 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg className={`w-4 h-4 shrink-0 text-indigo-400 transition-transform ${proj.isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  <svg className="w-4 h-4 shrink-0 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  <span className="truncate text-sm font-semibold text-slate-300">{proj.name}</span>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onNewConversation(proj.id); }} className="p-1 hover:text-white" title="New Chat in Project">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <button onClick={(e) => handleRenameProject(e, proj.id, proj.name)} className="p-1 hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete project folder? Chats will be ungrouped.')) onDeleteProject(proj.id); }} className="p-1 hover:text-red-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              {proj.isExpanded && (
                <div className="ml-6 mt-1 border-l border-white/5 pl-2">
                  {conversations.filter(c => c.projectId === proj.id).map(renderConversationItem)}
                  {conversations.filter(c => c.projectId === proj.id).length === 0 && (
                    <div className="px-2 py-2 text-[10px] text-slate-700 italic">No canvases yet</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Ungrouped</h3>
          {ungroupedConversations.length === 0 && (
            <div className="px-2 py-4 text-xs text-slate-600 italic">Start a new canvas</div>
          )}
          {ungroupedConversations.map(renderConversationItem)}
        </div>
      </div>

      {/* Branding footer */}
      <div className="p-6 border-t border-white/5 bg-slate-900/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30">V</div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">Vynaa AI</div>
            <div className="text-[10px] text-slate-500 font-medium">Interactive Audiobook</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
