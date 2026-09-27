import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  FILES,
  fileOf,
  findKingSquare,
  getGameStatus,
  rankOf,
  squareIndex,
  type PieceCode,
  type PieceType,
  type Side,
} from "./chess";
import { PieceGlyph } from "./PieceGlyph";
import { SKINS } from "./skins";
import { useGame } from "./store";

type Tracked = {
  id: string;
  code: PieceCode;
  square: number;
};

function visualCoord(square: number, flipped: boolean) {
  const file = fileOf(square);
  const rank = rankOf(square);
  const x = flipped ? 7 - file : file;
  const y = flipped ? 7 - rank : rank;
  return { x, y };
}

function syncTracked(prev: Tracked[], board: (PieceCode | null)[], lastMove: { from: number; to: number } | null) {
  const used = new Set<string>();
  const next: Tracked[] = [];
  const moved = lastMove ? board[lastMove.to] : null;
  const castle =
    lastMove && moved?.[1] === "K" && Math.abs(fileOf(lastMove.from) - fileOf(lastMove.to)) === 2;

  for (let sq = 0; sq < 64; sq++) {
    const code = board[sq];
    if (!code) continue;

    if (lastMove && sq === lastMove.to) {
      const fromPiece = prev.find((p) => {
        if (used.has(p.id) || p.square !== lastMove.from) return false;
        return p.code === code || (p.code[1] === "P" && code[1] !== "P" && p.code[0] === code[0]);
      });
      if (fromPiece) {
        next.push({ id: fromPiece.id, code, square: sq });
        used.add(fromPiece.id);
        continue;
      }
    }

    if (castle && lastMove) {
      const homeRank = rankOf(lastMove.to);
      const kingside = fileOf(lastMove.to) === 6;
      const rookTo = squareIndex(kingside ? 5 : 3, homeRank);
      const rookFrom = squareIndex(kingside ? 7 : 0, homeRank);
      if (sq === rookTo) {
        const rook = prev.find((p) => p.square === rookFrom && p.code[1] === "R" && !used.has(p.id));
        if (rook) {
          next.push({ id: rook.id, code, square: sq });
          used.add(rook.id);
          continue;
        }
      }
    }

    const same = prev.find((p) => p.square === sq && p.code === code && !used.has(p.id));
    if (same) {
      next.push(same);
      used.add(same.id);
    } else {
      next.push({ id: `${code}-${sq}-${next.length}`, code, square: sq });
    }
  }
  return next;
}

export function Board2D() {
  const board = useGame((s) => s.state.board);
  const lastMove = useGame((s) => s.state.lastMove);
  const turn = useGame((s) => s.state.turn);
  const selected = useGame((s) => s.selected);
  const legal = useGame((s) => s.legal);
  const flipped = useGame((s) => s.flipped);
  const skinId = useGame((s) => s.skin);
  const lastCapture = useGame((s) => s.lastCapture);
  const pendingPromotion = useGame((s) => s.pendingPromotion);
  const selectSquare = useGame((s) => s.selectSquare);
  const choosePromotion = useGame((s) => s.choosePromotion);
  const skin = SKINS[skinId];
  const status = getGameStatus(useGame((s) => s.state));
  const kingSq = status.inCheck ? findKingSquare(board, turn) : -1;

  const wrapRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef<Tracked[]>([]);
  const [pieces, setPieces] = useState<Tracked[]>([]);
  const [ready, setReady] = useState(false);
  const lastMoveRef = useRef(lastMove);

  useEffect(() => {
    const next = syncTracked(trackedRef.current, board, lastMoveRef.current === lastMove ? null : lastMove);
    lastMoveRef.current = lastMove;
    trackedRef.current = next;
    setPieces(next);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [board, lastMove]);

  const legalByTo = useMemo(() => {
    const map = new Map<number, (typeof legal)[number]>();
    for (const m of legal) map.set(m.to, m);
    return map;
  }, [legal]);

  const promoSide: Side = pendingPromotion
    ? ((board[pendingPromotion.from]?.[0] as Side) ?? turn)
    : turn;
  const promoPos = pendingPromotion ? visualCoord(pendingPromotion.to, flipped) : null;
  const promoDown = promoPos ? promoPos.y <= 3 : true;

  return (
    <div className="board-slot px-3 py-1 sm:px-4">
      <div
        className="board-frame relative"
        style={
          {
            "--tile-light": skin.tileLight,
            "--tile-dark": skin.tileDark,
            "--frame": skin.frame,
            "--felt": skin.felt,
          } as CSSProperties
        }
      >
        <div
          className="absolute inset-0 rounded-xl shadow-board"
          style={{
            background: skin.frame,
            padding: 12,
          }}
        >
          <div
            className="relative h-full w-full overflow-hidden rounded-md"
            style={{ background: skin.felt, boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.4)" }}
          >
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
              {Array.from({ length: 64 }, (_, vis) => {
                const vx = vis % 8;
                const vy = Math.floor(vis / 8);
                const file = flipped ? 7 - vx : vx;
                const rank = flipped ? 7 - vy : vy;
                const sq = squareIndex(file, rank);
                const isLight = (file + rank) % 2 === 0;
                const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
                const isSel = selected === sq;
                const isCheck = kingSq === sq;
                const move = legalByTo.get(sq);
                const showFile = vy === 7;
                const showRank = vx === 0;
                return (
                  <button
                    key={sq}
                    type="button"
                    aria-label={`${FILES[file]}${8 - rank}`}
                    onClick={() => selectSquare(sq)}
                    className="relative min-h-0 min-w-0 touch-manipulation outline-none focus-visible:z-10"
                    style={{
                      background: isLight
                        ? `linear-gradient(145deg, rgb(255 255 255 / 0.12), transparent 52%), ${skin.tileLight}`
                        : `linear-gradient(145deg, rgb(255 255 255 / 0.05), transparent 50%), ${skin.tileDark}`,
                    }}
                  >
                    {isLast && (
                      <span
                        className={
                          lastMove?.to === sq
                            ? "absolute inset-0 bg-sol/35"
                            : "absolute inset-0 bg-sol/18"
                        }
                      />
                    )}
                    {isCheck && (
                      <span
                        className="absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(circle at center, rgb(196 92 74 / 0.55), transparent 72%)",
                        }}
                      />
                    )}
                    {isSel && (
                      <span
                        className="absolute inset-[8%] rounded-xs"
                        style={{ boxShadow: `inset 0 0 0 2px ${skin.sunAccent}` }}
                      />
                    )}
                    {showFile && (
                      <span
                        className="pointer-events-none absolute right-[4%] bottom-[3%] font-sans text-micro font-medium sm:text-2xs"
                        style={{ color: isLight ? skin.tileDark : skin.tileLight, opacity: 0.72 }}
                      >
                        {FILES[file]}
                      </span>
                    )}
                    {showRank && (
                      <span
                        className="pointer-events-none absolute top-[3%] left-[4%] font-sans text-micro font-medium sm:text-2xs"
                        style={{ color: isLight ? skin.tileDark : skin.tileLight, opacity: 0.72 }}
                      >
                        {8 - rank}
                      </span>
                    )}
                    {move && (
                      <span
                        className="pointer-events-none absolute inset-0 grid place-items-center"
                        aria-hidden
                      >
                        {move.isCapture ? (
                          <span className="size-[72%] rounded-full border-2 border-danger/80" />
                        ) : (
                          <span className="size-[18%] rounded-full bg-fg/55 shadow-[0_0_0_1px_rgb(0_0_0/0.2)]" />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pointer-events-none absolute inset-0" key={flipped ? "f" : "n"}>
              {pieces.map((p) => {
                const { x, y } = visualCoord(p.square, flipped);
                const type = p.code[1] as PieceType;
                const side = p.code[0] as Side;
                const lifted = selected === p.square;
                return (
                  <div
                    key={p.id}
                    className="absolute aspect-square w-[12.5%]"
                    style={{
                      left: `${x * 12.5}%`,
                      top: `${y * 12.5}%`,
                      zIndex: lifted ? 5 : 2,
                      transition: ready
                        ? "left var(--motion-piece) var(--ease-smooth-out), top var(--motion-piece) var(--ease-smooth-out), transform var(--motion-fast) var(--ease-smooth-out)"
                        : "none",
                      transform: lifted ? "translateY(-6%) scale(1.06)" : "none",
                    }}
                  >
                    <PieceGlyph type={type} side={side} skin={skin} className="h-full w-full p-[4%]" />
                  </div>
                );
              })}
            </div>

            {lastCapture && (
              <Burst square={lastCapture.square} flipped={flipped} skinAccent={lastCapture.side === "w" ? skin.sunAccent : skin.moonAccent} />
            )}

            {pendingPromotion && promoPos && (
              <div
                className="pointer-events-auto absolute z-20 flex w-[12.5%] flex-col overflow-hidden rounded-sm border border-border-strong bg-bg-elevated shadow-elevated"
                style={{
                  left: `${promoPos.x * 12.5}%`,
                  top: promoDown ? `${promoPos.y * 12.5}%` : "auto",
                  bottom: promoDown ? "auto" : `${(7 - promoPos.y) * 12.5}%`,
                }}
              >
                {(["Q", "N", "R", "B"] as PieceType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-label={`Coronar a ${type}`}
                    onClick={() => choosePromotion(type)}
                    className="aspect-square w-full bg-bg-elevated transition-colors duration-150 hover:bg-bg-subtle"
                  >
                    <PieceGlyph type={type} side={promoSide} skin={skin} className="h-full w-full p-[6%]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Burst({
  square,
  flipped,
  skinAccent,
}: {
  square: number;
  flipped: boolean;
  skinAccent: string;
}) {
  const { x, y } = visualCoord(square, flipped);
  const dots = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        return { i, dx: Math.cos(a) * (18 + (i % 3) * 8), dy: Math.sin(a) * (18 + (i % 3) * 8) };
      }),
    [],
  );
  return (
    <div
      className="pointer-events-none absolute z-10 size-[12.5%]"
      style={{ left: `${x * 12.5}%`, top: `${y * 12.5}%` }}
    >
      {dots.map((d) => (
        <span
          key={d.i}
          className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={
            {
              background: skinAccent,
              animation: "capture-burst 0.65s var(--ease-smooth-out) forwards",
              "--dx": `${d.dx}px`,
              "--dy": `${d.dy}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
