'use client'

import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { Player } from '@/app/lib/game/types'
import { InvestigationRevealOverlay } from './InvestigationRevealOverlay'

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
  const [showReveal, setShowReveal] = useState(false)
  const [revealData, setRevealData] = useState<{ name: string; role: string } | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  // Fetch cooldown status on mount and after actions
  const fetchCooldown = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/game/ability?playerCode=${encodeURIComponent(player.id)}&abilityName=investigate`)
      const data = await response.json()
      if (data.success && data.cooldownRemaining) {
        setCooldownSeconds(data.cooldownRemaining)
      }
    } catch (error) {
      // Silently fail
    }
  }, [player.id])

  useEffect(() => {
    fetchCooldown()
  }, [fetchCooldown])

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const interval = setInterval(() => {
      setCooldownSeconds(prev => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldownSeconds])

  const handleDismissReveal = useCallback(() => {
    setShowReveal(false)
    setRevealData(null)
    onActionComplete?.()
  }, [onActionComplete])

  const handleInvestigate = async () => {
    if (!selectedTarget || isInvestigating || cooldownSeconds > 0) return

    setIsInvestigating(true)
    try {
      const response = await fetch('/api/v1/game/ability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCode: player.id,
          abilityName: 'investigate',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Use targetName and targetRole directly from API response
        const targetName = result.targetName || availableTargets.find(t => t.id === selectedTarget)?.name || 'Unknown'
        const targetRole = result.targetRole || 'civilian'

        setRevealData({ name: targetName, role: targetRole })
        setShowReveal(true)
        setSelectedTarget('')
        // Refresh cooldown after successful action
        fetchCooldown()
      } else {
        toast.error(result.error || 'Investigation failed')
      }
    } catch (error) {
      toast.error('Investigation failed')
    } finally {
      setIsInvestigating(false)
    }
  }

  const isOnCooldown = cooldownSeconds > 0
  const cooldownDisplay = isOnCooldown
    ? `Cooldown: ${Math.floor(cooldownSeconds / 60)}m ${cooldownSeconds % 60}s`
    : null

  return (
    <>
      <InvestigationRevealOverlay
        isVisible={showReveal}
        targetName={revealData?.name || ''}
        targetRole={revealData?.role || ''}
        onDismiss={handleDismissReveal}
      />

      <div className="space-y-4 rounded-lg border border-blue-500/20 bg-blue-900/10 p-4">
        <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-blue-300">
          🍭 Detective Powers
        </h3>
        <p className="text-sm text-blue-200/80">
          Investigate a player to reveal their true role. Use this power wisely.
        </p>

        {isOnCooldown ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-blue-300 font-semibold">{cooldownDisplay}</p>
            <p className="text-sm text-blue-200/60 mt-1">Your investigation powers are recharging...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-manor-candle"
              disabled={isInvestigating}
            >
              <option value="">Select player to investigate...</option>
              {availableTargets.filter(t => t.isAlive && t.id !== player.id).map((target) => (
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
        )}
      </div>
    </>
  )
}

// Reviver Component - Can bring back eliminated players
export const ReviverActions = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isReviving, setIsReviving] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const deadPlayers = availableTargets.filter(p => !p.isAlive)

  // Fetch cooldown status on mount
  const fetchCooldown = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/game/ability?playerCode=${encodeURIComponent(player.id)}&abilityName=revive`)
      const data = await response.json()
      if (data.success && data.cooldownRemaining) {
        setCooldownSeconds(data.cooldownRemaining)
      }
    } catch (error) {
      // Silently fail
    }
  }, [player.id])

  useEffect(() => {
    fetchCooldown()
  }, [fetchCooldown])

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const interval = setInterval(() => {
      setCooldownSeconds(prev => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldownSeconds])

  const handleRevive = async () => {
    if (!selectedTarget || isReviving || cooldownSeconds > 0) return

    setIsReviving(true)
    try {
      const response = await fetch('/api/v1/game/ability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCode: player.id,
          abilityName: 'revive',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message, { duration: 5000 })
        setSelectedTarget('')
        fetchCooldown()
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

  const isOnCooldown = cooldownSeconds > 0
  const cooldownDisplay = isOnCooldown
    ? `Cooldown: ${Math.floor(cooldownSeconds / 60)}m ${cooldownSeconds % 60}s`
    : null

  return (
    <div className="space-y-4 rounded-lg border border-green-500/20 bg-green-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-green-300">
        🧚 Sugarplum Powers
      </h3>
      <p className="text-sm text-green-200/80">
        Bring a fallen player back to life. Choose carefully - this power is precious.
      </p>

      {isOnCooldown ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-green-300 font-semibold">{cooldownDisplay}</p>
          <p className="text-sm text-green-200/60 mt-1">Your revival powers are recharging...</p>
        </div>
      ) : deadPlayers.length === 0 ? (
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
  const [abilityStatus, setAbilityStatus] = useState<{ canUse: boolean; reason?: string } | null>(null)

  // Fetch ability status on mount
  const fetchAbilityStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/game/ability?playerCode=${encodeURIComponent(player.id)}&abilityName=protect`)
      const data = await response.json()
      if (data.success) {
        setAbilityStatus({ canUse: data.canUse, reason: data.reason })
      }
    } catch (error) {
      // Silently fail
    }
  }, [player.id])

  useEffect(() => {
    fetchAbilityStatus()
  }, [fetchAbilityStatus])

  const handleProtect = async () => {
    if (!selectedTarget || isProtecting) return

    setIsProtecting(true)
    try {
      const response = await fetch('/api/v1/game/ability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCode: player.id,
          abilityName: 'protect',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message, { duration: 5000 })
        setSelectedTarget('')
        fetchAbilityStatus()
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

  const cannotUse = abilityStatus && !abilityStatus.canUse

  return (
    <div className="space-y-4 rounded-lg border border-yellow-500/20 bg-yellow-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-yellow-300">
        🥜 Nutcracker Powers
      </h3>
      <p className="text-sm text-yellow-200/80">
        Shield a player from harm for this round. Your protection could save a life.
      </p>

      {cannotUse ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🛡️</div>
          <p className="text-yellow-300 font-semibold">Already Protecting</p>
          <p className="text-sm text-yellow-200/60 mt-1">{abilityStatus?.reason || 'You are already protecting someone.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-manor-candle"
            disabled={isProtecting}
          >
            <option value="">Select player to protect...</option>
            {availableTargets.filter(t => t.isAlive && t.id !== player.id).map((target) => (
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
      )}
    </div>
  )
}

// Vigilante Component - Can eliminate suspected murderers
export const VigilanteActions = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isEliminating, setIsEliminating] = useState(false)
  const [abilityStatus, setAbilityStatus] = useState<{ canUse: boolean; reason?: string; usesRemaining?: number } | null>(null)

  // Fetch ability status on mount
  const fetchAbilityStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/game/ability?playerCode=${encodeURIComponent(player.id)}&abilityName=vigilante_kill`)
      const data = await response.json()
      if (data.success) {
        setAbilityStatus({ canUse: data.canUse, reason: data.reason, usesRemaining: data.usesRemaining })
      }
    } catch (error) {
      // Silently fail
    }
  }, [player.id])

  useEffect(() => {
    fetchAbilityStatus()
  }, [fetchAbilityStatus])

  const handleEliminate = async () => {
    if (!selectedTarget || isEliminating) return

    setIsEliminating(true)
    try {
      const response = await fetch('/api/v1/game/ability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCode: player.id,
          abilityName: 'vigilante_kill',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message, { duration: 5000 })
        setSelectedTarget('')
        fetchAbilityStatus()
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

  const cannotUse = abilityStatus && !abilityStatus.canUse

  return (
    <div className="space-y-4 rounded-lg border border-red-500/20 bg-red-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-red-300">
        ⭐ North Star Powers
      </h3>
      <p className="text-sm text-red-200/80">
        Eliminate a suspected murderer. Warning: If you target an innocent, you'll be eliminated instead!
      </p>

      {cannotUse ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">💫</div>
          <p className="text-red-300 font-semibold">Power Exhausted</p>
          <p className="text-sm text-red-200/60 mt-1">{abilityStatus?.reason || 'You have used your one-time elimination power.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {abilityStatus?.usesRemaining !== undefined && (
            <p className="text-xs text-red-300/70 text-center">Uses remaining: {abilityStatus.usesRemaining}</p>
          )}
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
      )}
    </div>
  )
}

// Grinch Component - Can mimic other players' abilities
export const GrinchActions = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isMimicking, setIsMimicking] = useState(false)
  const [mimickedPlayers, setMimickedPlayers] = useState<string[]>([])
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  // Fetch cooldown status on mount
  const fetchCooldown = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/game/ability?playerCode=${encodeURIComponent(player.id)}&abilityName=grinch_mimic`)
      const data = await response.json()
      if (data.success && data.cooldownRemaining) {
        setCooldownSeconds(data.cooldownRemaining)
      }
    } catch (error) {
      // Silently fail
    }
  }, [player.id])

  useEffect(() => {
    fetchCooldown()
  }, [fetchCooldown])

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const interval = setInterval(() => {
      setCooldownSeconds(prev => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldownSeconds])

  // Get list of already mimicked players
  useEffect(() => {
    if (player.grinchMimickedPlayers) {
      const mimicked = (player.grinchMimickedPlayers as any[]).map(m => m.playerCode)
      setMimickedPlayers(mimicked)
    }
  }, [player.grinchMimickedPlayers])

  // Filter out already mimicked players and self
  const availableToMimic = availableTargets.filter(p =>
    p.isAlive &&
    p.id !== player.id &&
    !mimickedPlayers.includes(p.id)
  )

  const handleMimic = async () => {
    if (!selectedTarget || isMimicking || cooldownSeconds > 0) return

    setIsMimicking(true)
    try {
      const response = await fetch('/api/v1/game/ability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCode: player.id,
          abilityName: 'grinch_mimic',
          targetCode: selectedTarget,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message, { duration: 6000 })
        setSelectedTarget('')
        fetchCooldown()
        onActionComplete?.()
      } else {
        toast.error(result.error || 'Mimic failed')
      }
    } catch (error) {
      toast.error('Mimic failed')
    } finally {
      setIsMimicking(false)
    }
  }

  const isOnCooldown = cooldownSeconds > 0
  const cooldownDisplay = isOnCooldown
    ? `Cooldown: ${Math.floor(cooldownSeconds / 60)}m ${cooldownSeconds % 60}s`
    : null

  return (
    <div className="space-y-4 rounded-lg border border-green-500/20 bg-green-900/10 p-4">
      <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-green-300">
        🎄 Grinch Powers
      </h3>
      <p className="text-sm text-green-200/80">
        Mimic another player's ability and use it once. <span className="text-red-300 font-semibold">Warning:</span> If you mimic a murderer, you will die!
      </p>

      {isOnCooldown ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-green-300 font-semibold">{cooldownDisplay}</p>
          <p className="text-sm text-green-200/60 mt-1">Your mimic powers are recharging...</p>
        </div>
      ) : availableToMimic.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-green-200/60 italic">
            {mimickedPlayers.length > 0
              ? "You have mimicked all available players."
              : "No players available to mimic."
            }
          </p>
          {mimickedPlayers.length > 0 && (
            <p className="text-xs text-green-300/50 mt-2">
              Mimicked: {mimickedPlayers.length} players
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-manor-candle"
            disabled={isMimicking}
          >
            <option value="">Select player to mimic...</option>
            {availableToMimic.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name} ({target.role})
              </option>
            ))}
          </select>

          <button
            onClick={handleMimic}
            disabled={!selectedTarget || isMimicking}
            className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
          >
            {isMimicking ? 'Mimicking...' : 'Mimic Player Ability'}
          </button>

          {mimickedPlayers.length > 0 && (
            <div className="text-xs text-green-300/60 bg-green-900/20 rounded p-2">
              <p className="font-semibold mb-1">Previously Mimicked:</p>
              <p>{mimickedPlayers.join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Voting Interface Component - Can be used by all roles
export const VotingInterface = ({ player, gameCode, availableTargets, onActionComplete }: RoleActionProps) => {
  const [selectedTarget, setSelectedTarget] = useState('')
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [isCheckingVoteStatus, setIsCheckingVoteStatus] = useState(true)
  // Only show alive players (excluding self)
  const alivePlayers = availableTargets.filter(p => p.isAlive && p.id !== player.id)

  // Check if player has already voted on component mount
  useEffect(() => {
    const checkVotingStatus = async () => {
      if (!player.id || !gameCode) return

      try {
        const response = await fetch(`/api/v1/game/vote/status?playerCode=${encodeURIComponent(player.id)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        const result = await response.json()
        if (response.ok && result.success) {
          setHasVoted(result.hasVoted)
        }
      } catch (error) {
        console.error('Error checking vote status:', error)
      } finally {
        setIsCheckingVoteStatus(false)
      }
    }

    checkVotingStatus()
  }, [player.id, gameCode])

  const handleVote = async () => {
    if (!selectedTarget || isVoting) return

    setIsVoting(true)
    try {
      const response = await fetch('/api/v1/game/vote/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCode: selectedTarget,
          voterCode: player.id,
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
        setHasVoted(true) // Mark as voted after successful vote
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

      {isCheckingVoteStatus ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-purple-300">
            <div className="w-5 h-5 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin"></div>
            <span className="text-sm">Checking your voting status...</span>
          </div>
        </div>
      ) : hasVoted ? (
        <div className="text-center py-8 space-y-3">
          <div className="text-4xl">✅</div>
          <h4 className="font-manor text-lg uppercase tracking-[0.2em] text-purple-300">
            Vote Already Cast
          </h4>
          <p className="text-sm text-purple-200/80">
            You have already voted in this round. Wait for other players to vote or for the next round.
          </p>
        </div>
      ) : alivePlayers.length === 0 ? (
        <p className="text-manor-parchment/60 italic">No players available to vote for.</p>
      ) : (
        <div className="space-y-4">
          {/* Player Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {alivePlayers.map((target) => (
              <button
                key={target.id}
                onClick={() => setSelectedTarget(target.id)}
                disabled={isVoting}
                className={`relative group p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedTarget === target.id
                    ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/30'
                    : 'border-white/20 bg-black/30 hover:border-purple-300/50 hover:bg-purple-500/10'
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Selected indicator */}
                {selectedTarget === target.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}

                {/* Player avatar placeholder */}
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-400/30 to-purple-600/30 flex items-center justify-center border border-white/20">
                  <span className="text-xl">👤</span>
                </div>

                {/* Player name */}
                <h4 className="font-manor text-sm uppercase tracking-[0.1em] text-center text-white/90 leading-tight">
                  {target.name}
                </h4>

                {/* Status indicator */}
                <div className="mt-2 flex justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                </div>
              </button>
            ))}
          </div>

          {/* Sticky Vote Button */}
          {selectedTarget && (
            <>
              {/* Fixed sticky button at bottom */}
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/95 to-transparent p-4 pb-6">
                <div className="max-w-5xl mx-auto">
                  <button
                    onClick={handleVote}
                    disabled={!selectedTarget || isVoting}
                    className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg"
                  >
                    {isVoting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Casting Vote...
                      </span>
                    ) : (
                      `Vote to Eliminate ${alivePlayers.find(p => p.id === selectedTarget)?.name}`
                    )}
                  </button>
                </div>
              </div>

              {/* Spacer to prevent content from being hidden behind sticky button */}
              <div className="h-20"></div>
            </>
          )}
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
    case 'troll':
      return <GrinchActions {...props} />
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
      case 'troll':
        return <GrinchActions {...props} />
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