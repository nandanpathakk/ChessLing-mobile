import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Linking,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { colors, spacing, typography } from '@/constants/theme'
import { Button } from '@/components/ui/button'
import { Card, CardRow, Divider } from '@/components/ui/card'
import { FullScreenLoader } from '@/components/ui/loading'
import { MeshBackground } from '@/components/ui/mesh-background'
import { useMatch } from '@/features/match/use-match'
import { claimPrize } from '@/features/match/match-service'
import { lamportsToSol, PLATFORM_FEE_BPS } from '@/features/match/match-types'
import { explorerTxUrl } from '@/features/stake/stake-service'

const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif'

const REASON_LABELS: Record<string, string> = {
  checkmate: 'by Checkmate',
  timeout: 'on Time',
  resignation: 'by Resignation',
  stalemate: 'Draw — Stalemate',
  draw: 'Draw',
  abandoned: 'Match Cancelled',
}

// ── Prize-tx helpers ──────────────────────────────────────────────────────────

/**
 * Parses the prize_tx field and returns the transaction signature relevant to
 * the current user.
 *
 * Formats:
 *   - Winner:  "<txSig>"  (plain Solana signature)
 *   - Draw:    "host:<sig1>;guest:<sig2>"
 *   - Pending: "pending"  (auto-disburse in flight)
 */
function parseMyTx(prizeTx: string | null, isHost: boolean): string | null {
  if (!prizeTx || prizeTx === 'pending') return null

  // Draw format: "host:<sig1>;guest:<sig2>"
  if (prizeTx.includes(';')) {
    const prefix = isHost ? 'host:' : 'guest:'
    const part = prizeTx.split(';').find((p) => p.startsWith(prefix))
    return part ? part.slice(prefix.length) : null
  }

  // Winner format: plain sig (or abandoned refund format "<addr>:<sig>")
  if (prizeTx.includes(':')) {
    // Abandoned: "<addr>:<sig>;..." — try to find our address... but we don't
    // have address here easily. Return the first tx sig as best-effort.
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

  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claimErr, setClaimErr] = useState<string | null>(null)

  // Entry animations
  const badgeScale   = useRef(new Animated.Value(0.3)).current
  const badgeOpacity = useRef(new Animated.Value(0)).current
  const contentOp    = useRef(new Animated.Value(0)).current
  const contentY     = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(badgeScale, { toValue: 1, tension: 52, friction: 7, useNativeDriver: true }),
        Animated.timing(badgeOpacity, { toValue: 1, duration: 380, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      ]),
      Animated.parallel([
        Animated.timing(contentOp, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 420, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]),
    ]).start()
  }, [])

  if (isLoading || !match) return <FullScreenLoader label="Loading result…" />

  const myKey   = account?.address ?? ''
  const isHost  = match.host_public_key === myKey
  const myColor = isHost ? match.host_color : match.guest_color
  const winner  = match.winner

  const isWinner = winner !== 'draw' && winner === myColor
  const isDraw   = winner === 'draw'

  const resultLabel    = isDraw ? 'Draw' : isWinner ? 'Victory' : 'Defeat'
  const resultIcon     = isDraw ? '🤝' : isWinner ? '♛' : '♟'
  const resultSubtitle = match.result_reason ? REASON_LABELS[match.result_reason] ?? '' : ''

  const accentColor = isDraw
    ? colors.textSecondary
    : isWinner
      ? colors.accent
      : colors.error

  const prizeAmount = match.prize_amount
  const prizeTx     = match.prize_tx
  const myTx        = parseMyTx(prizeTx, isHost)
  const disbursed   = isPrizeDisbursed(prizeTx) || claimed
  const pending     = isPrizePending(prizeTx)

  // For draws, each player gets their stake back minus their share of the fee
  const eachDrawRefund = isDraw && prizeAmount
    ? Math.floor(
        ((prizeAmount * (10_000 - PLATFORM_FEE_BPS)) / 10_000) / 2,
      )
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
      <MeshBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          {/* ── Hero badge ── */}
          <Animated.View
            style={[
              styles.heroSection,
              { transform: [{ scale: badgeScale }], opacity: badgeOpacity },
            ]}
          >
            <View
              style={[
                styles.glowRing,
                { borderColor: `${accentColor}30`, shadowColor: accentColor },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${accentColor}10` }]}>
                <Text style={styles.resultIcon}>{resultIcon}</Text>
              </View>
            </View>
            <Text style={[styles.resultLabel, { color: accentColor }]}>{resultLabel}</Text>
            <Text style={styles.resultSub}>{resultSubtitle}</Text>
          </Animated.View>

          {/* ── Details ── */}
          <Animated.View
            style={[
              styles.details,
              { opacity: contentOp, transform: [{ translateY: contentY }] },
            ]}
          >

            {/* ── Winner prize card ── */}
            {!isDraw && prizeAmount ? (
              <Card glow={isWinner ? 'gold' : 'error'}>
                <CardRow
                  left={<Text style={styles.prizeKey}>{isWinner ? 'Prize Won' : 'Prize Lost'}</Text>}
                  right={
                    <Text style={[styles.prizeAmt, { color: accentColor }]}>
                      {isWinner ? '+' : '−'}{lamportsToSol(prizeAmount)} SOL
                    </Text>
                  }
                />
                {myTx && (
                  <>
                    <Divider />
                    <CardRow
                      left={<Text style={styles.txKey}>Transaction</Text>}
                      right={
                        <Text
                          style={styles.txVal}
                          onPress={() => Linking.openURL(explorerTxUrl(myTx))}
                          numberOfLines={1}
                        >
                          {myTx.slice(0, 8)}…{myTx.slice(-6)} ↗
                        </Text>
                      }
                    />
                  </>
                )}
              </Card>
            ) : null}

            {/* ── Draw prize card ── */}
            {isDraw && eachDrawRefund > 0 ? (
              <Card glow="success">
                <CardRow
                  left={<Text style={styles.prizeKey}>Refund</Text>}
                  right={
                    <Text style={[styles.prizeAmt, { color: colors.textSecondary }]}>
                      +{lamportsToSol(eachDrawRefund)} SOL
                    </Text>
                  }
                />
                <CardRow
                  left={<Text style={styles.txKey}>Fee deducted</Text>}
                  right={
                    <Text style={styles.txKey}>
                      {(PLATFORM_FEE_BPS / 100).toFixed(0)}% platform fee
                    </Text>
                  }
                />
                {myTx && (
                  <>
                    <Divider />
                    <CardRow
                      left={<Text style={styles.txKey}>Transaction</Text>}
                      right={
                        <Text
                          style={styles.txVal}
                          onPress={() => Linking.openURL(explorerTxUrl(myTx))}
                          numberOfLines={1}
                        >
                          {myTx.slice(0, 8)}…{myTx.slice(-6)} ↗
                        </Text>
                      }
                    />
                  </>
                )}
              </Card>
            ) : null}

            {/* ── Auto-disbursed banner ── */}
            {disbursed && !pending && (
              <Card glow="success">
                <Text style={styles.claimedText}>
                  ✓ {isDraw ? 'Refund sent to your wallet' : isWinner ? 'Prize sent to your wallet' : 'Prize sent to winner'}
                </Text>
              </Card>
            )}

            {/* ── Pending banner ── */}
            {pending && (
              <Card>
                <Text style={styles.pendingText}>⏳ Disbursement in progress…</Text>
              </Card>
            )}

            {/* ── Manual claim button (fallback when auto-disburse failed) ── */}
            {!disbursed && !pending && prizeAmount && (isWinner || isDraw) && (
              <View style={styles.claimSection}>
                <Button
                  label={
                    isDraw
                      ? `Claim Refund ${lamportsToSol(eachDrawRefund)} SOL`
                      : `Claim ${lamportsToSol(prizeAmount)} SOL`
                  }
                  onPress={handleClaim}
                  variant="primary"
                  size="lg"
                  loading={claiming}
                />
                {claimErr && <Text style={styles.errorText}>{claimErr}</Text>}
                <Text style={styles.claimHint}>
                  Auto-disbursement failed — tap to retry
                </Text>
              </View>
            )}

            {/* ── Game summary ── */}
            <Card>
              <CardRow
                left={<Text style={styles.key}>Stake</Text>}
                right={<Text style={styles.val}>{lamportsToSol(match.stake_amount)} SOL</Text>}
              />
              <CardRow
                left={<Text style={styles.key}>Moves</Text>}
                right={<Text style={styles.val}>{match.move_count}</Text>}
              />
              <CardRow
                left={<Text style={styles.key}>Time Control</Text>}
                right={<Text style={styles.val}>{Math.round(match.time_control / 60)} min</Text>}
              />
              <CardRow
                left={<Text style={styles.key}>Your Color</Text>}
                right={<Text style={styles.val}>{myColor === 'white' ? '♔ White' : '♚ Black'}</Text>}
              />
            </Card>

            {/* ── Actions ── */}
            <View style={styles.actions}>
              <Button label="Play Again" onPress={() => router.replace('/create')} variant="primary" size="lg" style={styles.actionBtn} />
              <Button label="Home" onPress={() => router.replace('/')} variant="outline" size="lg" style={styles.actionBtn} />
            </View>

          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },

  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  glowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: { fontSize: 50, lineHeight: 60 },
  resultLabel: {
    fontSize: 42,
    fontFamily: serif,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  resultSub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  details: { gap: spacing.md, flex: 1 },

  prizeKey: { ...typography.bodyBold, color: colors.text },
  prizeAmt: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  txKey: { ...typography.caption, color: colors.textMuted },
  txVal: { ...typography.caption, color: colors.accent, fontFamily: 'monospace' },

  claimSection: { gap: spacing.sm, alignItems: 'center' },
  claimHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  errorText: { ...typography.caption, color: colors.error, textAlign: 'center' },
  claimedText: { ...typography.bodyBold, color: colors.success, textAlign: 'center', paddingVertical: spacing.xs },
  pendingText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xs },

  key: { ...typography.caption, color: colors.textSecondary },
  val: { ...typography.captionBold, color: colors.text },

  actions: { gap: spacing.sm, marginTop: 'auto' },
  actionBtn: { width: '100%' },
})
