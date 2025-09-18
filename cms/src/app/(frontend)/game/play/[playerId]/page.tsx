'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

import { PlayerView } from '@/components/game/PlayerView';
import { ThemeToggle } from '@/components/game/ThemeToggle';

type PlayerPageProps = {
  params: {
    playerId: string;
  };
};

export default function PlayerPage({ params }: PlayerPageProps) {
  const playerId = decodeURIComponent(params.playerId);

  return (
    <>
      <div className="fixed right-4 top-4 z-50 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
        <div className="relative z-10 flex min-h-screen flex-col">
          <main className="flex-1">
            <PlayerView playerId={playerId} className="mx-auto max-w-4xl px-4 py-8" />
          </main>
        </div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '12px',
            maxWidth: '90vw',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
