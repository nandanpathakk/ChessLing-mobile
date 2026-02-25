import { supabase } from '@/supabase.config'
import { MatchRow, PlayerColor } from './match-types'

/**
 * Base URL for the Node.js backend.
 * Set EXPO_PUBLIC_API_URL in your .env file.
 * Default falls back to localhost for development.
 */
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`)
  return data as T
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`)
  return data as T
}

// ─── Match lifecycle ──────────────────────────────────────────────────────────

export async function createMatch(
  hostPublicKey: string,
  stakeAmount: number,
  timeControl: number,
): Promise<{ matchId: string; code: string }> {
  return post('/api/matches', { hostPublicKey, stakeAmount, timeControl })
}

export async function getMatchByCode(code: string): Promise<MatchRow> {
  return get(`/api/matches/code/${code.toUpperCase().trim()}`)
}

export async function getMatch(matchId: string): Promise<MatchRow> {
  return get(`/api/matches/${matchId}`)
}

export async function joinMatch(matchId: string, guestPublicKey: string): Promise<void> {
  await post(`/api/matches/${matchId}/join`, { guestPublicKey })
}

export async function confirmStake(
  matchId: string,
  publicKey: string,
  txSignature: string,
): Promise<{ bothStaked: boolean }> {
  return post(`/api/matches/${matchId}/stake`, { publicKey, txSignature })
}

export async function makeMove(
  matchId: string,
  publicKey: string,
  from: string,
  to: string,
  newClockMs: number,
): Promise<void> {
  await post(`/api/matches/${matchId}/move`, { publicKey, from, to, newClockMs })
}

export async function resign(matchId: string, publicKey: string): Promise<void> {
  await post(`/api/matches/${matchId}/resign`, { publicKey })
}

export async function flagTimeout(matchId: string, timedOutColor: PlayerColor): Promise<void> {
  await post(`/api/matches/${matchId}/timeout`, { timedOutColor })
}

export async function claimPrize(matchId: string, publicKey: string): Promise<{ prizeTx: string }> {
  return post(`/api/matches/${matchId}/claim`, { publicKey })
}

export async function abandonMatch(matchId: string, publicKey: string): Promise<void> {
  await post(`/api/matches/${matchId}/abandon`, { publicKey })
}

// ─── Realtime subscription ────────────────────────────────────────────────────

/**
 * Subscribe to live updates for a match row.
 * Returns an unsubscribe function to clean up on unmount.
 */
export function subscribeToMatch(
  matchId: string,
  onUpdate: (match: MatchRow) => void,
): () => void {
  const channel = supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        onUpdate(payload.new as MatchRow)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
