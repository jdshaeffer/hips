import { useEffect, useRef, useState } from "react";
import Player from "./components/Player";
import RemotePlayer from "./components/RemotePlayer";
import { io, Socket } from "socket.io-client";
import "./styles/App.css";
import type { NetPong, WorldSnapshot } from "../models/netcode";

interface NetStats {
  pingMs: number;
  fps: number;
  corrections: number;
  snapshotRate: number;
}

const initialNetStats: NetStats = {
  pingMs: 0,
  fps: 0,
  corrections: 0,
  snapshotRate: 0,
};

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

interface Props {
  name?: string;
  onBack?: () => void;
}

function App({ name, onBack }: Props) {
  const borderRef = useRef<HTMLDivElement>(null);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [socket] = useState<Socket>(() =>
    io(socketUrl, {
      path: "/socket.io",
    }),
  );
  const [clients, setClients] = useState<string[]>([]);
  const [socketError, setSocketError] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [netStats, setNetStats] = useState<NetStats>(initialNetStats);
  const snapshotCounterRef = useRef(0);

  useEffect(() => {
    const onSocketConnect = () => {
      setConnected(true);
      setSocketError(false);
      socket.emit("setName", name || "anonymous");
    };

    const onSocketDisconnect = () => {
      setConnected(false);
    };

    const onSocketError = () => {
      setSocketError(true);
    };

    const onClientUpdate = (clientIds: string[]) => {
      setClients(clientIds);
    };

    const onNetPong = ({ clientTime }: NetPong) => {
      setNetStats((prev) => ({
        ...prev,
        pingMs: Math.max(0, Date.now() - clientTime),
      }));
    };

    const onWorldSnapshot = (snapshot: WorldSnapshot) => {
      snapshotCounterRef.current += 1;
      setPlayerNames((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const p of snapshot.players) {
          if (next[p.id] !== p.name) { next[p.id] = p.name; changed = true; }
        }
        return changed ? next : prev;
      });
    };

    socket.on("connect", onSocketConnect);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("connect_error", onSocketError);
    socket.on("reconnect_error", onSocketError);
    socket.on("clientUpdate", onClientUpdate);
    socket.on("netPong", onNetPong);
    socket.on("worldSnapshot", onWorldSnapshot);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    const pingInterval = window.setInterval(() => {
      socket.emit("netPing", { clientTime: Date.now() });
    }, 2500);

    const snapshotRateInterval = window.setInterval(() => {
      setNetStats((prev) => ({
        ...prev,
        snapshotRate: snapshotCounterRef.current,
      }));
      snapshotCounterRef.current = 0;
    }, 1000);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearInterval(pingInterval);
      window.clearInterval(snapshotRateInterval);
      socket.off("connect", onSocketConnect);
      socket.off("disconnect", onSocketDisconnect);
      socket.off("connect_error", onSocketError);
      socket.off("reconnect_error", onSocketError);
      socket.off("clientUpdate", onClientUpdate);
      socket.off("netPong", onNetPong);
      socket.off("worldSnapshot", onWorldSnapshot);
      socket.close();
    };
  }, [socket, name]);

  return (
    <>
      <div ref={borderRef} className="center-box">
        <Player
          socket={socket}
          onStats={(statsUpdate) =>
            setNetStats((prev) => ({
              ...prev,
              ...statsUpdate,
            }))
          }
        />
        {clients
          .filter((id) => id !== socket.id)
          .map((id: string) => (
            <RemotePlayer key={id} socket={socket} clientId={id} />
          ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "white",
        }}
      >
        <h2>🚧 under construction!!! 🚧</h2>
        <p>use arrow/wasd to move, space to "punch"</p>
        Connected clients:{" "}
        {clients
          .filter((id) => !id.startsWith("npc_"))
          .map((id: string) => {
            const displayName = playerNames[id] || id;
            if (id !== socket.id) return `${displayName}, `;
            return (
              <i key={id} className="local-client-id">
                {displayName} (you),{" "}
              </i>
            );
          })}
      </div>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#444",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px 16px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
        >
          ← menu
        </button>
      )}
      <div className="network-status">
        {connected ? "" : socketError ? "🟥" : "🟧"}
      </div>
      <div className="net-debug">
        <div>ping: {Math.round(netStats.pingMs)}ms</div>
        <div>fps: {Math.round(netStats.fps)}</div>
        <div>reconciles: {netStats.corrections}</div>
        <div>snapshots/s: {netStats.snapshotRate}</div>
      </div>
    </>
  );
}

export default App;
