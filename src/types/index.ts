export interface ChatSession {
    _id: string;
    projectId: string | null;
    ownerUserId: string;
    title: string;
    status: 'active' | 'archived' | 'deleted';
    summary?: string;
    nextTurnIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface Turn {
    _id: string;
    sessionId: string;
    projectId: string | null;
    turnIndex: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata: {
        suggestions?: Array<{ id: string; text: string }>;
        audio?: {
            hasAudio: boolean;
            base64Data?: string;
            durationRequested?: number;
        };
        position?: { x: number; y: number };
        velocity?: { x: number; y: number };
    };
    createdAt: string;
}

// Legacy types for canvas rendering (derived from Turn)
export interface NodeData {
    id: string;
    parentId: string | null;
    type: 'root' | 'user' | 'ai';
    content: string;
    suggestions: Array<{ id: string; text: string }>;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    audio?: {
        hasAudio: boolean;
        autoPlay?: boolean;
        isPlaying?: boolean;
        base64Data?: string;
        durationRequested?: number;
    };
    timestamp: number;
    isDragging?: boolean;
}

export interface CanvasState {
    scale: number;
    offset: { x: number; y: number };
}

export interface Project {
    _id: string;
    ownerId: string;
    name: string;
    isExpanded: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}