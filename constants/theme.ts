import { Dimensions, Platform } from 'react-native'

export const SCREEN_WIDTH = Dimensions.get('window').width
export const SCREEN_HEIGHT = Dimensions.get('window').height

export const BOARD_SIZE = SCREEN_WIDTH - 32
export const SQUARE_SIZE = BOARD_SIZE / 8
export const PIECE_FONT_SIZE = SQUARE_SIZE * 0.72

// ── Color palette ────────────────────────────────────────────────────────────
export const colors = {
  // ── Background surfaces ───────────────────────────────────────────────────
  bg: '#0B0B0F',    // near-black, subtle cool undertone
  bgAlt: '#0E0E14',    // inset surfaces
  bgCard: '#111117',    // panel surfaces
  bgElevated: '#161620',    // raised surfaces
  bgOverlay: 'rgba(11,11,15,0.97)',

  // ── Glass tokens (kept for backward compatibility) ────────────────────────
  glass: 'rgba(255,255,255,0.03)',
  glassMid: 'rgba(255,255,255,0.06)',
  glassHigh: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassBorderStrong: 'rgba(255,255,255,0.12)',

  bgCard2: 'rgba(255,255,255,0.03)',
  bgElevated2: 'rgba(255,255,255,0.06)',

  // ── Mesh (kept for backward compatibility) ────────────────────────────────
  meshBlue: 'rgba(60,40,10,0.22)',
  meshPurple: 'rgba(120,80,10,0.28)',

  // ── Structural borders ────────────────────────────────────────────────────
  border: 'rgba(255,255,255,0.07)',
  borderLight: 'rgba(255,255,255,0.11)',
  borderAccent: 'rgba(232,184,75,0.42)',

  // ── Accent: Amber ─────────────────────────────────────────────────────────
  accent: '#E8B84B',
  accentLight: '#F5D078',
  accentDark: '#B58A28',
  accentGlow: 'rgba(232,184,75,0.18)',

  // Legacy aliases
  gold: '#E8B84B',
  goldLight: '#F5D078',
  goldDark: '#B58A28',
  goldGlow: 'rgba(232,184,75,0.14)',

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#22C55E',
  successLight: '#4ADE80',
  successGlow: 'rgba(34,197,94,0.20)',
  error: '#EF4444',
  errorLight: '#F87171',
  errorGlow: 'rgba(239,68,68,0.18)',

  // ── Text ──────────────────────────────────────────────────────────────────
  text: '#F0EDE8',
  textSecondary: 'rgba(240,237,232,0.52)',
  textMuted: 'rgba(240,237,232,0.24)',

  // ── Chess board — warm parchment + near-black brown ────────────────────────
  boardLight: '#EADAC1',
  boardDark: '#9C815E',
  boardSelected: 'rgba(232,184,75,0.42)',
  boardLastMove: 'rgba(232,184,75,0.18)',
  boardValidMove: 'rgba(232,184,75,0.72)',
  boardValidCapture: 'rgba(232,184,75,0.46)',
  boardCheck: 'rgba(239,68,68,0.70)',
  boardLabel: 'rgba(100,86,50,0.60)',

  // ── Pieces ────────────────────────────────────────────────────────────────
  pieceWhite: '#F4F1EA',
  pieceBlack: '#24221F',
} as const

// ── Spacing ──────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

// ── Border radius ─────────────────────────────────────────────────────────────
export const radius = {
  sm: 2,
  md: 6,
  lg: 12,
  xl: 20,
  full: 9999,
} as const

// ── Typography ────────────────────────────────────────────────────────────────
const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif'

export const typography = {
  hero: { fontSize: 38, fontWeight: '700' as const, fontFamily: serif, letterSpacing: 0.5 },
  h1: { fontSize: 28, fontWeight: '700' as const, fontFamily: serif },
  h2: { fontSize: 22, fontWeight: '700' as const, fontFamily: serif },
  h3: { fontSize: 18, fontWeight: '600' as const, fontFamily: serif },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionBold: { fontSize: 13, fontWeight: '600' as const },
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  mono: { fontSize: 15, fontFamily: 'monospace' as const },
} as const
