import { useState, type ReactNode } from "react";
import { Users, Wifi, Bot, ArrowLeft, Instagram, ChevronRight, Sun, Moon } from "lucide-react";
import { useGame } from "./store";
import { Btn, Segmented } from "./ui";
import { cn } from "@/lib/utils";

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
    <div className="salon-grid absolute inset-0 z-40 overflow-y-auto">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_50%_0%,rgb(196_165_116/0.12),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-14 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:justify-center sm:pt-10">
        <header className="stagger-in mb-10 text-center">
          <BrandMark />
          <p className="mt-5 text-micro font-medium tracking-[0.32em] text-fg-subtle uppercase">
            Sol y Luna
          </p>
          <h1 className="font-display mt-1 text-4xl leading-none font-semibold tracking-tight text-fg sm:text-5xl">
            Eclipse Eterno
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
            Ajedrez de salón. Vista cenital, reglas completas, IA y partidas en línea.
          </p>
        </header>

        {panel === "root" && (
          <div className="stagger-in space-y-2.5">
            <MenuCard
              icon={<Bot className="size-5" strokeWidth={1.6} />}
              title="Contra la IA"
              description="Tres niveles. Juegas con el Sol."
              onClick={() => setPanel("ai")}
              trailing
            />
            <MenuCard
              icon={<Users className="size-5" strokeWidth={1.6} />}
              title="Dos jugadores"
              description="Turnos en el mismo dispositivo."
              onClick={() => startLocalGame("pvp")}
            />
            <MenuCard
              icon={<Wifi className="size-5" strokeWidth={1.6} />}
              title="En línea"
              description="Crea una sala o únete con un código."
              onClick={() => setPanel("online")}
              trailing
            />
          </div>
        )}

        {panel === "ai" && (
          <div className="space-y-5 rounded-xl border border-border bg-bg-elevated p-5 shadow-border">
            <BackRow onBack={() => setPanel("root")} label="Contra la IA" />
            <div>
              <p className="mb-2 text-micro font-medium tracking-[0.16em] text-fg-subtle uppercase">
                Dificultad
              </p>
              <Segmented
                value={aiDifficulty}
                onChange={setAiDifficulty}
                options={[
                  { value: 1, label: "Fácil" },
                  { value: 2, label: "Media" },
                  { value: 3, label: "Difícil" },
                ]}
              />
              <p className="mt-2.5 text-xs leading-relaxed text-fg-subtle">
                {aiDifficulty === 1 && "La Luna comete errores y juega más corto."}
                {aiDifficulty === 2 && "Juego sólido, suficiente para una partida seria."}
                {aiDifficulty === 3 && "Busca más profundo. Exige precisión."}
              </p>
            </div>
            <Btn
              className="w-full"
              onClick={() => {
                setDifficulty(aiDifficulty);
                startLocalGame("ai");
              }}
            >
              Jugar contra la IA
            </Btn>
          </div>
        )}

        {panel === "online" && (
          <div className="space-y-4 rounded-xl border border-border bg-bg-elevated p-5 shadow-border">
            <BackRow onBack={() => setPanel("root")} label="En línea" />
            <Btn className="w-full" onClick={() => startOnlineHost()}>
              Crear sala
            </Btn>
            <div className="flex items-center gap-3 px-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-micro tracking-[0.18em] text-fg-subtle uppercase">o</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.trim()) joinOnlineRoom(joinCode);
                }}
                placeholder="Código"
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 font-mono text-sm tracking-[0.28em] text-fg outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-fg-subtle focus-visible:border-border-strong"
              />
              <Btn
                variant="secondary"
                disabled={!joinCode.trim()}
                onClick={() => joinOnlineRoom(joinCode)}
                className="shrink-0 px-4"
              >
                Unirse
              </Btn>
            </div>
            <p className="text-xs leading-relaxed text-fg-subtle">
              Crea una sala y comparte el código, o introdúcelo para unirte a la de tu rival.
            </p>
          </div>
        )}

        <a
          href="https://www.instagram.com/andres.suarez.moreno"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-fg-subtle transition-colors duration-150 hover:text-fg"
        >
          <Instagram className="size-3.5 shrink-0" strokeWidth={1.75} />
          Andres Suarez Moreno
        </a>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="mx-auto flex items-center justify-center gap-3" aria-hidden>
      <Sun className="size-4 text-sol" strokeWidth={1.5} />
      <div className="grid size-12 grid-cols-8 overflow-hidden rounded-sm shadow-border">
        {Array.from({ length: 64 }, (_, i) => {
          const light = ((i % 8) + Math.floor(i / 8)) % 2 === 0;
          return <span key={i} className={light ? "bg-sol" : "bg-bg"} />;
        })}
      </div>
      <Moon className="size-4 text-luna" strokeWidth={1.5} />
    </div>
  );
}

function MenuCard({
  icon,
  title,
  description,
  onClick,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  trailing?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-border bg-bg-elevated p-4 text-left shadow-border",
        "transition-[background-color,box-shadow] duration-150 ease-out",
        "hover:bg-bg-subtle hover:shadow-border-hover",
        "active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-sm bg-bg-subtle text-fg">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{description}</p>
      </div>
      {trailing && <ChevronRight className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />}
    </button>
  );
}

function BackRow({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        className="grid size-11 place-items-center rounded-full border border-border bg-bg text-fg-muted transition-colors duration-150 hover:text-fg"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
      </button>
      <p className="text-xs font-medium tracking-[0.16em] text-fg-subtle uppercase">{label}</p>
    </div>
  );
}
