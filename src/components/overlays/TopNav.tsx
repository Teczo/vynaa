import React from 'react';
import ThemeToggle from '../ThemeToggle';
import { User, Settings } from 'lucide-react';
import { AIConfig } from '../SettingsModal';

const TopNav: React.FC<{
    userName: string;
    onProfile: () => void;
    onSettings: () => void;
    aiConfig: AIConfig | null;
}> = ({ userName, onProfile, onSettings, aiConfig }) => {
    return (
        <div className="fixed top-6 right-8 z-[2000] flex gap-3 items-center pointer-events-auto">
            {/* Active model badge */}
            {aiConfig?.apiKey && (
                <div className="bg-white/70 dark:bg-[#121212] px-3 py-1.5 rounded-full border border-black/10 dark:border-white/5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider backdrop-blur-xl">
                    {aiConfig.model}
                </div>
            )}

            <ThemeToggle />

            <button
                onClick={onSettings}
                className="flex items-center gap-2 bg-white/70 dark:bg-[#121212] hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-2.5 rounded-full border border-black/10 dark:border-white/5 transition-all backdrop-blur-xl"
                title="AI Settings"
            >
                <Settings size={14} />
            </button>

            <button
                onClick={onProfile}
                className="flex items-center gap-2 bg-white/70 dark:bg-[#121212] hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-4 py-2 rounded-full border border-black/10 dark:border-white/5 text-[11px] font-bold uppercase tracking-widest transition-all backdrop-blur-xl"
            >
                <User size={14} />
                {userName}
            </button>
        </div>
    );
};

export default TopNav;
