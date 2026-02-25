import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet, ViewStyle } from 'react-native'
import { MeshBackground } from './mesh-background'
import { colors, typography, spacing } from '@/constants/theme'

export function LoadingSpinner({
  size = 'md',
  color = colors.accent,
  style,
}: {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  style?: ViewStyle
}) {
  const spin = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ).start()
  }, [spin])

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const dim = size === 'sm' ? 20 : size === 'lg' ? 44 : 30
  const border = size === 'sm' ? 2 : size === 'lg' ? 3.5 : 3

  return (
    <View style={style}>
      <Animated.View
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderWidth: border,
          borderColor: `${color}28`,
          borderTopColor: color,
          transform: [{ rotate }],
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 4,
        }}
      />
    </View>
  )
}

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <View style={styles.fullscreen}>
      <MeshBackground />
      <LoadingSpinner size="lg" />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  )
}

/** Animated pulsing dots */
export function WaitingDots() {
  const dot1 = useRef(new Animated.Value(0.25)).current
  const dot2 = useRef(new Animated.Value(0.25)).current
  const dot3 = useRef(new Animated.Value(0.25)).current

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.25, duration: 380, useNativeDriver: true }),
        ]),
      ).start()

    pulse(dot1, 0)
    pulse(dot2, 180)
    pulse(dot3, 360)
  }, [dot1, dot2, dot3])

  return (
    <View style={styles.dots}>
      {[dot1, dot2, dot3].map((anim, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { opacity: anim }]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 3,
  },
})
