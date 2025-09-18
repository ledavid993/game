'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/lib/game/types';

interface PlayerGridProps {
  players: Player[];
  className?: string;
  showRoles?: boolean;
  onPlayerClick?: (player: Player) => void;
}

export function PlayerGrid({
  players,
  className = '',
  showRoles = false,
  onPlayerClick
}: PlayerGridProps) {
  const getPlayerEmoji = (player: Player): string => {
    if (!player.isAlive) return '💀';
    if (showRoles) {
      return player.role === 'murderer' ? '🔪' : '🧑‍🎄';
    }
    return '🧑‍🎄';
  };

  const getPlayerStatusColor = (player: Player): string => {
    if (!player.isAlive) return 'bg-gray-700 border-gray-500';
    if (showRoles && player.role === 'murderer') return 'bg-red-900 border-red-500';
    return 'bg-green-900 border-green-500';
  };

  const getPlayerTextColor = (player: Player): string => {
    if (!player.isAlive) return 'text-gray-400';
    if (showRoles && player.role === 'murderer') return 'text-red-300';
    return 'text-green-300';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`player-grid ${className}`}
    >
      {players.map((player) => (
        <motion.div
          key={player.id}
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPlayerClick?.(player)}
          className={`
            p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
            backdrop-blur-sm hover:shadow-lg
            ${getPlayerStatusColor(player)}
            ${onPlayerClick ? 'hover:scale-105' : ''}
            ${!player.isAlive ? 'opacity-60' : ''}
          `}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">{getPlayerEmoji(player)}</div>

            <h3 className={`font-bold text-lg ${getPlayerTextColor(player)}`}>
              {player.name}
            </h3>

            {showRoles && (
              <p className={`text-sm mt-1 ${getPlayerTextColor(player)}`}>
                {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
              </p>
            )}

            <div className="mt-2 flex justify-center items-center gap-2">
              <div className={`
                w-3 h-3 rounded-full
                ${player.isAlive ? 'bg-green-400' : 'bg-red-400'}
              `} />
              <span className={`text-xs ${getPlayerTextColor(player)}`}>
                {player.isAlive ? 'Alive' : 'Dead'}
              </span>
            </div>

            {player.socketId && (
              <div className="mt-1">
                <span className="text-xs text-blue-400">● Online</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {players.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full text-center py-12"
        >
          <div className="text-6xl mb-4">🎄</div>
          <p className="text-gray-400 text-lg">No players yet</p>
          <p className="text-gray-500 text-sm">Start a game to see players here</p>
        </motion.div>
      )}
    </motion.div>
  );
}