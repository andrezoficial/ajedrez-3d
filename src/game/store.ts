import { create } from "zustand";
import {
  applyMove,
  arePhasesEnabled,
  chooseAiMove,
  createInitialState,
  getAllLegalMoves,
  getCurrentPhase,
  getGameStatus,
  getLegalMoves,
  type GameState,
  type Move,
  type Side,
  resetEclipse,
  setPhasesEnabled,
  advanceEclipse,
} from "./chess";
import type { SkinId } from "./skins";
import {
  playCaptureSound,
  playCheckSound,
  playMoveSound,
  playSelectSound,
  playVictorySound,
  setAudioEnabled,
  unlockAudio,
} from "./audio";

export type Mode = "ai" | "pvp";

type Store = {
  state: GameState;
  selected: number | null;
  legal: Move[];
  mode: Mode;
  difficulty: number;
  skin: SkinId;
  audio: boolean;
  phases: boolean;
  flipped: boolean;
  thinking: boolean;
  toast: string | null;
  lastCapture: { square: number; side: Side } | null;
  selectSquare: (sq: number) => void;
  playMove: (move: Move) => void;
  newGame: () => void;
  setMode: (mode: Mode) => void;
  setDifficulty: (n: number) => void;
  setSkin: (id: SkinId) => void;
  setAudio: (on: boolean) => void;
  setPhases: (on: boolean) => void;
  flipBoard: () => void;
  clearToast: () => void;
};

let aiTimer: ReturnType<typeof setTimeout> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleToast(set: (p: Partial<Store>) => void, message: string) {
  if (toastTimer) clearTimeout(toastTimer);
  set({ toast: message });
  toastTimer = setTimeout(() => set({ toast: null }), 1600);
}

function triggerAi(get: () => Store, set: (p: Partial<Store>) => void) {
  if (aiTimer) clearTimeout(aiTimer);
  const { mode, state, difficulty } = get();
  if (mode !== "ai" || state.turn !== "b") return;
  if (getGameStatus(state).isOver) return;
  set({ thinking: true });
  aiTimer = setTimeout(() => {
    const current = get().state;
    if (current.turn !== "b" || get().mode !== "ai") {
      set({ thinking: false });
      return;
    }
    const depth = difficulty + 1;
    const move = chooseAiMove(current, depth, getCurrentPhase());
    set({ thinking: false });
    if (move) get().playMove(move);
  }, 280);
}

export const useGame = create<Store>((set, get) => ({
  state: createInitialState(),
  selected: null,
  legal: [],
  mode: "ai",
  difficulty: 2,
  skin: "gold_silver",
  audio: true,
  phases: false,
  flipped: false,
  thinking: false,
  toast: null,
  lastCapture: null,

  selectSquare: (sq) => {
    unlockAudio();
    const { state, selected, legal, mode, thinking } = get();
    const status = getGameStatus(state);
    if (status.isOver || thinking) return;
    if (mode === "ai" && state.turn === "b") return;

    if (selected !== null) {
      const move = legal.find((m) => m.to === sq);
      if (move) {
        get().playMove(move);
        return;
      }
    }

    const piece = state.board[sq];
    if (piece && piece[0] === state.turn) {
      playSelectSound();
      set({ selected: sq, legal: getLegalMoves(state, sq) });
    } else {
      set({ selected: null, legal: [] });
    }
  },

  playMove: (move) => {
    const { state } = get();
    const before = state.board;
    let capturedSquare: number | null = null;
    let capturedSide: Side | null = null;
    if (move.isEnPassant) {
      capturedSquare = (move.to % 8) + Math.floor(move.from / 8) * 8;
      capturedSide = (before[capturedSquare]?.[0] as Side) ?? null;
    } else if (before[move.to]) {
      capturedSquare = move.to;
      capturedSide = before[move.to]![0] as Side;
    }

    const next = applyMove(state, move.isPromotion ? { ...move, promotionPiece: "Q" } : move);
    advanceEclipse();
    const status = getGameStatus(next);
    playMoveSound();
    if (capturedSide) playCaptureSound();
    if (status.isOver) playVictorySound();
    else if (status.inCheck) playCheckSound();

    set({
      state: next,
      selected: null,
      legal: [],
      lastCapture:
        capturedSquare !== null && capturedSide
          ? { square: capturedSquare, side: capturedSide }
          : null,
    });
    scheduleToast(
      set,
      status.isOver
        ? status.result
        : capturedSide
          ? "Captura · energía liberada"
          : status.inCheck
            ? "Jaque"
            : "Movimiento ejecutado",
    );
    triggerAi(get, set);
  },

  newGame: () => {
    if (aiTimer) clearTimeout(aiTimer);
    resetEclipse();
    set({
      state: createInitialState(),
      selected: null,
      legal: [],
      thinking: false,
      lastCapture: null,
    });
    scheduleToast(set, "Nueva partida");
  },

  setMode: (mode) => {
    set({ mode });
    get().newGame();
  },
  setDifficulty: (n) => set({ difficulty: n }),
  setSkin: (id) => set({ skin: id }),
  setAudio: (on) => {
    set({ audio: on });
    setAudioEnabled(on);
  },
  setPhases: (on) => {
    setPhasesEnabled(on);
    set({ phases: on });
  },
  flipBoard: () => set({ flipped: !get().flipped }),
  clearToast: () => set({ toast: null }),
}));

export { getAllLegalMoves, arePhasesEnabled };
