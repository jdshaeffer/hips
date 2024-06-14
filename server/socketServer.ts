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
// const playerData: [Player] = [];

io.on('connection', (socket: SocketData) => {
  socket.broadcast.emit('playerConnect', socket.id);

  socket.on(`playerUpdate${socket.id}`, () => {
    socket.broadcast.emit(`playerUpdate${socket.id}`, playerData.get(socket.id));
  });
  
  socket.on('disconnect', () => {
    playerData.delete(socket.id);
    io.emit('playerDisconnect', socket.id);
  });
});

io.listen(3001);
