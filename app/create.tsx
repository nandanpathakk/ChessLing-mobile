import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Clipboard from '@react-native-clipboard/clipboard'
import { router } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { Button } from '@/components/ui/button'
import {
  STAKE_OPTIONS,
  TIME_CONTROLS,
  lamportsToSol,
  calculatePrize,
} from '@/features/match/match-types'
import { createMatch, subscribeToMatch } from '@/features/match/match-service'
import { useStake } from '@/features/stake/use-stake'

type StakeOption = typeof STAKE_OPTIONS[number]
type TimeControl = typeof TIME_CONTROLS[number]
type Step = 'config' | 'creating' | 'staking' | 'waiting'

const { width: SW, height: SH } = Dimensions.get('window')
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

const CELL    = Math.round(SW / 8)
const H_TOPS  = Array.from({ length: Math.ceil(SH / CELL) + 3 }, (_, i) => (i - 1) * CELL)
const V_LEFTS = Array.from({ length: Math.ceil(SW / CELL) + 3 }, (_, i) => (i - 1) * CELL)

export default function CreateScreen() {
  const { account } = useMobileWallet()
  const { stake, error: stakeError } = useStake()

  const [step, setStep]                   = useState<Step>('config')
  const [selectedStake, setSelectedStake] = useState<StakeOption>(STAKE_OPTIONS[1])
  const [selectedTime, setSelectedTime]   = useState<TimeControl>(TIME_CONTROLS[1])
  const [matchId, setMatchId]             = useState<string | null>(null)
  const [matchCode, setMatchCode]         = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)

  // Pulsing dot for waiting state
  const pulseOp = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOp, { toValue: 0.2, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(pulseOp, { toValue: 1,   duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ])
    ).start()
  }, [pulseOp])

  // Spinning indicator for loading state
  const spin = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, useNativeDriver: true })
    ).start()
  }, [spin])
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  useEffect(() => {
    if (!matchId) return
    const unsub = subscribeToMatch(matchId, (match) => {
      if (match.status === 'active') { unsub(); router.replace(`/game/${matchId}`) }
    })
    return unsub
  }, [matchId])

  async function handleCreateAndStake() {
    if (!account) return
    setError(null)
    try {
      setStep('creating')
      const { matchId: id, code } = await createMatch(
        account.address, selectedStake.value, selectedTime.seconds,
      )
      setMatchId(id); setMatchCode(code)
      setStep('staking')
      const sig = await stake(id, selectedStake.value)
      if (!sig) { setError(stakeError ?? 'Staking failed.'); setStep('config'); return }
      setStep('waiting')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('config')
    }
  }

  async function handleShare() {
    if (!matchCode) return
    await Share.share({ message: `Join my Chessling match! Code: ${matchCode}`, title: 'Chessling' })
  }

  function handleCopy() {
    if (!matchCode) return
    Clipboard.setString(matchCode)
    Alert.alert('Copied', 'Match code copied to clipboard')
  }

  const prizeAmount = calculatePrize(selectedStake.value)

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

  // ── Waiting ─────────────────────────────────────────────────────────────────
  if (step === 'waiting' && matchCode) {
    return (
      <View style={styles.root}>
        {Grid}
        <SafeAreaView style={styles.safe}>
          <View style={styles.waitWrap}>

            <View style={styles.header}>
              <Text style={styles.pageTitle}>MATCH READY</Text>
            </View>
            <View style={styles.rule} />

            {/* Code */}
            <View style={styles.codeBlock}>
              <Text style={styles.codeCap}>MATCH CODE</Text>
              <Text style={styles.codeValue}>{matchCode}</Text>
              <Text style={styles.codeHint}>Share this with your opponent</Text>
            </View>

            <View style={styles.rule} />

            {/* Summary */}
            <View style={styles.summaryTable}>
              <View style={styles.summRow}>
                <Text style={styles.summKey}>STAKE</Text>
                <Text style={styles.summVal}>{selectedStake.label}</Text>
              </View>
              <View style={styles.rowDivider} />
              <View style={styles.summRow}>
                <Text style={styles.summKey}>PRIZE POOL</Text>
                <Text style={styles.summVal}>{lamportsToSol(selectedStake.value * 2)} SOL</Text>
              </View>
              <View style={styles.rowDivider} />
              <View style={styles.summRow}>
                <Text style={styles.summKey}>TIME CONTROL</Text>
                <Text style={styles.summVal}>{selectedTime.label}</Text>
              </View>
            </View>

            <View style={styles.rule} />

            <View style={styles.waitStatus}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseOp }]} />
              <Text style={styles.waitLabel}>WAITING FOR OPPONENT</Text>
            </View>

            <View style={styles.actionGroup}>
              <View style={styles.shareRow}>
                <Button label="Copy Code" onPress={handleCopy} variant="outline" style={styles.shareBtn} />
                <Button label="Share" onPress={handleShare} variant="primary" style={styles.shareBtn} />
              </View>
              <Button label="Cancel" onPress={() => router.back()} variant="ghost" />
            </View>

          </View>
        </SafeAreaView>
      </View>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (step === 'creating' || step === 'staking') {
    const label = step === 'creating' ? 'CREATING MATCH' : 'CONFIRM IN WALLET'
    const sub   = step === 'staking' ? `Sending ${selectedStake.label} to escrow` : null
    return (
      <View style={[styles.root, styles.center]}>
        {Grid}
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
        <Text style={styles.loadLabel}>{label}</Text>
        {sub && <Text style={styles.loadSub}>{sub}</Text>}
      </View>
    )
  }

  // ── Config ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {Grid}
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.backBtn}>←</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>NEW MATCH</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.rule} />

          {/* Stake */}
          <Text style={styles.sectionLabel}>STAKE AMOUNT</Text>
          <View style={styles.optGrid}>
            {STAKE_OPTIONS.map((opt) => {
              const active = selectedStake.value === opt.value
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSelectedStake(opt)}
                  activeOpacity={0.75}
                  style={[styles.optTile, active && styles.optTileActive]}
                >
                  <Text style={[styles.optVal, active && styles.optValActive]}>{opt.display}</Text>
                  <Text style={[styles.optUnit, active && styles.optUnitActive]}>SOL</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Time */}
          <Text style={[styles.sectionLabel, { marginTop: 22 }]}>TIME CONTROL</Text>
          <View style={styles.timeRow}>
            {TIME_CONTROLS.map((tc) => {
              const active = selectedTime.seconds === tc.seconds
              return (
                <TouchableOpacity
                  key={tc.seconds}
                  onPress={() => setSelectedTime(tc)}
                  activeOpacity={0.75}
                  style={[styles.timeTile, active && styles.timeTileActive]}
                >
                  <Text style={[styles.timeMain, active && styles.timeMainActive]}>{tc.label}</Text>
                  <Text style={[styles.timeSub, active && styles.timeSubActive]}>{tc.display}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={[styles.rule, { marginTop: 26 }]} />

          {/* Summary */}
          <View style={styles.summaryTable}>
            <View style={styles.summRow}>
              <Text style={styles.summKey}>YOUR STAKE</Text>
              <Text style={styles.summVal}>{selectedStake.label}</Text>
            </View>
            {/* <View style={styles.rowDivider} /> */}
            <View style={styles.summRow}>
              <Text style={styles.summKey}>OPPONENT STAKE</Text>
              <Text style={styles.summVal}>{selectedStake.label}</Text>
            </View>
            {/* <View style={styles.rowDivider} /> */}
            <View style={styles.summRow}>
              <Text style={styles.summKey}>PRIZE POOL</Text>
              <Text style={styles.summVal}>{lamportsToSol(selectedStake.value * 2)} SOL</Text>
            </View>
            {/* <View style={styles.rowDivider} /> */}
            <View style={styles.summRow}>
              <Text style={styles.summKey}>PLATFORM FEE (5%)</Text>
              <Text style={styles.summVal}>− {lamportsToSol(Math.floor(selectedStake.value * 2 * 0.05))} SOL</Text>
            </View>
            {/* <View style={styles.rowDivider} /> */}
            <View style={styles.summRow}>
              <Text style={[styles.summKey, { color: '#FFFFFF' }]}>YOU WIN</Text>
              <Text style={[styles.summVal, { color: '#FFFFFF', fontWeight: '700' }]}>{lamportsToSol(prizeAmount)} SOL</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.summRow}>
              <Text style={styles.summKey}>TIME CONTROL</Text>
              <Text style={styles.summVal}>{selectedTime.display}</Text>
            </View>
          </View>

          <View style={styles.rule} />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            label={`Stake ${selectedStake.label} & Create`}
            onPress={handleCreateAndStake}
            variant="primary"
            size="lg"
            disabled={!account}
          />
          <Text style={styles.disclaimer}>Funds held in escrow · Released on game end</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  safe: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },

  // ── Grid ────────────────────────────────────────────────────────────────────
  gridWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.06)' },
  hLine:    { left: -CELL, right: -CELL, height: StyleSheet.hairlineWidth },
  vLine:    { top: -CELL, bottom: -CELL, width: StyleSheet.hairlineWidth },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  backBtn: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: mono,
    lineHeight: 24,
  },
  pageTitle: {
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
  },

  // ── Rule ────────────────────────────────────────────────────────────────────
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 22,
  },

  // ── Scroll / Config ─────────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 40,
    gap: 10,
  },

  sectionLabel: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2.5,
    marginBottom: 10,
  },

  // ── Stake tiles ─────────────────────────────────────────────────────────────
  optGrid: { flexDirection: 'row', gap: 8 },
  optTile: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 3,
    gap: 3,
  },
  optTileActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  optVal: {
    fontSize: 17,
    fontFamily: mono,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optValActive: { color: '#0B0B0B' },
  optUnit: {
    fontSize: 8,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 1.5,
  },
  optUnitActive: { color: 'rgba(11,11,11,0.45)' },

  // ── Time tiles ──────────────────────────────────────────────────────────────
  timeRow: { flexDirection: 'row', gap: 8 },
  timeTile: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 3,
    gap: 4,
  },
  timeTileActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  timeMain: {
    fontSize: 13,
    fontFamily: mono,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timeMainActive: { color: '#0B0B0B' },
  timeSub: {
    fontSize: 9,
    fontFamily: mono,
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 1,
  },
  timeSubActive: { color: 'rgba(11,11,11,0.45)' },

  // ── Summary table ───────────────────────────────────────────────────────────
  summaryTable: { gap: 0 },
  summRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  summKey: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
  },
  summVal: {
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },

  // ── Loading ─────────────────────────────────────────────────────────────────
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
  loadSub: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.5,
  },

  // ── Waiting ─────────────────────────────────────────────────────────────────
  waitWrap: {
    flex: 1,
    paddingBottom: 24,
    gap: 20,
  },
  codeBlock: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 22,
    gap: 10,
  },
  codeCap: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 3,
  },
  codeValue: {
    fontSize: 54,
    fontFamily: mono,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 18,
  },
  codeHint: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.5,
  },
  waitStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  waitLabel: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 2.5,
  },
  actionGroup: {
    paddingHorizontal: 22,
    gap: 10,
    marginTop: 'auto',
  },
  shareRow: { flexDirection: 'row', gap: 10 },
  shareBtn: { flex: 1 },

  // ── Misc ────────────────────────────────────────────────────────────────────
  errorText: {
    fontSize: 11,
    fontFamily: mono,
    color: 'rgba(248,113,113,0.80)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(255,255,255,0.20)',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 2,
  },
})
