import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { Button } from '@/components/ui/button'
import { useMatch } from '@/features/match/use-match'
import { claimPrize } from '@/features/match/match-service'
import { lamportsToSol, PLATFORM_FEE_BPS } from '@/features/match/match-types'
import { explorerTxUrl } from '@/features/stake/stake-service'

const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif'
const mono  = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

const REASON_LABELS: Record<string, string> = {
  checkmate:   'by checkmate',
  timeout:     'on time',
  resignation: 'by resignation',
  stalemate:   'stalemate',
  draw:        'draw',
  abandoned:   'match cancelled',
}

// ── Prize-tx helpers ──────────────────────────────────────────────────────────

function parseMyTx(prizeTx: string | null, isHost: boolean): string | null {
  if (!prizeTx || prizeTx === 'pending') return null

  if (prizeTx.includes(';')) {
    const prefix = isHost ? 'host:' : 'guest:'
    const part = prizeTx.split(';').find((p) => p.startsWith(prefix))
    return part ? part.slice(prefix.length) : null
  }

  if (prizeTx.includes(':')) {
    const firstPart = prizeTx.split(';')[0]
    const colonIdx = firstPart.indexOf(':')
    return colonIdx !== -1 ? firstPart.slice(colonIdx + 1) : null
  }

  return prizeTx
}

function isPrizeDisbursed(prizeTx: string | null): boolean {
  return !!prizeTx && prizeTx !== 'pending'
}

function isPrizePending(prizeTx: string | null): boolean {
  return prizeTx === 'pending'
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { account } = useMobileWallet()
  const { match, isLoading } = useMatch(id ?? null)

  const [claiming, setClaiming]   = useState(false)
  const [claimed, setClaimed]     = useState(false)
  const [claimErr, setClaimErr]   = useState<string | null>(null)

  // Spinner animation (loading state)
  const spinVal = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinVal, { toValue: 1, duration: 1100, useNativeDriver: true })
    )
    loop.start()
    return () => loop.stop()
  }, [spinVal])
  const spinDeg = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  // Entry animations (result loaded)
  const hasAnimated = useRef(false)
  const verdictOp   = useRef(new Animated.Value(0)).current
  const verdictY    = useRef(new Animated.Value(20)).current
  const contentOp   = useRef(new Animated.Value(0)).current
  const contentY    = useRef(new Animated.Value(16)).current

  useEffect(() => {
    if (!match || hasAnimated.current) return
    hasAnimated.current = true
    Animated.sequence([
      Animated.parallel([
        Animated.timing(verdictOp, {
          toValue: 1, duration: 480, useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(verdictY, {
          toValue: 0, duration: 480, useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(contentOp, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(contentY, {
          toValue: 0, duration: 360, useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start()
  }, [match])

  if (isLoading || !match) {
    return (
      <View style={[styles.root, styles.center]}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spinDeg }] }]} />
        <Text style={styles.loadLabel}>LOADING RESULT</Text>
      </View>
    )
  }

  const myKey   = account?.address ?? ''
  const isHost  = match.host_public_key === myKey
  const myColor = isHost ? match.host_color : match.guest_color
  const winner  = match.winner

  const isWinner = winner !== 'draw' && winner === myColor
  const isDraw   = winner === 'draw'

  const resultLabel    = isDraw ? 'DRAW' : isWinner ? 'VICTORY' : 'DEFEAT'
  const resultSubtitle = match.result_reason ? (REASON_LABELS[match.result_reason] ?? '') : ''

  const verdictColor = isDraw
    ? 'rgba(240,237,232,0.50)'
    : isWinner
      ? '#E8B84B'
      : '#EF4444'

  const prizeAmount    = match.prize_amount
  const prizeTx        = match.prize_tx
  const myTx           = parseMyTx(prizeTx, isHost)
  const disbursed      = isPrizeDisbursed(prizeTx) || claimed
  const pending        = isPrizePending(prizeTx)

  const eachDrawRefund = isDraw && prizeAmount
    ? Math.floor(((prizeAmount * (10_000 - PLATFORM_FEE_BPS)) / 10_000) / 2)
    : 0

  async function handleClaim() {
    if (!account || !id) return
    setClaiming(true)
    setClaimErr(null)
    try {
      const { prizeTx: tx } = await claimPrize(id, account.address)
      setClaimed(true)
      const myParsed = parseMyTx(tx, isHost)
      if (myParsed) Linking.openURL(explorerTxUrl(myParsed))
    } catch (e) {
      setClaimErr(e instanceof Error ? e.message : 'Claim failed')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>

        {/* ─────────────────────────────────────────────────────────────────
            VERDICT ZONE — typographic, editorial, left-rail structure
            Matches the hero aesthetic from home + create screens.
        ──────────────────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.verdictBlock,
            { opacity: verdictOp, transform: [{ translateY: verdictY }] },
          ]}
        >
          {/* Outcome-colored vertical rail */}
          <View style={[styles.verdictRail, { backgroundColor: verdictColor }]} />

          {/* Label + subtitle */}
          <View style={styles.verdictMid}>
            <Text style={[styles.verdictWord, { color: verdictColor }]}>
              {resultLabel}
            </Text>
            {resultSubtitle ? (
              <Text style={styles.verdictSub}>{resultSubtitle}</Text>
            ) : null}
          </View>

          {/* Prize / refund — right column, vertically centered */}
          {isWinner && prizeAmount ? (
            <View style={styles.verdictNum}>
              <Text style={styles.verdictNumSign}>+</Text>
              <Text style={styles.verdictNumAmt}>{lamportsToSol(prizeAmount)}</Text>
              <Text style={styles.verdictNumUnit}>SOL</Text>
            </View>
          ) : isDraw && eachDrawRefund > 0 ? (
            <View style={styles.verdictNum}>
              <Text style={styles.verdictNumRefund}>+{lamportsToSol(eachDrawRefund)}</Text>
              <Text style={styles.verdictNumUnit}>SOL</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* ─────────────────────────────────────────────────────────────────
            CONTENT — status strip, claim, stats grid, actions
        ──────────────────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.contentWrap,
            { opacity: contentOp, transform: [{ translateY: contentY }] },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >

            {/* ── Prize disbursed strip ── */}
            {disbursed && !pending && (
              <View style={styles.statusStrip}>
                <View style={[styles.statusPip, { backgroundColor: '#4ADE80' }]} />
                <Text style={[styles.statusText, { color: 'rgba(74,222,128,0.75)' }]}>
                  {isDraw
                    ? 'REFUND SENT TO WALLET'
                    : isWinner
                      ? 'PRIZE SENT TO WALLET'
                      : 'PRIZE SENT TO WINNER'}
                </Text>
                {myTx && (
                  <TouchableOpacity onPress={() => Linking.openURL(explorerTxUrl(myTx!))}>
                    <Text style={styles.txLink}>{myTx.slice(0, 6)}···{myTx.slice(-4)} ↗</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── Pending strip ── */}
            {pending && (
              <View style={styles.statusStrip}>
                <View style={[styles.statusPip, { backgroundColor: '#E8B84B' }]} />
                <Text style={[styles.statusText, { color: 'rgba(232,184,75,0.75)' }]}>
                  DISBURSEMENT IN PROGRESS
                </Text>
              </View>
            )}

            {/* ── Manual claim ── */}
            {!disbursed && !pending && prizeAmount && (isWinner || isDraw) && (
              <View style={styles.claimSection}>
                <Button
                  label={
                    isDraw
                      ? `Claim Refund  ${lamportsToSol(eachDrawRefund)} SOL`
                      : `Claim Prize  ${lamportsToSol(prizeAmount)} SOL`
                  }
                  onPress={handleClaim}
                  variant="primary"
                  size="lg"
                  loading={claiming}
                />
                {claimErr && <Text style={styles.errorText}>{claimErr}</Text>}
                <Text style={styles.claimHint}>Auto-disbursement failed — tap to retry</Text>
              </View>
            )}

            {/* ── Stats grid: 2×2 structural grid ── */}
            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statVal}>{lamportsToSol(match.stake_amount)}</Text>
                <Text style={styles.statKey}>SOL STAKE</Text>
              </View>
              <View style={[styles.statCell, styles.statBorderLeft]}>
                <Text style={styles.statVal}>{match.move_count}</Text>
                <Text style={styles.statKey}>MOVES</Text>
              </View>
              <View style={[styles.statCell, styles.statBorderTop]}>
                <Text style={styles.statVal}>{Math.round(match.time_control / 60)}</Text>
                <Text style={styles.statKey}>MIN BLITZ</Text>
              </View>
              <View style={[styles.statCell, styles.statBorderLeft, styles.statBorderTop]}>
                <Text style={styles.statVal}>{myColor === 'white' ? '♔' : '♚'}</Text>
                <Text style={styles.statKey}>{(myColor ?? 'unknown').toUpperCase()}</Text>
              </View>
            </View>

            {/* ── Amber rule — mirrors home screen separator ── */}
            <View style={styles.amberRule} />

            {/* ── CTA buttons ── */}
            <View style={styles.actions}>
              <Button
                label="Play Again"
                onPress={() => router.replace('/create')}
                variant="primary"
                size="lg"
              />
              <Button
                label="Home"
                onPress={() => router.replace('/')}
                variant="outline"
                size="lg"
              />
            </View>

          </ScrollView>
        </Animated.View>

      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0B0B0F' },
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },

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

  // ── Verdict block ─────────────────────────────────────────────────────────
  verdictBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
    minHeight: 110,
  },
  verdictRail: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  verdictMid: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 26,
    gap: 8,
  },
  verdictWord: {
    fontSize: 54,
    fontFamily: serif,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 58,
  },
  verdictSub: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.28)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  verdictNum: {
    paddingRight: 20,
    alignItems: 'flex-end',
    gap: 2,
  },
  verdictNumSign: {
    fontSize: 14,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(232,184,75,0.55)',
  },
  verdictNumAmt: {
    fontSize: 30,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: -0.5,
  },
  verdictNumUnit: {
    fontSize: 10,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(232,184,75,0.45)',
    letterSpacing: 1.5,
  },
  verdictNumRefund: {
    fontSize: 22,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(240,237,232,0.42)',
    letterSpacing: -0.3,
  },

  // ── Content wrap ──────────────────────────────────────────────────────────
  contentWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },

  // ── Status strip ──────────────────────────────────────────────────────────
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 44,
    backgroundColor: '#0E0E14',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  statusPip: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    flex: 1,
    fontSize: 8,
    fontFamily: mono,
    fontWeight: '700',
    letterSpacing: 2,
  },
  txLink: {
    fontSize: 9,
    fontFamily: mono,
    color: 'rgba(232,184,75,0.55)',
  },

  // ── Claim ─────────────────────────────────────────────────────────────────
  claimSection: {
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  errorText: {
    fontSize: 10,
    fontFamily: mono,
    color: '#EF4444',
    textAlign: 'center',
  },
  claimHint: {
    fontSize: 9,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.22)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Stats grid ────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#1A1A22',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  statCell: {
    width: '50%',
    paddingVertical: 22,
    alignItems: 'center',
    gap: 7,
  },
  statBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#1A1A22',
  },
  statBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#1A1A22',
  },
  statVal: {
    fontSize: 20,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: 0.2,
  },
  statKey: {
    fontSize: 7.5,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.22)',
    letterSpacing: 1.8,
  },

  // ── Amber rule ────────────────────────────────────────────────────────────
  amberRule: {
    height: 2,
    backgroundColor: '#E8B84B',
    opacity: 0.70,
    borderRadius: 1,
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 18,
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  actions: {
    gap: 10,
    paddingHorizontal: 20,
  },
})
