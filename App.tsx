import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { NodeData, CanvasState } from './types';
import BubbleNode from './components/BubbleNode';
import Connection from './components/Connection';
import ProjectSidebar from './src/components/ProjectSidebar';
import { useUndo } from './src/hooks/useUndo';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { sessions, turns } from './src/services/api';
import { turnsToNodes } from './src/utils/turnConverter';

// Pages
import Login from './src/pages/auth/Login';
import Signup from './src/pages/auth/Signup';
import VerifyEmail from './src/pages/auth/VerifyEmail';
import Profile from './src/pages/Profile';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const {
    state: nodes,
    setState: setNodesWithHistory,
    setWithoutHistory: setNodesWithoutHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetNodes
  } = useUndo<NodeData[]>([]);

  const [canvas, setCanvas] = useState<CanvasState>({ scale: 1, offset: { x: 0, y: 0 } });
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('Canvas');
  const [isSessionLoading, setIsSessionLoading] = useState(false); // NEW: For session loading state

  const dragRef = useRef<{ id: string; startX: number; startY: number; initialNodeX: number; initialNodeY: number } | null>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Load Session Data
  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
    }
  }, [activeSessionId]);

  // Auto-create default canvas if user has no sessions
  useEffect(() => {
    const initializeCanvas = async () => {
      if (activeSessionId) return;

      try {
        setIsSessionLoading(true); // NEW
        const sessionsList = await sessions.list();

        if (sessionsList.length === 0) {
          const defaultSession = await sessions.create('Welcome');
          setActiveSessionId(defaultSession._id);
        } else {
          // Load most recent session
          setActiveSessionId(sessionsList[0]._id);
        }
      } catch (error) {
        console.error('Failed to initialize canvas:', error);
        alert('Failed to load. Please refresh the page.');
      } finally {
        setIsSessionLoading(false); // NEW
      }
    };

    initializeCanvas();
  }, [activeSessionId]);

  // UPDATED: Load session with loading states
  const loadSession = async (id: string) => {
    try {
      setIsSessionLoading(true); // Show loading indicator
      const data = await sessions.get(id);
      const convertedNodes = turnsToNodes(data.turns);
      resetNodes(convertedNodes);
      setActiveSessionTitle(data.session.title);
    } catch (err) {
      console.error("Failed to load session", err);
      alert('Failed to load session. Please try again.');
      // Optionally: redirect to home or retry
    } finally {
      setIsSessionLoading(false); // Hide loading indicator
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  // Physics Loop
  useEffect(() => {
    let frameId: number;
    const physicsLoop = () => {
      setNodesWithoutHistory(prevNodes => {
        let changed = false;
        const newNodes = prevNodes.map(node => {
          if (node.isDragging || node.id === 'root') return node;

          let fx = 0, fy = 0;
          const minDistance = 500;

          prevNodes.forEach(other => {
            if (other.id === node.id) return;
            const dx = node.position.x - other.position.x;
            const dy = node.position.y - other.position.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq) || 1;

            if (dist < minDistance) {
              const force = (minDistance - dist) * 0.4;
              fx += (dx / dist) * force;
              fy += (dy / dist) * force;
              changed = true;
            }
          });

          if (Math.abs(fx) < 0.05 && Math.abs(fy) < 0.05) return node;

          return {
            ...node,
            position: { x: node.position.x + fx * 0.1, y: node.position.y + fy * 0.1 }
          };
        });

        return changed ? newNodes : prevNodes;
      });
      frameId = requestAnimationFrame(physicsLoop);
    };
    frameId = requestAnimationFrame(physicsLoop);
    return () => cancelAnimationFrame(frameId);
  }, [setNodesWithoutHistory]);

  // Interaction Handlers
  const handleDragStart = (id: string, clientX: number, clientY: number) => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      dragRef.current = { id, startX: clientX, startY: clientY, initialNodeX: node.position.x, initialNodeY: node.position.y };
      setNodesWithoutHistory(prev => prev.map(n => n.id === id ? { ...n, isDragging: true } : n));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !dragRef.current) {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const { id, startX, startY, initialNodeX, initialNodeY } = dragRef.current;
      const dx = (e.clientX - startX) / canvas.scale;
      const dy = (e.clientY - startY) / canvas.scale;
      setNodesWithoutHistory(prev => prev.map(n => n.id === id ? { ...n, position: { x: initialNodeX + dx, y: initialNodeY + dy } } : n));
      return;
    }
    if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setCanvas(prev => ({ ...prev, offset: { x: prev.offset.x + dx, y: prev.offset.y + dy } }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    if (dragRef.current) {
      const id = dragRef.current.id;
      setNodesWithHistory(prev => prev.map(n => n.id === id ? { ...n, isDragging: false } : n));
      dragRef.current = null;
    }
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSpeed = 0.0015;
    const delta = -e.deltaY * zoomSpeed;
    setCanvas(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale + delta, 0.05), 4) }));
  };

  const handleAsk = useCallback(async (question: string, parentId: string) => {
    if (!activeSessionId) return;

    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const angle = Math.random() * Math.PI * 2;
    const distance = 550;
    const newX = parentNode.position.x + Math.cos(angle) * distance;
    const newY = parentNode.position.y + Math.sin(angle) * distance;

    // Optimistically add user node
    const tempUserNodeId = `temp-user-${Date.now()}`;
    const tempUserNode: NodeData = {
      id: tempUserNodeId,
      parentId: parentId,
      type: 'user',
      content: question,
      suggestions: [],
      position: { x: newX, y: newY },
      velocity: { x: 0, y: 0 },
      timestamp: Date.now(),
    };

    setNodesWithHistory(prev => [...prev, tempUserNode]);
    setIsLoading(tempUserNodeId);

    try {
      // Call API
      const response = await turns.create(activeSessionId, question, { x: newX, y: newY });

      // Replace temp node with real user turn
      const userNode: NodeData = {
        id: response.userTurn._id,
        parentId: parentId,
        type: 'user',
        content: response.userTurn.content,
        suggestions: [],
        position: response.userTurn.metadata.position,
        velocity: response.userTurn.metadata.velocity,
        timestamp: new Date(response.userTurn.createdAt).getTime(),
      };

      // Add AI node
      const aiNode: NodeData = {
        id: response.assistantTurn._id,
        parentId: response.userTurn._id,
        type: 'ai',
        content: response.assistantTurn.content,
        suggestions: response.assistantTurn.metadata.suggestions || [],
        position: response.assistantTurn.metadata.position,
        velocity: response.assistantTurn.metadata.velocity,
        audio: response.assistantTurn.metadata.audio,
        timestamp: new Date(response.assistantTurn.createdAt).getTime(),
      };

      setNodesWithHistory(prev => [
        ...prev.filter(n => n.id !== tempUserNodeId),
        userNode,
        aiNode
      ]);

    } catch (error) {
      console.error('Failed to ask question:', error);
      // Remove temp node on error
      setNodesWithHistory(prev => prev.filter(n => n.id !== tempUserNodeId));
      alert('Failed to get response. Please try again.');
    } finally {
      setIsLoading(null);
    }
  }, [nodes, activeSessionId, setNodesWithHistory]);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // NEW: Show loading overlay when session is loading
  if (isSessionLoading) {
    return (
      <div className="flex w-full h-screen bg-[#020617] text-white items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-[#020617] text-white">
      <ProjectSidebar
        activeConversationId={activeSessionId || undefined}
        onSelectConversation={handleSelectSession}
      />

      <div className="fixed top-4 right-4 z-50 flex gap-4">
        <button
          onClick={handleProfileClick}
          className="bg-slate-800/80 hover:bg-slate-700/80 text-white px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider transition-all"
        >
          {user?.name?.split(' ')[0] || 'User'}
        </button>
      </div>

      <main
        className="flex-1 relative overflow-hidden touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="w-full h-full will-change-transform"
          style={{
            transform: `translate(${canvas.offset.x}px, ${canvas.offset.y}px) scale(${canvas.scale})`,
            transformOrigin: '0 0'
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="branch-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <filter id="branch-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {nodes.map(node => {
              if (!node.parentId) return null;
              const parent = nodes.find(n => n.id === node.parentId);
              if (!parent) return null;
              const isHighlighted = hoveredNodeId === node.id || hoveredNodeId === node.parentId;
              return <Connection key={`conn-${node.id}`} parent={parent} child={node} isHighlighted={isHighlighted} />;
            })}
          </svg>

          {nodes.map(node => (
            <BubbleNode
              key={node.id}
              node={node}
              onAsk={handleAsk}
              onDragStart={handleDragStart}
              onHover={setHoveredNodeId}
              isRoot={node.id === 'root'}
              isLoading={isLoading === node.id}
            />
          ))}
        </div>

        {/* Global Controls Overlay */}
        <div className="fixed bottom-10 right-10 flex items-center gap-4 bg-slate-900/60 backdrop-blur-3xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl">
          <button onClick={() => setCanvas(p => ({ ...p, scale: Math.min(p.scale + 0.2, 4) }))} className="p-2 hover:bg-white/10 rounded-xl text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
          </button>
          <button onClick={() => setCanvas(p => ({ ...p, scale: Math.max(p.scale - 0.2, 0.05) }))} className="p-2 hover:bg-white/10 rounded-xl text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 12H4" /></svg>
          </button>
          <div className="w-px h-6 bg-white/20"></div>
          <button onClick={undo} disabled={!canUndo} className={`p-2 rounded-xl text-white transition-all ${!canUndo ? 'opacity-30' : 'hover:bg-white/10'}`}>
            <span className="text-xl">↩</span>
          </button>
          <button onClick={redo} disabled={!canRedo} className={`p-2 rounded-xl text-white transition-all ${!canRedo ? 'opacity-30' : 'hover:bg-white/10'}`}>
            <span className="text-xl">↪</span>
          </button>
        </div>

        <div className="fixed top-10 right-10 text-right pointer-events-none opacity-20">
          <div className="text-4xl font-black text-white tracking-tighter select-none">VYNAA</div>
          <div className="text-[10px] text-indigo-400 uppercase tracking-[0.4em] font-black">Canvas Active</div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;