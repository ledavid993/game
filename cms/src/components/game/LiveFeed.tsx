'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KillEvent } from '@/lib/game/types';

interface LiveFeedProps {
  killEvents: KillEvent[];
  onPlayerKilled?: (killEvent: KillEvent) => void;
  className?: string;
  maxEvents?: number;
}

export function LiveFeed({
  killEvents,
  onPlayerKilled,
  className = '',
  maxEvents = 10
}: LiveFeedProps) {
  const [visibleEvents, setVisibleEvents] = useState<KillEvent[]>([]);
  const [newEvent, setNewEvent] = useState<KillEvent | null>(null);

  useEffect(() => {
    // Keep only the most recent events
    const recentEvents = killEvents.slice(-maxEvents);
    setVisibleEvents(recentEvents);

    // Check for new events
    if (killEvents.length > 0) {
      const latestEvent = killEvents[killEvents.length - 1];
      if (!visibleEvents.some(e => e.id === latestEvent.id)) {
        setNewEvent(latestEvent);
        onPlayerKilled?.(latestEvent);

        // Clear the new event highlight after animation
        setTimeout(() => setNewEvent(null), 3000);
      }
    }
  }, [killEvents, maxEvents, onPlayerKilled]);

  const getEventIcon = (event: KillEvent): string => {
    if (event.message.includes('WIN')) return '🎉';
    if (event.message.includes('killed')) return '💀';
    if (event.message.includes('joined')) return '👥';
    return '📢';
  };

  const getEventColor = (event: KillEvent): string => {
    if (event.message.includes('WIN')) return 'text-yellow-400';
    if (event.message.includes('killed')) return 'text-red-400';
    if (event.message.includes('joined')) return 'text-green-400';
    return 'text-blue-400';
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`bg-gray-900 rounded-xl p-6 h-full ${className}`}>
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📺 Live Feed
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">LIVE</span>
        </div>
      </div>

      <div className="space-y-3 h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {visibleEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 py-8"
            >
              <div className="text-4xl mb-2">🎄</div>
              <p>Waiting for the chaos to begin...</p>
            </motion.div>
          ) : (
            visibleEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -50, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                  backgroundColor: newEvent?.id === event.id ? '#dc2626' : 'rgba(255, 255, 255, 0.1)'
                }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{
                  duration: 0.3,
                  backgroundColor: { duration: 2 }
                }}
                className={`
                  p-4 rounded-lg backdrop-blur-sm border border-white/20
                  ${newEvent?.id === event.id ? 'ring-2 ring-red-400' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getEventIcon(event)}</span>
                  <div className="flex-1">
                    <p className={`font-bold ${getEventColor(event)}`}>
                      {event.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {newEvent && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-xl z-50"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{getEventIcon(newEvent)}</span>
            <p className="font-bold">{newEvent.message}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}