import React from 'react'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '@/constants/theme'

/**
 * Warm mesh-gradient background — purple blob top-right, blue blob bottom-left,
 * over the dark warm-gray base. Position:absolute so it fills the parent without
 * consuming layout space.
 */
export function MeshBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Solid warm dark base */}
      <View style={[StyleSheet.absoluteFill, styles.base]} />

      {/* Blob 1 — warm purple, top-right */}
      <LinearGradient
        colors={[colors.meshPurple, 'transparent']}
        style={styles.blobTopRight}
        start={{ x: 0.85, y: 0.1 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Blob 2 — blue, bottom-left */}
      <LinearGradient
        colors={[colors.meshBlue, 'transparent']}
        style={styles.blobBottomLeft}
        start={{ x: 0.15, y: 0.9 }}
        end={{ x: 1, y: 0 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bg,
  },
  blobTopRight: {
    position: 'absolute',
    top: -100,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
})
