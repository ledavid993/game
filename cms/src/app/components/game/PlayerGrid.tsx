'use client'

import React from 'react'
import { Player } from '@/app/lib/game/types'
import { ROLE_LABELS, isMurdererRole } from '@/app/lib/game/roles'
import { ROLE_INFO } from '@/app/lib/game/gameSettings'

interface PlayerGridProps {
  players: Player[]
  className?: string
  showRoles?: boolean
  onPlayerClick?: (player: Player, event: React.MouseEvent<HTMLDivElement>) => void
}

export function PlayerGrid({
  players,
  className = '',
  showRoles = false,
  onPlayerClick,
}: PlayerGridProps) {
  const getRolePriority = (role: string | undefined): number => {
    if (!role) return 100 // Unknown roles go last

    // Murderers get highest priority (lowest number)
    if (role === 'murderer') return 1

    // Other special roles
    const specialRolePriority: Record<string, number> = {
      'detective': 2,
      'vigilante': 3,
      'reviver': 4,
      'bodyguard': 5,
      'nurse': 6,
      'doctor': 7,
      'troll': 8,
    }

    if (specialRolePriority[role]) {
      return specialRolePriority[role]
    }

    // Civilians come after special roles
    if (role === 'civilian') return 50

    // Unknown roles
    return 100
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const priorityA = getRolePriority(a.role)
    const priorityB = getRolePriority(b.role)

    // If same priority, sort by name
    if (priorityA === priorityB) {
      return a.name.localeCompare(b.name)
    }

    return priorityA - priorityB
  })

  const getPlayerEmoji = (player: Player): string => {
    if (!player.isAlive) return '💀'
    if (showRoles && player.role) {
      // Find the role info by matching the role
      const roleInfoEntry = Object.values(ROLE_INFO).find(roleInfo => roleInfo.role === player.role)
      if (roleInfoEntry) {
        return roleInfoEntry.emoji
      }
      // Fallback for civilian or unknown roles
      return player.role === 'civilian' ? '❄️' : '🧑‍🎄'
    }
    return '🧑‍🎄'
  }

  const getPlayerStatusColor = (player: Player): string => {
    if (!player.isAlive) return 'bg-gray-700 border-gray-500'
    if (showRoles && player.role) {
      const roleInfoEntry = Object.values(ROLE_INFO).find(roleInfo => roleInfo.role === player.role)
      if (roleInfoEntry) {
        const colorMap = {
          red: 'bg-red-900 border-red-500',
          blue: 'bg-blue-900 border-blue-500',
          green: 'bg-green-900 border-green-500',
          yellow: 'bg-yellow-900 border-yellow-500',
          orange: 'bg-orange-900 border-orange-500',
          cyan: 'bg-cyan-900 border-cyan-500',
          purple: 'bg-purple-900 border-purple-500',
        }
        return colorMap[roleInfoEntry.color as keyof typeof colorMap] || 'bg-gray-900 border-gray-500'
      }
      // Fallback for civilian
      return player.role === 'civilian' ? 'bg-gray-900 border-gray-500' : 'bg-green-900 border-green-500'
    }
    return 'bg-green-900 border-green-500'
  }

  const getPlayerTextColor = (player: Player): string => {
    if (!player.isAlive) return 'text-gray-400'
    if (showRoles && player.role) {
      const roleInfoEntry = Object.values(ROLE_INFO).find(roleInfo => roleInfo.role === player.role)
      if (roleInfoEntry) {
        const colorMap = {
          red: 'text-red-300',
          blue: 'text-blue-300',
          green: 'text-green-300',
          yellow: 'text-yellow-300',
          orange: 'text-orange-300',
          cyan: 'text-cyan-300',
          purple: 'text-purple-300',
        }
        return colorMap[roleInfoEntry.color as keyof typeof colorMap] || 'text-gray-300'
      }
      // Fallback for civilian
      return player.role === 'civilian' ? 'text-gray-300' : 'text-green-300'
    }
    return 'text-green-300'
  }

  return (
    <div className={`player-grid ${className}`}>
      {sortedPlayers.map((player) => (
        <div
          key={player.id}
          onClick={(event) => onPlayerClick?.(player, event)}
          className={`
            p-4 rounded-xl border-2 cursor-pointer
            backdrop-blur-sm hover:shadow-lg transition-colors
            ${getPlayerStatusColor(player)}
            ${onPlayerClick ? 'hover:opacity-80' : ''}
            ${!player.isAlive ? 'opacity-60' : ''}
          `}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">{getPlayerEmoji(player)}</div>

            <h3 className={`font-bold text-lg ${getPlayerTextColor(player)}`}>{player.name}</h3>

            {showRoles && player.role && (
              <div className="mt-1 text-sm text-manor-parchment/70">
                <p className="font-semibold">
                  {(() => {
                    const roleInfoEntry = Object.values(ROLE_INFO).find(roleInfo => roleInfo.role === player.role)
                    if (roleInfoEntry) {
                      return roleInfoEntry.displayName
                    }
                    return player.role === 'civilian' ? 'Snowbound Citizen' : ROLE_LABELS[player.role] || player.role
                  })()}
                </p>
                <p className="text-xs text-manor-parchment/40 mt-0.5 uppercase font-medium">
                  {(() => {
                    const roleInfoEntry = Object.values(ROLE_INFO).find(roleInfo => roleInfo.role === player.role)
                    if (roleInfoEntry) {
                      return roleInfoEntry.role
                    }
                    return player.role || 'unknown'
                  })()}
                </p>
                <p className="text-xs text-manor-parchment/40 mt-0.5">
                  {(() => {
                    const descriptions = {
                      'murderer': 'Eliminates other players secretly',
                      'detective': 'Investigates players for roles',
                      'reviver': 'Brings eliminated players back',
                      'bodyguard': 'Protects players from elimination',
                      'vigilante': 'Eliminates suspected murderers only',
                      'nurse': 'Heals and supports players',
                      'doctor': 'Advanced healing and medicine',
                      'troll': 'Mimics other players abilities',
                      'civilian': 'Find and eliminate murderers'
                    }
                    return descriptions[player.role as keyof typeof descriptions] || 'Unknown role'
                  })()}
                </p>
              </div>
            )}

            <div className="mt-2 flex justify-center items-center gap-2">
              <div
                className={`
                w-3 h-3 rounded-full
                ${player.isAlive ? 'bg-green-400' : 'bg-red-400'}
              `}
              />
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
        </div>
      ))}

      {sortedPlayers.length === 0 && (
        <div className="col-span-full text-center py-12">
          <div className="text-6xl mb-4">🎄</div>
          <p className="text-gray-400 text-lg">No players yet</p>
          <p className="text-gray-500 text-sm">Start a game to see players here</p>
        </div>
      )}
    </div>
  )
}
