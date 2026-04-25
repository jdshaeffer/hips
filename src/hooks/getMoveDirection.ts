import {
  PLAYER_SPEED,
  applyInputToState,
  getDirectionFromInput,
} from "../../models/movement";
import type { InputCommand, PlayerState } from "../../models/netcode";

const directionToInput = (direction: string): InputCommand => {
  return {
    seq: 0,
    timestamp: 0,
    dt: 0,
    up: direction.includes("n"),
    down: direction.includes("s"),
    left: direction.includes("w"),
    right: direction.includes("e"),
    punch: false,
  };
};

const getMoveDirection = (direction: string, border: Set<string>) => {
  const input = directionToInput(direction);
  const simulated = applyInputToState(
    {
      id: "local",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      dir: getDirectionFromInput(input),
      color: "#fff",
      name: "local",
      lastProcessedInput: 0,
    } as PlayerState,
    input,
    1 / PLAYER_SPEED,
  );
  let dx = simulated.x;
  let dy = simulated.y;
  if ((dy < 0 && border.has("n")) || (dy > 0 && border.has("s"))) dy = 0;
  if ((dx < 0 && border.has("w")) || (dx > 0 && border.has("e"))) dx = 0;

  return [dx, dy];
};

export default getMoveDirection;
