'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import type { Player } from '@/app/lib/game/types'

interface RoleActionProps {
  player: Player
  gameCode: string
  availableTargets: Player[]
  onActionComplete?: () => void
}

// Detective Component - Can investigate players to reveal their role
export const DetectiveActions = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isInvestigating, setIsInvestigating] = useState(false)

  const handleInvestigate = async () => {
    if (!selectedTarget || isInvestigating) return

    setIsInvestigating(true)
    try {
      const response = await fetch('/api/v1/game/role-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameCode,
          playerCode: player.id,
          action: 'investigate',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message, { duration: 5000 })
        setSelectedTarget('')
        onActionComplete?.()
      } else {
        toast.error(result.error || 'Investigation failed')
      }
    } catch (error) {
      toast.error('Investigation failed')
    } finally {
      setIsInvestigating(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-blue-500/20 bg-blue-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-blue-300">
        🍭 Detective Powers
      </h3>
      <p className="text-sm text-blue-200/80">
        Investigate a player to reveal their true role. Use this power wisely.
      </p>

      <div className="space-y-3">
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-manor-candle"
          disabled={isInvestigating}
        >
          <option value="">Select player to investigate...</option>
          {availableTargets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleInvestigate}
          disabled={!selectedTarget || isInvestigating}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
        >
          {isInvestigating ? 'Investigating...' : 'Investigate Player'}
        </button>
      </div>
    </div>
  )
}

// Reviver Component - Can bring back eliminated players
export const ReviverActions = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isReviving, setIsReviving] = useState(false)
  const deadPlayers = availableTargets.filter(p => !p.isAlive)

  const handleRevive = async () => {
    if (!selectedTarget || isReviving) return

    setIsReviving(true)
    try {
      const response = await fetch('/api/v1/game/role-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameCode,
          playerCode: player.id,
          action: 'revive',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message, { duration: 5000 })
        setSelectedTarget('')
        onActionComplete?.()
      } else {
        toast.error(result.error || 'Revival failed')
      }
    } catch (error) {
      toast.error('Revival failed')
    } finally {
      setIsReviving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-green-500/20 bg-green-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-green-300">
        🧚 Sugarplum Powers
      </h3>
      <p className="text-sm text-green-200/80">
        Bring a fallen player back to life. Choose carefully - this power is precious.
      </p>

      {deadPlayers.length === 0 ? (
        <p className="text-manor-parchment/60 italic">No fallen players to revive.</p>
      ) : (
        <div className="space-y-3">
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-manor-candle"
            disabled={isReviving}
          >
            <option value="">Select fallen player to revive...</option>
            {deadPlayers.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name} (Eliminated)
              </option>
            ))}
          </select>

          <button
            onClick={handleRevive}
            disabled={!selectedTarget || isReviving}
            className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
          >
            {isReviving ? 'Reviving...' : 'Revive Player'}
          </button>
        </div>
      )}
    </div>
  )
}

// Bodyguard Component - Can protect players
export const BodyguardActions = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isProtecting, setIsProtecting] = useState(false)

  const handleProtect = async () => {
    if (!selectedTarget || isProtecting) return

    setIsProtecting(true)
    try {
      const response = await fetch('/api/v1/game/role-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameCode,
          playerCode: player.id,
          action: 'protect',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message, { duration: 5000 })
        setSelectedTarget('')
        onActionComplete?.()
      } else {
        toast.error(result.error || 'Protection failed')
      }
    } catch (error) {
      toast.error('Protection failed')
    } finally {
      setIsProtecting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-yellow-500/20 bg-yellow-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-yellow-300">
        🥜 Nutcracker Powers
      </h3>
      <p className="text-sm text-yellow-200/80">
        Shield a player from harm for this round. Your protection could save a life.
      </p>

      <div className="space-y-3">
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-manor-candle"
          disabled={isProtecting}
        >
          <option value="">Select player to protect...</option>
          {availableTargets.filter(t => t.isAlive).map((target) => (
            <option key={target.id} value={target.id}>
              {target.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleProtect}
          disabled={!selectedTarget || isProtecting}
          className="w-full rounded-lg bg-yellow-600 px-6 py-3 font-semibold text-white hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
        >
          {isProtecting ? 'Protecting...' : 'Protect Player'}
        </button>
      </div>
    </div>
  )
}

// Vigilante Component - Can eliminate suspected murderers
export const VigilanteActions = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isEliminating, setIsEliminating] = useState(false)

  const handleEliminate = async () => {
    if (!selectedTarget || isEliminating) return

    setIsEliminating(true)
    try {
      const response = await fetch('/api/v1/game/role-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameCode,
          playerCode: player.id,
          action: 'vigilante_kill',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message, { duration: 5000 })
        setSelectedTarget('')
        onActionComplete?.()
      } else {
        toast.error(result.error || 'Elimination failed')
      }
    } catch (error) {
      toast.error('Elimination failed')
    } finally {
      setIsEliminating(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-red-500/20 bg-red-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-red-300">
        ⭐ North Star Powers
      </h3>
      <p className="text-sm text-red-200/80">
        Eliminate a suspected murderer. Warning: If you target an innocent, you'll be eliminated instead!
      </p>

      <div className="space-y-3">
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-manor-candle"
          disabled={isEliminating}
        >
          <option value="">Select suspected murderer...</option>
          {availableTargets.filter(t => t.isAlive && t.id !== player.id).map((target) => (
            <option key={target.id} value={target.id}>
              {target.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleEliminate}
          disabled={!selectedTarget || isEliminating}
          className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
        >
          {isEliminating ? 'Eliminating...' : 'Eliminate Suspected Murderer'}
        </button>
      </div>
    </div>
  )
}

// Voting Interface Component - Can be used by all roles
export const VotingInterface = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isVoting, setIsVoting] = useState(false)
  // Only show alive players (excluding self)
  const alivePlayers = availableTargets.filter(p => p.isAlive && p.id !== player.id)

  console.log('VotingInterface Debug:', {
    availableTargets: availableTargets.length,
    alivePlayers: alivePlayers.length,
    playerId: player.id,
    allPlayers: availableTargets.map(p => ({ id: p.id, name: p.name, isAlive: p.isAlive }))
  })

  const handleVote = async () => {
    if (!selectedTarget || isVoting) return

    setIsVoting(true)
    try {
      const response = await fetch('/api/v1/game/vote/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        if (result.eliminated) {
          toast.success(`${result.eliminatedPlayer.name} has been eliminated by majority vote!`, { duration: 6000 })
        } else {
          toast.success(result.message, { duration: 4000 })
        }
        setSelectedTarget('')
        onActionComplete?.()
      } else {
        toast.error(result.error || 'Vote failed')
      }
    } catch (error) {
      toast.error('Vote failed')
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-purple-500/20 bg-purple-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-purple-300">
        🗳️ Cast Your Vote
      </h3>
      <p className="text-sm text-purple-200/80">
        Vote to eliminate a suspected murderer. If 70% of alive players vote for someone, they will be eliminated.
      </p>

      {alivePlayers.length === 0 ? (
        <p className="text-manor-parchment/60 italic">No players available to vote for.</p>
      ) : (
        <div className="space-y-3">
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-manor-candle"
            disabled={isVoting}
          >
            <option value="">Select player to vote for...</option>
            {alivePlayers.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleVote}
            disabled={!selectedTarget || isVoting}
            className="w-full rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
          >
            {isVoting ? 'Casting Vote...' : 'Cast Vote'}
          </button>
        </div>
      )}
    </div>
  )
}

// Role-specific actions only (no voting)
export const RoleSpecificActions = (props: RoleActionProps) => {
  const { player } = props

  if (!player.isAlive) {
    return (
      <div className="space-y-4">
        <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
          💀 Eliminated
        </h3>
        <p className="text-sm text-manor-parchment/80">
          Your story has ended. Watch from beyond as the tale unfolds.
        </p>
      </div>
    )
  }

  // Get role-specific content only
  switch (player.role) {
    case 'detective':
      return <DetectiveActions {...props} />
    case 'reviver':
      return <ReviverActions {...props} />
    case 'bodyguard':
      return <BodyguardActions {...props} />
    case 'vigilante':
      return <VigilanteActions {...props} />
    case 'nurse':
    case 'doctor':
      return (
        <div className="space-y-4 rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-4">
          <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-cyan-300">
            {player.role === 'nurse' ? '🍪 Gingerbread Powers' : '🧊 Arctic Elf Powers'}
          </h3>
          <p className="text-sm text-cyan-200/80">
            Your healing abilities are being prepared. Stay vigilant and protect the innocent.
          </p>
        </div>
      )
    case 'civilian':
      return (
        <div className="space-y-4 rounded-lg border border-gray-500/20 bg-gray-900/10 p-4">
          <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-gray-300">
            ❄️ Snowbound Citizen
          </h3>
          <p className="text-sm text-gray-200/80">
            You have no special powers, but your vote and voice are powerful. Work with others to find the murderers.
          </p>
        </div>
      )
    default:
      return null
  }
}

// Generic component selector (includes voting)
export const RoleActionsComponent = (props: RoleActionProps) => {
  const { player } = props

  if (!player.isAlive) {
    return (
      <div className="space-y-4">
        <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
          💀 Eliminated
        </h3>
        <p className="text-sm text-manor-parchment/80">
          Your story has ended. Watch from beyond as the tale unfolds.
        </p>
      </div>
    )
  }

  // Get role-specific content
  const getRoleContent = () => {
    switch (player.role) {
      case 'detective':
        return <DetectiveActions {...props} />
      case 'reviver':
        return <ReviverActions {...props} />
      case 'bodyguard':
        return <BodyguardActions {...props} />
      case 'vigilante':
        return <VigilanteActions {...props} />
      case 'nurse':
      case 'doctor':
        return (
          <div className="space-y-4 rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-4">
            <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-cyan-300">
              {player.role === 'nurse' ? '🍪 Gingerbread Powers' : '🧊 Arctic Elf Powers'}
            </h3>
            <p className="text-sm text-cyan-200/80">
              Your healing abilities are being prepared. Stay vigilant and protect the innocent.
            </p>
          </div>
        )
      case 'civilian':
        return (
          <div className="space-y-4 rounded-lg border border-gray-500/20 bg-gray-900/10 p-4">
            <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-gray-300">
              ❄️ Snowbound Citizen
            </h3>
            <p className="text-sm text-gray-200/80">
              You have no special powers, but your vote and voice are powerful. Work with others to find the murderers.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {getRoleContent()}
      <div className="border-t border-white/10 pt-6">
        <VotingInterface {...props} />
      </div>
    </div>
  )
}