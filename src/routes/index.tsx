import { createFileRoute } from "@tanstack/react-router";
import GameApp from "@/game/GameApp";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return <GameApp />;
}
