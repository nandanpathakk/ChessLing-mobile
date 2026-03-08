import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet, Platform } from 'react-native'

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace'

interface ChessTimerProps {
  milliseconds: number
  isActive: boolean
  label: string
  shortAddress: string
  totalMs?: number
  capturedPieces?: string[]
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ChessTimer({
  milliseconds,
  isActive,
  label,
  shortAddress,
  totalMs,
  capturedPieces = []
}: ChessTimerProps) {
  const isLow = milliseconds > 0 && milliseconds < 10_000
  const isWarn = milliseconds > 0 && milliseconds < 30_000 && !isLow
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isActive && isLow) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.20, duration: 380, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        ]),
      )
      loop.start()
      return () => loop.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isActive, isLow, pulseAnim])

  const isWhitePlayer = label.toLowerCase().includes('white')
  const pieceIcon = isWhitePlayer ? '♙' : '♟'

  const PIECE_SYM: Record<string, string> = {
    q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  }

  // Clock color progression
  const clockColor = milliseconds <= 0
    ? '#EF4444'
    : isLow && isActive
      ? '#EF4444'
      : isWarn && isActive
        ? '#E8B84B'
        : isActive
          ? '#F0EDE8'
          : 'rgba(240,237,232,0.22)'

  // Time bar progress
  const barProgress = totalMs && totalMs > 0
    ? Math.max(0, Math.min(1, milliseconds / totalMs))
    : null

  return (
    <View style={[styles.container, isActive && styles.containerActive]}>

      {/* Left: player identity zone */}
      <View style={styles.identityZone}>
        {/* Active indicator — left rail */}
        <View style={[styles.leftRail, isActive && styles.leftRailActive]} />

        <View style={styles.identityContent}>
          <Text style={[styles.playerLabel, isActive && styles.playerLabelActive]} numberOfLines={1}>
            {pieceIcon}  {label.toUpperCase()}
          </Text>
          <Text style={styles.playerAddr} numberOfLines={1}>{shortAddress}</Text>

          {capturedPieces.length > 0 && (
            <View style={styles.capturedRow}>
              {capturedPieces.slice(0, 8).map((type, i) => (
                <Text key={i} style={styles.capturedPiece}>{PIECE_SYM[type] ?? ''}</Text>
              ))}
              {capturedPieces.length > 8 && (
                <Text style={styles.capturedMore}>+{capturedPieces.length - 8}</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Right: clock zone — gets amber tint when active */}
      <View style={[styles.clockZone, isActive && styles.clockZoneActive]}>
        <Animated.Text
          style={[styles.clockText, { color: clockColor, opacity: isLow && isActive ? pulseAnim : 1 }]}
          allowFontScaling={false}
        >
          {formatTime(milliseconds)}
        </Animated.Text>
      </View>

      {/* Time depletion bar at very bottom */}
      {barProgress !== null && (
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${barProgress * 100}%`,
                backgroundColor: isLow ? '#EF4444' : isWarn ? '#E8B84B' : '#E8B84B',
              },
            ]}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
    backgroundColor: '#0B0B0F',
    overflow: 'hidden',
  },
  containerActive: {
    backgroundColor: '#0F0F17',
  },

  // ── Identity zone (left ~58%) ─────────────────────────────────────────────
  identityZone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftRail: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  leftRailActive: {
    backgroundColor: '#E8B84B',
  },
  identityContent: {
    flex: 1,
    paddingHorizontal: 14,
    gap: 4,
    justifyContent: 'center',
  },
  playerLabel: {
    fontSize: 9,
    fontFamily: mono,
    fontWeight: '700',
    color: 'rgba(240,237,232,0.22)',
    letterSpacing: 2,
  },
  playerLabelActive: {
    color: 'rgba(240,237,232,0.62)',
  },
  playerAddr: {
    fontSize: 10,
    fontFamily: mono,
    color: 'rgba(240,237,232,0.18)',
    letterSpacing: 0.3,
  },
  capturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
    gap: 1,
  },
  capturedPiece: {
    fontSize: 10,
    color: 'rgba(232,184,75,0.48)',
    lineHeight: 12,
  },
  capturedMore: {
    fontSize: 8,
    fontFamily: mono,
    color: 'rgba(232,184,75,0.30)',
    marginLeft: 2,
  },

  // ── Clock zone (right ~42%) ──────────────────────────────────────────────
  clockZone: {
    width: '42%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#1A1A22',
    backgroundColor: '#0C0C12',
  },
  clockZoneActive: {
    backgroundColor: 'rgba(232,184,75,0.07)',
    borderLeftColor: 'rgba(232,184,75,0.20)',
  },
  clockText: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: mono,
    letterSpacing: -1.5,
  },

  // ── Time bar ──────────────────────────────────────────────────────────────
  barTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  barFill: {
    height: '100%',
    opacity: 0.55,
  },
})
