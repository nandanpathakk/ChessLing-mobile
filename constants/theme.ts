import { Dimensions, Platform } from 'react-native'

export const SCREEN_WIDTH = Dimensions.get('window').width
export const SCREEN_HEIGHT = Dimensions.get('window').height

export const BOARD_SIZE = SCREEN_WIDTH - 32
export const SQUARE_SIZE = BOARD_SIZE / 8
export const PIECE_FONT_SIZE = SQUARE_SIZE * 0.72

// ── Color palette ────────────────────────────────────────────────────────────
export const colors = {
  // ── Background ────────────────────────────────────────────────────────────
  bg:         '#252230',          // dark warm purple-gray
  bgAlt:      '#1F1D2B',          // deeper background
  bgCard:     '#2E2B3E',          // card surfaces
  bgElevated: '#373351',          // elevated surfaces (dropdowns, tooltips)
  bgOverlay:  'rgba(25,23,34,0.96)',

  // ── Glassmorphism panels ──────────────────────────────────────────────────
  glass:             'rgba(255,255,255,0.07)',
  glassMid:          'rgba(255,255,255,0.11)',
  glassHigh:         'rgba(255,255,255,0.17)',
  glassBorder:       'rgba(255,255,255,0.09)',
  glassBorderStrong: 'rgba(255,255,255,0.20)',

  // Aliases used by existing components
  bgCard2:    'rgba(255,255,255,0.07)',
  bgElevated2:'rgba(255,255,255,0.11)',

  // ── Mesh blob colors ──────────────────────────────────────────────────────
  meshBlue:   'rgba(40,80,155,0.28)',
  meshPurple: 'rgba(100,60,155,0.35)',

  // ── Borders ───────────────────────────────────────────────────────────────
  border:        'rgba(255,255,255,0.09)',
  borderLight:   'rgba(255,255,255,0.16)',
  borderAccent:  'rgba(61,165,232,0.40)',

  // ── Accent: Sky Blue ──────────────────────────────────────────────────────
  accent:      '#3DA5E8',
  accentLight: '#6DC1F4',
  accentDark:  '#1F85CE',
  accentGlow:  'rgba(61,165,232,0.18)',

  // Aliases for legacy code that references "gold"
  gold:      '#3DA5E8',
  goldLight: '#6DC1F4',
  goldDark:  '#1F85CE',
  goldGlow:  'rgba(61,165,232,0.15)',

  // ── Status ────────────────────────────────────────────────────────────────
  success:      '#34D399',
  successLight: '#6EE7B7',
  successGlow:  'rgba(52,211,153,0.22)',
  error:        '#F87171',
  errorLight:   '#FCA5A5',
  errorGlow:    'rgba(248,113,113,0.18)',

  // ── Text ──────────────────────────────────────────────────────────────────
  text:          '#F0EDF8',
  textSecondary: 'rgba(220,215,245,0.72)',
  textMuted:     'rgba(175,170,205,0.45)',

  // ── Chess board ───────────────────────────────────────────────────────────
  boardLight:        '#D8D8D8',           // light gray squares
  boardDark:         '#1C1C1C',           // near-black dark squares
  boardSelected:     'rgba(200,200,200,0.35)',
  boardLastMove:     'rgba(200,200,200,0.14)',
  boardValidMove:    'rgba(160,160,160,0.72)',
  boardValidCapture: 'rgba(200,200,200,0.50)',
  boardCheck:        'rgba(248,113,113,0.72)',
  boardLabel:        'rgba(80,80,80,0.70)',

  // ── Pieces ────────────────────────────────────────────────────────────────
  pieceWhite: '#F8F8F8',
  pieceBlack: '#101010',
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
  sm: 10,
  md: 16,
  lg: 22,
  xl: 32,
  full: 9999,
} as const

// ── Typography ────────────────────────────────────────────────────────────────
// Headings → Georgia (serif, available on both iOS & Android)
// Body     → system default (SF Pro / Roboto — Google-Sans-like)
const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif'

export const typography = {
  // Serif / small-caps headings
  hero:        { fontSize: 38, fontWeight: '700' as const, fontFamily: serif, letterSpacing: 2 },
  h1:          { fontSize: 28, fontWeight: '700' as const, fontFamily: serif, letterSpacing: 1.5 },
  h2:          { fontSize: 22, fontWeight: '700' as const, fontFamily: serif, letterSpacing: 1 },
  h3:          { fontSize: 18, fontWeight: '600' as const, fontFamily: serif },

  // Sans-serif body
  body:        { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold:    { fontSize: 15, fontWeight: '600' as const },
  caption:     { fontSize: 13, fontWeight: '400' as const },
  captionBold: { fontSize: 13, fontWeight: '600' as const },
  label:       {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  mono: { fontSize: 15, fontFamily: 'monospace' as const },
} as const
