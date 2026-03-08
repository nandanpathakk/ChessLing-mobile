import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess, Square } from 'chess.js'
import { MatchRow, PlayerColor } from '@/features/match/match-types'
import { subscribeToMatch, getMatch, makeMove, resign, flagTimeout } from '@/features/match/match-service'
import { getValidTargets } from './chess-engine'

interface ChessGameState {
  match: MatchRow | null
  isLoading: boolean
  playerColor: PlayerColor | null
  isMyTurn: boolean
  selectedSquare: Square | null
  validTargets: Square[]
  /** Locally-ticked clocks in milliseconds (smooth 100ms updates). */
  localClocks: { white: number; black: number }
  handleSquarePress: (square: Square) => void
  handleResign: () => Promise<void>
}

/**
 * Core game hook.
 * - Loads match state from Supabase and subscribes to live updates.
 * - Runs a local 100ms interval to keep clocks smooth between server ticks.
 * - All move validation is delegated to chess.js on the server; the client
 *   uses chess.js only for UX (valid-move highlights, selection).
 */
export function useChessGame(matchId: string, playerPublicKey: string): ChessGameState {
  const [match, setMatch] = useState<MatchRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [validTargets, setValidTargets] = useState<Square[]>([])
  const [localClocks, setLocalClocks] = useState({ white: 0, black: 0 })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasFlaggedTimeout = useRef(false)
  const isMoving = useRef(false)

  // ── Derived values ─────────────────────────────────────────────────────────

  const isLocalPlay = match?.host_public_key === match?.guest_public_key

  const playerColor: PlayerColor | null =
    isLocalPlay && match
      ? (match.turn === 'w' ? 'white' : 'black')
      : match?.host_public_key === playerPublicKey
        ? match.host_color
        : match?.guest_public_key === playerPublicKey
          ? match?.guest_color ?? null
          : null

  const isMyTurn =
    !!playerColor &&
    !!match &&
    match.turn === (playerColor === 'white' ? 'w' : 'b') &&
    match.status === 'active'

  // ── Load + subscribe ───────────────────────────────────────────────────────

  useEffect(() => {
    setIsLoading(true)

    getMatch(matchId)
      .then((m) => {
        setMatch(m)
        setLocalClocks({ white: m.clock_white, black: m.clock_black })
      })
      .finally(() => setIsLoading(false))

    const unsub = subscribeToMatch(matchId, (updater) => {
      setMatch((prev) => {
        const updated = updater(prev)
        // Reset clocks to authoritative server values on each move
        setLocalClocks({ white: updated.clock_white, black: updated.clock_black })
        hasFlaggedTimeout.current = false
        return updated
      })
    })

    return unsub
  }, [matchId])

  // ── Local clock ticker ─────────────────────────────────────────────────────

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!match || match.status !== 'active') return

    const startTime = Date.now()
    const snapshot = { white: match.clock_white, black: match.clock_black }
    const activeTurn = match.turn

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setLocalClocks((prev) => {
        const next = { ...prev }
        if (activeTurn === 'w') {
          next.white = Math.max(0, snapshot.white - elapsed)
        } else {
          next.black = Math.max(0, snapshot.black - elapsed)
        }
        return next
      })
    }, 100)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // Re-run whenever the turn changes (a new move was made on the server)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.turn, match?.clock_last_updated, match?.status])

  // ── Timeout detection (only flag once per game per color) ──────────────────

  useEffect(() => {
    if (!match || match.status !== 'active' || hasFlaggedTimeout.current) return
    if (localClocks.white === 0 && match.turn === 'w') {
      hasFlaggedTimeout.current = true
      flagTimeout(matchId, 'white').catch(console.error)
    } else if (localClocks.black === 0 && match.turn === 'b') {
      hasFlaggedTimeout.current = true
      flagTimeout(matchId, 'black').catch(console.error)
    }
  }, [localClocks, match?.turn, match?.status, matchId])

  // ── Square press handler ───────────────────────────────────────────────────

  const handleSquarePress = useCallback(
    (square: Square) => {
      if (!match || !isMyTurn) return

      const myChessColor = playerColor === 'white' ? 'w' : 'b'

      if (selectedSquare === null) {
        // Attempt to select one of our pieces
        const game = new Chess(match.fen)
        const piece = game.get(square)
        if (!piece || piece.color !== myChessColor) return
        const targets = getValidTargets(match.fen, square)
        setSelectedSquare(square)
        setValidTargets(targets)
      } else if (validTargets.includes(square)) {
        // Execute the move
        if (isMoving.current) return
        isMoving.current = true

        const from = selectedSquare
        setSelectedSquare(null)
        setValidTargets([])

        const elapsed = Date.now() - match.clock_last_updated
        const newClock =
          playerColor === 'white'
            ? Math.max(0, match.clock_white - elapsed)
            : Math.max(0, match.clock_black - elapsed)

        // Optimistic UI Update: apply the move instantly on the client
        try {
          const tempGame = new Chess(match.fen)
          tempGame.move({ from, to: square, promotion: 'q' })

          setMatch((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              fen: tempGame.fen(),
              turn: tempGame.turn(),
              last_move_from: from,
              last_move_to: square,
              moves: [...(prev.moves || []), `${from}${square}`]
            }
          })
        } catch (e) {
          console.warn('Optimistic preview failed', e)
        }

        makeMove(matchId, playerPublicKey, from, square, newClock)
          .catch((err) => {
            console.error('Failed to make move:', err)
          })
          .finally(() => {
            isMoving.current = false
          })
      } else if (square === selectedSquare) {
        // Deselect
        setSelectedSquare(null)
        setValidTargets([])
      } else {
        // Attempt to re-select a different piece
        const game = new Chess(match.fen)
        const piece = game.get(square)
        if (piece && piece.color === myChessColor) {
          const targets = getValidTargets(match.fen, square)
          setSelectedSquare(square)
          setValidTargets(targets)
        } else {
          setSelectedSquare(null)
          setValidTargets([])
        }
      }
    },
    [match, isMyTurn, playerColor, selectedSquare, validTargets, matchId, playerPublicKey],
  )

  // ── Resign ─────────────────────────────────────────────────────────────────

  const handleResign = useCallback(async () => {
    if (!match || match.status !== 'active') return
    await resign(matchId, playerPublicKey)
  }, [match, matchId, playerPublicKey])

  return {
    match,
    isLoading,
    playerColor,
    isMyTurn,
    selectedSquare,
    validTargets,
    localClocks,
    handleSquarePress,
    handleResign,
  }
}
