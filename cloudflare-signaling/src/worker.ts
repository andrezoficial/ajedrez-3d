/**
 * WebRTC signaling relay for "Eclipse Eterno", running on Cloudflare Workers +
 * Durable Objects instead of Postgres. One Durable Object instance per room
 * code holds that room's tiny bit of state (peer roster + pending SDP/ICE
 * signals) — no database needed. Game moves never pass through here; only
 * rendezvous traffic while the WebRTC mesh forms.
 *
 * Wire contract (must match src/lib/multiplayer/p2p.ts on the app side):
 *   GET  /?room&peer&name&since  -> { peers: [{id,name}], signals: [{id,from,kind,payload}] }
 *   POST /  { op: "signal", room, from, to, kind, payload } -> { ok: true }
 *   POST /  { op: "leave", room, peer }                     -> { ok: true }
 */

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const PEER_TTL_MS = 30_000;
const SIGNAL_TTL_MS = 60_000;
const MAX_PAYLOAD_CHARS = 32_768;

export interface Env {
  RTC_ROOM: DurableObjectNamespace;
  /** Optional: comma-separated list of allowed browser origins. Defaults to "*". */
  ALLOWED_ORIGIN?: string;
}

function corsHeaders(env: Env, request: Request): Record<string, string> {
  const allowed = env.ALLOWED_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean);
  const origin = request.headers.get("origin") ?? "";
  const allowOrigin = !allowed?.length ? "*" : allowed.includes(origin) ? origin : allowed[0];
  return {
    "access-control-allow-origin": allowOrigin,
    "vary": "origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(env, request);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    let room: string | null = null;
    let forward = request;

    if (request.method === "GET") {
      room = url.searchParams.get("room");
    } else if (request.method === "POST") {
      let body: unknown;
      try {
        body = await request.clone().json();
      } catch {
        return json({ error: "invalid JSON" }, 400, cors);
      }
      room = typeof (body as { room?: unknown })?.room === "string" ? (body as { room: string }).room : null;
      forward = new Request(request.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      return json({ error: "method not allowed" }, 405, cors);
    }

    if (!room || !ID_RE.test(room)) return json({ error: "invalid room" }, 400, cors);

    const stub = env.RTC_ROOM.get(env.RTC_ROOM.idFromName(room));
    const res = await stub.fetch(forward);
    const merged = new Headers(res.headers);
    for (const [k, v] of Object.entries(cors)) merged.set(k, v);
    return new Response(res.body, { status: res.status, headers: merged });
  },
};

interface PeerState {
  name: string;
  lastSeen: number;
}
interface SignalState {
  id: number;
  to: string;
  from: string;
  kind: "offer" | "answer" | "ice";
  payload: unknown;
  createdAt: number;
}
interface Snapshot {
  peers: [string, PeerState][];
  signals: SignalState[];
  nextId: number;
}

/** One instance per room (via idFromName), created lazily on first request. */
export class RtcRoom {
  private readonly state: DurableObjectState;
  private peers = new Map<string, PeerState>();
  private signals: SignalState[] = [];
  private nextId = 1;
  private loaded = false;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const stored = await this.state.storage.get<Snapshot>("room");
    if (stored) {
      this.peers = new Map(stored.peers);
      this.signals = stored.signals;
      this.nextId = stored.nextId;
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    const snapshot: Snapshot = {
      peers: [...this.peers.entries()],
      signals: this.signals,
      nextId: this.nextId,
    };
    await this.state.storage.put("room", snapshot);
  }

  /** Rides the polls (like the Postgres version) instead of a cron/alarm. */
  private prune(): void {
    const now = Date.now();
    for (const [id, p] of this.peers) {
      if (now - p.lastSeen > PEER_TTL_MS) this.peers.delete(id);
    }
    this.signals = this.signals.filter((s) => now - s.createdAt <= SIGNAL_TTL_MS);
  }

  async fetch(request: Request): Promise<Response> {
    await this.ensureLoaded();
    try {
      if (request.method === "GET") return await this.handleGet(new URL(request.url));
      if (request.method === "POST") return await this.handlePost(request);
      return json({ error: "method not allowed" }, 405, {});
    } catch (err) {
      console.error("[rtc] error:", err);
      return json({ error: "signaling failed" }, 500, {});
    }
  }

  /** GET ?room&peer&name&since — join (since=0), heartbeat, and inbox. */
  private async handleGet(url: URL): Promise<Response> {
    const peer = url.searchParams.get("peer");
    const name = (url.searchParams.get("name") ?? "").slice(0, 64);
    const since = Number.parseInt(url.searchParams.get("since") ?? "0", 10) || 0;
    if (!peer || !ID_RE.test(peer)) return json({ error: "invalid query" }, 400, {});

    if (since === 0 || Math.random() < 0.1) this.prune();
    this.peers.set(peer, { name, lastSeen: Date.now() });

    const inbox = this.signals
      .filter((s) => s.to === peer && s.id > since)
      .sort((a, b) => a.id - b.id)
      .slice(0, 200);

    await this.persist();

    return json(
      {
        peers: [...this.peers.entries()].map(([id, p]) => ({ id, name: p.name })),
        signals: inbox.map((s) => ({ id: s.id, from: s.from, kind: s.kind, payload: s.payload })),
      },
      200,
      {},
    );
  }

  private async handlePost(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON" }, 400, {});
    }
    const b = body as Record<string, unknown>;

    if (b.op === "signal") {
      const { from, to, kind, payload } = b;
      const validIds = [from, to].every((v) => typeof v === "string" && ID_RE.test(v));
      const validKind = kind === "offer" || kind === "answer" || kind === "ice";
      if (!validIds || !validKind) return json({ error: "invalid request" }, 400, {});
      if (payload === undefined || JSON.stringify(payload).length > MAX_PAYLOAD_CHARS) {
        return json({ error: "payload too large" }, 400, {});
      }
      this.signals.push({
        id: this.nextId++,
        to: to as string,
        from: from as string,
        kind,
        payload,
        createdAt: Date.now(),
      });
      await this.persist();
      return json({ ok: true }, 200, {});
    }

    if (b.op === "leave") {
      const { peer } = b;
      if (typeof peer !== "string" || !ID_RE.test(peer)) return json({ error: "invalid request" }, 400, {});
      this.peers.delete(peer);
      await this.persist();
      return json({ ok: true }, 200, {});
    }

    return json({ error: "invalid request" }, 400, {});
  }
}
