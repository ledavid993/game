'use client'

import React from 'react'
import { Toaster } from 'react-hot-toast'
import { HostDashboard } from './HostDashboard'
import type { SerializedGameState } from '@/app/lib/game/types'

interface HostDashboardWrapperProps {
  initialGameState?: SerializedGameState | null
}

export function HostDashboardWrapper({ initialGameState: _initialGameState }: HostDashboardWrapperProps) {
  return (
    <>
      <HostDashboard />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
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
  )
}