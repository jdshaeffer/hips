import type { InputCommand, PlayerState } from "./netcode";

export const PLAYER_SPEED = 140;
export const WORLD_WIDTH = 300;
export const WORLD_HEIGHT = 300;
export const PLAYER_SIZE = 24;

const getAxisValue = (negative: boolean, positive: boolean): number => {
  if (negative === positive) return 0;
  return negative ? -1 : 1;
};

export const getDirectionFromInput = (input: Pick<InputCommand, "up" | "down" | "left" | "right">): string => {
  let dir = "";
  if (input.up) dir += "n";
  if (input.down) dir += "s";
  if (input.right) dir += "e";
  if (input.left) dir += "w";
  return dir;
};

export const applyInputToState = (
  state: PlayerState,
  input: Pick<InputCommand, "up" | "down" | "left" | "right">,
  dtSeconds: number,
): PlayerState => {
  const axisX = getAxisValue(input.left, input.right);
  const axisY = getAxisValue(input.up, input.down);
  const axisMagnitude = Math.hypot(axisX, axisY) || 1;

  const nx = axisX / axisMagnitude;
  const ny = axisY / axisMagnitude;
  const vx = nx * PLAYER_SPEED;
  const vy = ny * PLAYER_SPEED;

  const nextX = Math.min(
    WORLD_WIDTH - PLAYER_SIZE,
    Math.max(0, state.x + vx * dtSeconds),
  );
  const nextY = Math.min(
    WORLD_HEIGHT - PLAYER_SIZE,
    Math.max(0, state.y + vy * dtSeconds),
  );

  return {
    ...state,
    x: nextX,
    y: nextY,
    vx,
    vy,
    dir: getDirectionFromInput(input) || state.dir,
  };
};
