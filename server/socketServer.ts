import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { PlayerData } from '../models/PlayerData';
import { PosData } from '../models/PosData';

interface SocketData
  extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
  data: any;
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
  // io.timeout(1000).emit("areYouThere")
  const clientIds = getClientIds();
  const playerIds = Object.keys(playerData);
  console.log('Update client ids: ' + getClientIds());

  const rm = playerIds.forEach((id) => {
    if (!clientIds.includes(id)) delete playerData[id];
  });

  io.emit('clientUpdate', getClientIds());
};

io.on('connection', (socket: SocketData) => {
  playerData[socket.id] = {
    pos: {
      x: 135,
      y: 135,
      dir: '',
    },
    name: 'bob',
    color: '#FFFFFF',
  };

  updateClientIds();

  // Purpose: update newly connected clients with present values
  socket.on(`requestPlayerUpdate${socket.id}`, () => {
    socket.emit(`playerUpdate${socket.id}`, playerData[socket.id]);
  });

  // Purpose: request getting the entirety of the player values
  socket.on(`requestCacheDump${socket.id}`, () => {
    updateClientIds();
    Object.keys(playerData).forEach((pId: string) =>
      socket.emit(`playerUpdate${pId}`, playerData[pId])
    );
    // Object.values(playerData).forEach((pd: PlayerData) => socket.emit(`playerUpdate${pd.id}`, pd));
  });

  // Purpose: update all clients with entire player values
  socket.on(`playerUpdate${socket.id}`, (pd: PlayerData) => {
    console.log(`color: ${pd.color}`);
    if (playerData[socket.id].color !== pd.color)
      console.log(
        `colorUpdate from ${playerData[socket.id].color} to ${
          pd.color
        } on client ${socket.id}`
      );

    playerData[socket.id] = pd;
    socket.broadcast.emit(`playerUpdate${socket.id}`, pd);
  });

  // Purpose: update all clients with only position values
  socket.on(`positionUpdate${socket.id}`, (pos: PosData) => {
    playerData[socket.id].pos = pos;
    socket.broadcast.emit(`positionUpdate${socket.id}`, pos);
  });

  // Purpose: update all clients with only punching value
  socket.on(`punchUpdate${socket.id}`, (punching: false) => {
    socket.broadcast.emit(`punchUpdate${socket.id}`, punching);
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
