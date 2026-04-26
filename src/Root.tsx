import { useState } from "react";
import App from "./App.tsx";
import MainMenu from "./components/MainMenu.tsx";
import GameSelect from "./components/GameSelect.tsx";

type Screen = "menu" | "select" | "game";

export default function Root() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playerName, setPlayerName] = useState("");

  if (screen === "game") return <App name={playerName} onBack={() => setScreen("menu")} />;
  if (screen === "select") return (
    <GameSelect
      onPlay={() => setScreen("game")}
      onBack={() => setScreen("menu")}
    />
  );
  return (
    <MainMenu
      onPlay={(name) => {
        setPlayerName(name);
        setScreen("select");
      }}
    />
  );
}
