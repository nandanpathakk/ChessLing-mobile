import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/ui/wallet-chip'
import { SplashScreen } from '@/components/ui/splash-screen'

const { width: SW, height: SH } = Dimensions.get('window')
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

// ─── Same grid geometry as the splash screen ─────────────────────────────────
const CELL    = Math.round(SW / 8)
const H_TOPS  = Array.from({ length: Math.ceil(SH / CELL) + 3 }, (_, i) => (i - 1) * CELL)
const V_LEFTS = Array.from({ length: Math.ceil(SW / CELL) + 3 }, (_, i) => (i - 1) * CELL)

const STATS = [
  { value: '0.05–0.5', label: 'SOL STAKE' },
  { value: '1–3 MIN',  label: 'TIME LIMIT' },
  { value: '1.9×',     label: 'WINNER PAYS' },
]

export default function HomeScreen() {
  const { account } = useMobileWallet()
  const [showSplash, setShowSplash] = useState(true)
  const contentOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!showSplash) {
      Animated.timing(contentOp, {
        toValue: 1, duration: 500,
        useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }).start()
    }
  }, [showSplash])

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <View style={styles.root}>

        {/* ── Grid background ── */}
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

        {/* ── Edge vignettes ── */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(0,0,0,0.62)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.5 }} end={{ x: 0.42, y: 0.5 }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.62)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.58, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.50)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.18 }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={[StyleSheet.absoluteFill, { top: '65%' }]}
          />
        </View>

        {/* ── Content ── */}
        <SafeAreaView style={styles.safe}>
          <Animated.View style={[styles.content, { opacity: contentOp }]}>

            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.logo}>CHESSLING</Text>
              <WalletButton />
            </View>

            <View style={styles.rule} />

            {/* ── Hero ── */}
            <View style={styles.hero}>
              <Text style={styles.heroPiece}>♔</Text>
              <Text style={styles.heroHeadline}>Chess for{'\n'}Real Stakes.</Text>
              <Text style={styles.heroSub}>
                Wager SOL · Beat your opponent · Take the prize
              </Text>
            </View>

            {/* ── Bottom section ── */}
            <View style={styles.bottom}>

              <View style={styles.rule} />

              {/* Stats */}
              <View style={styles.statsRow}>
                {STATS.map((s, i) => (
                  <View
                    key={s.label}
                    style={[styles.statItem, i < STATS.length - 1 && styles.statBorder]}
                  >
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.rule} />

              {/* CTAs */}
              <View style={styles.ctaGroup}>
                <Button
                  label="New Match"
                  onPress={() => { if (account) router.push('/create') }}
                  variant="primary"
                  size="lg"
                  disabled={!account}
                />
                <Button
                  label="Join Match"
                  onPress={() => { if (account) router.push('/join') }}
                  variant="outline"
                  size="lg"
                  disabled={!account}
                />
                {!account && (
                  <Text style={styles.walletHint}>Connect wallet to play</Text>
                )}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.networkDot} />
                <Text style={styles.networkText}>DEVNET</Text>
              </View>

            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },

  // ── Grid ───────────────────────────────────────────────────────────────────
  gridWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  hLine: {
    left: -CELL,
    right: -CELL,
    height: StyleSheet.hairlineWidth,
  },
  vLine: {
    top: -CELL,
    bottom: -CELL,
    width: StyleSheet.hairlineWidth,
  },

  // ── Layout ─────────────────────────────────────────────────────────────────
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 4,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  logo: {
    fontSize: 13,
    fontFamily: mono,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 5,
  },

  // ── Rule ───────────────────────────────────────────────────────────────────
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // ── Hero ───────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  heroPiece: {
    fontSize: 72,
    color: '#FFFFFF',
    lineHeight: 82,
  },
  heroHeadline: {
    fontSize: 34,
    fontFamily: mono,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 42,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.36)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ── Bottom block ───────────────────────────────────────────────────────────
  bottom: {
    gap: 14,
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  statBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.18)',
  },
  statValue: {
    fontSize: 16,
    fontFamily: mono,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 2,
  },

  // ── CTAs ───────────────────────────────────────────────────────────────────
  ctaGroup: {
    gap: 9,
  },
  walletHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 2,
  },
  networkDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  networkText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 2.5,
  },
})
