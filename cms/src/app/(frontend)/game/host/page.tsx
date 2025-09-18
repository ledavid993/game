'use client'

import { HostDashboard } from '@/app/components/game/HostDashboard'
import { ThemeToggle } from '@/app/components/game/ThemeToggle'
import React from 'react'

import { Toaster } from 'react-hot-toast'

export default function HostPage() {
  return (
    <>
      <HostDashboard />
      <Toaster
        position="top-right"
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
