import React from 'react';
import { NodeData, CanvasState } from '../../../types';

import BubbleNode from '../BubbleNode';
import Connection from '../Connection';

type Props = {
    mainRef: React.RefObject<HTMLDivElement>;

    nodes: NodeData[];
    canvas: CanvasState;
    isPanningUI: boolean;

    hoveredNodeId: string | null;
    isLoading: string | null;

    onPointerDownMain: (e: React.PointerEvent) => void;
    onPointerMoveMain: (e: React.PointerEvent) => void;
    onPointerUpMain: (e: React.PointerEvent) => void;
    onPointerCancelMain: (e: React.PointerEvent) => void;
    onWheelMain: (e: React.WheelEvent) => void;

    onHoverNode: (id: string | null) => void;
    onAsk: (question: string, parentId: string) => void;
    onDragStartNode: (id: string, clientX: number, clientY: number, pointerId: number) => void;
};

const CanvasStage: React.FC<Props> = ({
    mainRef,
    nodes,
    canvas,
    isPanningUI,
    hoveredNodeId,
    isLoading,
    onPointerDownMain,
    onPointerMoveMain,
    onPointerUpMain,
    onPointerCancelMain,
    onWheelMain,
    onHoverNode,
    onAsk,
    onDragStartNode,
}) => {
    return (
        <main
            ref={mainRef}
            className={[
                'flex-1 relative overflow-hidden',
                'touch-none',
                isPanningUI ? 'cursor-grabbing' : 'cursor-grab',
                'select-none',
            ].join(' ')}
            onPointerDown={onPointerDownMain}
            onPointerMove={onPointerMoveMain}
            onPointerUp={onPointerUpMain}
            onPointerCancel={onPointerCancelMain}
            onWheel={onWheelMain}
        >
            {/* Background (ElevenLabs-like) */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-white to-[#f7f7f8] dark:from-[#0b0f14] dark:to-[#070a0d]" />
                <div className="absolute inset-0 dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
            </div>

            {/* World layer */}
            <div
                className="absolute inset-0 will-change-transform"
                style={{
                    transform: `translate(${canvas.offset.x}px, ${canvas.offset.y}px) scale(${canvas.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                <svg className="absolute left-0 top-0 pointer-events-none overflow-visible" width={50000} height={50000}>
                    {nodes.map((node) => {
                        const parent = nodes.find((n) => n.id === node.parentId);
                        if (!parent) return null;

                        const isHighlighted = hoveredNodeId === node.id || hoveredNodeId === node.parentId;
                        return <Connection key={node.id} parent={parent} child={node} isHighlighted={isHighlighted} />;
                    })}
                </svg>

                {nodes.map((node) => (
                    <BubbleNode
                        key={node.id}
                        node={node}
                        onAsk={onAsk}
                        onDragStart={onDragStartNode}
                        onHover={onHoverNode}
                        isRoot={node.id === 'root'}
                        isLoading={isLoading === node.id}
                    />
                ))}
            </div>
        </main>
    );
};

export default CanvasStage;
