export interface ChatSession {
    _id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export interface Turn {
    _id: string;
    sessionId: string;
    parentTurnId: string | null;
    role: 'user' | 'assistant';
    content: string;
    model: string;
    provider: 'google' | 'openai' | 'anthropic';
    position: { x: number; y: number };
    suggestions?: Array<{ id: string; text: string }>;
    createdAt: string;
}

export interface NodeData {
    id: string;
    parentId: string | null;
    type: 'root' | 'user' | 'ai';
    content: string;
    suggestions: Array<{ id: string; text: string }>;
    position: { x: number; y: number };
    timestamp: number;
    isDragging?: boolean;
}

export interface CanvasState {
    scale: number;
    offset: { x: number; y: number };
}
