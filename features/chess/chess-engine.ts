/**
 * Thin helpers around chess.js.
 * All validation, move generation, and game-state detection
 * is delegated entirely to chess.js — no custom logic.
 */
import { Chess, Square, Color, PieceSymbol } from 'chess.js'

export type PieceData = { type: PieceSymbol; color: Color; square: Square } | null
export type BoardData = PieceData[][]

/** Unicode chess pieces keyed by [color][pieceType]. */
export const PIECE_UNICODE: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
}

/**
 * Converts a visual display cell (row 0 = top) into its chess square name.
 * flipped = black player is viewing from the bottom.
 */
export function getSquareName(row: number, col: number, flipped: boolean): Square {
  const file = flipped
    ? String.fromCharCode('h'.charCodeAt(0) - col)
    : String.fromCharCode('a'.charCodeAt(0) + col)
  const rank = flipped ? row + 1 : 8 - row
  return `${file}${rank}` as Square
}

/**
 * Reads the piece at a display cell from chess.js board() output.
 * chess.js board()[0][0] is always the a8 square.
 */
export function getPieceAtDisplay(
  board: BoardData,
  row: number,
  col: number,
  flipped: boolean,
): PieceData {
  const br = flipped ? 7 - row : row
  const bc = flipped ? 7 - col : col
  return board[br]?.[bc] ?? null
}

/** Returns all valid target squares for a piece on `from`, using chess.js. */
export function getValidTargets(fen: string, from: Square): Square[] {
  const game = new Chess(fen)
  return game.moves({ square: from, verbose: true }).map((m) => m.to)
}

/** Returns the king's square if it is currently in check, otherwise null. */
export function getCheckedKingSquare(fen: string): Square | null {
  const game = new Chess(fen)
  if (!game.inCheck()) return null
  const turn = game.turn()
  for (const row of game.board()) {
    for (const piece of row) {
      if (piece && piece.type === 'k' && piece.color === turn) return piece.square
    }
  }
  return null
}

/** Coordinate label arrays, accounting for board orientation. */
export function getBoardLabels(flipped: boolean): { files: string[]; ranks: string[] } {
  return {
    files: flipped
      ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
      : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ranks: flipped
      ? ['1', '2', '3', '4', '5', '6', '7', '8']
      : ['8', '7', '6', '5', '4', '3', '2', '1'],
  }
}
