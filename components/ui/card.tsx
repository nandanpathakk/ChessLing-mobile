import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors, radius, spacing } from '@/constants/theme'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  glow?: 'accent' | 'gold' | 'success' | 'error'
  noPadding?: boolean
}

export function Card({ children, style, glow, noPadding }: CardProps) {
  const glowStyle =
    glow === 'accent' || glow === 'gold'
      ? { borderColor: colors.borderAccent, shadowColor: colors.accent }
      : glow === 'success'
        ? { borderColor: `${colors.success}50`, shadowColor: colors.success }
        : glow === 'error'
          ? { borderColor: `${colors.error}50`, shadowColor: colors.error }
          : undefined

  return (
    <View
      style={[
        styles.card,
        noPadding && { padding: 0 },
        glow && styles.glowBase,
        glowStyle,
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />
}

export function CardRow({
  left,
  right,
  style,
}: {
  left: React.ReactNode
  right: React.ReactNode
  style?: ViewStyle
}) {
  return (
    <View style={[styles.row, style]}>
      <View>{left}</View>
      <View>{right}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  glowBase: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
})
