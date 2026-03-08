import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { Button } from '@/components/ui/button'
import { MatchRow, lamportsToSol, calculatePrize } from '@/features/match/match-types'
import { getMatchByCode, joinMatch } from '@/features/match/match-service'
import { useStake } from '@/features/stake/use-stake'

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'
const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif'
const SW = Dimensions.get('window').width

type Step = 'enter' | 'lookup' | 'review' | 'staking'

export default function JoinScreen() {
  const { account } = useMobileWallet()
  const { stake, error: stakeError } = useStake()

  const [code, setCode]             = useState('')
  const [step, setStep]             = useState<Step>('enter')
  const [foundMatch, setFoundMatch] = useState<MatchRow | null>(null)
  const [error, setError]           = useState<string | null>(null)

  const spinVal = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinVal, { toValue: 1, duration: 1100, useNativeDriver: true })
    ).start()
  }, [spinVal])
  const spinDeg = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

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

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (step === 'lookup' || step === 'staking') {
    return (
      <View style={[styles.root, styles.center]}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spinDeg }] }]} />
        <Text style={styles.loadLabel}>
          {step === 'lookup' ? 'FINDING MATCH' : 'CONFIRM IN WALLET'}
        </Text>
        <Text style={styles.loadSub}>
          {step === 'staking'
            ? `Sending ${foundMatch ? lamportsToSol(foundMatch.stake_amount) : ''} SOL to escrow`
            : 'Searching...'}
        </Text>
      </View>
    )
  }

  // ── REVIEW ─────────────────────────────────────────────────────────────────
  if (step === 'review' && foundMatch) {
    const prize     = calculatePrize(foundMatch.stake_amount)
    const timeMin   = Math.round(foundMatch.time_control / 60)
    const hostShort = `${foundMatch.host_public_key.slice(0, 6)}···${foundMatch.host_public_key.slice(-6)}`

    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setStep('enter'); setFoundMatch(null) }} hitSlop={12}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MATCH FOUND</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.headerRule} />

          {/* Match card */}
          <View style={styles.matchCard}>

            {/* Code display strip */}
            <View style={styles.reviewCodeStrip}>
              {foundMatch.code.split('').map((ch, i) => (
                <View key={i} style={styles.reviewCodeChar}>
                  <Text style={styles.reviewCodeCharText}>{ch}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardDivider} />

            {/* Match details */}
            <View style={styles.matchDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>HOST</Text>
                <Text style={[styles.detailVal, { fontFamily: mono }]}>{hostShort}</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>STAKE REQUIRED</Text>
                <Text style={styles.detailVal}>{lamportsToSol(foundMatch.stake_amount)} SOL</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>TIME CONTROL</Text>
                <Text style={styles.detailVal}>{timeMin} MIN BLITZ</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Win highlight */}
            <View style={styles.winHighlight}>
              <View style={styles.winHighlightLeft}>
                <Text style={styles.winHighlightLabel}>IF YOU WIN</Text>
              </View>
              <Text style={styles.winHighlightAmount}>{lamportsToSol(prize)} SOL</Text>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaArea}>
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
          </View>

        </SafeAreaView>
      </View>
    )
  }

  // ── CODE ENTRY ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safe}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>JOIN MATCH</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.headerRule} />

          {/* Title block */}
          <View style={styles.entryTitleBlock}>
            <Text style={styles.entryTitle}>Enter</Text>
            <Text style={[styles.entryTitle, styles.entryTitleAccent]}>Match Code</Text>
          </View>

          {/* Character display */}
          <View style={styles.charDisplay}>
            {Array.from({ length: 6 }, (_, i) => {
              const char    = code[i] ?? ''
              const filled  = i < code.length
              const isCursor = i === code.length && code.length < 6
              return (
                <View
                  key={i}
                  style={[
                    styles.charCell,
                    filled && styles.charCellFilled,
                    isCursor && styles.charCellCursor,
                  ]}
                >
                  {filled
                    ? <Text style={styles.charCellText}>{char}</Text>
                    : <Text style={styles.charCellPlaceholder}>{isCursor ? '|' : '·'}</Text>
                  }
                </View>
              )
            })}

            {/* Hidden TextInput — captures keyboard */}
            <TextInput
              value={code}
              onChangeText={(t) => { setCode(t.toUpperCase()); setError(null) }}
              style={styles.hiddenInput}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLookup}
              caretHidden
            />
          </View>

          {/* Progress pips */}
          <View style={styles.progressPips}>
            {Array.from({ length: 6 }, (_, i) => (
              <View key={i} style={[styles.pip, i < code.length && styles.pipFilled]} />
            ))}
          </View>

          {/* Hint */}
          <Text style={styles.hint}>
            Ask your opponent for their 6-character code
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* CTA */}
          <View style={styles.entryCta}>
            <Button
              label="Find Match"
              onPress={handleLookup}
              variant="primary"
              size="lg"
              disabled={!account || code.trim().length < 6}
            />
            {!account && (
              <Text style={styles.walletNote}>Connect wallet to play</Text>
            )}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0B0B0F' },
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },

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
    fontFamily: mono,
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

  // ── Entry — title block ────────────────────────────────────────────────────
  entryTitleBlock: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 28,
    gap: 0,
  },
  entryTitle: {
    fontSize: 46,
    fontFamily: serif,
    fontWeight: '700',
    color: '#F0EDE8',
    lineHeight: 52,
    letterSpacing: -0.3,
  },
  entryTitleAccent: {
    color: '#E8B84B',
  },

  // ── Char display ──────────────────────────────────────────────────────────
  charDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    position: 'relative',
  },
  charCell: {
    width: (SW - 40 - 40) / 6,
    height: 68,
    borderWidth: 1,
    borderColor: '#1A1A22',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0E14',
  },
  charCellFilled: {
    borderColor: 'rgba(232,184,75,0.50)',
    backgroundColor: 'rgba(232,184,75,0.06)',
  },
  charCellCursor: {
    borderColor: '#E8B84B',
  },
  charCellText: {
    fontSize: 26,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
  },
  charCellPlaceholder: {
    fontSize: 22,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.14)',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 68,
  },

  // ── Progress pips ─────────────────────────────────────────────────────────
  progressPips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 14,
  },
  pip: {
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#1A1A22',
  },
  pipFilled: {
    backgroundColor: '#E8B84B',
    width: 14,
  },

  // ── Hint ──────────────────────────────────────────────────────────────────
  hint: {
    fontSize: 11,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.24)',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    letterSpacing: 0.3,
  },

  // ── Entry CTA ─────────────────────────────────────────────────────────────
  entryCta: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 'auto',
    paddingBottom: 28,
    paddingTop: 16,
  },
  walletNote: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.24)',
    textAlign: 'center',
  },

  // ── Review — Match card ────────────────────────────────────────────────────
  matchCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#1A1A22',
    borderRadius: 2,
    overflow: 'hidden',
  },
  reviewCodeStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 16,
    backgroundColor: '#0E0E14',
  },
  reviewCodeChar: {
    width: 40,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(232,184,75,0.42)',
    backgroundColor: 'rgba(232,184,75,0.06)',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCodeCharText: {
    fontSize: 22,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#1A1A22',
  },
  matchDetails: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  detailKey: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.28)',
    letterSpacing: 2,
  },
  detailVal: {
    fontSize: 12,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.70)',
  },
  winHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: 'rgba(232,184,75,0.05)',
  },
  winHighlightLeft: {},
  winHighlightLabel: {
    fontSize: 8,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(232,184,75,0.60)',
    letterSpacing: 2.5,
  },
  winHighlightAmount: {
    fontSize: 26,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: -0.5,
  },

  // ── CTA area ──────────────────────────────────────────────────────────────
  ctaArea: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 10,
  },
  errorText: {
    fontSize: 11,
    fontFamily: mono,
    color: 'rgba(239,68,68,0.80)',
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
  loadLabel: {
    fontSize: 10,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(240,237,232,0.50)',
    letterSpacing: 3,
  },
  loadSub: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.26)',
    letterSpacing: 0.4,
  },
})
