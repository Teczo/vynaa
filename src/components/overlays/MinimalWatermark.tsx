import React from 'react';

const MinimalWatermark: React.FC = () => {
    return (
        <div className="fixed bottom-10 right-10 z-[1500] text-right pointer-events-none select-none">
            <div className="text-2xl font-black text-zinc-900/10 dark:text-white/10 tracking-tighter">VYNAA</div>
            <div className="text-[8px] text-zinc-900/10 dark:text-white/10 uppercase tracking-[0.4em] font-black">
                Studio Instance v1.0
            </div>
        </div>
    );
};

export default MinimalWatermark;
