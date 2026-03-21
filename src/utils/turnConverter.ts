import { Turn, NodeData } from '../types';

export function turnsToNodes(turns: Turn[]): NodeData[] {
    const nodes: NodeData[] = [];

    // Add root node
    nodes.push({
        id: 'root',
        parentId: null,
        type: 'root',
        content: '',
        suggestions: [],
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        timestamp: Date.now(),
    });

    // Build a map for quick lookup
    const turnMap = new Map<string, Turn>();
    turns.forEach(t => turnMap.set(t._id, t));

    // Convert turns to nodes
    turns.forEach((turn) => {
        let parentId: string;

        if (turn.parentTurnId && turnMap.has(turn.parentTurnId)) {
            parentId = turn.parentTurnId;
        } else {
            // No parent turn → connect to root
            parentId = 'root';
        }

        nodes.push({
            id: turn._id,
            parentId,
            type: turn.role === 'user' ? 'user' : 'ai',
            content: turn.content,
            suggestions: turn.suggestions || [],
            position: turn.position || { x: 0, y: 0 },
            timestamp: new Date(turn.createdAt).getTime(),
        });
    });

    return nodes;
}
