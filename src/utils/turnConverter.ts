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
        velocity: { x: 0, y: 0 },
        timestamp: Date.now(),
    });

    // Convert turns to nodes
    turns.forEach((turn, index) => {
        const parentId = index === 0 ? 'root' : turns[index - 1]._id;

        nodes.push({
            id: turn._id,
            parentId,
            type: turn.role === 'user' ? 'user' : 'ai',
            content: turn.content,
            suggestions: turn.metadata.suggestions || [],
            position: turn.metadata.position || { x: 0, y: 0 },
            velocity: turn.metadata.velocity || { x: 0, y: 0 },
            audio: turn.metadata.audio ? {
                hasAudio: turn.metadata.audio.hasAudio,
                base64Data: turn.metadata.audio.base64Data,
                durationRequested: turn.metadata.audio.durationRequested,
                isPlaying: false
            } : undefined,
            timestamp: new Date(turn.createdAt).getTime(),
        });
    });

    return nodes;
}