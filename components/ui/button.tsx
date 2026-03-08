import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native'

const MONO = 'monospace'

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

  const paddingV = size === 'sm' ? 10 : size === 'lg' ? 16 : 13
  const fz       = size === 'sm' ? 10 : size === 'lg' ? 11 : 11
  const ls       = 2.5

  // ── PRIMARY — amber fill, dark text ───────────────────────────────────────
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.82}
        style={[
          styles.primary,
          { paddingVertical: paddingV, opacity: isDisabled ? 0.28 : 1 },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color="#0B0B0F" size="small" />
          : (
            <View style={styles.row}>
              {icon && <View style={styles.iconL}>{icon}</View>}
              <Text style={[styles.lDark, { fontSize: fz, letterSpacing: ls }]}>
                {label.toUpperCase()}
              </Text>
            </View>
          )}
      </TouchableOpacity>
    )
  }

  // ── OUTLINE / SECONDARY — white border, white text ─────────────────────────
  if (variant === 'outline' || variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.70}
        style={[
          styles.outline,
          { paddingVertical: paddingV, opacity: isDisabled ? 0.28 : 1 },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color="#F0EDE8" size="small" />
          : (
            <View style={styles.row}>
              {icon && <View style={styles.iconL}>{icon}</View>}
              <Text style={[styles.lLight, { fontSize: fz, letterSpacing: ls }]}>
                {label.toUpperCase()}
              </Text>
            </View>
          )}
      </TouchableOpacity>
    )
  }

  // ── DANGER ────────────────────────────────────────────────────────────────
  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.70}
        style={[
          styles.outline,
          {
            paddingVertical: paddingV,
            borderColor: 'rgba(239,68,68,0.50)',
            opacity: isDisabled ? 0.28 : 1,
          },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color="#EF4444" size="small" />
          : (
            <View style={styles.row}>
              {icon && <View style={styles.iconL}>{icon}</View>}
              <Text style={[styles.lLight, { fontSize: fz, letterSpacing: ls, color: '#EF4444' }]}>
                {label.toUpperCase()}
              </Text>
            </View>
          )}
      </TouchableOpacity>
    )
  }

  // ── GHOST ─────────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.60}
      style={[
        { paddingVertical: paddingV, paddingHorizontal: 16, alignItems: 'center', opacity: isDisabled ? 0.28 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon && <View style={styles.iconL}>{icon}</View>}
        <Text style={[styles.lMuted, { fontSize: fz, letterSpacing: ls }]}>
          {label.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#E8B84B',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(240,237,232,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconL: { marginRight: 8 },
  lDark: {
    fontWeight: '700',
    color: '#0B0B0F',
    fontFamily: MONO,
  },
  lLight: {
    fontWeight: '600',
    color: '#F0EDE8',
    fontFamily: MONO,
  },
  lMuted: {
    fontWeight: '500',
    color: 'rgba(240,237,232,0.36)',
    fontFamily: MONO,
  },
})
