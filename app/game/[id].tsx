import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { ChessBoard } from '@/features/chess/chess-board'
import { ChessTimer } from '@/features/chess/chess-timer'
import { useChessGame } from '@/features/chess/use-chess-game'
import type { Square } from 'chess.js'

const { width: SW } = Dimensions.get('window')
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortAddr(addr: string) {
  return `${addr.slice(0, 4)}···${addr.slice(-4)}`
}

function getCaptured(fen: string): { byWhite: string[]; byBlack: string[] } {
  const placement = fen.split(' ')[0]
  const cur: Record<string, number> = {}
  for (const ch of placement) {
    if (ch === '/' || (ch >= '1' && ch <= '8')) continue
    cur[ch] = (cur[ch] || 0) + 1
  }
  const start: Record<string, number> = {
    P: 8, R: 2, N: 2, B: 2, Q: 1,
    p: 8, r: 2, n: 2, b: 2, q: 1,
  }
  const byWhite: string[] = []
  const byBlack: string[] = []
  for (const [ch, s] of Object.entries(start)) {
    const missing = s - (cur[ch] || 0)
    for (let i = 0; i < missing; i++) {
      if (ch === ch.toLowerCase()) byWhite.push(ch)
      else byBlack.push(ch.toLowerCase())
    }
  }
  return { byWhite, byBlack }
}

function getMoveHistory(moves: string[]) {
  const pairs: Array<{ n: number; w: string; b: string }> = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ n: i / 2 + 1, w: moves[i] ?? '', b: moves[i + 1] ?? '' })
  }
  return pairs
}

const PIECE_SYM: Record<string, string> = {
  q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { account } = useMobileWallet()

  const {
    match, isLoading, playerColor, isMyTurn,
    selectedSquare, validTargets, localClocks,
    handleSquarePress, handleResign,
  } = useChessGame(id ?? '', account?.address ?? '')

  const [isExiting, setIsExiting] = useState(false)

  const spinVal = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinVal, { toValue: 1, duration: 1100, useNativeDriver: true })
    ).start()
  }, [spinVal])
  const spinDeg = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  useEffect(() => {
    // If the local screen has already initiated destruction, ignore external updates
    if (isExiting) return

    if (match?.status === 'completed') {
      if (match.result_reason === 'resignation') {
        router.replace('/')
      } else {
        router.replace(`/result/${id}`)
      }
    }
  }, [match?.status, match?.result_reason, id, isExiting])

  function confirmResign() {
    Alert.alert('Resign?', 'Your opponent wins the match and your stake.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resign',
        style: 'destructive',
        onPress: () => {
          // 1. Immediately tear down screen so it can't receive board taps
          setIsExiting(true)

          // 2. Dispatch home route
          router.replace('/')

          // 3. Fire the resignation asynchronously into the backend
          handleResign().catch((err) => {
            console.error('Quiet Resign Failure:', err)
          })
        }
      },
    ])
  }

  if (isLoading || !match || !playerColor) {
    return (
      <View style={[styles.root, styles.center]}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spinDeg }] }]} />
        <Text style={styles.loadLabel}>{!match ? 'LOADING GAME' : 'CONNECTING'}</Text>
      </View>
    )
  }

  const isWhite = playerColor === 'white'
  const chessColor = isWhite ? 'w' : 'b'
  const opponentKey = isWhite ? match.guest_public_key : match.host_public_key
  const myKey = account?.address ?? ''
  const opponentColor = isWhite ? 'black' : 'white'
  const opponentMs = opponentColor === 'white' ? localClocks.white : localClocks.black
  const myMs = isWhite ? localClocks.white : localClocks.black
  const opponentTurn = match.turn === (opponentColor === 'white' ? 'w' : 'b')
  const lastMove = match.last_move_from && match.last_move_to
    ? { from: match.last_move_from, to: match.last_move_to }
    : null
  const stakeSOL = (match.stake_amount / 1e9).toFixed(2)
  const totalMs = match.time_control * 1000

  const { byWhite, byBlack } = getCaptured(match.fen)
  const myCaptured = isWhite ? byWhite : byBlack
  const moveHistory = getMoveHistory(match.moves ?? [])
  const lastPairIdx = moveHistory.length - 1

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>

        {/* ─────────────────────────────────────────────────────────────────
            OPPONENT TIMER — split-zone HUD panel (clock zone on right)
        ──────────────────────────────────────────────────────────────── */}
        <ChessTimer
          milliseconds={opponentMs}
          isActive={opponentTurn}
          label={opponentColor === 'white' ? 'White' : 'Black'}
          shortAddress={opponentKey ? shortAddr(opponentKey) : '···'}
          totalMs={totalMs}
          capturedPieces={isWhite ? byBlack : byWhite}
        />

        {/* ─────────────────────────────────────────────────────────────────
            BOARD AREA — board centered in available space
        ──────────────────────────────────────────────────────────────── */}
        <View style={styles.boardArea}>
          <ChessBoard
            fen={match.fen}
            playerColor={chessColor}
            selectedSquare={selectedSquare}
            validTargets={validTargets}
            lastMove={lastMove}
            onSquarePress={(sq: Square) => handleSquarePress(sq)}
            disabled={!isMyTurn}
          />
        </View>

        {/* ─────────────────────────────────────────────────────────────────
            STATUS STRIP — turn indicator + stake + captured pieces
        ──────────────────────────────────────────────────────────────── */}
        <View style={styles.statusStrip}>
          {/* Turn indicator */}
          <View style={styles.turnSection}>
            <View style={[styles.turnDot, isMyTurn && styles.turnDotActive]} />
            <Text style={[styles.turnText, isMyTurn && styles.turnTextActive]}>
              {isMyTurn ? 'YOUR MOVE' : 'OPPONENT'}
            </Text>
          </View>

          {/* Stake badge — always center */}
          <View style={styles.stakeBadge}>
            <Text style={styles.stakeVal}>{stakeSOL}</Text>
            <Text style={styles.stakeUnit}> SOL</Text>
          </View>
        </View>

        {/* ─────────────────────────────────────────────────────────────────
            MY TIMER — mirror of opponent HUD
        ──────────────────────────────────────────────────────────────── */}
        <ChessTimer
          milliseconds={myMs}
          isActive={isMyTurn}
          label={playerColor === 'white' ? 'White' : 'Black'}
          shortAddress={shortAddr(myKey)}
          totalMs={totalMs}
          capturedPieces={isWhite ? byWhite : byBlack}
        />

        {/* ─────────────────────────────────────────────────────────────────
            CONTROLS — resign button + move history scroll
        ──────────────────────────────────────────────────────────────── */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.resignBtn}
            onPress={confirmResign}
            activeOpacity={0.75}
          >
            <Text style={styles.resignLabel}>RESIGN</Text>
          </TouchableOpacity>

          <View style={styles.controlsDivider} />

          {moveHistory.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyList}
              style={styles.historyScroll}
            >
              {moveHistory.map((pair, idx) => (
                <View key={idx} style={styles.movePair}>
                  <Text style={styles.moveNum}>{pair.n}.</Text>
                  <View style={[styles.moveChip, idx === lastPairIdx && !pair.b && styles.moveChipLast]}>
                    <Text style={[styles.moveText, idx === lastPairIdx && !pair.b && styles.moveTextLast]}>
                      {pair.w}
                    </Text>
                  </View>
                  {pair.b && (
                    <View style={[styles.moveChip, idx === lastPairIdx && styles.moveChipLast]}>
                      <Text style={[styles.moveText, idx === lastPairIdx && styles.moveTextLast]}>
                        {pair.b}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.historyEmpty}>
              <Text style={styles.historyEmptyText}>No moves yet</Text>
            </View>
          )}
        </View>

      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },

  // ── Board ────────────────────────────────────────────────────────────────
  boardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0B0F',
  },

  // ── Status strip ─────────────────────────────────────────────────────────
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1A1A22',
    paddingHorizontal: 14,
    backgroundColor: '#0E0E14',
  },
  turnSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  turnDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1A1A22',
  },
  turnDotActive: {
    backgroundColor: '#E8B84B',
  },
  turnText: {
    fontSize: 8,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(240,237,232,0.20)',
    letterSpacing: 2.2,
  },
  turnTextActive: {
    color: 'rgba(240,237,232,0.65)',
  },

  stakeBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(232,184,75,0.30)',
    borderRadius: 2,
    backgroundColor: 'rgba(232,184,75,0.05)',
  },
  stakeVal: {
    fontSize: 12,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: 0.2,
  },
  stakeUnit: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(232,184,75,0.50)',
  },

  // ── Controls ──────────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderTopWidth: 1,
    borderTopColor: '#1A1A22',
    backgroundColor: '#0B0B0F',
  },
  resignBtn: {
    paddingHorizontal: 16,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resignLabel: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(239,68,68,0.60)',
    letterSpacing: 2,
  },
  controlsDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#1A1A22',
  },
  historyScroll: {
    flex: 1,
  },
  historyList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  historyEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmptyText: {
    fontSize: 9,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.16)',
    letterSpacing: 1.5,
  },
  movePair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  moveNum: {
    fontSize: 9,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.18)',
  },
  moveChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 1,
  },
  moveChipLast: {
    backgroundColor: 'rgba(232,184,75,0.12)',
  },
  moveText: {
    fontSize: 10,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.28)',
  },
  moveTextLast: {
    color: '#E8B84B',
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  spinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(232,184,75,0.15)',
    borderTopColor: '#E8B84B',
  },
  loadLabel: {
    fontSize: 10,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(240,237,232,0.45)',
    letterSpacing: 3,
  },
})
