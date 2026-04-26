import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./styles/App.css";
import App from "./App.tsx";
import MainMenu from "./components/MainMenu.tsx";
import GameSelect from "./components/GameSelect.tsx";

type Screen = "menu" | "select" | "game";

function Root() {
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
