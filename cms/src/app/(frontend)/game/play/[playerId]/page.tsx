import { PlayerPageShell } from '@/app/components/game/PlayerPageShell'
import React from 'react'

type PlayerPageProps = {
  params: Promise<{
    playerId: string
  }>
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerId } = await params

  return <PlayerPageShell playerId={decodeURIComponent(playerId)} />
}
