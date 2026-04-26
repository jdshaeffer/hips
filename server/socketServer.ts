import { Server } from "socket.io";
import {
  applyInputToState,
  getDirectionFromInput,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_SIZE,
} from "../models/movement.ts";
import type {
  InputCommand,
  NetPing,
  NetPong,
  PlayerState,
  PunchResult,
  WorldSnapshot,
} from "../models/netcode.ts";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://jdshaeffer.github.io",
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigins = allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;
const serverPort = Number(process.env.PORT || "8000");

const socketConfig = {
  path: "/socket.io",
  cors: {
    origin: corsOrigins,
    allowedHeaders: ["Access-Control-Allow-Origin"],
    methods: ["GET", "POST"],
  },
};

const io = new Server({ ...socketConfig, pingTimeout: 5000, pingInterval: 2000 });
const players: Record<string, PlayerState> = {};
const latestInputs: Record<string, InputCommand> = {};
const pendingPunches = new Set<string>();
let tick = 0;
const TICK_RATE = 30;
const SNAPSHOT_RATE = 15;
const SNAPSHOT_INTERVAL = Math.max(1, Math.floor(TICK_RATE / SNAPSHOT_RATE));

const NPC_COUNT = 5;
const NPC_PREFIX = "npc_";
const npcCooldowns: Record<string, number> = {};
const npcCurrentInputs: Record<string, Pick<InputCommand, "up" | "down" | "left" | "right">> = {};

const npcDirections = [
  { up: true,  down: false, left: false, right: false },
  { up: false, down: true,  left: false, right: false },
  { up: false, down: false, left: true,  right: false },
  { up: false, down: false, left: false, right: true  },
  { up: true,  down: false, left: false, right: true  },
  { up: true,  down: false, left: true,  right: false },
  { up: false, down: true,  left: false, right: true  },
  { up: false, down: true,  left: true,  right: false },
  { up: false, down: false, left: false, right: false }, // stopped
  { up: false, down: false, left: false, right: false }, // stopped (weighted 2x)
];
const randomNpcDir = () => npcDirections[Math.floor(Math.random() * npcDirections.length)];
const randomCooldown = () => TICK_RATE + Math.floor(Math.random() * TICK_RATE * 2);

const getClientIds = (): string[] => {
  return Array.from(io.of("/").sockets.keys());
};

const randColor = () => {
  return (
    "#" +
    ((Math.random() * 0x888888 + 0x888888) << 0).toString(16).padStart(6, "0")
  );
};

const updateClientIds = () => {
  const clientIds = getClientIds();
  const playerIds = Object.keys(players);

  playerIds.forEach((id) => {
    if (!id.startsWith(NPC_PREFIX) && !clientIds.includes(id)) {
      delete players[id];
      delete latestInputs[id];
      pendingPunches.delete(id);
    }
  });

  io.emit("clientUpdate", [...clientIds, ...Object.keys(npcCooldowns)]);
};

const emitSnapshot = () => {
  const snapshot: WorldSnapshot = {
    serverTime: Date.now(),
    tick,
    players: Object.values(players),
  };
  io.emit("worldSnapshot", snapshot);
};

const resolvePunches = () => {
  for (const puncherId of pendingPunches) {
    const puncher = players[puncherId];
    if (!puncher) continue;
    let hit = false;

    for (const opponent of Object.values(players)) {
      if (opponent.id === puncherId) continue;
      const dx = puncher.x - opponent.x;
      const dy = puncher.y - opponent.y;
      if (Math.hypot(dx, dy) <= 34) {
        const result: PunchResult = {
          puncherId,
          opponentId: opponent.id,
          hit: true,
          serverTime: Date.now(),
        };
        io.emit("punchResult", result);
        hit = true;
      }
    }

    if (!hit) {
      io.emit("punchResult", {
        puncherId,
        opponentId: "",
        hit: false,
        serverTime: Date.now(),
      } satisfies PunchResult);
    }
  }
  pendingPunches.clear();
};

const serverTick = () => {
  tick += 1;
  const dtSeconds = 1 / TICK_RATE;

  for (const id of Object.keys(npcCooldowns)) {
    npcCooldowns[id] -= 1;
    const npc = players[id];
    if (!npc) continue;
    const atWall =
      npc.x <= 0 || npc.x >= WORLD_WIDTH - PLAYER_SIZE ||
      npc.y <= 0 || npc.y >= WORLD_HEIGHT - PLAYER_SIZE;
    if (npcCooldowns[id] <= 0 || atWall) {
      npcCurrentInputs[id] = randomNpcDir();
      npcCooldowns[id] = randomCooldown();
    }
    const next = applyInputToState(npc, npcCurrentInputs[id], dtSeconds);
    players[id] = { ...next, dir: getDirectionFromInput(npcCurrentInputs[id]) || next.dir };
  }

  for (const [id, player] of Object.entries(players)) {
    if (id.startsWith(NPC_PREFIX)) continue;
    const input = latestInputs[id] ?? {
      seq: player.lastProcessedInput,
      timestamp: Date.now(),
      dt: dtSeconds * 1000,
      up: false,
      down: false,
      left: false,
      right: false,
      punch: false,
    };
    const nextState = applyInputToState(player, input, dtSeconds);
    players[id] = {
      ...nextState,
      lastProcessedInput: input.seq,
      dir: getDirectionFromInput(input) || nextState.dir,
    };
  }
  resolvePunches();
  if (tick % SNAPSHOT_INTERVAL === 0) {
    emitSnapshot();
  }
};

for (let i = 0; i < NPC_COUNT; i++) {
  const id = `${NPC_PREFIX}${i}`;
  players[id] = {
    id,
    x: Math.random() * (WORLD_WIDTH - PLAYER_SIZE),
    y: Math.random() * (WORLD_HEIGHT - PLAYER_SIZE),
    vx: 0,
    vy: 0,
    dir: "s",
    name: "npc",
    color: randColor(),
    lastProcessedInput: 0,
  };
  npcCurrentInputs[id] = randomNpcDir();
  npcCooldowns[id] = randomCooldown();
}

setInterval(serverTick, 1000 / TICK_RATE);

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected.`);
  players[socket.id] = {
    id: socket.id,
    x: 135,
    y: 135,
    vx: 0,
    vy: 0,
    dir: "",
    name: "bob",
    color: randColor(),
    lastProcessedInput: 0,
  };
  latestInputs[socket.id] = {
    seq: 0,
    timestamp: Date.now(),
    dt: 0,
    up: false,
    down: false,
    left: false,
    right: false,
    punch: false,
  };

  updateClientIds();
  emitSnapshot();

  socket.on("inputCommand", (input: InputCommand) => {
    latestInputs[socket.id] = input;
    if (input.punch) pendingPunches.add(socket.id);
  });

  socket.on("punchCommand", (input: Pick<InputCommand, "seq" | "timestamp">) => {
    latestInputs[socket.id] = {
      ...(latestInputs[socket.id] ?? {
        seq: 0,
        timestamp: Date.now(),
        dt: 0,
        up: false,
        down: false,
        left: false,
        right: false,
        punch: false,
      }),
      seq: input.seq,
      timestamp: input.timestamp,
      punch: true,
    };
    pendingPunches.add(socket.id);
  });

  socket.on("setName", (name: unknown) => {
    if (players[socket.id] && typeof name === "string") {
      players[socket.id].name = name.trim().slice(0, 20) || "anonymous";
    }
  });

  socket.on("netPing", ({ clientTime }: NetPing) => {
    socket.emit("netPong", {
      clientTime,
      serverTime: Date.now(),
    } satisfies NetPong);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    delete latestInputs[socket.id];
    pendingPunches.delete(socket.id);
    console.log(`Client ${socket.id} disconnected.`);
    updateClientIds();
    emitSnapshot();
  });
});

io.listen(serverPort);
