import React, { useEffect, useRef } from 'react'
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

const { width: SW, height: SH } = Dimensions.get('window')
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

const CELL    = Math.round(SW / 8)
const H_TOPS  = Array.from({ length: Math.ceil(SH / CELL) + 3 }, (_, i) => (i - 1) * CELL)
const V_LEFTS = Array.from({ length: Math.ceil(SW / CELL) + 3 }, (_, i) => (i - 1) * CELL)

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortAddr(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
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

  // Spinning indicator for loading
  const spin = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, useNativeDriver: true })
    ).start()
  }, [spin])
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  useEffect(() => {
    if (match?.status === 'completed') router.replace(`/result/${id}`)
  }, [match?.status, id])

  function confirmResign() {
    Alert.alert('Resign?', 'Your opponent wins the match and stake.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resign', style: 'destructive', onPress: () => handleResign() },
    ])
  }

  const Grid = (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.gridWrap}>
        {H_TOPS.map((top) => (
          <View key={`h${top}`} style={[styles.gridLine, styles.hLine, { top }]} />
        ))}
        {V_LEFTS.map((left) => (
          <View key={`v${left}`} style={[styles.gridLine, styles.vLine, { left }]} />
        ))}
      </View>
    </View>
  )

  if (isLoading || !match || !playerColor) {
    const label = !match ? 'LOADING GAME' : 'CONNECTING'
    return (
      <View style={[styles.root, styles.center]}>
        {Grid}
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
        <Text style={styles.loadLabel}>{label}</Text>
      </View>
    )
  }

  const isWhite       = playerColor === 'white'
  const chessColor    = isWhite ? 'w' : 'b'
  const opponentKey   = isWhite ? match.guest_public_key : match.host_public_key
  const myKey         = account?.address ?? ''
  const opponentColor = isWhite ? 'black' : 'white'
  const opponentMs    = opponentColor === 'white' ? localClocks.white : localClocks.black
  const myMs          = isWhite ? localClocks.white : localClocks.black
  const opponentTurn  = match.turn === (opponentColor === 'white' ? 'w' : 'b')
  const lastMove      = match.last_move_from && match.last_move_to
    ? { from: match.last_move_from, to: match.last_move_to }
    : null
  const stakeSOL      = (match.stake_amount / 1e9).toFixed(2)

  const { byWhite, byBlack } = getCaptured(match.fen)
  const myCaptured   = isWhite ? byWhite : byBlack
  const moveHistory  = getMoveHistory(match.moves ?? [])
  const lastPairIdx  = moveHistory.length - 1

  return (
    <View style={styles.root}>
      {Grid}
      <SafeAreaView style={styles.safe}>

        <View style={styles.layout}>

          {/* ── Opponent timer ── */}
          <ChessTimer
            milliseconds={opponentMs}
            isActive={opponentTurn}
            label={opponentColor === 'white' ? 'White' : 'Black'}
            shortAddress={opponentKey ? shortAddr(opponentKey) : 'Opponent'}
          />

          {/* ── Turn + stake row ── */}
          <View style={styles.infoRow}>
            <View style={styles.turnRow}>
              <View style={[styles.turnDot, isMyTurn && styles.turnDotActive]} />
              <Text style={[styles.turnText, isMyTurn && styles.turnTextActive]}>
                {isMyTurn ? 'YOUR MOVE' : 'WAITING'}
              </Text>
            </View>
            <Text style={styles.stakeText}>{stakeSOL} SOL</Text>
          </View>

          {/* ── Chess board ── */}
          <View style={styles.boardWrap}>
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

          {/* ── Captured pieces ── */}
          {myCaptured.length > 0 && (
            <View style={styles.capturedRow}>
              <Text style={styles.capturedLabel}>CAPTURED</Text>
              <View style={styles.capturedPieces}>
                {myCaptured.map((type, i) => (
                  <Text key={i} style={styles.capturedPiece}>
                    {PIECE_SYM[type] ?? ''}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* ── Move history ── */}
          {moveHistory.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moveHistoryContent}
              style={styles.moveHistory}
            >
              {moveHistory.map((pair, i) => (
                <View key={i} style={styles.movePair}>
                  <Text style={styles.moveNum}>{pair.n}.</Text>
                  <View style={[styles.moveChip, i === lastPairIdx && !pair.b && styles.moveChipActive]}>
                    <Text style={[styles.moveChipText, i === lastPairIdx && !pair.b && styles.moveChipTextActive]}>
                      {pair.w}
                    </Text>
                  </View>
                  {pair.b ? (
                    <View style={[styles.moveChip, i === lastPairIdx && styles.moveChipActive]}>
                      <Text style={[styles.moveChipText, i === lastPairIdx && styles.moveChipTextActive]}>
                        {pair.b}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}

          {/* ── My timer ── */}
          <ChessTimer
            milliseconds={myMs}
            isActive={isMyTurn}
            label={playerColor === 'white' ? 'White' : 'Black'}
            shortAddress={shortAddr(myKey)}
          />

        </View>

        {/* ── Bottom nav ── */}
        <View style={styles.rule} />
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navBtn} onPress={confirmResign} activeOpacity={0.7}>
            <Text style={styles.navBtnDanger}>⚑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
            <Text style={styles.navBtnIcon}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]} activeOpacity={0.7}>
            <Text style={styles.navBtnIconActive}>⊞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
            <Text style={styles.navBtnIcon}>⌛</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
            <Text style={styles.navBtnIcon}>···</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0B0B0B' },
  safe:   { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },

  // ── Grid ────────────────────────────────────────────────────────────────────
  gridWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.06)' },
  hLine:    { left: -CELL, right: -CELL, height: StyleSheet.hairlineWidth },
  vLine:    { top: -CELL, bottom: -CELL, width: StyleSheet.hairlineWidth },

  // ── Layout ──────────────────────────────────────────────────────────────────
  layout: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 8,
    justifyContent: 'center',
  },

  // ── Board ───────────────────────────────────────────────────────────────────
  boardWrap: {
    alignItems: 'center',
  },

  // ── Info row ────────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  turnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  turnDotActive: {
    backgroundColor: '#FFFFFF',
  },
  turnText: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 2,
  },
  turnTextActive: {
    color: 'rgba(255,255,255,0.70)',
  },
  stakeText: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 1.5,
  },

  // ── Captured pieces ──────────────────────────────────────────────────────────
  capturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  capturedLabel: {
    fontSize: 8,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2,
    minWidth: 58,
  },
  capturedPieces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  capturedPiece: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
  },

  // ── Move history ─────────────────────────────────────────────────────────────
  moveHistory: {
    maxHeight: 34,
  },
  moveHistoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  movePair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  moveNum: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(255,255,255,0.22)',
    marginRight: 1,
  },
  moveChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  moveChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  moveChipText: {
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  moveChipTextActive: {
    color: '#0B0B0B',
  },

  // ── Rule ────────────────────────────────────────────────────────────────────
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // ── Bottom nav ───────────────────────────────────────────────────────────────
  bottomNav: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 22,
    backgroundColor: '#0B0B0B',
  },
  navBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  navBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  navBtnIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.40)',
    fontFamily: mono,
  },
  navBtnIconActive: {
    fontSize: 16,
    color: '#0B0B0B',
    fontFamily: mono,
  },
  navBtnDanger: {
    fontSize: 16,
    color: 'rgba(248,113,113,0.70)',
    fontFamily: mono,
  },

  // ── Loading ──────────────────────────────────────────────────────────────────
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopColor: 'rgba(255,255,255,0.75)',
  },
  loadLabel: {
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 3,
    marginTop: 4,
  },
})
