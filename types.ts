
export type NodeType = 'root' | 'ai' | 'user';

export interface Suggestion {
  id: string;
  text: string;
}

export interface NodeData {
  id: string;
  parentId: string | null;
  type: NodeType;
  content: string;
  suggestions: Suggestion[];
  position: { x: number; y: number };
  timestamp: number;
  isDragging?: boolean;
}

export interface CanvasState {
  scale: number;
  offset: { x: number; y: number };
}
