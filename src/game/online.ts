import { P2PRoom, type PeerInfo } from "@/lib/multiplayer";
import type { GameState, Move } from "./chess";

export type OnlineStatus = "idle" | "connecting" | "waiting" | "connected" | "disconnected";

export type OnlineMessage =
  | { type: "move"; move: Move }
  | { type: "sync"; state: GameState; phases: boolean }
  | { type: "newGame" };

export interface OnlineCallbacks {
  onStatusChange: (status: OnlineStatus) => void;
  onMessage: (message: OnlineMessage) => void;
}

// Excludes 0/O/1/I so a spoken-out-loud or handwritten code never round-trips wrong.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function makeSelfId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/**
 * Thin wrapper around P2PRoom for the two-player chess case: one remote peer
 * max, JSON chess messages instead of raw data. Kept out of the zustand store
 * itself (like the AI/toast timers) since it isn't serializable state.
 */
export class OnlineGame {
  readonly selfId = makeSelfId();
  readonly room: string;
  private p2p: P2PRoom | null = null;
  private readonly callbacks: OnlineCallbacks;
  private hasPeer = false;

  constructor(room: string, callbacks: OnlineCallbacks) {
    this.room = room;
    this.callbacks = callbacks;
  }

  connect(): void {
    this.callbacks.onStatusChange("connecting");
    this.p2p = new P2PRoom({
      // Namespaced so this game's rooms never collide with another app on
      // the same signaling relay / room-code space.
      room: `ajedrez3d-eclipse-eterno-${this.room}`,
      selfId: this.selfId,
      name: "Jugador",
      onConnected: () => {
        if (!this.hasPeer) this.callbacks.onStatusChange("waiting");
      },
      onPeersChanged: (peers) => this.handlePeers(peers),
      onMessage: (_from, data) => this.callbacks.onMessage(data as OnlineMessage),
    });
    void this.p2p.join();
  }

  private handlePeers(peers: PeerInfo[]): void {
    const connected = peers.some((p) => p.connectionState === "connected");
    if (connected && !this.hasPeer) {
      this.hasPeer = true;
      this.callbacks.onStatusChange("connected");
    } else if (!connected && this.hasPeer) {
      this.hasPeer = false;
      this.callbacks.onStatusChange("disconnected");
    }
  }

  send(message: OnlineMessage): void {
    this.p2p?.send(message);
  }

  close(): void {
    this.p2p?.close();
    this.p2p = null;
  }
}
