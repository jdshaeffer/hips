import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { applyInputToState } from "../../models/movement";
import type { InputCommand, PlayerState, PunchResult, WorldSnapshot } from "../../models/netcode";
import "../styles/App.css";
import Sprite from "./Sprite";

interface Props {
  socket: Socket;
  onStats?: (stats: { fps?: number; corrections?: number }) => void;
}

const randColor = () => {
  return (
    "#" +
    ((Math.random() * 0x888888 + 0x888888) << 0).toString(16).padStart(6, "0")
  );
};

const movementKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"]);

function Player({ socket, onStats }: Props) {
  const [isPunching, setIsPunching] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const punchRef = useRef<HTMLDivElement>(null);
  const [localState, setLocalState] = useState<PlayerState>({
    id: "",
    x: 135,
    y: 135,
    vx: 0,
    vy: 0,
    dir: "",
    color: randColor(),
    name: "bob",
    lastProcessedInput: 0,
  });
  const localStateRef = useRef(localState);
  const pressedKeysRef = useRef<Record<string, boolean>>({});
  const pendingInputsRef = useRef<InputCommand[]>([]);
  const seqRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const correctionsRef = useRef(0);

  useEffect(() => {
    const buildInput = (dt: number, punch: boolean): InputCommand => {
      const keys = pressedKeysRef.current;
      const input: InputCommand = {
        seq: (seqRef.current += 1),
        timestamp: Date.now(),
        dt,
        up: !!(keys.ArrowUp || keys.w),
        down: !!(keys.ArrowDown || keys.s),
        left: !!(keys.ArrowLeft || keys.a),
        right: !!(keys.ArrowRight || keys.d),
        punch,
      };
      return input;
    };

    const sendInputTimer = window.setInterval(() => {
      const input = buildInput(50, false);
      pendingInputsRef.current.push(input);
      socket.emit("inputCommand", input);
    }, 50);

    return () => window.clearInterval(sendInputTimer);
  }, [socket]);

  useEffect(() => {
    let previousFrame = performance.now();
    let frameCount = 0;
    let fpsWindowStart = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - previousFrame) / 1000);
      previousFrame = now;
      const keys = pressedKeysRef.current;
      const current = localStateRef.current;
      const next = applyInputToState(
        current,
        {
          up: !!(keys.ArrowUp || keys.w),
          down: !!(keys.ArrowDown || keys.s),
          left: !!(keys.ArrowLeft || keys.a),
          right: !!(keys.ArrowRight || keys.d),
        },
        dt,
      );
      localStateRef.current = next;
      setLocalState(next);

      frameCount += 1;
      if (now - fpsWindowStart >= 1000) {
        onStats?.({
          fps: frameCount,
          corrections: correctionsRef.current,
        });
        frameCount = 0;
        fpsWindowStart = now;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [onStats]);

  useEffect(() => {
    const onWorldSnapshot = (snapshot: WorldSnapshot) => {
      if (!socket.id) return;
      const authoritative = snapshot.players.find((player) => player.id === socket.id);
      if (!authoritative) return;

      const current = localStateRef.current;

      const pending = pendingInputsRef.current.filter(
        (input) => input.seq > authoritative.lastProcessedInput,
      );
      pendingInputsRef.current = pending;

      let reconciled = { ...authoritative };
      for (const input of pending) {
        reconciled = applyInputToState(reconciled, input, input.dt / 1000);
      }

      const errorDistance = Math.hypot(reconciled.x - current.x, reconciled.y - current.y);
      if (errorDistance > 3) {
        correctionsRef.current += 1;
        localStateRef.current = reconciled;
        setLocalState(reconciled);
      }
    };

    const onPunchResult = ({ puncherId, opponentId, hit }: PunchResult) => {
      if (puncherId === socket.id && hit) {
        console.log(`${puncherId} just clocked ${opponentId}!`);
      }
    };

    socket.on("worldSnapshot", onWorldSnapshot);
    socket.on("punchResult", onPunchResult);
    return () => {
      socket.off("worldSnapshot", onWorldSnapshot);
      socket.off("punchResult", onPunchResult);
    };
  }, [socket]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (movementKeys.has(event.key)) {
        pressedKeysRef.current[event.key] = true;
      }
      if (event.key === " " && !event.repeat) {
        setIsPunching(true);
        const seq = (seqRef.current += 1);
        socket.emit("punchCommand", { seq, timestamp: Date.now() });
        window.setTimeout(() => setIsPunching(false), 150);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (movementKeys.has(event.key)) {
        pressedKeysRef.current[event.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [socket]);

  return (
    <>
      <Sprite
        punchRef={punchRef}
        ref={playerRef}
        x={localState.x}
        y={localState.y}
        dir={localState.dir}
        punching={isPunching}
        color={localState.color}
      />
    </>
  );
}

export default Player;
