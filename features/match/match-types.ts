// Matches the Supabase `matches` table columns exactly (snake_case)

export type MatchStatus = 'waiting' | 'staking' | 'active' | 'completed' | 'cancelled'
export type PlayerColor = 'white' | 'black'
export type GameResult = 'checkmate' | 'timeout' | 'resignation' | 'stalemate' | 'draw' | 'abandoned'
export type Winner = 'white' | 'black' | 'draw'

export interface MatchRow {
  id: string
  code: string
  status: MatchStatus
  stake_amount: number // lamports
  time_control: number // seconds per player
  host_public_key: string
  host_color: PlayerColor
  host_staked: boolean
  host_tx: string | null
  guest_public_key: string | null
  guest_color: PlayerColor | null
  guest_staked: boolean
  guest_tx: string | null
  fen: string
  pgn: string
  moves: string[]
  turn: 'w' | 'b'
  last_move_from: string | null
  last_move_to: string | null
  move_count: number
  clock_white: number // milliseconds remaining
  clock_black: number // milliseconds remaining
  clock_last_updated: number // unix timestamp ms
  clock_last_turn: 'w' | 'b' | null
  winner: Winner | null
  result_reason: GameResult | null
  prize_amount: number | null
  prize_tx: string | null
  created_at: string
  started_at: string | null
  ended_at: string | null
}

export const STAKE_OPTIONS = [
  { label: '0.05 SOL', value: 50_000_000, display: '0.05' },
  { label: '0.1 SOL', value: 100_000_000, display: '0.1' },
  { label: '0.25 SOL', value: 250_000_000, display: '0.25' },
  { label: '0.5 SOL', value: 500_000_000, display: '0.5' },
] as const

export const TIME_CONTROLS = [
  { label: '1 min', seconds: 60, display: '1+0' },
  { label: '2 min', seconds: 120, display: '2+0' },
  { label: '3 min', seconds: 180, display: '3+0' },
] as const

export const SOL_PER_LAMPORT = 1e-9
export const PLATFORM_FEE_BPS = 500 // 5%

export function lamportsToSol(lamports: number): string {
  return (lamports * SOL_PER_LAMPORT).toFixed(4).replace(/\.?0+$/, '')
}

export function calculatePrize(stakeAmount: number): number {
  const pool = stakeAmount * 2
  const fee = Math.floor((pool * PLATFORM_FEE_BPS) / 10_000)
  return pool - fee
}
