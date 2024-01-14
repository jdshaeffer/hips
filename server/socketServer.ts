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
          origin: ['http://localhost:3000', 'https://jdshaeffer.github.io'],
          methods: ['GET', 'POST'],
        },
      };

const io = new Server(socketConfig);
let playerCount = 0;

// NOTE: the Map object holds key-value pairs
// and remembers the original insertion order of the keys
const socketToPlayerId = new Map<number, string>();

io.on('connection', (socket: SocketData) => {
  console.log('socket server connected to client');
  playerCount += 1;
  io.emit('playerCountUpdate', playerCount);
  if (playerCount < 3) {
    socketToPlayerId.set(playerCount, socket.id);
    // emit only back to sender to issue playerId
    socket.emit('assignPlayerId', playerCount);

    socket.on('p1Moving', (pos: Position) => {
      // to all clients except sender
      socket.broadcast.emit('p1Moving', pos);
    });
    socket.on('p2Moving', (pos: Position) => {
      socket.broadcast.emit('p2Moving', pos);
    });
    socket.on('p1Punching', (isPunching: boolean, punchDirection: string) => {
      // to all connected clients
      io.emit('p1Punching', isPunching, punchDirection);
    });
    socket.on('p2Punching', (isPunching: boolean, punchDirection: string) => {
      io.emit('p2Punching', isPunching, punchDirection);
    });
  }
  socket.on('disconnect', () => {
    playerCount -= 1;
    socketToPlayerId.set(playerCount, socket.id);

    // need to emit to the remaining player that they're now player1 when player1 disconnects
    socket.broadcast.emit('assignPlayerId', playerCount);
    io.emit('playerCountUpdate', playerCount);
  });
});

io.listen(5000);
