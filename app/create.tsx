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
  Animated,
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
import { createMatch, subscribeToMatch, getMatch } from '@/features/match/match-service'
import { useStake } from '@/features/stake/use-stake'

type StakeOption = typeof STAKE_OPTIONS[number]
type TimeControl = typeof TIME_CONTROLS[number]
type Step = 'config' | 'creating' | 'staking' | 'waiting'

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

export default function CreateScreen() {
  const { account } = useMobileWallet()
  const { stake, error: stakeError } = useStake()

  const [step, setStep] = useState<Step>('config')
  const [selectedStake, setSelectedStake] = useState<StakeOption>(STAKE_OPTIONS[1])
  const [selectedTime, setSelectedTime] = useState<TimeControl>(TIME_CONTROLS[1])
  const [matchId, setMatchId] = useState<string | null>(null)
  const [matchCode, setMatchCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const spinVal = useRef(new Animated.Value(0)).current
  const pulseVal = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinVal, { toValue: 1, duration: 1100, useNativeDriver: true })
    ).start()
  }, [spinVal])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseVal, { toValue: 0.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseVal, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [pulseVal])

  const spinDeg = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  useEffect(() => {
    if (!matchId) return

    // Immediately fetch just in case we already missed the realtime event
    getMatch(matchId).then((m) => {
      if (m.status === 'active') { router.replace(`/game/${matchId}`) }
    }).catch(console.error)

    const unsub = subscribeToMatch(matchId, (updater) => {
      // Create a dummy merge just to check the new status
      const nextState = updater(null)
      if (nextState.status === 'active') { unsub(); router.replace(`/game/${matchId}`) }
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

  // ── WAITING STATE ───────────────────────────────────────────────────────────
  if (step === 'waiting' && matchCode) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>WAITING FOR OPPONENT</Text>
          </View>
          <View style={styles.headerRule} />

          <View style={styles.waitingContent}>
            {/* Code display — vault-style large chars */}
            <View style={styles.codeSection}>
              <Text style={styles.codeSectionLabel}>SHARE THIS CODE</Text>
              <View style={styles.codeCharRow}>
                {matchCode.split('').map((ch, i) => (
                  <View key={i} style={styles.codeChar}>
                    <Text style={styles.codeCharText}>{ch}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.codePulseRow}>
                <Animated.View style={[styles.codePulseDot, { opacity: pulseVal }]} />
                <Text style={styles.codePulseLabel}>MATCH OPEN — WAITING</Text>
              </View>
            </View>

            <View style={styles.waitingRule} />

            {/* Match summary */}
            <View style={styles.matchSummary}>
              <View style={styles.summRow}>
                <Text style={styles.summKey}>STAKE</Text>
                <Text style={styles.summVal}>{selectedStake.label}</Text>
              </View>
              <View style={styles.summRow}>
                <Text style={styles.summKey}>PRIZE POOL</Text>
                <Text style={[styles.summVal, styles.summValAmber]}>
                  {lamportsToSol(selectedStake.value * 2)} SOL
                </Text>
              </View>
              <View style={styles.summRow}>
                <Text style={styles.summKey}>TIME CONTROL</Text>
                <Text style={styles.summVal}>{selectedTime.label}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.waitingActions}>
            <View style={styles.waitingBtnRow}>
              <Button label="Copy Code" onPress={handleCopy} variant="outline" style={styles.flex1} />
              <Button label="Share" onPress={handleShare} variant="primary" style={styles.flex1} />
            </View>
            <Button label="Cancel" onPress={() => router.back()} variant="ghost" />
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // ── LOADING STATE ───────────────────────────────────────────────────────────
  if (step === 'creating' || step === 'staking') {
    return (
      <View style={[styles.root, styles.center]}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spinDeg }] }]} />
        <Text style={styles.loadPrimary}>
          {step === 'creating' ? 'CREATING MATCH' : 'CONFIRM IN WALLET'}
        </Text>
        <Text style={styles.loadSub}>
          {step === 'staking'
            ? `Sending ${selectedStake.label} to treasury`
            : 'Setting up your game'}
        </Text>
      </View>
    )
  }

  // ── CONFIG STATE ────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NEW MATCH</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.headerRule} />

          {/* ── TWO-COLUMN SELECTOR ─── completely new structure */}
          <View style={styles.selectorPanel}>

            {/* LEFT COLUMN: Stake selection */}
            <View style={styles.selectorCol}>
              <Text style={styles.colLabel}>STAKE</Text>
              <Text style={styles.colSelected}>
                {selectedStake.display}
                <Text style={styles.colSelectedUnit}> SOL</Text>
              </Text>
              <View style={styles.optionList}>
                {STAKE_OPTIONS.map((opt) => {
                  const active = selectedStake.value === opt.value
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setSelectedStake(opt)}
                      activeOpacity={0.75}
                      style={[styles.optionRow, active && styles.optionRowActive]}
                    >
                      <View style={[styles.optionPip, active && styles.optionPipActive]} />
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {opt.display} SOL
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Vertical divider */}
            <View style={styles.colDivider} />

            {/* RIGHT COLUMN: Time control selection */}
            <View style={styles.selectorCol}>
              <Text style={styles.colLabel}>TIME</Text>
              <Text style={styles.colSelected}>
                {selectedTime.label}
                <Text style={styles.colSelectedUnit}> MIN</Text>
              </Text>
              <View style={styles.optionList}>
                {TIME_CONTROLS.map((tc) => {
                  const active = selectedTime.seconds === tc.seconds
                  return (
                    <TouchableOpacity
                      key={tc.seconds}
                      onPress={() => setSelectedTime(tc)}
                      activeOpacity={0.75}
                      style={[styles.optionRow, active && styles.optionRowActive]}
                    >
                      <View style={[styles.optionPip, active && styles.optionPipActive]} />
                      <View>
                        <Text style={[styles.optionText, active && styles.optionTextActive]}>
                          {tc.label} MIN
                        </Text>
                        <Text style={styles.optionSub}>{tc.display}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </View>

          {/* ── SUMMARY PANEL ── */}
          <View style={styles.summaryPanel}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>YOUR STAKE</Text>
                <Text style={styles.summaryCellValue}>{selectedStake.label}</Text>
              </View>
              <View style={styles.summaryCellDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>OPPONENT STAKE</Text>
                <Text style={styles.summaryCellValue}>{selectedStake.label}</Text>
              </View>
              <View style={[styles.summaryCellDivider, styles.summaryCellDividerH]} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>PLATFORM FEE</Text>
                <Text style={styles.summaryCellValue}>
                  −{lamportsToSol(Math.floor(selectedStake.value * 2 * 0.05))} SOL
                </Text>
              </View>
              <View style={styles.summaryCellDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>TIME CONTROL</Text>
                <Text style={styles.summaryCellValue}>{selectedTime.display}</Text>
              </View>
            </View>

            {/* YOU WIN callout */}
            <View style={styles.winCallout}>
              <Text style={styles.winCalloutLabel}>IF YOU WIN</Text>
              <Text style={styles.winCalloutAmount}>{lamportsToSol(prizeAmount)} SOL</Text>
            </View>
          </View>

          {/* ── CTA ── */}
          <View style={styles.ctaArea}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button
              label={`Stake ${selectedStake.label} & Create`}
              onPress={handleCreateAndStake}
              variant="primary"
              size="lg"
              disabled={!account}
            />
            <Text style={styles.disclaimer}>
              Funds held in a secure treasury · Released on game end
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  flex1: { flex: 1 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backArrow: {
    fontSize: 20,
    color: 'rgba(240,237,232,0.45)',
    fontFamily: 'monospace',
    lineHeight: 24,
    width: 28,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: mono,
    fontWeight: '700',
    color: '#F0EDE8',
    letterSpacing: 4,
  },
  headerSpacer: { width: 28 },
  headerRule: {
    height: 1,
    backgroundColor: '#1A1A22',
  },

  // ── Two-column selector ───────────────────────────────────────────────────
  selectorPanel: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  selectorCol: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 18,
    gap: 6,
  },
  colDivider: {
    width: 1,
    backgroundColor: '#1A1A22',
    alignSelf: 'stretch',
  },
  colLabel: {
    fontSize: 8,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(240,237,232,0.28)',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  colSelected: {
    fontSize: 38,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: -1,
    marginBottom: 14,
  },
  colSelectedUnit: {
    fontSize: 16,
    color: 'rgba(232,184,75,0.55)',
    letterSpacing: 0,
  },
  optionList: {
    gap: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#1A1A22',
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  optionRowActive: {
    borderColor: 'rgba(232,184,75,0.42)',
    backgroundColor: 'rgba(232,184,75,0.06)',
  },
  optionPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A34',
  },
  optionPipActive: {
    backgroundColor: '#E8B84B',
    borderColor: '#E8B84B',
  },
  optionText: {
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.45)',
    letterSpacing: 0.3,
  },
  optionTextActive: {
    color: '#E8B84B',
  },
  optionSub: {
    fontSize: 9,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.22)',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // ── Summary panel ─────────────────────────────────────────────────────────
  summaryPanel: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryCell: {
    width: '50%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 4,
  },
  summaryCellDivider: {
    width: 1,
    backgroundColor: '#1A1A22',
  },
  summaryCellDividerH: {
    width: '100%',
    height: 1,
    backgroundColor: '#1A1A22',
  },
  summaryCellLabel: {
    fontSize: 8,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.25)',
    letterSpacing: 2,
  },
  summaryCellValue: {
    fontSize: 13,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.70)',
  },

  // YOU WIN callout
  winCallout: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1A22',
    backgroundColor: 'rgba(232,184,75,0.05)',
  },
  winCalloutLabel: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(232,184,75,0.65)',
    letterSpacing: 2.5,
  },
  winCalloutAmount: {
    fontSize: 22,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: -0.5,
  },

  // ── CTA area ──────────────────────────────────────────────────────────────
  ctaArea: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 11,
    fontFamily: mono,
    color: 'rgba(239,68,68,0.80)',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.18)',
    textAlign: 'center',
    letterSpacing: 0.3,
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
  loadPrimary: {
    fontSize: 10,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(240,237,232,0.55)',
    letterSpacing: 3,
  },
  loadSub: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.26)',
    letterSpacing: 0.4,
  },

  // ── Waiting ───────────────────────────────────────────────────────────────
  waitingContent: {
    flex: 1,
  },
  codeSection: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 16,
  },
  codeSectionLabel: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.28)',
    letterSpacing: 3,
  },
  codeCharRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeChar: {
    width: 46,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(232,184,75,0.48)',
    backgroundColor: 'rgba(232,184,75,0.06)',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCharText: {
    fontSize: 28,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
  },
  codePulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  codePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8B84B',
  },
  codePulseLabel: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.32)',
    letterSpacing: 2.5,
  },
  waitingRule: {
    height: 1,
    backgroundColor: '#1A1A22',
  },
  matchSummary: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  summRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  summKey: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.28)',
    letterSpacing: 2,
  },
  summVal: {
    fontSize: 12,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.65)',
  },
  summValAmber: {
    color: '#E8B84B',
  },
  waitingActions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
    gap: 10,
  },
  waitingBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
})
