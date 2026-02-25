import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  style?: ViewStyle
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading

  const paddingV = size === 'sm' ? 11 : size === 'lg' ? 16 : 13
  const fontSize  = size === 'sm' ? 11 : size === 'lg' ? 13 : 12
  const spacing   = size === 'sm' ? 2.0 : 2.5

  // ── PRIMARY — white fill, black text ──────────────────────────────────────
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.80}
        style={[
          styles.primary,
          { paddingVertical: paddingV, opacity: isDisabled ? 0.35 : 1 },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color="#0B0B0B" size="small" />
          : (
            <View style={styles.row}>
              {icon && <View style={styles.iconLeft}>{icon}</View>}
              <Text style={[styles.labelDark, { fontSize, letterSpacing: spacing }]}>
                {label.toUpperCase()}
              </Text>
            </View>
          )}
      </TouchableOpacity>
    )
  }

  // ── OUTLINE — hairline border, white text ─────────────────────────────────
  if (variant === 'outline' || variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.70}
        style={[
          styles.outline,
          { paddingVertical: paddingV, opacity: isDisabled ? 0.32 : 1 },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" size="small" />
          : (
            <View style={styles.row}>
              {icon && <View style={styles.iconLeft}>{icon}</View>}
              <Text style={[styles.labelLight, { fontSize, letterSpacing: spacing }]}>
                {label.toUpperCase()}
              </Text>
            </View>
          )}
      </TouchableOpacity>
    )
  }

  // ── DANGER — red border, red text ─────────────────────────────────────────
  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.70}
        style={[
          styles.outline,
          { paddingVertical: paddingV, borderColor: 'rgba(248,113,113,0.55)', opacity: isDisabled ? 0.32 : 1 },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color="#F87171" size="small" />
          : (
            <View style={styles.row}>
              {icon && <View style={styles.iconLeft}>{icon}</View>}
              <Text style={[styles.labelLight, { fontSize, letterSpacing: spacing, color: '#F87171' }]}>
                {label.toUpperCase()}
              </Text>
            </View>
          )}
      </TouchableOpacity>
    )
  }

  // ── GHOST — no border, muted text ─────────────────────────────────────────
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.60}
      style={[
        { paddingVertical: paddingV, paddingHorizontal: 16, alignItems: 'center', opacity: isDisabled ? 0.32 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <Text style={[styles.labelMuted, { fontSize, letterSpacing: spacing }]}>
          {label.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // Shared shape
  primary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  row: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: 8 },

  labelDark: {
    fontWeight: '700',
    color: '#0B0B0B',
  },
  labelLight: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  labelMuted: {
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
  },
})
