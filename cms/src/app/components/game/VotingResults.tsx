'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface VoteResult {
  targetId: string
  targetName: string
  count: number
}

interface VotingResultsProps {
  gameId?: string
}

export function VotingResults({ gameId }: VotingResultsProps) {
  const [votes, setVotes] = useState<VoteResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        setIsLoading(true)
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
          setVotes(data.votes || [])
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
    }

    fetchVotes()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchVotes, 5000)
    return () => clearInterval(interval)
  }, [gameId])

  if (isLoading) {
    return (
      <div className="p-5 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-24 mx-auto mb-2"></div>
          <div className="h-3 bg-white/5 rounded w-32 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5 text-center text-manor-parchment/60">
        <p className="text-sm">Unable to load voting results</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    )
  }

  if (votes.length === 0) {
    return (
      <div className="p-5 text-center text-manor-parchment/60">
        <div className="text-2xl mb-2">🗳️</div>
        <p className="font-manor text-sm uppercase tracking-[0.25em] text-manor-parchment/70">
          No Votes Cast
        </p>
        <p className="text-xs mt-1 text-manor-parchment/50">
          Voting results will appear here once votes are recorded
        </p>
      </div>
    )
  }

  // Sort votes by count (highest first)
  const sortedVotes = [...votes].sort((a, b) => b.count - a.count)
  const maxVotes = sortedVotes[0]?.count || 0

  return (
    <div className="p-5">
      <div className="mb-4">
        <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle mb-1">
          Voting Results
        </h3>
        <p className="text-xs text-manor-parchment/60">
          {votes.length} player{votes.length !== 1 ? 's' : ''} received votes
        </p>
      </div>

      <div className="space-y-3">
        {sortedVotes.map((vote, index) => (
          <motion.div
            key={vote.targetId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-black/20">
              <div className="flex items-center gap-3">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                  ${index === 0
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : index === 1
                    ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    : index === 2
                    ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30'
                    : 'bg-white/10 text-manor-parchment/70 border border-white/10'
                  }
                `}>
                  {index === 0 ? '👑' : index + 1}
                </div>
                <div>
                  <p className="font-manor text-sm uppercase tracking-[0.2em] text-manor-candle">
                    {vote.targetName}
                  </p>
                  <p className="text-xs text-manor-parchment/60">
                    ID: {vote.targetId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-manor-candle text-lg">
                    {vote.count}
                  </p>
                  <p className="text-xs text-manor-parchment/60">
                    vote{vote.count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Vote bar */}
                <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${maxVotes > 0 ? (vote.count / maxVotes) * 100 : 0}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      index === 0
                        ? 'bg-yellow-400'
                        : index === 1
                        ? 'bg-gray-400'
                        : index === 2
                        ? 'bg-amber-600'
                        : 'bg-manor-wine'
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <p className="text-xs text-manor-parchment/50 uppercase tracking-[0.25em]">
          Total Votes: {votes.reduce((sum, vote) => sum + vote.count, 0)}
        </p>
      </div>
    </div>
  )
}