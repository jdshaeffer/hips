import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import PunchLine from './PunchLine';
import getMoveDirection from './getMoveDirection';
import './App.css';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

function App() {
  // player position state
  const [posX1, setPosX1] = useState(150);
  const [posY1, setPosY1] = useState(150);
  const [posX2, setPosX2] = useState(50);
  const [posY2, setPosY2] = useState(50);
  const [p1Punching, setP1Punching] = useState(false);
  const [p2Punching, setP2Punching] = useState(false);
  const [p1PunchDirection, setP1PunchDirection] = useState('');
  const [p2PunchDirection, setP2PunchDirection] = useState('');

  // collision refs
  const player1Ref = useRef<HTMLDivElement>(null);
  const player2Ref = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);

  // other state
  const [moving, setMoving] = useState(false);
  const [direction, setDirection] = useState('');
  const [lastDirection, setLastDirection] = useState('n');
  const [playerCount, setPlayerCount] = useState(0);
  const [playerId, setPlayerId] = useState(0);

  const directionMap: { [key: string]: string } = {
    ArrowUp: 'n',
    ArrowDown: 's',
    ArrowRight: 'e',
    ArrowLeft: 'w',
    w: 'n',
    a: 'w',
    s: 's',
    d: 'e',
  };

  const validPunchDirection = () => {
    let dir = direction.slice(0, 2);
    if (dir === 'ew' || dir === 'we' || dir === 'sn' || dir === 'ns') {
      return direction[1];
    } else {
      return dir;
    }
  };

  const isValidDirection = (key: string, dir: string) =>
    ((key === 'ArrowUp' || key === 'w') && !dir.includes('n')) ||
    ((key === 'ArrowDown' || key === 's') && !dir.includes('s')) ||
    ((key === 'ArrowRight' || key === 'd') && !dir.includes('e')) ||
    ((key === 'ArrowLeft' || key === 'a') && !dir.includes('w'));

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isValidDirection(e.key, direction)) {
      setMoving(true);
      setDirection(direction + directionMap[e.key]);
    } else if (e.key === ' ') {
      if (e.repeat) return;
      const punchDirection =
        direction === '' ? lastDirection : validPunchDirection();
      // emitting pattern where the socket controls the state:
      // key press emits the event, the socket server emits back to all clients
      socket.emit(`p${playerId}Punching`, true, punchDirection);
      setTimeout(() => {
        socket.emit(`p${playerId}Punching`, false, '');
      }, 150);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') return;
    setLastDirection(direction);
    const mappedDirection = directionMap[e.key];
    if (mappedDirection) {
      const i = direction.indexOf(mappedDirection);
      setDirection(direction.slice(0, i) + direction.slice(i + 1));
      if (direction.length === 0) {
        setMoving(false);
      }
    }
  };

  const checkBorderCollision = () => {
    const borderBuffer = 4;
    const playerDiv = playerId === 1 ? player1Ref.current : player2Ref.current;
    const borderDiv = borderRef.current;

    const playerHitBox = playerDiv!.getBoundingClientRect();
    const borderHitBox = borderDiv!.getBoundingClientRect();

    const checkCollision = (side: keyof DOMRect) =>
      +playerHitBox[side] <= +borderHitBox[side] + borderBuffer;

    const checkCollisionAlt = (side: keyof DOMRect) =>
      +playerHitBox[side] >= +borderHitBox[side] - borderBuffer;

    let borderDetected = new Set<string>();
    if (checkCollision('left')) {
      borderDetected.add('w');
    } else {
      borderDetected.delete('w');
    }
    if (checkCollisionAlt('right')) {
      borderDetected.add('e');
    } else {
      borderDetected.delete('e');
    }
    if (checkCollisionAlt('bottom')) {
      borderDetected.add('s');
    } else {
      borderDetected.delete('s');
    }
    if (checkCollision('top')) {
      borderDetected.add('n');
    } else {
      borderDetected.delete('n');
    }
    return borderDetected;
  };

  const updatePlayerPosition = (dx: number, dy: number) => {
    if (playerId === 1) {
      setPosX1(posX1 + dx);
      setPosY1(posY1 + dy);
      socket.emit('p1Moving', { x: posX1, y: posY1 });
    } else {
      setPosX2(posX2 + dx);
      setPosY2(posY2 + dy);
      socket.emit('p2Moving', { x: posX2, y: posY2 });
    }
  };

  const move = () => {
    const [dx, dy] = getMoveDirection(direction, checkBorderCollision());
    if (direction.length === 0) {
      setMoving(false);
      return;
    }
    updatePlayerPosition(dx, dy);
  };

  // socket listener
  useEffect(() => {
    socket =
      process.env.NODE_ENV === 'production'
        ? io('https://nycmud.com', {
            path: '/socket.io',
          })
        : io('http://localhost:5000');
    socket.on('playerCountUpdate', (count: number) => {
      setPlayerCount(count);
    });
    socket.on('assignPlayerId', (id: number) => {
      setPlayerId(id);
    });
    socket.on('p1Moving', (pos) => {
      setPosX1(pos.x);
      setPosY1(pos.y);
    });
    socket.on('p2Moving', (pos) => {
      setPosX2(pos.x);
      setPosY2(pos.y);
    });
    socket.on('p1Punching', (isPunching, punchDirection) => {
      setP1Punching(isPunching);
      setP1PunchDirection(punchDirection);
    });
    socket.on('p2Punching', (isPunching, punchDirection) => {
      setP2Punching(isPunching);
      setP2PunchDirection(punchDirection);
    });
    socket.on('display', (res: string) => {
      console.log(res);
    });
  }, []);

  // move controller
  useEffect(() => {
    if (moving) {
      requestAnimationFrame(move);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  if (playerCount > 2) {
    return (
      <div className='center-box'>
        <p>sorry, only supporting 2 players at a time</p>
      </div>
    );
  } else {
    return (
      <div ref={borderRef} className='center-box'>
        <div
          id='player1'
          ref={player1Ref}
          className='player'
          style={{
            top: posY1,
            left: posX1,
            padding: '10px',
            border: '2px solid white',
          }}
        />
        {playerCount > 1 && (
          <div
            id='player2'
            ref={player2Ref}
            className='player'
            style={{
              top: posY2,
              left: posX2,
              padding: '10px',
              border: '2px solid red',
            }}
          />
        )}
        {p1Punching && (
          <PunchLine
            punchDirection={p1PunchDirection}
            posX={posX1}
            posY={posY1}
            color='white'
          />
        )}
        {p2Punching && (
          <PunchLine
            punchDirection={p2PunchDirection}
            posX={posX2}
            posY={posY2}
            color='red'
          />
        )}
      </div>
    );
  }
}

export default App;
