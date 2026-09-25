import { Settings, RotateCcw, Sparkles, Volume2, VolumeX, Sun, Moon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { getGameStatus, getCurrentPhase, getPhaseTurnsLeft, materialOf } from "./chess";
import { SKINS, type SkinId } from "./skins";
import { useGame } from "./store";

export function GameHUD() {
  const state = useGame((s) => s.state);
  const mode = useGame((s) => s.mode);
  const difficulty = useGame((s) => s.difficulty);
  const skin = useGame((s) => s.skin);
  const audio = useGame((s) => s.audio);
  const phases = useGame((s) => s.phases);
  const thinking = useGame((s) => s.thinking);
  const toast = useGame((s) => s.toast);
  const selected = useGame((s) => s.selected);
  const setMode = useGame((s) => s.setMode);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const setSkin = useGame((s) => s.setSkin);
  const setAudio = useGame((s) => s.setAudio);
  const setPhases = useGame((s) => s.setPhases);
  const newGame = useGame((s) => s.newGame);
  const flipBoard = useGame((s) => s.flipBoard);
  const [open, setOpen] = useState(false);

  const status = getGameStatus(state);
  const sunMat = materialOf(state.board, "w");
  const moonMat = materialOf(state.board, "b");
  const round = Math.floor(state.halfmove / 2) + 1;
  const phase = phases ? getCurrentPhase() : null;
  const sunActive = state.turn === "w" && !status.isOver;
  const moonActive = state.turn === "b" && !status.isOver;

  let message = "Elige una pieza";
  if (status.isOver) message = status.result;
  else if (thinking) message = "La Luna piensa…";
  else if (status.inCheck) message = state.turn === "w" ? "Jaque al Sol" : "Jaque a la Luna";
  else if (selected !== null) message = "Elige el destino";

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <PlayerBadge
          name="Sol Invictus"
          tag="LUZ"
          material={sunMat}
          active={sunActive}
          faction="sol"
          icon={<Sun className="size-4" strokeWidth={1.75} />}
        />
        <div className="min-w-0 pt-1 text-center">
          <p className="font-sans text-[10px] font-medium tracking-[0.22em] text-fg-subtle uppercase">
            Ajedrez 3D
          </p>
          <h1 className="font-display text-lg leading-tight font-semibold tracking-tight text-fg sm:text-2xl">
            Eclipse Eterno
          </h1>
          <p className="mt-0.5 font-sans text-[11px] text-fg-muted">
            {status.isOver
              ? status.result
              : thinking
                ? "Turno de la Luna"
                : `Turno del ${state.turn === "w" ? "Sol" : "Luna"}`}
            {status.inCheck && !status.isOver ? " · Jaque" : ""}
          </p>
        </div>
        <PlayerBadge
          name="Luna Noir"
          tag={mode === "ai" ? "IA" : "SOMBRA"}
          material={moonMat}
          active={moonActive}
          faction="luna"
          icon={<Moon className="size-4" strokeWidth={1.75} />}
          reverse
        />
      </header>

      <div className="pointer-events-none absolute top-[5.5rem] left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:top-[6.25rem]">
        <Pill>Tablero astral</Pill>
        <Pill>Ronda {round}</Pill>
      </div>

      {toast && !status.isOver && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border bg-bg-elevated px-4 py-2 font-sans text-xs text-fg sm:bottom-24">
          {toast}
        </div>
      )}

      {phase && (
        <div className="pointer-events-none absolute right-3 bottom-28 z-10 flex items-center gap-2 rounded-xl border border-border bg-bg-elevated/90 px-3 py-2 sm:bottom-24">
          {phase === "sun" ? (
            <Sun className="size-4 text-sol" strokeWidth={1.75} />
          ) : (
            <Moon className="size-4 text-luna" strokeWidth={1.75} />
          )}
          <div>
            <p className="font-sans text-[11px] font-medium text-fg">
              {phase === "sun" ? "Mediodía solar" : "Luna creciente"}
            </p>
            <p className="font-sans text-[10px] text-fg-subtle">
              {getPhaseTurnsLeft()} {getPhaseTurnsLeft() === 1 ? "turno" : "turnos"}
            </p>
          </div>
        </div>
      )}

      {status.isOver && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-bg/55 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-elevated p-6 text-center shadow-[0_24px_80px_rgb(0_0_0/0.45)]">
            <p className="font-sans text-[10px] tracking-[0.2em] text-fg-subtle uppercase">Partida terminada</p>
            <p className="font-display mt-1 text-2xl font-semibold text-fg">{status.result}</p>
            <button
              type="button"
              onClick={newGame}
              className="mt-5 h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
            >
              Nueva partida
            </button>
          </div>
        </div>
      )}

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
        <div className="mx-auto flex w-full max-w-xl items-center gap-2">
          <Chip>
            <span className="size-1.5 rounded-full bg-sol" />
            Sol <strong className="font-medium text-fg tabular-nums">{sunMat}</strong>
          </Chip>
          <Chip className="min-w-0 flex-1 justify-center">
            <span className="truncate text-center">
              {state.halfmove === 0 && !status.isOver
                ? "Arrastra para orbitar · toca una pieza"
                : message}
            </span>
          </Chip>
          <Chip>
            <span className="size-1.5 rounded-full bg-luna" />
            Luna <strong className="font-medium text-fg tabular-nums">{moonMat}</strong>
          </Chip>
        </div>
        <nav className="pointer-events-auto mx-auto flex items-center gap-2">
          <IconBtn label="Ajustes" onClick={() => setOpen(true)}>
            <Settings className="size-4" strokeWidth={1.75} />
          </IconBtn>
          <IconBtn label="Nueva partida" primary onClick={newGame}>
            <Sparkles className="size-4" strokeWidth={1.75} />
          </IconBtn>
          <IconBtn label="Girar tablero" onClick={flipBoard}>
            <RotateCcw className="size-4" strokeWidth={1.75} />
          </IconBtn>
        </nav>
      </footer>

      {open && (
        <div className="absolute inset-0 z-30">
          <button
            type="button"
            aria-label="Cerrar ajustes"
            className="absolute inset-0 bg-bg/70"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute top-1/2 right-3 w-[min(22rem,calc(100%-1.5rem))] -translate-y-1/2 rounded-xl border border-border bg-bg-elevated p-5 shadow-[0_24px_80px_rgb(0_0_0/0.45)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
                  Eclipse eterno
                </p>
                <h2 className="font-display text-2xl font-semibold text-fg">Ajustes</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-sm bg-bg-subtle text-lg text-fg-muted"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-bg-subtle/50 p-3">
              <Field label="Modo de partida">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "ai" | "pvp")}
                  className="mt-1.5 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg outline-none"
                >
                  <option value="ai">Contra la IA</option>
                  <option value="pvp">Dos jugadores</option>
                </select>
              </Field>
              <Field label="Dificultad">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="mt-1.5 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg outline-none"
                >
                  <option value={1}>Fácil</option>
                  <option value={2}>Media</option>
                  <option value={3}>Difícil</option>
                </select>
              </Field>
            </div>

            <div className="mt-3 space-y-3 rounded-lg border border-border bg-bg-subtle/50 p-3">
              <Field label="Estética">
                <select
                  value={skin}
                  onChange={(e) => setSkin(e.target.value as SkinId)}
                  className="mt-1.5 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg outline-none"
                >
                  {Object.values(SKINS).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <SwitchRow
                label="Fases lunares"
                checked={phases}
                onChange={setPhases}
              />
              <SwitchRow
                label="Sonido"
                checked={audio}
                onChange={setAudio}
                icon={
                  audio ? (
                    <Volume2 className="size-3.5" />
                  ) : (
                    <VolumeX className="size-3.5" />
                  )
                }
              />
            </div>

            <p className="mt-3 font-sans text-[11px] leading-relaxed text-fg-subtle">
              La luz solar favorece al Sol. La sombra lunar favorece a la Luna.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
            >
              Listo
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

function PlayerBadge({
  name,
  tag,
  material,
  active,
  faction,
  icon,
  reverse,
}: {
  name: string;
  tag: string;
  material: number;
  active: boolean;
  faction: "sol" | "luna";
  icon: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div
      className={[
        "pointer-events-auto flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 transition-opacity duration-200 sm:min-w-[7.5rem]",
        reverse ? "flex-row-reverse" : "",
        active ? "border-border-strong bg-bg-elevated/90 opacity-100" : "border-border bg-bg-elevated/70 opacity-55",
      ].join(" ")}
    >
      <div
        className={[
          "grid size-9 place-items-center rounded-full",
          faction === "sol" ? "bg-sol text-accent-fg" : "bg-luna text-accent-fg",
        ].join(" ")}
      >
        {icon}
      </div>
      <div className={reverse ? "text-right" : ""}>
        <p className="hidden font-sans text-[11px] font-medium tracking-wide text-fg uppercase sm:block">{name}</p>
        <p className="font-sans text-[11px] font-medium tracking-wide text-fg uppercase sm:hidden">
          {faction === "sol" ? "Sol" : "Luna"}
        </p>
        <p className="font-mono text-[9px] text-fg-subtle">{tag}</p>
        <p className={["font-sans text-[10px] tabular-nums", faction === "sol" ? "text-sol" : "text-luna"].join(" ")}>
          {material}
        </p>
      </div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-bg-elevated/80 px-2.5 py-1 font-sans text-[10px] tracking-[0.14em] text-fg-muted uppercase">
      {children}
    </span>
  );
}

function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated/85 px-2.5 py-1.5 font-sans text-[10px] text-fg-muted ${className}`}
    >
      {children}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  primary,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-lg border px-3",
        primary
          ? "border-border-strong bg-accent text-accent-fg"
          : "border-border bg-bg-elevated text-fg",
      ].join(" ")}
    >
      {children}
      <span className="font-sans text-[9px] tracking-wide uppercase opacity-70">{label}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block font-sans text-[11px] text-fg-muted">
      {label}
      {children}
    </label>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <label className="flex h-10 items-center justify-between gap-3 font-sans text-[12px] text-fg">
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-5 w-9 rounded-full transition-colors duration-150",
          checked ? "bg-accent" : "bg-bg",
        ].join(" ")}
      >
        <i
          className={[
            "absolute top-0.5 size-4 rounded-full bg-fg transition-transform duration-150",
            checked ? "left-4" : "left-0.5",
            checked ? "bg-accent-fg" : "bg-fg-muted",
          ].join(" ")}
        />
      </button>
    </label>
  );
}
