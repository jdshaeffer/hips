import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

interface SocketData
  extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
  data: any;
}

interface Position {
  x: number;
  y: number;
}

const socketConfig =
  process.env.NODE_ENV === 'prod'
    ? {
        path: '/socket.io',
      }
    : {
        cors: {
          origin: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
        },
      };

const io = new Server(socketConfig);
let playerCount = 0;
// the Map object holds key-value pairs and remembers the original insertion order of the keys
const socketToPlayerId = new Map<number, string>();

io.on('connection', (socket: SocketData) => {
  playerCount += 1;
  io.emit('playerCountUpdate', playerCount);
  if (playerCount < 3) {
    socketToPlayerId.set(playerCount, socket.id);
    // emit only back to sender to issue playerId
    socket.emit('assignPlayerId', playerCount);

    socket.on('updatePlayer1', (pos: Position) => {
      socket.broadcast.emit('updatePlayer1', pos);
    });
    socket.on('updatePlayer2', (pos: Position) => {
      socket.broadcast.emit('updatePlayer2', pos);
    });
  }
  socket.on('disconnect', () => {
    playerCount -= 1;
    socketToPlayerId.set(playerCount, socket.id);
    // need to emit to the remaining player that they're now player1
    socket.broadcast.emit('assignPlayerId', playerCount);
    io.emit('playerCountUpdate', playerCount);
  });
});

io.listen(5000);
