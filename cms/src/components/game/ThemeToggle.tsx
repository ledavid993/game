'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { currentTheme, themeName, changeTheme, getAvailableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const availableThemes = getAvailableThemes();

  const handleThemeChange = (newTheme: string) => {
    changeTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20 text-white hover:bg-white hover:bg-opacity-20 transition-all duration-200"
      >
        <span className="text-lg">🎨</span>
        <span className="font-medium">{currentTheme.displayName}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm"
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-48 bg-white bg-opacity-10 backdrop-blur-md rounded-lg border border-white border-opacity-20 shadow-xl z-50"
          >
            <div className="p-2">
              <div className="text-xs text-gray-300 px-3 py-1 font-semibold">
                Choose Theme
              </div>
              {availableThemes.map((theme) => (
                <motion.button
                  key={theme.name}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleThemeChange(theme.name)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-150
                    ${themeName === theme.name ? 'bg-white bg-opacity-20 text-white' : 'text-gray-300 hover:text-white'}
                  `}
                >
                  <span className="text-lg">
                    {theme.name === 'christmas' ? '🎄' : '🎃'}
                  </span>
                  <span className="font-medium">{theme.displayName}</span>
                  {themeName === theme.name && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-green-400"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>

            <div className="border-t border-white/10 p-2">
              <div className="text-xs text-gray-400 px-3 py-1">
                Theme changes instantly for all users
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}