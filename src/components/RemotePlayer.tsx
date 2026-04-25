import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import type { PlayerState, PunchResult, WorldSnapshot } from "../../models/netcode";
import Sprite from "./Sprite";

interface Props {
  socket: Socket;
  clientId: string;
}

function RemotePlayer({ socket, clientId }: Props) {
  const punchRef = useRef<HTMLDivElement>(null);
  const [isPunching, setIsPunching] = useState(false);
  const [renderState, setRenderState] = useState<PlayerState>({
    id: clientId,
    x: 135,
    y: 135,
    vx: 0,
    vy: 0,
    dir: "s",
    color: "#ffffff",
    name: "remote",
    lastProcessedInput: 0,
  });
  const snapshotsRef = useRef<Array<{ receivedAt: number; state: PlayerState }>>([]);
  const interpolationDelayMs = 100;
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onWorldSnapshot = (snapshot: WorldSnapshot) => {
      const state = snapshot.players.find((player) => player.id === clientId);
      if (!state) return;
      snapshotsRef.current.push({ receivedAt: performance.now(), state });
      if (snapshotsRef.current.length > 40) {
        snapshotsRef.current.shift();
      }
    };

    const onPunchResult = ({ puncherId }: PunchResult) => {
      if (puncherId === clientId) {
        setIsPunching(true);
        window.setTimeout(() => setIsPunching(false), 150);
      }
    };

    socket.on("worldSnapshot", onWorldSnapshot);
    socket.on("punchResult", onPunchResult);
    return () => {
      socket.off("worldSnapshot", onWorldSnapshot);
      socket.off("punchResult", onPunchResult);
    };
  }, [clientId, socket]);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      const targetTime = performance.now() - interpolationDelayMs;
      const buffer = snapshotsRef.current;
      if (buffer.length >= 2) {
        let previous = buffer[0];
        let next = buffer[1];

        for (let index = 1; index < buffer.length; index += 1) {
          if (buffer[index].receivedAt >= targetTime) {
            next = buffer[index];
            previous = buffer[Math.max(0, index - 1)];
            break;
          }
          previous = buffer[index];
        }

        const span = Math.max(1, next.receivedAt - previous.receivedAt);
        const alpha = Math.min(1, Math.max(0, (targetTime - previous.receivedAt) / span));
        setRenderState({
          ...next.state,
          x: previous.state.x + (next.state.x - previous.state.x) * alpha,
          y: previous.state.y + (next.state.y - previous.state.y) * alpha,
        });
      } else if (buffer.length === 1) {
        setRenderState(buffer[0].state);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <>
      <Sprite
        punchRef={punchRef}
        ref={playerRef}
        x={renderState.x}
        y={renderState.y}
        dir={renderState.dir}
        punching={isPunching}
        color={renderState.color}
      />
    </>
  );
}

export default RemotePlayer;
