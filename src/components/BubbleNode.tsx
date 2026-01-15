import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Sparkles, MessageSquare, CornerDownRight } from 'lucide-react';
import { NodeData } from '../types';

interface BubbleNodeProps {
  node: NodeData;
  onAsk: (question: string, parentId: string) => void;
  onDragStart: (id: string, clientX: number, clientY: number, pointerId: number) => void;
  onHover: (id: string | null) => void;
  isRoot?: boolean;
  isLoading?: boolean;
}

const BubbleNode: React.FC<BubbleNodeProps> = ({
  node,
  onAsk,
  onDragStart,
  onHover,
  isRoot,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    if (!node.content) return;

    const utterance = new SpeechSynthesisUtterance(node.content);
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.name === 'Google US English') ||
      voices.find((v) => v.lang === 'en-US') ||
      voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onAsk(inputValue.trim(), node.id);
    setInputValue('');
  };

  const onPointerDownNode = (e: React.PointerEvent) => {
    // Prevent text selection + ensure we can capture the pointer upstream
    const target = e.target as HTMLElement;

    // Allow interaction with inputs/buttons without dragging
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

  const isRootNode = isRoot || node.type === 'root';

  const containerBg = isRootNode
    ? 'bg-white text-zinc-900'
    : 'bg-white/80 text-zinc-900 border border-black/10 dark:bg-[#0c0c0e] dark:text-zinc-100 dark:border-white/10';

  return (
    <motion.div
      data-node="true"
      onPointerDown={onPointerDownNode}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className="group select-none"
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: node.isDragging ? 100 : 10,
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={[
          'relative transition-all duration-300 shadow-2xl',
          containerBg,
          isRootNode ? 'w-72 h-72 rounded-full flex items-center justify-center p-8' : 'max-w-md rounded-[28px] p-8',
          node.isDragging ? 'cursor-grabbing scale-[1.02]' : 'cursor-grab',
        ].join(' ')}
      >
        {isRootNode ? (
          <div className="text-center space-y-5 w-full">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">VYNAA</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                Studio AI
              </p>
            </div>
            <form onSubmit={handleSubmit} className="w-full">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-white border border-black/10 rounded-2xl py-3 px-4 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:bg-black/20 dark:border-white/10 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </form>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {node.type === 'ai' ? (
                  <Sparkles size={14} className="text-zinc-500 dark:text-zinc-400" />
                ) : (
                  <MessageSquare size={14} className="text-zinc-500 dark:text-zinc-600" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-500">
                  {node.type === 'ai' ? 'Intelligence' : 'User Query'}
                </span>
              </div>

              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-zinc-700 hover:text-zinc-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-400 dark:hover:text-white transition-all"
                aria-label={isPlaying ? 'Stop playback' : 'Play'}
                title={isPlaying ? 'Stop' : 'Read aloud'}
              >
                {isPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              </button>
            </div>

            <p className="text-[17px] leading-[1.6] font-medium tracking-tight whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
              {node.content}
            </p>

            {isLoading && (
              <div className="flex gap-1.5 py-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 bg-zinc-500 rounded-full"
                  />
                ))}
              </div>
            )}

            {/* Suggestions */}
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

            {/* Continue input */}
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
