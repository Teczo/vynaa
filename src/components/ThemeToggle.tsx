import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {theme === 'dark' ? (
                    <Moon size={20} className="text-text-primary" />
                ) : (
                    <Sun size={20} className="text-yellow-500" />
                )}
            </motion.div>
        </button>
    );
};

export default ThemeToggle;
