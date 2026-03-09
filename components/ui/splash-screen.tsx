import React, { useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const { width: SW, height: SH } = Dimensions.get('window')
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

// ─── Chess-board grid lines ───────────────────────────────────────────────────
// Lines only — cleaner and sharper than filled squares
const CELL = Math.round(SW / 8)
const H_TOPS = Array.from({ length: Math.ceil(SH / CELL) + 3 }, (_, i) => (i - 1) * CELL)
const V_LEFTS = Array.from({ length: Math.ceil(SW / CELL) + 3 }, (_, i) => (i - 1) * CELL)

const PIECE_W = SW * 0.76
const PIECE_H = SW * 0.58

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const bgOp = useRef(new Animated.Value(0)).current
  const gridOp = useRef(new Animated.Value(0)).current
  const pieceOp = useRef(new Animated.Value(0)).current
  const pieceSc = useRef(new Animated.Value(0.97)).current
  const ruleScX = useRef(new Animated.Value(0)).current
  const logoOp = useRef(new Animated.Value(0)).current
  const tagOp = useRef(new Animated.Value(0)).current
  const exitOp = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([

      // ① Stage fades in, grid quietly materialises
      Animated.parallel([
        Animated.timing(bgOp, {
          toValue: 1, duration: 420,
          useNativeDriver: true, easing: Easing.out(Easing.quad),
        }),
        Animated.timing(gridOp, {
          toValue: 1, duration: 1000,
          useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
      ]),

      // ② King materialises — pure presence
      Animated.parallel([
        Animated.timing(pieceOp, {
          toValue: 1, duration: 720,
          useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(pieceSc, {
          toValue: 1, duration: 720,
          useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
      ]),

      // ③ Rules extend from centre, title fades shortly after
      Animated.parallel([
        Animated.timing(ruleScX, {
          toValue: 1, duration: 480,
          useNativeDriver: true, easing: Easing.out(Easing.cubic),
        }),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(logoOp, {
            toValue: 1, duration: 380,
            useNativeDriver: true, easing: Easing.out(Easing.cubic),
          }),
        ]),
      ]),

      // ④ Tagline
      Animated.timing(tagOp, {
        toValue: 1, duration: 320, useNativeDriver: true,
      }),

      // ⑤ Hold
      Animated.delay(680),

      // ⑥ Curtain
      Animated.timing(exitOp, {
        toValue: 0, duration: 480,
        useNativeDriver: true, easing: Easing.in(Easing.quad),
      }),

    ]).start(() => onFinish())
  }, [])

  return (
    <Animated.View style={[styles.container, { opacity: exitOp }]}>

      {/* ── 1. Black stage ── */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.stage, { opacity: bgOp }]} />

      {/* ── 2. Chess grid lines — hairline at 6% white, perfectly subtle ── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.gridWrap, { opacity: gridOp }]}
      >
        {H_TOPS.map((top) => (
          <View key={`h${top}`} style={[styles.gridLine, styles.hLine, { top }]} />
        ))}
        {V_LEFTS.map((left) => (
          <View key={`v${left}`} style={[styles.gridLine, styles.vLine, { left }]} />
        ))}
      </Animated.View>

      {/* ── 3. Edge vignettes — soft, not heavy ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Left */}
        <LinearGradient
          colors={['rgba(0,0,0,0.60)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.5 }} end={{ x: 0.42, y: 0.5 }}
        />
        {/* Right */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.60)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.58, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        />
        {/* Top */}
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.20 }}
        />
        {/* Bottom — stops before wordmark area */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.52)']}
          style={[StyleSheet.absoluteFill, { top: '62%' }]}
        />
      </View>

      {/* ── 4. King piece — no shadow, just the piece ── */}
      <Animated.Image
        source={require('@/assets/images/Chess_Icon_no_bg.png')}
        style={[
          styles.piece,
          { opacity: pieceOp, transform: [{ scale: pieceSc }] },
        ]}
        resizeMode="contain"
      />

      {/* ── 5. Wordmark ── */}
      <View style={styles.wordmarkGroup}>
        <Animated.View style={[styles.rule, { transform: [{ scaleX: ruleScX }] }]} />

        <Animated.Text style={[styles.title, { opacity: logoOp }]}>
          CHESSLING
        </Animated.Text>

        <Animated.View style={[styles.rule, { transform: [{ scaleX: ruleScX }] }]} />

        <Animated.Text style={[styles.tagline, { opacity: tagOp }]}>
          Speed Chess  ·  Real Stakes
        </Animated.Text>
      </View>

    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    backgroundColor: '#000',
  },

  // ── Stage ──────────────────────────────────────────────────────────────────
  stage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#08080D',
  },

  // ── Grid ───────────────────────────────────────────────────────────────────
  gridWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    // 6% white on black — present but never competing with the piece
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

  // ── Piece ──────────────────────────────────────────────────────────────────
  piece: {
    width: PIECE_W,
    height: PIECE_H,
    marginBottom: 20,
    // No shadow — high contrast between white piece and black is enough
  },

  // ── Wordmark ───────────────────────────────────────────────────────────────
  wordmarkGroup: {
    alignItems: 'center',
    gap: 12,
  },
  rule: {
    width: 156,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(200,166,90,0.55)',
  },
  title: {
    fontSize: 26,
    fontFamily: mono,
    fontWeight: '700',
    color: '#EEE9DF',
    letterSpacing: 11,
  },
  tagline: {
    fontSize: 10,
    letterSpacing: 3.2,
    color: 'rgba(200,166,90,0.45)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
})
