import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { Button } from '@/components/ui/button'
import { MatchRow, lamportsToSol, calculatePrize } from '@/features/match/match-types'
import { getMatchByCode, joinMatch } from '@/features/match/match-service'
import { useStake } from '@/features/stake/use-stake'

const { width: SW, height: SH } = Dimensions.get('window')
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

const CELL    = Math.round(SW / 8)
const H_TOPS  = Array.from({ length: Math.ceil(SH / CELL) + 3 }, (_, i) => (i - 1) * CELL)
const V_LEFTS = Array.from({ length: Math.ceil(SW / CELL) + 3 }, (_, i) => (i - 1) * CELL)

type Step = 'enter' | 'lookup' | 'review' | 'staking'

export default function JoinScreen() {
  const { account } = useMobileWallet()
  const { stake, error: stakeError } = useStake()

  const [code, setCode]             = useState('')
  const [step, setStep]             = useState<Step>('enter')
  const [foundMatch, setFoundMatch] = useState<MatchRow | null>(null)
  const [error, setError]           = useState<string | null>(null)

  // Spinning indicator
  const spin = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, useNativeDriver: true })
    ).start()
  }, [spin])
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  async function handleLookup() {
    if (code.trim().length < 6) { setError('Enter a 6-character match code'); return }
    setError(null); setStep('lookup')
    try {
      const match = await getMatchByCode(code)
      if (match.status !== 'waiting') { setError('Match no longer available'); setStep('enter'); return }
      if (match.host_public_key === account?.address) { setError("You can't join your own match"); setStep('enter'); return }
      setFoundMatch(match); setStep('review')
    } catch {
      setError('Match not found. Check the code.'); setStep('enter')
    }
  }

  async function handleJoinAndStake() {
    if (!account || !foundMatch) return
    setError(null); setStep('staking')
    try {
      await joinMatch(foundMatch.id, account.address)
      const sig = await stake(foundMatch.id, foundMatch.stake_amount)
      if (!sig) { setError(stakeError ?? 'Staking failed.'); setStep('review'); return }
      router.replace(`/game/${foundMatch.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join'); setStep('review')
    }
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (step === 'lookup' || step === 'staking') {
    const label = step === 'lookup' ? 'FINDING MATCH' : 'CONFIRM IN WALLET'
    const sub   = step === 'staking' ? `Sending ${foundMatch ? lamportsToSol(foundMatch.stake_amount) : ''} SOL to escrow` : null
    return (
      <View style={[styles.root, styles.center]}>
        {Grid}
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
        <Text style={styles.loadLabel}>{label}</Text>
        {sub && <Text style={styles.loadSub}>{sub}</Text>}
      </View>
    )
  }

  // ── Review ────────────────────────────────────────────────────────────────
  if (step === 'review' && foundMatch) {
    const prize    = calculatePrize(foundMatch.stake_amount)
    const timeMin  = Math.round(foundMatch.time_control / 60)
    const hostShort = `${foundMatch.host_public_key.slice(0, 4)}…${foundMatch.host_public_key.slice(-4)}`

    return (
      <View style={styles.root}>
        {Grid}
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => { setStep('enter'); setFoundMatch(null) }} hitSlop={12}>
                <Text style={styles.backBtn}>←</Text>
              </TouchableOpacity>
              <Text style={styles.pageTitle}>MATCH FOUND</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.rule} />

            {/* Code display */}
            <View style={styles.codeBlock}>
              <Text style={styles.codeCap}>MATCH CODE</Text>
              <Text style={styles.codeValue}>{foundMatch.code}</Text>
            </View>

            <View style={styles.rule} />

            {/* Summary table */}
            <View style={styles.summaryTable}>
              <View style={styles.summRow}>
                <Text style={styles.summKey}>HOST</Text>
                <Text style={[styles.summVal, { fontFamily: mono }]}>{hostShort}</Text>
              </View>
              <View style={styles.summRow}>
                <Text style={styles.summKey}>STAKE REQUIRED</Text>
                <Text style={styles.summVal}>{lamportsToSol(foundMatch.stake_amount)} SOL</Text>
              </View>
              <View style={styles.summRow}>
                <Text style={styles.summKey}>TIME CONTROL</Text>
                <Text style={styles.summVal}>{timeMin} MIN</Text>
              </View>
              <View style={styles.rowDivider} />
              <View style={styles.summRow}>
                <Text style={[styles.summKey, { color: '#FFFFFF' }]}>YOU WIN</Text>
                <Text style={[styles.summVal, { color: '#FFFFFF', fontWeight: '700' }]}>{lamportsToSol(prize)} SOL</Text>
              </View>
            </View>

            <View style={styles.rule} />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              label={`Stake ${lamportsToSol(foundMatch.stake_amount)} SOL & Join`}
              onPress={handleJoinAndStake}
              variant="primary"
              size="lg"
              disabled={!account}
            />
            <Button
              label="Back"
              onPress={() => { setStep('enter'); setFoundMatch(null) }}
              variant="ghost"
            />

          </ScrollView>
        </SafeAreaView>
      </View>
    )
  }

  // ── Enter code ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {Grid}
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safe}
        >
          <View style={styles.enterWrap}>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                <Text style={styles.backBtn}>←</Text>
              </TouchableOpacity>
              <Text style={styles.pageTitle}>JOIN MATCH</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.rule} />

            {/* Input area */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>MATCH CODE</Text>

              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                placeholder="– – – – – –"
                placeholderTextColor="rgba(255,255,255,0.18)"
                style={styles.input}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleLookup}
              />

              {/* Dot progress */}
              <View style={styles.dotRow}>
                {Array.from({ length: 6 }, (_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i < code.length && styles.dotFilled]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.rule} />

            <Text style={styles.hint}>Ask your opponent for their 6-character match code</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.actionGroup}>
              <Button
                label="Find Match"
                onPress={handleLookup}
                variant="primary"
                size="lg"
                disabled={!account || code.trim().length < 6}
              />
              {!account && (
                <Text style={styles.walletHint}>Connect wallet to play</Text>
              )}
            </View>

          </View>
        </KeyboardAvoidingView>
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

  // ── Enter ───────────────────────────────────────────────────────────────────
  enterWrap: {
    flex: 1,
    gap: 22,
  },
  inputSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 22,
    gap: 14,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2.5,
  },
  input: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: mono,
    color: '#FFFFFF',
    letterSpacing: 14,
    textAlign: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  dotRow: { flexDirection: 'row', gap: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotFilled: {
    backgroundColor: '#FFFFFF',
  },

  // ── Action group ─────────────────────────────────────────────────────────────
  actionGroup: {
    paddingHorizontal: 22,
    gap: 10,
    marginTop: 'auto',
    paddingBottom: 24,
  },
  hint: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 22,
  },
  walletHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Review / Scroll ──────────────────────────────────────────────────────────
  scroll: {
    paddingBottom: 40,
    gap: 10,
  },

  // ── Code block ───────────────────────────────────────────────────────────────
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

  // ── Summary table ─────────────────────────────────────────────────────────────
  summaryTable: {
    paddingHorizontal: 22,
    gap: 0,
  },
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
  loadSub: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.5,
  },

  // ── Misc ─────────────────────────────────────────────────────────────────────
  errorText: {
    fontSize: 11,
    fontFamily: mono,
    color: 'rgba(248,113,113,0.80)',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: 22,
  },
})
