import React, { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', compact = false }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className={`group relative inline-flex items-center gap-2 rounded-full border transition-all duration-300 active:scale-95 ${
                compact ? 'p-2' : 'pl-2 pr-3 py-1.5'
            } ${
                isDark
                    ? 'border-white/15 bg-white/5 hover:bg-white/10 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                    : 'border-sky-200/80 bg-white/80 hover:bg-white text-sky-700 shadow-[0_8px_24px_rgba(14,165,233,0.15)]'
            } ${className}`}
        >
            <span
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                    isDark
                        ? 'bg-linear-to-br from-indigo-500 to-violet-600 text-white'
                        : 'bg-linear-to-br from-amber-300 to-orange-400 text-white'
                }`}
            >
                {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </span>
            {!compact && (
                <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {isDark ? 'Dark' : 'Light'}
                </span>
            )}
        </button>
    );
};

export default ThemeToggle;
