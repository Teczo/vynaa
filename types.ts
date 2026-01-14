
export type NodeType = 'root' | 'ai' | 'user';

export interface Suggestion {
  id: string;
  text: string;
}

export interface AudioState {
  hasAudio: boolean;
  autoPlay: boolean;
  isPlaying: boolean;
  base64Data?: string;
  durationRequested?: number; // in minutes
}

export interface NodeData {
  id: string;
  parentId: string | null;
  type: NodeType;
  content: string;
  suggestions: Suggestion[];
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  audio?: AudioState;
  timestamp: number;
  isDragging?: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  isExpanded: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  projectId: string | null;
  nodes: NodeData[];
  createdAt: number;
  updatedAt: number;
}

export interface CanvasState {
  scale: number;
  offset: { x: number; y: number };
}
