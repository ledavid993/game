'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface VoteResult {
  targetId: string
  targetName: string
  count: number
}

interface VotingResultsProps {
  gameId?: string
  aliveCount?: number
}

// Optimized player card component
const PlayerVoteCard = React.memo<{
  vote: VoteResult
  index: number
  isTopVoted: boolean
  aliveCount?: number
}>(({ vote, index, isTopVoted, aliveCount }) => {
  const getRankIcon = () => {
    if (index === 0) return '👑'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getBadgeStyle = () => {
    const percentage = aliveCount && aliveCount > 0 ? (vote.count / aliveCount) * 100 : 0

    // Danger zone (≥70% - elimination threshold)
    if (percentage >= 70) return 'bg-red-500/30 text-red-200 border-red-400/70 animate-pulse'
    // Warning zone (≥50%)
    if (percentage >= 50) return 'bg-orange-500/25 text-orange-300 border-orange-400/60'
    // Top positions
    if (index === 0) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
    if (index === 1) return 'bg-gray-400/20 text-gray-300 border-gray-400/50'
    if (index === 2) return 'bg-amber-600/20 text-amber-400 border-amber-600/50'
    return 'bg-manor-wine/20 text-manor-wine border-manor-wine/50'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative"
    >
      <div
        className={`
        relative rounded-lg border bg-black/30 backdrop-blur-sm p-3 transition-all hover:bg-black/40
        ${(() => {
          const percentage = aliveCount && aliveCount > 0 ? (vote.count / aliveCount) * 100 : 0
          if (percentage >= 70) return 'border-red-500/50 shadow-lg shadow-red-500/20 bg-red-900/10'
          if (percentage >= 50) return 'border-orange-500/40 shadow-md shadow-orange-500/10 bg-orange-900/5'
          if (isTopVoted) return 'border-yellow-500/30 shadow-lg shadow-yellow-500/10'
          return 'border-white/10'
        })()}
      `}
      >
        {/* Vote Count Badge */}
        <div
          className={`
          absolute -top-1 -right-1 w-6 h-6 rounded-full border flex items-center justify-center
          font-bold text-xs shadow-md ${getBadgeStyle()}
        `}
        >
          {vote.count}
        </div>

        {/* Rank Icon */}
        <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-white/5 border border-white/10">
          <span className="text-sm">{getRankIcon()}</span>
        </div>

        {/* Player Info */}
        <div className="text-center">
          <h3 className="font-manor text-xs uppercase tracking-[0.15em] text-manor-candle truncate mb-1">
            {vote.targetName}
          </h3>
          <p className="text-xs text-manor-parchment/80 font-medium">
            {aliveCount && aliveCount > 0
              ? `${Math.round((vote.count / aliveCount) * 100)}%`
              : `${vote.count} vote${vote.count !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Top voted glow effect */}
        {isTopVoted && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />
        )}
      </div>
    </motion.div>
  )
})

PlayerVoteCard.displayName = 'PlayerVoteCard'

export const VotingResults = React.memo<VotingResultsProps>(({ gameId, aliveCount }) => {
  const [votes, setVotes] = useState<VoteResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const previousVotesRef = useRef<string>('')

  const fetchVotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/game/vote/results?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch voting results')
      }

      const data = await response.json()
      if (data.success) {
        const newVotes = data.votes || []
        const newVotesString = JSON.stringify(newVotes)

        // Only update state if votes actually changed
        if (newVotesString !== previousVotesRef.current) {
          setVotes(newVotes)
          previousVotesRef.current = newVotesString
        }
        setError(null)
      } else {
        setError(data.error || 'Failed to load votes')
      }
    } catch (err) {
      console.error('Error fetching votes:', err)
      setError(err instanceof Error ? err.message : 'Failed to load votes')
      setVotes([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVotes()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchVotes, 5000)
    return () => clearInterval(interval)
  }, [fetchVotes, gameId])

  // Memoized calculations to prevent unnecessary re-computations
  const sortedVotes = useMemo(() => [...votes].sort((a, b) => b.count - a.count), [votes])

  const totalVotes = useMemo(() => votes.reduce((sum, vote) => sum + vote.count, 0), [votes])

  const maxVotes = useMemo(() => sortedVotes[0]?.count || 0, [sortedVotes])

  if (isLoading) {
    return (
      <div className="border-b border-white/10 px-6 py-5">
        <div className="animate-pulse">
          <div className="h-5 bg-white/10 rounded w-32 mb-2"></div>
          <div className="h-3 bg-white/5 rounded w-48"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-b border-white/10 px-6 py-5 text-center text-manor-parchment/60">
        <p className="text-sm">Unable to load voting results</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    )
  }

  if (votes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-manor-parchment/60">
        <div>
          <div className="text-4xl mb-4">🗳️</div>
          <p className="font-manor text-sm uppercase tracking-[0.25em] text-manor-parchment/70">
            No Votes Cast
          </p>
          <p className="text-xs mt-2 text-manor-parchment/50">
            Voting results will appear here once votes are recorded
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
          {sortedVotes.map((vote, index) => (
            <PlayerVoteCard
              key={vote.targetId}
              vote={vote}
              index={index}
              isTopVoted={index === 0 && vote.count > 0}
              aliveCount={aliveCount}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

VotingResults.displayName = 'VotingResults'
