import React, { useCallback, useMemo, memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Chess, Square } from 'chess.js'
import {
  PIECE_UNICODE,
  getSquareName,
  getPieceAtDisplay,
  getCheckedKingSquare,
  getBoardLabels,
  BoardData,
  PieceData,
} from './chess-engine'
import { colors, BOARD_SIZE, SQUARE_SIZE, PIECE_FONT_SIZE } from '@/constants/theme'

interface ChessBoardProps {
  fen: string
  playerColor: 'w' | 'b'
  selectedSquare: Square | null
  validTargets: Square[]
  lastMove: { from: string; to: string } | null
  onSquarePress: (square: Square) => void
  disabled?: boolean
}

// ── Memoized Square Component to prevent 64 re-renders ──────────────────────
interface SquareCellProps {
  square: Square
  piece: PieceData
  isLight: boolean
  isSelected: boolean
  isLastFrom: boolean
  isLastTo: boolean
  isValidTarget: boolean
  isInCheck: boolean
  showRankLabel: boolean
  showFileLabel: boolean
  rankLabel: string
  fileLabel: string
  onPress: (square: Square) => void
}

const SquareCell = memo(({
  square, piece, isLight, isSelected, isLastFrom, isLastTo, isValidTarget,
  isInCheck, showRankLabel, showFileLabel, rankLabel, fileLabel, onPress,
}: SquareCellProps) => {
  const isCapture = isValidTarget && piece !== null
  const squareBg = isLight ? colors.boardLight : colors.boardDark

  return (
    <TouchableOpacity
      style={[styles.square, { backgroundColor: squareBg }]}
      onPress={() => onPress(square)}
      activeOpacity={0.85}
    >
      {/* Highlight layers */}
      {(isLastFrom || isLastTo) && !isSelected && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.boardLastMove }]} />
      )}
      {isInCheck && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.boardCheck }]} />
      )}
      {isSelected && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.boardSelected }]} />
      )}

      {/* Valid move dot */}
      {isValidTarget && !isCapture && <View style={styles.moveDot} />}
      {/* Capture ring */}
      {isCapture && <View style={styles.captureRing} />}

      {/* Chess piece — heavy 3D drop shadow for depth */}
      {piece && (
        <Text
          style={[
            styles.piece,
            piece.color === 'w' ? styles.pieceWhite : styles.pieceBlack,
          ]}
          allowFontScaling={false}
        >
          {PIECE_UNICODE[piece.color][piece.type]}
        </Text>
      )}

      {/* Board coordinates — subtle, square-color adaptive */}
      {showRankLabel && (
        <Text
          style={[
            styles.rankLabel,
            { color: isLight ? colors.boardDark : colors.boardLight },
          ]}
        >
          {rankLabel}
        </Text>
      )}
      {showFileLabel && (
        <Text
          style={[
            styles.fileLabel,
            { color: isLight ? colors.boardDark : colors.boardLight },
          ]}
        >
          {fileLabel}
        </Text>
      )}
    </TouchableOpacity>
  )
})

export function ChessBoard({
  fen,
  playerColor,
  selectedSquare,
  validTargets,
  lastMove,
  onSquarePress,
  disabled = false,
}: ChessBoardProps) {
  const flipped = playerColor === 'b'

  // Memoize heavy engine parsing so it only fires when the underlying FEN changes
  const boardData = useMemo(() => {
    const game = new Chess(fen)
    return {
      board: game.board() as BoardData,
      checkedKing: getCheckedKingSquare(fen),
    }
  }, [fen])

  const { files, ranks } = useMemo(() => getBoardLabels(flipped), [flipped])

  const handlePress = useCallback(
    (square: Square) => { if (!disabled) onSquarePress(square) },
    [disabled, onSquarePress],
  )

  return (
    <View style={styles.container}>
      {Array.from({ length: 8 }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: 8 }, (_, col) => {
            const square = getSquareName(row, col, flipped)
            const piece = getPieceAtDisplay(boardData.board, row, col, flipped)

            return (
              <SquareCell
                key={square}
                square={square}
                piece={piece}
                isLight={(row + col) % 2 === 1}
                isSelected={selectedSquare === square}
                isLastFrom={lastMove?.from === square}
                isLastTo={lastMove?.to === square}
                isValidTarget={validTargets.includes(square)}
                isInCheck={boardData.checkedKing === square}
                showRankLabel={col === 0}
                showFileLabel={row === 7}
                rankLabel={ranks[row]}
                fileLabel={files[col]}
                onPress={handlePress}
              />
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // White piece — heavy 3D drop shadow
  piece: {
    fontSize: PIECE_FONT_SIZE,
    includeFontPadding: false,
    lineHeight: SQUARE_SIZE * 0.92,
  },
  pieceWhite: {
    color: colors.pieceWhite,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 1, height: 5 },
    textShadowRadius: 8,
  },
  pieceBlack: {
    color: colors.pieceBlack,
    textShadowColor: 'rgba(255,255,255,0.15)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 6,
  },

  moveDot: {
    position: 'absolute',
    width: SQUARE_SIZE * 0.30,
    height: SQUARE_SIZE * 0.30,
    borderRadius: SQUARE_SIZE * 0.15,
    backgroundColor: colors.boardValidMove,
  },
  captureRing: {
    position: 'absolute',
    width: SQUARE_SIZE - 4,
    height: SQUARE_SIZE - 4,
    borderRadius: (SQUARE_SIZE - 4) / 2,
    borderWidth: 4,
    borderColor: colors.boardValidCapture,
  },
  rankLabel: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    lineHeight: 11,
    opacity: 0.65,
  },
  fileLabel: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    lineHeight: 11,
    opacity: 0.65,
  },
})
