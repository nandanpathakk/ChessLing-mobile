import { useState, useEffect } from 'react'
import { MatchRow } from './match-types'
import { getMatch, subscribeToMatch } from './match-service'

interface UseMatchResult {
  match: MatchRow | null
  isLoading: boolean
  error: string | null
}

/**
 * Loads a match and subscribes to live Supabase Realtime updates.
 * Automatically cleans up the subscription on unmount.
 */
export function useMatch(matchId: string | null): UseMatchResult {
  const [match, setMatch] = useState<MatchRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!matchId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    getMatch(matchId)
      .then((m) => {
        setMatch(m)
        setIsLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setIsLoading(false)
      })

    const unsubscribe = subscribeToMatch(matchId, (updater) => {
      setMatch(updater as any)
    })

    return unsubscribe
  }, [matchId])

  return { match, isLoading, error }
}
