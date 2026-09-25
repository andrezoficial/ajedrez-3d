export type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";
export type Side = "w" | "b";
export type PieceCode = `${Side}${PieceType}`;

export type Move = {
  from: number;
  to: number;
  isCapture?: boolean;
  isEnPassant?: boolean;
  isDoubleStep?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
  castleSide?: "K" | "Q";
};

export type GameState = {
  board: (PieceCode | null)[];
  turn: Side;
  castlingRights: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
  enPassantSquare: number | null;
  lastMove: { from: number; to: number } | null;
  halfmove: number;
};

export const PIECE_VALUES: Record<PieceType, number> = {
  K: 0,
  Q: 9,
  R: 5,
  B: 3,
  N: 3,
  P: 1,
};

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function squareIndex(file: number, rank: number) {
  return rank * 8 + file;
}
export function fileOf(index: number) {
  return index % 8;
}
export function rankOf(index: number) {
  return Math.floor(index / 8);
}
export function isInBounds(file: number, rank: number) {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}
export function opponentColor(color: Side): Side {
  return color === "w" ? "b" : "w";
}
export function squareName(index: number) {
  return `${FILES[fileOf(index)]}${8 - rankOf(index)}`;
}

export function createInitialBoard(): (PieceCode | null)[] {
  const board: (PieceCode | null)[] = Array(64).fill(null);
  const back: PieceType[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let file = 0; file < 8; file++) {
    board[squareIndex(file, 0)] = `b${back[file]}`;
    board[squareIndex(file, 1)] = "bP";
    board[squareIndex(file, 6)] = "wP";
    board[squareIndex(file, 7)] = `w${back[file]}`;
  }
  return board;
}

export function createInitialState(): GameState {
  return {
    board: createInitialBoard(),
    turn: "w",
    castlingRights: { wK: true, wQ: true, bK: true, bQ: true },
    enPassantSquare: null,
    lastMove: null,
    halfmove: 0,
  };
}

export function cloneState(state: GameState): GameState {
  return {
    board: state.board.slice(),
    turn: state.turn,
    castlingRights: { ...state.castlingRights },
    enPassantSquare: state.enPassantSquare,
    lastMove: state.lastMove ? { ...state.lastMove } : null,
    halfmove: state.halfmove,
  };
}

export function applyMove(state: GameState, move: Move): GameState {
  const next = cloneState(state);
  const board = next.board;
  const piece = board[move.from];
  if (!piece) return next;

  const color = piece[0] as Side;
  next.enPassantSquare = null;

  if (move.isEnPassant) {
    board[squareIndex(fileOf(move.to), rankOf(move.from))] = null;
  }

  board[move.to] = piece;
  board[move.from] = null;

  if (move.isDoubleStep) {
    next.enPassantSquare = squareIndex(
      fileOf(move.from),
      (rankOf(move.from) + rankOf(move.to)) / 2,
    );
  }

  if (move.isPromotion) board[move.to] = `${color}${move.promotionPiece ?? "Q"}`;

  if (move.castleSide) {
    const homeRank = rankOf(move.from);
    if (move.castleSide === "K") {
      board[squareIndex(5, homeRank)] = board[squareIndex(7, homeRank)];
      board[squareIndex(7, homeRank)] = null;
    } else {
      board[squareIndex(3, homeRank)] = board[squareIndex(0, homeRank)];
      board[squareIndex(0, homeRank)] = null;
    }
  }

  if (piece[1] === "K") {
    next.castlingRights[`${color}K`] = false;
    next.castlingRights[`${color}Q`] = false;
  }
  if (piece[1] === "R") {
    const homeRank = color === "w" ? 7 : 0;
    if (move.from === squareIndex(0, homeRank)) next.castlingRights[`${color}Q`] = false;
    if (move.from === squareIndex(7, homeRank)) next.castlingRights[`${color}K`] = false;
  }

  const captured = move.isEnPassant ? null : state.board[move.to];
  if (captured && captured[1] === "R") {
    const capColor = captured[0] as Side;
    const homeRank = capColor === "w" ? 7 : 0;
    if (move.to === squareIndex(0, homeRank)) next.castlingRights[`${capColor}Q`] = false;
    if (move.to === squareIndex(7, homeRank)) next.castlingRights[`${capColor}K`] = false;
  }

  next.turn = opponentColor(color);
  next.lastMove = { from: move.from, to: move.to };
  next.halfmove = state.halfmove + 1;
  return next;
}

const DIRECTIONS: Record<"R" | "B" | "Q" | "N" | "K", [number, number][]> = {
  R: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
  B: [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
  Q: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
  N: [
    [1, 2],
    [2, 1],
    [-1, 2],
    [-2, 1],
    [1, -2],
    [2, -1],
    [-1, -2],
    [-2, -1],
  ],
  K: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
};

export function findKingSquare(board: (PieceCode | null)[], color: Side) {
  return board.findIndex((p) => p === `${color}K`);
}

export function isSquareAttackedBy(
  board: (PieceCode | null)[],
  targetSquare: number,
  attackerColor: Side,
) {
  if (targetSquare < 0) return false;
  const file = fileOf(targetSquare);
  const rank = rankOf(targetSquare);
  const pawnDirection = attackerColor === "w" ? 1 : -1;

  for (const df of [-1, 1]) {
    const f = file + df;
    const r = rank + pawnDirection;
    if (isInBounds(f, r) && board[squareIndex(f, r)] === `${attackerColor}P`) return true;
  }

  for (const [df, dr] of DIRECTIONS.N) {
    const f = file + df;
    const r = rank + dr;
    if (isInBounds(f, r) && board[squareIndex(f, r)] === `${attackerColor}N`) return true;
  }

  for (const [df, dr] of DIRECTIONS.K) {
    const f = file + df;
    const r = rank + dr;
    if (isInBounds(f, r) && board[squareIndex(f, r)] === `${attackerColor}K`) return true;
  }

  for (const [df, dr] of DIRECTIONS.B) {
    let f = file + df;
    let r = rank + dr;
    while (isInBounds(f, r)) {
      const p = board[squareIndex(f, r)];
      if (p) {
        if (p[0] === attackerColor && (p[1] === "B" || p[1] === "Q")) return true;
        break;
      }
      f += df;
      r += dr;
    }
  }

  for (const [df, dr] of DIRECTIONS.R) {
    let f = file + df;
    let r = rank + dr;
    while (isInBounds(f, r)) {
      const p = board[squareIndex(f, r)];
      if (p) {
        if (p[0] === attackerColor && (p[1] === "R" || p[1] === "Q")) return true;
        break;
      }
      f += df;
      r += dr;
    }
  }
  return false;
}

export function generatePseudoLegalMoves(state: GameState, fromSquare: number): Move[] {
  const board = state.board;
  const piece = board[fromSquare];
  if (!piece) return [];
  const color = piece[0] as Side;
  const type = piece[1] as PieceType;
  const file = fileOf(fromSquare);
  const rank = rankOf(fromSquare);
  const moves: Move[] = [];

  if (type === "P") {
    const direction = color === "w" ? -1 : 1;
    const startRank = color === "w" ? 6 : 1;
    const promotionRank = color === "w" ? 0 : 7;
    const oneRank = rank + direction;
    if (isInBounds(file, oneRank)) {
      const one = squareIndex(file, oneRank);
      if (!board[one]) {
        moves.push({ from: fromSquare, to: one, isPromotion: oneRank === promotionRank });
        const two = squareIndex(file, rank + 2 * direction);
        if (rank === startRank && !board[two]) {
          moves.push({ from: fromSquare, to: two, isDoubleStep: true });
        }
      }
      for (const df of [-1, 1]) {
        const f = file + df;
        const r = rank + direction;
        if (!isInBounds(f, r)) continue;
        const target = squareIndex(f, r);
        if (board[target] && board[target]![0] !== color) {
          moves.push({
            from: fromSquare,
            to: target,
            isPromotion: r === promotionRank,
            isCapture: true,
          });
        } else if (!board[target] && state.enPassantSquare === target) {
          moves.push({ from: fromSquare, to: target, isEnPassant: true, isCapture: true });
        }
      }
    }
  } else if (type === "N" || type === "K") {
    for (const [df, dr] of DIRECTIONS[type]) {
      const f = file + df;
      const r = rank + dr;
      if (!isInBounds(f, r)) continue;
      const target = squareIndex(f, r);
      const targetPiece = board[target];
      if (!targetPiece || targetPiece[0] !== color) {
        moves.push({ from: fromSquare, to: target, isCapture: !!targetPiece });
      }
    }

    if (type === "K") {
      const homeRank = color === "w" ? 7 : 0;
      const enemy = opponentColor(color);
      if (fromSquare === squareIndex(4, homeRank)) {
        if (
          state.castlingRights[`${color}K`] &&
          !board[squareIndex(5, homeRank)] &&
          !board[squareIndex(6, homeRank)] &&
          !isSquareAttackedBy(board, squareIndex(4, homeRank), enemy) &&
          !isSquareAttackedBy(board, squareIndex(5, homeRank), enemy) &&
          !isSquareAttackedBy(board, squareIndex(6, homeRank), enemy) &&
          board[squareIndex(7, homeRank)] === `${color}R`
        ) {
          moves.push({ from: fromSquare, to: squareIndex(6, homeRank), castleSide: "K" });
        }

        if (
          state.castlingRights[`${color}Q`] &&
          !board[squareIndex(3, homeRank)] &&
          !board[squareIndex(2, homeRank)] &&
          !board[squareIndex(1, homeRank)] &&
          !isSquareAttackedBy(board, squareIndex(4, homeRank), enemy) &&
          !isSquareAttackedBy(board, squareIndex(3, homeRank), enemy) &&
          !isSquareAttackedBy(board, squareIndex(2, homeRank), enemy) &&
          board[squareIndex(0, homeRank)] === `${color}R`
        ) {
          moves.push({ from: fromSquare, to: squareIndex(2, homeRank), castleSide: "Q" });
        }
      }
    }
  } else {
    for (const [df, dr] of DIRECTIONS[type]) {
      let f = file + df;
      let r = rank + dr;
      while (isInBounds(f, r)) {
        const target = squareIndex(f, r);
        const targetPiece = board[target];
        if (!targetPiece) moves.push({ from: fromSquare, to: target });
        else {
          if (targetPiece[0] !== color) {
            moves.push({ from: fromSquare, to: target, isCapture: true });
          }
          break;
        }
        f += df;
        r += dr;
      }
    }
  }
  return moves;
}

export function getLegalMoves(state: GameState, fromSquare: number): Move[] {
  const piece = state.board[fromSquare];
  if (!piece || piece[0] !== state.turn) return [];
  return generatePseudoLegalMoves(state, fromSquare).filter((move) => {
    const trial = move.isPromotion ? { ...move, promotionPiece: "Q" as const } : move;
    const next = applyMove(state, trial);
    const king = findKingSquare(next.board, piece[0] as Side);
    return king >= 0 && !isSquareAttackedBy(next.board, king, opponentColor(piece[0] as Side));
  });
}

export function getAllLegalMoves(state: GameState, color: Side = state.turn): Move[] {
  const working = { ...state, turn: color };
  const moves: Move[] = [];
  for (let i = 0; i < 64; i++) {
    if (working.board[i]?.[0] === color) moves.push(...getLegalMoves(working, i));
  }
  return moves;
}

export function isKingInCheck(state: GameState, color: Side) {
  const king = findKingSquare(state.board, color);
  return king >= 0 && isSquareAttackedBy(state.board, king, opponentColor(color));
}

export type GameStatus =
  | { isOver: false; inCheck: boolean }
  | { isOver: true; inCheck: true; result: string; winner: Side }
  | { isOver: true; inCheck: false; result: string; winner: null };

export function getGameStatus(state: GameState): GameStatus {
  const inCheck = isKingInCheck(state, state.turn);
  const moves = getAllLegalMoves(state, state.turn);
  if (!moves.length) {
    if (inCheck) {
      const winner = opponentColor(state.turn);
      return {
        isOver: true,
        inCheck: true,
        winner,
        result: winner === "w" ? "Gana el Sol por mate" : "Gana la Luna por mate",
      };
    }
    return { isOver: true, inCheck: false, winner: null, result: "Tablas por ahogado" };
  }
  return { isOver: false, inCheck };
}

const PST: Record<PieceType, number[]> = {
  P: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10,
    25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10,
    10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  N: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0,
    -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  B: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10,
    5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  R: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
    0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5,
    0, 0, 0,
  ],
  Q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0,
    5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  K: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50,
    -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

function pstIndex(square: number, color: Side) {
  const file = fileOf(square);
  const rank = rankOf(square);
  // Rank 0 is black's back rank (chess rank 8, PST row 0). White uses rank as-is;
  // black mirrors so their back rank maps to the same PST row as white's.
  const visualRank = color === "w" ? rank : 7 - rank;
  return visualRank * 8 + file;
}

export function evaluateBoard(board: (PieceCode | null)[], phase: "sun" | "moon" | null) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (!piece) continue;
    const color = piece[0] as Side;
    const type = piece[1] as PieceType;
    const sign = color === "w" ? 1 : -1;
    score += sign * (PIECE_VALUES[type] * 100 + PST[type][pstIndex(i, color)]);
  }
  if (phase === "sun") score += 40;
  if (phase === "moon") score -= 40;
  return score;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  phase: "sun" | "moon" | null,
  nodes: { n: number },
): number {
  if (nodes.n++ > 18000) return evaluateBoard(state.board, phase);
  const status = getGameStatus(state);
  if (depth === 0 || status.isOver) {
    if (status.isOver) {
      if (status.winner === "w") return 20000 - (8 - depth);
      if (status.winner === "b") return -20000 + (8 - depth);
      return 0;
    }
    return evaluateBoard(state.board, phase);
  }

  const moves = getAllLegalMoves(state, state.turn);
  moves.sort((a, b) => Number(b.isCapture) - Number(a.isCapture));

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const next = applyMove(state, move.isPromotion ? { ...move, promotionPiece: "Q" } : move);
      best = Math.max(best, minimax(next, depth - 1, alpha, beta, false, phase, nodes));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = applyMove(state, move.isPromotion ? { ...move, promotionPiece: "Q" } : move);
    best = Math.min(best, minimax(next, depth - 1, alpha, beta, true, phase, nodes));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

export function chooseAiMove(
  state: GameState,
  depth: number,
  phase: "sun" | "moon" | null,
): Move | null {
  const moves = getAllLegalMoves(state, state.turn);
  if (!moves.length) return null;
  const white = state.turn === "w";
  let bestMove: Move | null = null;
  let bestScore = white ? -Infinity : Infinity;
  const ordered = [...moves].sort((a, b) => Number(b.isCapture) - Number(a.isCapture));
  const nodes = { n: 0 };

  for (const move of ordered) {
    const next = applyMove(state, move.isPromotion ? { ...move, promotionPiece: "Q" } : move);
    const score = minimax(next, Math.max(0, depth - 1), -Infinity, Infinity, !white, phase, nodes);
    const better = white ? score > bestScore : score < bestScore;
    if (better || (score === bestScore && Math.random() < 0.2)) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

let phasesEnabled = false;
let eclipseHalfmove = 0;

export function setPhasesEnabled(value: boolean) {
  phasesEnabled = !!value;
}
export function resetEclipse() {
  eclipseHalfmove = 0;
}
export function advanceEclipse() {
  eclipseHalfmove++;
}
export function getCurrentPhase(): "sun" | "moon" | null {
  if (!phasesEnabled) return null;
  return Math.floor(eclipseHalfmove / 5) % 2 === 0 ? "sun" : "moon";
}
export function getPhaseTurnsLeft() {
  return 5 - (eclipseHalfmove % 5);
}
export function arePhasesEnabled() {
  return phasesEnabled;
}

export function materialOf(board: (PieceCode | null)[], color: Side) {
  let total = 0;
  for (const p of board) {
    if (p && p[0] === color) total += PIECE_VALUES[p[1] as PieceType];
  }
  return total;
}
