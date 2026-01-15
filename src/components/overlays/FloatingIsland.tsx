import React from 'react';
import { Plus, Minus, RotateCcw, RotateCw, Crosshair } from 'lucide-react';

type Props = {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;

    onCenter: () => void;
    disableCenter: boolean;

    onZoomOut: () => void;
    onZoomIn: () => void;
    zoomPct: number;
};

const FloatingIsland: React.FC<Props> = ({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onCenter,
    disableCenter,
    onZoomOut,
    onZoomIn,
    zoomPct,
}) => {
    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] pointer-events-auto">
            <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-[#121212]/80 backdrop-blur-3xl border border-black/10 dark:border-white/10 p-2 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-1 px-2 border-r border-black/10 dark:border-white/5">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 rounded-xl text-zinc-700 dark:text-zinc-400 transition-all"
                        title="Undo"
                    >
                        <RotateCcw size={18} />
                    </button>

                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 rounded-xl text-zinc-700 dark:text-zinc-400 transition-all"
                        title="Redo"
                    >
                        <RotateCw size={18} />
                    </button>

                    <button
                        onClick={onCenter}
                        disabled={disableCenter}
                        className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 rounded-xl text-zinc-700 dark:text-zinc-400 transition-all"
                        title="Center"
                    >
                        <Crosshair size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-1 px-2">
                    <button
                        onClick={onZoomOut}
                        className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-zinc-700 dark:text-zinc-400 transition-all"
                        title="Zoom out"
                    >
                        <Minus size={18} />
                    </button>

                    <span className="text-[10px] font-black w-12 text-center text-zinc-700/70 dark:text-zinc-500 uppercase tracking-tighter">
                        {zoomPct}%
                    </span>

                    <button
                        onClick={onZoomIn}
                        className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-zinc-700 dark:text-zinc-400 transition-all"
                        title="Zoom in"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingIsland;
