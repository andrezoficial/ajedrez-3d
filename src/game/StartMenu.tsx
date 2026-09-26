import { useState, type ReactNode } from "react";
import { Sun, Moon, Users, Wifi, Bot, ArrowLeft } from "lucide-react";
import { useGame } from "./store";

type Panel = "root" | "ai" | "online";

export function StartMenu() {
  const [panel, setPanel] = useState<Panel>("root");
  const [aiDifficulty, setAiDifficulty] = useState(2);
  const [joinCode, setJoinCode] = useState("");

  const startLocalGame = useGame((s) => s.startLocalGame);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const startOnlineHost = useGame((s) => s.startOnlineHost);
  const joinOnlineRoom = useGame((s) => s.joinOnlineRoom);

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-[radial-gradient(circle_at_50%_15%,rgb(196_165_116/0.16),transparent_55%),radial-gradient(circle_at_50%_100%,rgb(168_176_196/0.14),transparent_55%)] bg-bg">
      <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-5 py-12">
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Sun className="size-7 text-sol" strokeWidth={1.5} />
            <Moon className="size-7 text-luna" strokeWidth={1.5} />
          </div>
          <p className="font-sans text-[10px] font-medium tracking-[0.32em] text-fg-subtle uppercase">
            Ajedrez 3D
          </p>
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-fg">
            Eclipse Eterno
          </h1>
          <p className="mt-2 font-sans text-[13px] text-fg-muted">
            El Sol y la Luna se disputan el tablero astral.
          </p>
        </div>

        {panel === "root" && (
          <div className="space-y-3">
            <MenuCard
              icon={<Bot className="size-5" strokeWidth={1.75} />}
              title="Contra la IA"
              description="Elige la dificultad y enfréntate a la Luna."
              onClick={() => setPanel("ai")}
            />
            <MenuCard
              icon={<Users className="size-5" strokeWidth={1.75} />}
              title="Dos jugadores"
              description="Turnos alternos en el mismo dispositivo."
              onClick={() => startLocalGame("pvp")}
            />
            <MenuCard
              icon={<Wifi className="size-5" strokeWidth={1.75} />}
              title="En línea"
              description="Crea una sala o únete con un código."
              onClick={() => setPanel("online")}
            />
          </div>
        )}

        {panel === "ai" && (
          <div className="space-y-5 rounded-xl border border-border bg-bg-elevated p-5">
            <BackRow onBack={() => setPanel("root")} label="Contra la IA" />
            <div>
              <p className="mb-2 font-sans text-[11px] tracking-[0.14em] text-fg-subtle uppercase">
                Dificultad
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { n: 1, label: "Fácil" },
                  { n: 2, label: "Media" },
                  { n: 3, label: "Difícil" },
                ].map((d) => (
                  <button
                    key={d.n}
                    type="button"
                    onClick={() => setAiDifficulty(d.n)}
                    className={[
                      "h-11 rounded-md border font-sans text-sm transition-colors",
                      aiDifficulty === d.n
                        ? "border-border-strong bg-accent text-accent-fg"
                        : "border-border bg-bg text-fg-muted",
                    ].join(" ")}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDifficulty(aiDifficulty);
                startLocalGame("ai");
              }}
              className="h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
            >
              Jugar contra la IA
            </button>
          </div>
        )}

        {panel === "online" && (
          <div className="space-y-4 rounded-xl border border-border bg-bg-elevated p-5">
            <BackRow onBack={() => setPanel("root")} label="En línea" />
            <button
              type="button"
              onClick={() => startOnlineHost()}
              className="h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
            >
              Crear sala
            </button>
            <div className="flex items-center gap-2 px-1">
              <span className="h-px flex-1 bg-border" />
              <span className="font-sans text-[10px] tracking-wide text-fg-subtle uppercase">o</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Código de sala"
                maxLength={6}
                autoCapitalize="characters"
                className="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 font-mono text-sm tracking-[0.2em] text-fg outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-fg-subtle"
              />
              <button
                type="button"
                disabled={!joinCode.trim()}
                onClick={() => joinOnlineRoom(joinCode)}
                className="h-11 shrink-0 rounded-md border border-border-strong bg-bg px-4 text-sm font-medium text-fg disabled:opacity-40"
              >
                Unirse
              </button>
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-fg-subtle">
              Pide a tu rival el código de su sala, o crea una y compártelo con él.
            </p>
          </div>
        )}

        <p className="mt-10 text-center font-[family-name:var(--font-signature)] text-lg text-fg-subtle">
          creado por Andres Suarez Moreno · @andres.suarez.moreno
        </p>
      </div>
    </div>
  );
}

function MenuCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg-elevated p-4 text-left transition-colors hover:border-border-strong hover:bg-bg-subtle"
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-full bg-bg-subtle text-fg">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-sans text-sm font-medium text-fg">{title}</p>
        <p className="mt-0.5 font-sans text-[11px] text-fg-muted">{description}</p>
      </div>
    </button>
  );
}

function BackRow({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        className="grid size-7 place-items-center rounded-full border border-border bg-bg text-fg-muted"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
      </button>
      <p className="font-sans text-[11px] tracking-[0.14em] text-fg-subtle uppercase">{label}</p>
    </div>
  );
}
