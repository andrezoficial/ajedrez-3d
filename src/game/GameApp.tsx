import { PlayScreen } from "./GameHUD";
import { StartMenu } from "./StartMenu";
import { useGame } from "./store";
import { cn } from "@/lib/utils";

export default function GameApp() {
  const screen = useGame((s) => s.screen);
  const turn = useGame((s) => s.state.turn);
  const phases = useGame((s) => s.phases);
  const halfmove = useGame((s) => s.state.halfmove);
  const phase = phases ? (Math.floor(halfmove / 5) % 2 === 0 ? "sun" : "moon") : null;
  const warm = phase === "sun" || (!phase && turn === "w");

  return (
    <div
      className={cn(
        "relative h-dvh w-full overflow-hidden bg-bg text-fg antialiased",
        warm ? "game-stage-sol" : "game-stage-luna",
      )}
    >
      {screen === "menu" ? <StartMenu /> : <PlayScreen />}
    </div>
  );
}
