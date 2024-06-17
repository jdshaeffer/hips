import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { PlayerData } from '../models/PlayerData';
import { randomInt } from 'crypto';

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

// NOTE: the Map object holds key-value pairs
// and remembers the original insertion order of the keys
// const socketToPlayerId = new Map<number, string>();
const playerData = new Map<string, PlayerData>();
const playerClients: string[] = [];

io.on('connection', (socket: SocketData) => {
  playerClients.push(socket.id);
  socket.emit('playerAssignment', socket.id);

  console.log(playerClients);
  io.emit('playerConnect', playerClients);

  socket.on(`playerUpdate${socket.id}`, () => {
    socket.broadcast.emit(
      `playerUpdate${socket.id}`,
      playerData.get(socket.id)
    );
  });

  socket.on('disconnect', () => {
    const i = playerClients.indexOf(socket.id);
    playerClients.splice(i, 1);
    console.log(playerClients);
    io.emit('playerDisconnect', playerClients);
  });
});

io.listen(3001);
