export interface InputCommand {
  seq: number;
  timestamp: number;
  dt: number;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  punch: boolean;
}

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: string;
  color: string;
  name: string;
  lastProcessedInput: number;
}

export interface WorldSnapshot {
  serverTime: number;
  tick: number;
  players: PlayerState[];
}

export interface NetPing {
  clientTime: number;
}

export interface NetPong {
  clientTime: number;
  serverTime: number;
}

export interface PunchResult {
  puncherId: string;
  opponentId: string;
  hit: boolean;
  serverTime: number;
}
