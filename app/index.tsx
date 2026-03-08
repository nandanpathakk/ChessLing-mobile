import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { createLocalPlayMatch } from '@/features/match/match-service'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/ui/wallet-chip'
import { SplashScreen } from '@/components/ui/splash-screen'

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'
const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif'

export default function HomeScreen() {
  const { account } = useMobileWallet()
  const [showSplash, setShowSplash] = useState(true)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(28)).current

  useEffect(() => {
    if (!showSplash) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 620,
          useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0, duration: 620,
          useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
      ]).start()
    }
  }, [showSplash])

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <Animated.View
            style={[
              styles.screen,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >

            {/* ─────────────────────────────────────────────────────────────
                HEADER — thin strip: logo | wallet
            ───────────────────────────────────────────────────────────── */}
            <View style={styles.header}>
              <Text style={styles.wordmark}>CHESSLING</Text>
              <WalletButton />
            </View>

            {/* ─────────────────────────────────────────────────────────────
                HERO — left-aligned editorial typographic block
                Vertical amber rail on the left + three-line headline
            ───────────────────────────────────────────────────────────── */}
            <View style={styles.hero}>
              <View style={styles.amberRail} />

              <View style={styles.heroText}>
                <Text style={styles.heroLine1}>CHESS</Text>
                <Text style={styles.heroLine2}>FOR</Text>
                <Text style={styles.heroLine3}>STAKES.</Text>
                <Text style={styles.heroSub}>
                  Wager SOL. Beat your opponent.{'\n'}Take the pot.
                </Text>
              </View>
            </View>

            {/* ─────────────────────────────────────────────────────────────
                METRICS — bordered stat box: Stake · Prize · Time
            ───────────────────────────────────────────────────────────── */}
            <View style={styles.metricsBox}>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>0.05–0.5</Text>
                <Text style={styles.metricLabel}>SOL STAKE</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>1.9×</Text>
                <Text style={styles.metricLabel}>NET WIN</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>1–3</Text>
                <Text style={styles.metricLabel}>MIN BLITZ</Text>
              </View>
            </View>

            {/* ─────────────────────────────────────────────────────────────
                ACTION ZONE — amber rule + CTAs + footer
            ───────────────────────────────────────────────────────────── */}
            <View style={styles.actionZone}>

              {/* Amber section separator */}
              <View style={styles.amberRule} />

              <View style={styles.ctaStack}>
                <Button
                  label="New Match"
                  onPress={() => { if (account) router.push('/create') }}
                  variant="primary"
                  size="lg"
                  disabled={!account}
                />
                <Button
                  label="Join with Code"
                  onPress={() => { if (account) router.push('/join') }}
                  variant="outline"
                  size="lg"
                  disabled={!account}
                />
                {!account && (
                  <Text style={styles.walletNote}>Connect wallet above to play</Text>
                )}

                {__DEV__ && (
                  <Button
                    label="[DEV] Local Self-Play"
                    onPress={async () => {
                      if (!account) return
                      try {
                        const { matchId } = await createLocalPlayMatch(account.address)
                        router.push(`/game/${matchId}`)
                      } catch (e) {
                        console.error('Failed to create local match', e)
                      }
                    }}
                    variant="outline"
                    size="lg"
                    disabled={!account}
                    style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  />
                )}
              </View>

              <View style={styles.footer}>
                <View style={styles.netPip} />
                <Text style={styles.netLabel}>DEVNET</Text>
              </View>
            </View>

          </Animated.View>
        </SafeAreaView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  safe: { flex: 1 },
  screen: { flex: 1 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  wordmark: {
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '700',
    color: '#F0EDE8',
    letterSpacing: 5,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingRight: 20,
    gap: 18,
  },
  amberRail: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#E8B84B',
    alignSelf: 'stretch',
    marginTop: 4,
    marginBottom: 4,
  },
  heroText: {
    flex: 1,
    justifyContent: 'center',
    gap: 0,
  },
  heroLine1: {
    fontSize: 54,
    fontFamily: serif,
    fontWeight: '700',
    color: '#F0EDE8',
    lineHeight: 60,
    letterSpacing: -0.5,
  },
  heroLine2: {
    fontSize: 54,
    fontFamily: serif,
    fontWeight: '700',
    color: '#F0EDE8',
    lineHeight: 60,
    letterSpacing: -0.5,
  },
  heroLine3: {
    fontSize: 54,
    fontFamily: serif,
    fontWeight: '700',
    color: '#E8B84B',
    lineHeight: 60,
    letterSpacing: -0.5,
  },
  heroSub: {
    marginTop: 18,
    fontSize: 12,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.32)',
    letterSpacing: 0.3,
    lineHeight: 18,
  },

  // ── Metrics box ───────────────────────────────────────────────────────────
  metricsBox: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1A1A22',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricCell: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 5,
  },
  metricDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#1A1A22',
  },
  metricValue: {
    fontSize: 14,
    fontFamily: mono,
    fontWeight: '700',
    color: '#E8B84B',
    letterSpacing: 0.2,
  },
  metricLabel: {
    fontSize: 7.5,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(240,237,232,0.22)',
    letterSpacing: 1.8,
  },

  // ── Action zone ───────────────────────────────────────────────────────────
  actionZone: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 0,
  },
  amberRule: {
    height: 2,
    backgroundColor: '#E8B84B',
    borderRadius: 1,
    marginBottom: 18,
    marginTop: 14,
    opacity: 0.70,
  },
  ctaStack: {
    gap: 10,
  },
  walletNote: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.24)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
    marginBottom: 2,
  },
  netPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8B84B',
    opacity: 0.55,
  },
  netLabel: {
    fontSize: 8.5,
    fontFamily: mono,
    fontWeight: '600',
    color: 'rgba(232,184,75,0.45)',
    letterSpacing: 2.5,
  },
})
