import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet, Platform } from 'react-native'

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

interface ChessTimerProps {
  milliseconds: number
  isActive: boolean
  label: string
  shortAddress: string
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ChessTimer({ milliseconds, isActive, label, shortAddress }: ChessTimerProps) {
  const isLow = milliseconds > 0 && milliseconds < 10_000
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isActive && isLow) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.25, duration: 480, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 480, useNativeDriver: true }),
        ]),
      )
      loop.start()
      return () => loop.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isActive, isLow, pulseAnim])

  const isWhitePlayer = label.toLowerCase().includes('white')
  const pieceIcon     = isWhitePlayer ? '♙' : '♟'

  const clockColor = milliseconds <= 0
    ? 'rgba(248,113,113,0.90)'
    : isLow && isActive
      ? 'rgba(248,113,113,0.90)'
      : isActive
        ? '#FFFFFF'
        : 'rgba(255,255,255,0.30)'

  return (
    <View style={[styles.container, isActive && styles.containerActive]}>
      {/* Left accent bar */}
      {isActive && <View style={styles.activeBar} />}

      {/* Piece icon */}
      <Text style={[styles.pieceIcon, isActive && styles.pieceIconActive]}>
        {pieceIcon}
      </Text>

      {/* Player info */}
      <View style={styles.info}>
        <Text style={[styles.playerName, isActive && styles.playerNameActive]} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
        <Text style={styles.address} numberOfLines={1}>{shortAddress}</Text>
      </View>

      {/* Clock */}
      <Animated.Text
        style={[styles.clock, { color: clockColor, opacity: isLow && isActive ? pulseAnim : 1 }]}
        allowFontScaling={false}
      >
        {formatTime(milliseconds)}
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#111111',
    overflow: 'hidden',
    position: 'relative',
    gap: 12,
  },
  containerActive: {
    borderColor: 'rgba(255,255,255,0.50)',
  },

  activeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
  },

  pieceIcon: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.25)',
  },
  pieceIconActive: {
    color: 'rgba(255,255,255,0.80)',
  },

  info: {
    flex: 1,
    gap: 3,
  },
  playerName: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 2,
  },
  playerNameActive: {
    color: 'rgba(255,255,255,0.65)',
  },
  address: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(255,255,255,0.22)',
    letterSpacing: 0.3,
  },

  clock: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: mono,
    letterSpacing: -0.5,
    minWidth: 64,
    textAlign: 'right',
  },
})
