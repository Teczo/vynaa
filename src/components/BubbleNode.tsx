import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, CornerDownRight } from 'lucide-react';
import { NodeData } from '../types';

interface BubbleNodeProps {
  node: NodeData;
  onAsk: (question: string, parentId: string) => void;
  onDragStart: (id: string, clientX: number, clientY: number, pointerId: number) => void;
  onHover: (id: string | null) => void;
  isRoot?: boolean;
  isLoading?: boolean;
}

export const ROOT_WORLD_POSITION = { x: -1400, y: -200 };

const BubbleNode: React.FC<BubbleNodeProps> = ({
  node,
  onAsk,
  onDragStart,
  onHover,
  isRoot,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState('');

  const isRootNode = Boolean(isRoot) || node.type === 'root' || node.id === 'root';
  const renderPos = isRootNode ? ROOT_WORLD_POSITION : node.position;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onAsk(inputValue.trim(), node.id);
    setInputValue('');
  };

  const onPointerDownNode = (e: React.PointerEvent) => {
    if (isRootNode) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('form')
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    onDragStart(node.id, e.clientX, e.clientY, e.pointerId);
  };

  const containerBg = isRootNode
    ? 'bg-white text-zinc-900 shadow-2xl shadow-indigo-500/10 dark:bg-[#232325] dark:text-zinc-100 dark:shadow-black/30'
    : 'bg-white/90 backdrop-blur-xl text-zinc-900 border border-zinc-200/50 shadow-xl shadow-zinc-200/50 dark:bg-[#232325] dark:text-zinc-100 dark:border-white/5 dark:shadow-black/20';

  return (
    <motion.div
      data-node="true"
      onPointerDown={onPointerDownNode}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className="group select-none"
      style={{
        position: 'absolute',
        left: renderPos.x,
        top: renderPos.y,
        transform: 'translate(-50%, -50%)',
        zIndex: node.isDragging ? 100 : 10,
        width: isRootNode ? 'auto' : undefined,
        pointerEvents: 'auto',
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={[
          'relative transition-all duration-300',
          containerBg,
          isRootNode
            ? 'w-80 h-80 rounded-full flex items-center justify-center p-10 ring-1 ring-black/5 dark:ring-white/10'
            : 'min-w-[200px] max-w-[480px] rounded-[32px] p-7',
          isRootNode
            ? 'cursor-default'
            : node.isDragging
              ? 'cursor-grabbing scale-[1.02]'
              : 'cursor-grab',
        ].join(' ')}
      >
        {isRootNode ? (
          <div className="text-center space-y-6 w-full flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl opacity-50 rounded-full" />
              <h1 className="relative text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                VYNAA
              </h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-2">
                Studio AI
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full relative group/input">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur transition-opacity duration-500 -z-10" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Start imagining..."
                className="w-full bg-white/50 backdrop-blur-md border border-zinc-200/80 rounded-2xl py-3.5 px-5 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-0 focus:bg-white transition-all dark:bg-black/20 dark:border-white/10 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:bg-black/30 text-center"
              />
            </form>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {node.type === 'ai' ? (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Sparkles size={10} className="text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <MessageSquare size={10} className="text-zinc-500 dark:text-zinc-400" />
                  </div>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {node.type === 'ai' ? 'Intelligence' : 'Query'}
                </span>
              </div>
            </div>

            <p className="text-[17px] leading-[1.6] font-medium tracking-tight whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
              {node.content}
            </p>

            {isLoading && (
              <div className="flex gap-1.5 py-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 bg-zinc-400 rounded-full"
                  />
                ))}
              </div>
            )}

            {!isLoading && node.suggestions?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {node.suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAsk(s.text, node.id);
                    }}
                    className="bg-black/5 hover:bg-black/10 text-zinc-800 border border-black/10 px-4 py-2 rounded-full text-[11px] font-bold transition-all active:scale-95 flex items-center gap-2 dark:bg-[#121212] dark:hover:bg-white dark:hover:text-black dark:border-white/10 dark:text-zinc-300"
                  >
                    <CornerDownRight size={10} />
                    {s.text}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full mt-4">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Continue conversation..."
                className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:bg-black/20 dark:border-white/10 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BubbleNode;
