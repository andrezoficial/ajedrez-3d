import {
  Settings,
  RotateCcw,
  Plus,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Copy,
  Check,
  House,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  capturedPieces,
  getGameStatus,
  getCurrentPhase,
  getPhaseTurnsLeft,
  lastMoveLabel,
  materialDelta,
  opponentColor,
  type PieceType,
  type Side,
} from "./chess";
import { PieceGlyph } from "./PieceGlyph";
import { SKINS, type SkinId } from "./skins";
import { useGame, type Mode } from "./store";
import type { OnlineStatus } from "./online";
import { Board2D } from "./Board2D";
import { Btn, Field, Modal, Segmented, SwitchRow } from "./ui";
import { cn } from "@/lib/utils";

export function PlayScreen() {
  const state = useGame((s) => s.state);
  const mode = useGame((s) => s.mode);
  const difficulty = useGame((s) => s.difficulty);
  const skinId = useGame((s) => s.skin);
  const audio = useGame((s) => s.audio);
  const phases = useGame((s) => s.phases);
  const thinking = useGame((s) => s.thinking);
  const toast = useGame((s) => s.toast);
  const selected = useGame((s) => s.selected);
  const pendingPromotion = useGame((s) => s.pendingPromotion);
  const onlineRoom = useGame((s) => s.onlineRoom);
  const onlineColor = useGame((s) => s.onlineColor);
  const onlineStatus = useGame((s) => s.onlineStatus);
  const flipped = useGame((s) => s.flipped);
  const setMode = useGame((s) => s.setMode);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const setSkin = useGame((s) => s.setSkin);
  const setAudio = useGame((s) => s.setAudio);
  const setPhases = useGame((s) => s.setPhases);
  const newGame = useGame((s) => s.newGame);
  const flipBoard = useGame((s) => s.flipBoard);
  const startOnlineHost = useGame((s) => s.startOnlineHost);
  const joinOnlineRoom = useGame((s) => s.joinOnlineRoom);
  const returnToMenu = useGame((s) => s.returnToMenu);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [uiMode, setUiMode] = useState<Mode>(mode);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mode !== "online") setUiMode(mode);
  }, [mode]);

  const status = getGameStatus(state);
  const skin = SKINS[skinId];
  const phase = phases ? getCurrentPhase() : null;
  const topSide: Side = flipped ? "w" : "b";
  const bottomSide: Side = flipped ? "b" : "w";
  const moveLabel = lastMoveLabel(state);

  let message = "Toca una pieza";
  if (mode === "online" && onlineStatus !== "connected") {
    message =
      onlineStatus === "waiting"
        ? "Esperando al rival"
        : onlineStatus === "disconnected"
          ? "Rival desconectado"
          : "Conectando";
  } else if (status.isOver) message = status.result;
  else if (pendingPromotion) message = "Elige la coronación";
  else if (mode === "ai" && thinking) message = "La Luna piensa";
  else if (status.inCheck) message = state.turn === "w" ? "Jaque al Sol" : "Jaque a la Luna";
  else if (mode === "online" && state.turn !== onlineColor) message = "Turno del rival";
  else if (selected !== null) message = "Elige el destino";
  else if (moveLabel) message = `${moveLabel} · ${state.turn === "w" ? "Sol" : "Luna"}`;

  const requestNewGame = () => {
    if (state.halfmove > 0 && !status.isOver) setConfirmNew(true);
    else newGame();
  };

  return (
    <div className="relative flex h-dvh w-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1 sm:px-4">
        <IconBtn label="Menú" onClick={returnToMenu}>
          <House className="size-4" strokeWidth={1.7} />
        </IconBtn>
        <div className="min-w-0 text-center">
          <p className="text-micro font-medium tracking-[0.24em] text-fg-subtle uppercase">Sol y Luna</p>
          <h1 className="font-display text-lg leading-tight font-semibold tracking-tight text-fg sm:text-xl">
            Eclipse Eterno
          </h1>
        </div>
        <IconBtn label="Ajustes" onClick={() => setSettingsOpen(true)}>
          <Settings className="size-4" strokeWidth={1.7} />
        </IconBtn>
      </header>

      {phase && (
        <div className="flex justify-center pb-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-2.5 py-1 text-2xs text-fg-muted">
            {phase === "sun" ? (
              <Sun className="size-3 text-sol" strokeWidth={1.75} />
            ) : (
              <Moon className="size-3 text-luna" strokeWidth={1.75} />
            )}
            {phase === "sun" ? "Mediodía solar" : "Luna creciente"}
            <span className="text-fg-subtle tabular-nums">
              · {getPhaseTurnsLeft()} {getPhaseTurnsLeft() === 1 ? "turno" : "turnos"}
            </span>
          </div>
        </div>
      )}

      <PlayerRail
        side={topSide}
        mode={mode}
        onlineColor={onlineColor}
        onlineStatus={onlineStatus}
        thinking={thinking && topSide === "b"}
        active={state.turn === topSide && !status.isOver}
      />

      <Board2D />

      <PlayerRail
        side={bottomSide}
        mode={mode}
        onlineColor={onlineColor}
        onlineStatus={onlineStatus}
        thinking={thinking && bottomSide === "b"}
        active={state.turn === bottomSide && !status.isOver}
      />

      <footer className="flex shrink-0 flex-col items-center gap-2 px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
        <p
          aria-live="polite"
          className="min-h-5 max-w-sm truncate text-center text-xs text-fg-muted"
        >
          {toast && !status.isOver ? toast : message}
        </p>
        <nav className="flex items-center gap-2">
          <IconBtn label="Nueva" onClick={requestNewGame} primary caption>
            <Plus className="size-4" strokeWidth={1.7} />
          </IconBtn>
          <IconBtn label="Girar" onClick={flipBoard} caption>
            <RotateCcw className="size-4" strokeWidth={1.7} />
          </IconBtn>
        </nav>
      </footer>

      {status.isOver && (
        <Modal kicker="Partida terminada" title={status.result}>
          <div className="mb-5 flex justify-center">
            {status.winner === "w" ? (
              <Sun className="size-10 text-sol" strokeWidth={1.4} />
            ) : status.winner === "b" ? (
              <Moon className="size-10 text-luna" strokeWidth={1.4} />
            ) : (
              <div className="flex gap-2 text-fg-muted">
                <Sun className="size-8" strokeWidth={1.4} />
                <Moon className="size-8" strokeWidth={1.4} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Btn className="w-full" onClick={newGame}>
              Revancha
            </Btn>
            <Btn variant="secondary" className="w-full" onClick={returnToMenu}>
              Volver al menú
            </Btn>
          </div>
        </Modal>
      )}

      {mode === "online" && (onlineStatus === "connecting" || onlineStatus === "waiting") && (
        <Modal
          kicker={onlineStatus === "connecting" ? "En línea" : "Sala lista"}
          title={onlineStatus === "connecting" ? "Buscando la sala" : "Comparte el código"}
          onClose={returnToMenu}
        >
          {onlineRoom && (
            <>
              <p className="mb-3 text-center font-mono text-3xl font-semibold tracking-[0.28em] text-fg">
                {onlineRoom}
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(onlineRoom).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
                className="mb-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-bg text-sm text-fg-muted transition-colors duration-150 hover:text-fg"
              >
                {copied ? <Check className="size-4" strokeWidth={1.75} /> : <Copy className="size-4" strokeWidth={1.75} />}
                {copied ? "Código copiado" : "Copiar código"}
              </button>
            </>
          )}
          <p className="mb-5 text-center text-xs leading-relaxed text-fg-muted">
            {onlineStatus === "connecting"
              ? "Un segundo…"
              : "Tu rival necesita este código para unirse."}
          </p>
          <Btn variant="secondary" className="w-full" onClick={returnToMenu}>
            Cancelar
          </Btn>
        </Modal>
      )}

      {confirmNew && (
        <Modal kicker="Partida en curso" title="¿Empezar de nuevo?" onClose={() => setConfirmNew(false)}>
          <p className="mb-5 text-sm leading-relaxed text-fg-muted">
            Se perderá el progreso de esta partida.
          </p>
          <div className="flex flex-col gap-2">
            <Btn
              className="w-full"
              onClick={() => {
                setConfirmNew(false);
                newGame();
              }}
            >
              Nueva partida
            </Btn>
            <Btn variant="ghost" className="w-full" onClick={() => setConfirmNew(false)}>
              Seguir jugando
            </Btn>
          </div>
        </Modal>
      )}

      {settingsOpen && (
        <Modal kicker="Eclipse Eterno" title="Ajustes" onClose={() => setSettingsOpen(false)} wide>
          <div className="space-y-3">
            <div className="space-y-3 rounded-lg bg-bg p-3 shadow-border">
              <Field label="Modo de partida">
                <Segmented
                  value={uiMode}
                  onChange={(next) => {
                    setUiMode(next);
                    if (next !== "online") setMode(next);
                  }}
                  options={[
                    { value: "ai", label: "IA" },
                    { value: "pvp", label: "Local" },
                    { value: "online", label: "En línea" },
                  ]}
                />
              </Field>
              {uiMode === "ai" && (
                <Field label="Dificultad">
                  <Segmented
                    value={difficulty}
                    onChange={setDifficulty}
                    options={[
                      { value: 1, label: "Fácil" },
                      { value: 2, label: "Media" },
                      { value: 3, label: "Difícil" },
                    ]}
                  />
                </Field>
              )}
              {uiMode === "online" && (
                <OnlinePanel
                  connected={mode === "online"}
                  onlineRoom={onlineRoom}
                  onlineColor={onlineColor}
                  onlineStatus={onlineStatus}
                  joinCode={joinCode}
                  setJoinCode={setJoinCode}
                  copied={copied}
                  onHost={() => startOnlineHost()}
                  onJoin={() => {
                    if (joinCode.trim()) joinOnlineRoom(joinCode);
                  }}
                  onCopy={() => {
                    if (!onlineRoom) return;
                    navigator.clipboard?.writeText(onlineRoom).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    });
                  }}
                  onLeave={() => {
                    returnToMenu();
                    setJoinCode("");
                  }}
                />
              )}
            </div>

            <div className="space-y-3 rounded-lg bg-bg p-3 shadow-border">
              <Field label="Tablero">
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(SKINS).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSkin(s.id as SkinId)}
                      className={cn(
                        "overflow-hidden rounded-md text-left transition-[box-shadow] duration-150",
                        skinId === s.id ? "shadow-[0_0_0_2px_var(--color-accent)]" : "shadow-border",
                      )}
                    >
                      <span className="grid h-8 grid-cols-4">
                        {Array.from({ length: 8 }, (_, i) => (
                          <span
                            key={i}
                            style={{
                              background: ((i % 4) + Math.floor(i / 4)) % 2 === 0 ? s.tileLight : s.tileDark,
                            }}
                          />
                        ))}
                      </span>
                      <span className="block truncate px-1.5 py-1.5 text-micro leading-tight text-fg-muted">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
              <SwitchRow label="Fases lunares" checked={phases} onChange={setPhases} />
              <SwitchRow
                label="Sonido"
                checked={audio}
                onChange={setAudio}
                icon={
                  audio ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />
                }
              />
            </div>

            <p className="text-xs leading-relaxed text-fg-subtle">
              Con fases activas, la luz solar favorece al Sol y la sombra lunar a la Luna.
            </p>
            <Btn className="w-full" onClick={() => setSettingsOpen(false)}>
              Listo
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PlayerRail({
  side,
  mode,
  onlineColor,
  onlineStatus,
  thinking,
  active,
}: {
  side: Side;
  mode: Mode;
  onlineColor: Side | null;
  onlineStatus: OnlineStatus;
  thinking: boolean;
  active: boolean;
}) {
  const board = useGame((s) => s.state.board);
  const skin = SKINS[useGame((s) => s.skin)];
  const captured = capturedPieces(board, opponentColor(side));
  const delta = materialDelta(board, side);
  const isSol = side === "w";
  const name = isSol ? "Sol Invictus" : "Luna Noir";
  const short = isSol ? "Sol" : "Luna";
  const tag = playerTag(side, mode, onlineColor, onlineStatus);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-xl shrink-0 items-center gap-2.5 px-3 py-1.5 sm:px-4",
        "transition-opacity duration-200 ease-out",
        active ? "opacity-100" : "opacity-55",
      )}
    >
      <div
        className={cn(
          "relative grid size-10 shrink-0 place-items-center rounded-full",
          isSol ? "bg-sol text-accent-fg" : "bg-luna text-accent-fg",
        )}
      >
        {isSol ? <Sun className="size-4" strokeWidth={1.7} /> : <Moon className="size-4" strokeWidth={1.7} />}
        {active && (
          <span className="turn-dot absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-accent shadow-[0_0_0_2px_var(--color-bg)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-medium tracking-wide text-fg">
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{name}</span>
          </p>
          <p className="shrink-0 text-micro tracking-[0.14em] text-fg-subtle uppercase">{tag}</p>
        </div>
        <div className="mt-0.5 flex min-h-4 items-center gap-0.5">
          {captured.map((type, i) => (
              <PieceGlyph
                key={`${type}-${i}`}
                type={type as PieceType}
                side={opponentColor(side)}
                skin={skin}
                className="size-4"
              />
            ))}
        </div>
      </div>
      <p
        className={cn(
          "shrink-0 font-mono text-sm tabular-nums",
          thinking ? "shimmer-text" : delta > 0 ? (isSol ? "text-sol" : "text-luna") : "text-fg-subtle",
        )}
      >
        {thinking ? "…" : delta > 0 ? `+${delta}` : ""}
      </p>
    </div>
  );
}

function playerTag(
  side: Side,
  mode: Mode,
  onlineColor: Side | null,
  onlineStatus: OnlineStatus,
): string {
  if (mode === "ai") return side === "w" ? "Tú" : "IA";
  if (mode === "online") {
    if (onlineColor === side) return "Tú";
    if (onlineStatus === "connected") return "Rival";
    if (onlineStatus === "waiting") return "Espera";
    return "En línea";
  }
  return side === "w" ? "Luz" : "Sombra";
}

function OnlinePanel({
  connected,
  onlineRoom,
  onlineColor,
  onlineStatus,
  joinCode,
  setJoinCode,
  copied,
  onHost,
  onJoin,
  onCopy,
  onLeave,
}: {
  connected: boolean;
  onlineRoom: string | null;
  onlineColor: Side | null;
  onlineStatus: OnlineStatus;
  joinCode: string;
  setJoinCode: (v: string) => void;
  copied: boolean;
  onHost: () => void;
  onJoin: () => void;
  onCopy: () => void;
  onLeave: () => void;
}) {
  if (!connected) {
    return (
      <div className="space-y-2">
        <Btn className="w-full" onClick={onHost}>
          Crear sala
        </Btn>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Código de sala"
            maxLength={6}
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg-elevated px-3 font-mono text-sm tracking-[0.22em] text-fg outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-fg-subtle"
          />
          <Btn variant="secondary" disabled={!joinCode.trim()} onClick={onJoin} className="shrink-0">
            Unirse
          </Btn>
        </div>
      </div>
    );
  }

  const statusLabel =
    onlineStatus === "connected"
      ? "Rival conectado"
      : onlineStatus === "waiting"
        ? "Esperando al rival"
        : onlineStatus === "disconnected"
          ? "Rival desconectado"
          : "Conectando";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-2xl font-semibold tracking-[0.28em] text-fg">{onlineRoom}</p>
        <button
          type="button"
          onClick={onCopy}
          aria-label="Copiar código"
          className="grid size-11 shrink-0 place-items-center rounded-md border border-border text-fg-muted"
        >
          {copied ? <Check className="size-4" strokeWidth={1.75} /> : <Copy className="size-4" strokeWidth={1.75} />}
        </button>
      </div>
      <p className="flex items-center gap-2 text-xs text-fg-muted">
        <span
          className={cn("size-1.5 rounded-full", onlineStatus === "connected" ? "bg-ok" : "bg-fg-subtle")}
        />
        {statusLabel} · {onlineColor === "w" ? "Sol" : "Luna"}
      </p>
      <Btn variant="secondary" className="h-10 w-full text-xs" onClick={onLeave}>
        Salir de la sala
      </Btn>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  primary,
  caption,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  caption?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border",
        "transition-[background-color,transform] duration-150 ease-out",
        "active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        caption ? "h-12 min-w-14 px-3" : "size-11",
        primary
          ? "border-transparent bg-accent text-accent-fg"
          : "border-border bg-bg-elevated text-fg shadow-border",
      )}
      aria-label={label}
      title={label}
    >
      {children}
      {caption && (
        <span className="text-micro font-medium tracking-wide uppercase opacity-70">{label}</span>
      )}
    </button>
  );
}
