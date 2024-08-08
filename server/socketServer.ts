import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { HitBox } from '../models/HitBox';
import { PlayerData } from '../models/PlayerData';
import { PosData } from '../models/PosData';

interface SocketData
  extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
  data: any;
}

interface PositionUpdate {
  pos: PosData;
  hitBox: HitBox;
}

const socketConfig =
  process.env.NODE_ENV === 'prod'
    ? {
        path: '/socket.io',
      }
    : {
        cors: {
          origin: ['http://localhost:3000', 'https://jdshaeffer.github.io'],
          methods: ['GET', 'POST'],
        },
      };

const io = new Server(socketConfig);
const playerData: { [key: string]: PlayerData } = {};

const getClientIds = (): string[] => {
  return Array.from(io.of('/').sockets.keys());
};

const updateClientIds = () => {
  const clientIds = getClientIds();
  const playerIds = Object.keys(playerData);

  playerIds.forEach((id) => {
    if (!clientIds.includes(id)) delete playerData[id];
  });

  io.emit('clientUpdate', getClientIds());
};

io.on('connection', (socket: SocketData) => {
  console.log(`Client ${socket.id} connected.`);
  playerData[socket.id] = {
    pos: {
      x: 135,
      y: 135,
      dir: '',
    },
    name: 'bob',
    color: '#FFFFFF',
    hitBox: { top: 0, left: 0, bottom: 0, right: 0 },
  };

  updateClientIds();

  socket.on(`requestPlayerUpdate${socket.id}`, () => {
    socket.emit(`playerUpdate${socket.id}`, playerData[socket.id]);
  });

  // Purpose: request getting the entirety of the player values
  socket.on(`requestCacheDump${socket.id}`, () => {
    updateClientIds();
    Object.keys(playerData).forEach((pId: string) =>
      socket.emit(`playerUpdate${pId}`, playerData[pId])
    );
  });

  // Purpose: update all clients with entire player values
  socket.on(`playerUpdate${socket.id}`, (pd: PlayerData) => {
    playerData[socket.id] = pd;
    socket.broadcast.emit(`playerUpdate${socket.id}`, pd);
  });

  // Purpose: update all clients with only position values
  socket.on(`positionUpdate${socket.id}`, ({ pos, hitBox }: PositionUpdate) => {
    playerData[socket.id].pos = pos;
    playerData[socket.id].hitBox = hitBox;
    socket.broadcast.emit(`positionUpdate${socket.id}`, pos);
  });

  socket.on(`punchUpdate${socket.id}`, (isPunching) => {
    socket.broadcast.emit(`punchUpdate${socket.id}`, isPunching);
  });

  // receive player punch data, return response of opponents hit
  socket.on('punchCollision', (punchHitBox: HitBox, callback) => {
    const opponentIds = Object.keys(playerData).filter((id) => id != socket.id);
    const {
      bottom: pBottom,
      top: pTop,
      left: pLeft,
      right: pRight,
    } = punchHitBox;
    for (const id of opponentIds) {
      const opponentHitBox = playerData[id].hitBox;
      const {
        bottom: oBottom,
        top: oTop,
        left: oLeft,
        right: oRight,
      } = opponentHitBox;
      let xPunch = false;
      let yPunch = false;
      if (pBottom - oBottom <= 24 && pTop - oTop <= 24) {
        xPunch = true;
      }
      if (
        (pLeft - oLeft < 22 && pLeft - oLeft > -2) ||
        (pRight - oRight > 2 && pRight - oRight < 22)
      ) {
        yPunch = true;
      }
      if (xPunch && yPunch) {
        callback({
          punchCollision: true,
          puncher: socket.id,
          opponent: id,
        });
        console.log('*************PUNCH************');
      } else {
        callback({
          punchCollision: false,
        });
      }
    }
  });

  socket.on('disconnect', () => {
    delete playerData[socket.id];
    console.log(`Client ${socket.id} disconnected.`);
    updateClientIds();
  });
});

io.on('disconnect', (socket: any) => updateClientIds());
io.on('reconnect', (socket: any) => updateClientIds());

io.listen(3001);
