import { ChessCanvas } from "./ChessScene";
import { GameHUD } from "./GameHUD";
import { StartMenu } from "./StartMenu";
import { useGame } from "./store";

export default function GameApp() {
  const screen = useGame((s) => s.screen);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      {screen === "menu" ? (
        <StartMenu />
      ) : (
        <>
          <div className="absolute inset-0">
            <ChessCanvas />
          </div>
          <GameHUD />
        </>
      )}
    </div>
  );
}
