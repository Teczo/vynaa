import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { NodeData, CanvasState } from '../../types';

import ProjectSidebar from '../components/ProjectSidebar';
import { useUndo } from '../hooks/useUndo';
import { useAuth } from '../context/AuthContext';
import { sessions, turns } from '../services/api';
import { turnsToNodes } from '../utils/turnConverter';

import CanvasStage from '../components/canvas/CanvasStage';
import OverlayHUD from '../components/overlays/OverlayHUD';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const mainRef = useRef<HTMLDivElement>(null);

    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const {
        state: nodes,
        setState: setNodesWithHistory,
        setWithoutHistory: setNodesWithoutHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        reset: resetNodes,
    } = useUndo<NodeData[]>([]);

    const [canvas, setCanvas] = useState<CanvasState>({
        scale: 0.8,
        offset: { x: 0, y: 0 },
    });

    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [isSessionLoading, setIsSessionLoading] = useState(false);
    const [isPanningUI, setIsPanningUI] = useState(false);

    const dragRef = useRef<{
        id: string;
        startX: number;
        startY: number;
        initialNodeX: number;
        initialNodeY: number;
        pointerId: number;
    } | null>(null);

    const panRef = useRef<{
        startX: number;
        startY: number;
        initialOffsetX: number;
        initialOffsetY: number;
        pointerId: number;
    } | null>(null);

    const setGlobalDraggingMode = (enabled: boolean) => {
        document.body.style.userSelect = enabled ? 'none' : '';
        (document.body.style as any).webkitUserSelect = enabled ? 'none' : '';
        document.body.style.cursor = enabled ? 'grabbing' : '';
    };

    const centerOnRoot = useCallback((nodeList: NodeData[]) => {
        const el = mainRef.current;
        if (!el) return;

        const root = nodeList.find((n) => n.id === 'root' || n.type === 'root');
        if (!root) return;

        const rect = el.getBoundingClientRect();

        setCanvas((prev) => ({
            ...prev,
            offset: {
                x: rect.width / 2 - root.position.x * prev.scale,
                y: rect.height / 2 - root.position.y * prev.scale,
            },
        }));
    }, []);

    // Initialize default session
    useEffect(() => {
        const initializeCanvas = async () => {
            if (activeSessionId) return;

            try {
                setIsSessionLoading(true);
                const sessionsList = await sessions.list();
                if (!sessionsList || sessionsList.length === 0) {
                    const defaultSession = await sessions.create('Welcome');
                    setActiveSessionId(defaultSession._id);
                } else {
                    setActiveSessionId(sessionsList[0]._id);
                }
            } catch (error) {
                console.error('Failed to initialize canvas:', error);
                alert('Failed to load. Please refresh the page.');
            } finally {
                setIsSessionLoading(false);
            }
        };

        initializeCanvas();
    }, [activeSessionId]);

    useEffect(() => {
        if (activeSessionId) loadSession(activeSessionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSessionId]);

    const loadSession = async (id: string) => {
        try {
            setIsSessionLoading(true);
            const data = await sessions.get(id);

            const nodeList = turnsToNodes(data.turns);
            resetNodes(nodeList);

            requestAnimationFrame(() => centerOnRoot(nodeList));
        } catch (err) {
            console.error('Failed to load session', err);
            alert('Failed to load session. Please try again.');
        } finally {
            setIsSessionLoading(false);
        }
    };

    useEffect(() => {
        const onResize = () => centerOnRoot(nodes);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [nodes, centerOnRoot]);

    const handleAsk = useCallback(
        async (question: string, parentId: string) => {
            if (!activeSessionId) return;

            const parentNode = nodes.find((n) => n.id === parentId);
            if (!parentNode) return;

            const angle = Math.random() * Math.PI * 2;
            const distance = 550;

            const newX = parentNode.position.x + Math.cos(angle) * distance;
            const newY = parentNode.position.y + Math.sin(angle) * distance;

            const tempUserNodeId = `temp-user-${Date.now()}`;
            const tempUserNode: NodeData = {
                id: tempUserNodeId,
                parentId,
                type: 'user',
                content: question,
                suggestions: [],
                position: { x: newX, y: newY },
                velocity: { x: 0, y: 0 },
                timestamp: Date.now(),
            };

            setNodesWithHistory((prev) => [...prev, tempUserNode]);
            setIsLoading(tempUserNodeId);

            try {
                const response = await turns.create(activeSessionId, question, { x: newX, y: newY });

                const userNode: NodeData = {
                    id: response.userTurn._id,
                    parentId,
                    type: 'user',
                    content: response.userTurn.content,
                    suggestions: [],
                    position: response.userTurn.metadata.position,
                    velocity: response.userTurn.metadata.velocity,
                    timestamp: new Date(response.userTurn.createdAt).getTime(),
                };

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

                setNodesWithHistory((prev) => [...prev.filter((n) => n.id !== tempUserNodeId), userNode, aiNode]);
            } catch (error) {
                console.error('Failed to ask question:', error);
                setNodesWithHistory((prev) => prev.filter((n) => n.id !== tempUserNodeId));
                alert('Failed to get response. Please try again.');
            } finally {
                setIsLoading(null);
            }
        },
        [activeSessionId, nodes, setNodesWithHistory]
    );

    // IMPORTANT: ignore overlay clicks so buttons work
    const onPointerDownMain = (e: React.PointerEvent) => {
        if (e.button !== 0) return;

        const target = e.target as HTMLElement;

        // Ignore any overlay UI interactions
        if (target.closest('[data-overlay="true"]')) return;
        if (target.closest('button, a, input, textarea, select')) return;

        // Ignore nodes
        if (target.closest('[data-node="true"]')) return;

        e.preventDefault();
        mainRef.current?.setPointerCapture(e.pointerId);

        panRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialOffsetX: canvas.offset.x,
            initialOffsetY: canvas.offset.y,
            pointerId: e.pointerId,
        };

        setIsPanningUI(true);
        setGlobalDraggingMode(true);
    };

    const onPointerMoveMain = (e: React.PointerEvent) => {
        const pan = panRef.current;

        if (pan && e.pointerId === pan.pointerId) {
            e.preventDefault();

            const dx = e.clientX - pan.startX;
            const dy = e.clientY - pan.startY;

            const nextOffsetX = pan.initialOffsetX + dx;
            const nextOffsetY = pan.initialOffsetY + dy;

            setCanvas((prev) => ({
                ...prev,
                offset: { x: nextOffsetX, y: nextOffsetY },
            }));

            return;
        }

        const drag = dragRef.current;
        if (drag && e.pointerId === drag.pointerId) {
            e.preventDefault();

            const dx = (e.clientX - drag.startX) / canvas.scale;
            const dy = (e.clientY - drag.startY) / canvas.scale;

            const id = drag.id;
            const x = drag.initialNodeX + dx;
            const y = drag.initialNodeY + dy;

            setNodesWithoutHistory((prev) =>
                prev.map((n) => (n.id === id ? { ...n, position: { x, y } } : n))
            );
        }
    };

    const endPointerOps = (pointerId: number) => {
        if (panRef.current?.pointerId === pointerId) {
            panRef.current = null;
            setIsPanningUI(false);
            setGlobalDraggingMode(false);
        }

        if (dragRef.current?.pointerId === pointerId) {
            const id = dragRef.current.id;
            dragRef.current = null;

            setNodesWithHistory((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isDragging: false } : n))
            );
            setGlobalDraggingMode(false);
        }
    };

    const onPointerUpMain = (e: React.PointerEvent) => {
        endPointerOps(e.pointerId);
        try {
            mainRef.current?.releasePointerCapture(e.pointerId);
        } catch { }
    };

    const onPointerCancelMain = (e: React.PointerEvent) => {
        endPointerOps(e.pointerId);
        try {
            mainRef.current?.releasePointerCapture(e.pointerId);
        } catch { }
    };

    const onWheelMain = (e: React.WheelEvent) => {
        // IMPORTANT: do not let page scroll
        e.preventDefault();
        const next = Math.min(Math.max(canvas.scale + -e.deltaY * 0.001, 0.1), 2);
        setCanvas((p) => ({ ...p, scale: next }));
    };

    const handleDragStart = (id: string, clientX: number, clientY: number, pointerId: number) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;

        mainRef.current?.setPointerCapture(pointerId);

        dragRef.current = {
            id,
            startX: clientX,
            startY: clientY,
            initialNodeX: node.position.x,
            initialNodeY: node.position.y,
            pointerId,
        };

        setGlobalDraggingMode(true);
        setNodesWithoutHistory((prev) => prev.map((n) => (n.id === id ? { ...n, isDragging: true } : n)));
    };

    if (isSessionLoading) {
        return (
            <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 border-2 border-white/15 border-t-white rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-white/60 text-sm">Loading canvas…</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-screen overflow-hidden bg-[#f7f7f8] text-zinc-900 dark:bg-[#0b0f14] dark:text-white">
            <ProjectSidebar
                activeConversationId={activeSessionId || undefined}
                onSelectConversation={setActiveSessionId}
            />

            <CanvasStage
                mainRef={mainRef}
                nodes={nodes}
                canvas={canvas}
                isPanningUI={isPanningUI}
                hoveredNodeId={hoveredNodeId}
                isLoading={isLoading}
                onPointerDownMain={onPointerDownMain}
                onPointerMoveMain={onPointerMoveMain}
                onPointerUpMain={onPointerUpMain}
                onPointerCancelMain={onPointerCancelMain}
                onWheelMain={onWheelMain}
                onHoverNode={setHoveredNodeId}
                onAsk={handleAsk}
                onDragStartNode={handleDragStart}
            />

            <OverlayHUD
                userName={user?.name?.split(' ')[0] || 'Profile'}
                onProfile={() => navigate('/profile')}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onCenter={() => centerOnRoot(nodes)}
                onZoomOut={() => setCanvas((p) => ({ ...p, scale: Math.max(p.scale - 0.1, 0.1) }))}
                onZoomIn={() => setCanvas((p) => ({ ...p, scale: Math.min(p.scale + 0.1, 2) }))}
                zoomPct={Math.round(canvas.scale * 100)}
                disableCenter={nodes.length === 0}
            />
        </div>
    );
};

export default DashboardPage;
