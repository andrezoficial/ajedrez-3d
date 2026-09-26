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
import { OnlineGame, generateRoomCode, type OnlineStatus } from "./online";
import {
  playCaptureSound,
  playCheckSound,
  playMoveSound,
  playSelectSound,
  playVictorySound,
  setAudioEnabled,
  unlockAudio,
} from "./audio";

export type Mode = "ai" | "pvp" | "online";
export type Screen = "menu" | "game";

type Store = {
  screen: Screen;
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
  onlineRoom: string | null;
  onlineColor: Side | null;
  onlineStatus: OnlineStatus;
  selectSquare: (sq: number) => void;
  playMove: (move: Move) => void;
  applyRemoteMove: (move: Move) => void;
  newGame: () => void;
  setMode: (mode: "ai" | "pvp") => void;
  setDifficulty: (n: number) => void;
  setSkin: (id: SkinId) => void;
  setAudio: (on: boolean) => void;
  setPhases: (on: boolean) => void;
  flipBoard: () => void;
  clearToast: () => void;
  startLocalGame: (mode: "ai" | "pvp") => void;
  startOnlineHost: () => string;
  joinOnlineRoom: (code: string) => void;
  returnToMenu: () => void;
};

let aiTimer: ReturnType<typeof setTimeout> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let onlineGame: OnlineGame | null = null;

function scheduleToast(set: (p: Partial<Store>) => void, message: string) {
  if (toastTimer) clearTimeout(toastTimer);
  set({ toast: message });
  toastTimer = setTimeout(() => set({ toast: null }), 1600);
}

function freshGameProps() {
  return {
    state: createInitialState(),
    selected: null,
    legal: [],
    thinking: false,
    lastCapture: null,
  } satisfies Partial<Store>;
}

function teardownOnline() {
  onlineGame?.close();
  onlineGame = null;
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

/** Shared by local and remote-applied moves: board update, sounds, toast. */
function commitMove(get: () => Store, set: (p: Partial<Store>) => void, move: Move) {
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
}

function setupOnlineGame(
  get: () => Store,
  set: (p: Partial<Store>) => void,
  room: string,
  color: Side,
) {
  teardownOnline();
  onlineGame = new OnlineGame(room, {
    onStatusChange: (status) => {
      set({ onlineStatus: status });
      // The host is the source of truth for a peer that just joined: push the
      // current board so a rejoin (or a slow initial connect) always syncs.
      if (status === "connected" && get().onlineColor === "w") {
        onlineGame?.send({ type: "sync", state: get().state, phases: get().phases });
      }
    },
    onMessage: (message) => {
      if (message.type === "move") {
        get().applyRemoteMove(message.move);
      } else if (message.type === "sync") {
        setPhasesEnabled(message.phases);
        set({ state: message.state, phases: message.phases, selected: null, legal: [] });
      } else if (message.type === "newGame") {
        resetEclipse();
        set(freshGameProps());
        scheduleToast(set, "Nueva partida");
      }
    },
  });
  onlineGame.connect();
  resetEclipse();
  set({
    ...freshGameProps(),
    screen: "game",
    mode: "online",
    onlineRoom: room,
    onlineColor: color,
    onlineStatus: "connecting",
    flipped: color === "b",
  });
}

export const useGame = create<Store>((set, get) => ({
  screen: "menu",
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
  onlineRoom: null,
  onlineColor: null,
  onlineStatus: "idle",

  selectSquare: (sq) => {
    unlockAudio();
    const { state, selected, legal, mode, thinking, onlineColor, onlineStatus } = get();
    const status = getGameStatus(state);
    if (status.isOver || thinking) return;
    if (mode === "ai" && state.turn === "b") return;
    if (mode === "online" && (onlineStatus !== "connected" || state.turn !== onlineColor)) return;

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
    commitMove(get, set, move);
    if (get().mode === "online") onlineGame?.send({ type: "move", move });
    triggerAi(get, set);
  },

  // Applied when the move arrives from the remote peer — no re-broadcast, no AI.
  applyRemoteMove: (move) => {
    commitMove(get, set, move);
  },

  newGame: () => {
    if (aiTimer) clearTimeout(aiTimer);
    resetEclipse();
    set(freshGameProps());
    scheduleToast(set, "Nueva partida");
    if (get().mode === "online") onlineGame?.send({ type: "newGame" });
  },

  setMode: (mode) => {
    teardownOnline();
    set({ mode, onlineRoom: null, onlineColor: null, onlineStatus: "idle" });
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

  startLocalGame: (localMode) => {
    teardownOnline();
    resetEclipse();
    set({
      ...freshGameProps(),
      screen: "game",
      mode: localMode,
      onlineRoom: null,
      onlineColor: null,
      onlineStatus: "idle",
    });
  },
  startOnlineHost: () => {
    const code = generateRoomCode();
    setupOnlineGame(get, set, code, "w");
    return code;
  },
  joinOnlineRoom: (code) => {
    setupOnlineGame(get, set, code.trim().toUpperCase(), "b");
  },
  returnToMenu: () => {
    teardownOnline();
    resetEclipse();
    set({
      ...freshGameProps(),
      screen: "menu",
      mode: "ai",
      onlineRoom: null,
      onlineColor: null,
      onlineStatus: "idle",
    });
  },
}));

export { getAllLegalMoves, arePhasesEnabled };
