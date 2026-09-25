import { ChessCanvas } from "./ChessScene";
import { GameHUD } from "./GameHUD";

export default function GameApp() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <div className="absolute inset-0">
        <ChessCanvas />
      </div>
      <GameHUD />
    </div>
  );
}
