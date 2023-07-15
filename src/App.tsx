import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import './App.css';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

function Game() {
  const [posX1, setPosX1] = useState(150);
  const [posY1, setPosY1] = useState(150);
  const [posX2, setPosX2] = useState(50);
  const [posY2, setPosY2] = useState(50);
  const [moving, setMoving] = useState(false);
  const [direction, setDirection] = useState('');
  const [playerCount, setPlayerCount] = useState(0);
  const [playerId, setPlayerId] = useState(0);

  const player1Ref = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);

  const validKeys = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowRight',
    'ArrowLeft',
    'w',
    'a',
    's',
    'd',
  ]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (validKeys.has(e.key)) {
      setMoving(true);
      if (
        (e.key === 'ArrowUp' || e.key === 'w') &&
        direction.indexOf('n') == -1
      ) {
        setDirection(direction + 'n');
      } else if (
        (e.key === 'ArrowDown' || e.key === 's') &&
        direction.indexOf('s') == -1
      ) {
        setDirection(direction + 's');
      } else if (
        (e.key === 'ArrowRight' || e.key === 'd') &&
        direction.indexOf('e') == -1
      ) {
        setDirection(direction + 'e');
      } else if (
        (e.key === 'ArrowLeft' || e.key === 'a') &&
        direction.indexOf('w') == -1
      ) {
        setDirection(direction + 'w');
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (validKeys.has(e.key)) {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        let i = direction.indexOf('n');
        setDirection(direction.substring(0, i) + direction.substring(i + 1));
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        let i = direction.indexOf('s');
        setDirection(direction.substring(0, i) + direction.substring(i + 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        let i = direction.indexOf('e');
        setDirection(direction.substring(0, i) + direction.substring(i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        let i = direction.indexOf('w');
        setDirection(direction.substring(0, i) + direction.substring(i + 1));
      }
      if (direction.length == 0) {
        setMoving(false);
      }
    }
  };

  const checkBorderCollision = () => {
    const borderBuffer = 4;
    const player1Div = player1Ref.current;
    const borderDiv = borderRef.current;

    const player1HitBox = player1Div!.getBoundingClientRect();
    const borderHitBox = borderDiv!.getBoundingClientRect();

    let borderDetected = new Set<string>();
    if (player1HitBox.left <= borderHitBox.left + borderBuffer) {
      borderDetected.add('w');
    } else {
      borderDetected.delete('w');
    }
    if (player1HitBox.right >= borderHitBox.right - borderBuffer) {
      borderDetected.add('e');
    } else {
      borderDetected.delete('e');
    }
    if (player1HitBox.bottom >= borderHitBox.bottom - borderBuffer) {
      borderDetected.add('s');
    } else {
      borderDetected.delete('s');
    }
    if (player1HitBox.top <= borderHitBox.top + borderBuffer) {
      borderDetected.add('n');
    } else {
      borderDetected.delete('n');
    }
    return borderDetected;
  };

  const move = () => {
    let dx = 0;
    let dy = 0;
    const speed = 2;
    const diagspd = 1.4;

    const borderCollision = checkBorderCollision();
    const l = direction.length;

    if (l === 1) {
      if (direction === 'n' && !borderCollision.has('n')) {
        dy -= speed;
      } else if (direction === 's' && !borderCollision.has('s')) {
        dy += speed;
      } else if (direction === 'w' && !borderCollision.has('w')) {
        dx -= speed;
      } else if (direction === 'e' && !borderCollision.has('e')) {
        dx += speed;
      }
    } else if (l === 2) {
      if (direction === 'ne') {
        if (borderCollision.has('n') && !borderCollision.has('e')) {
          dx += speed;
        } else if (borderCollision.has('e') && !borderCollision.has('n')) {
          dy -= speed;
        } else if (!borderCollision.has('n') && !borderCollision.has('e')) {
          dy -= diagspd;
          dx += diagspd;
        }
      } else if (direction === 'nw') {
        if (borderCollision.has('n') && !borderCollision.has('w')) {
          dx -= speed;
        } else if (borderCollision.has('w') && !borderCollision.has('n')) {
          dy -= speed;
        } else if (!borderCollision.has('n') && !borderCollision.has('w')) {
          dy -= diagspd;
          dx -= diagspd;
        }
      } else if (direction === 'se') {
        if (borderCollision.has('s') && !borderCollision.has('e')) {
          dx += speed;
        } else if (borderCollision.has('e') && !borderCollision.has('s')) {
          dy += speed;
        } else if (!borderCollision.has('s') && !borderCollision.has('e')) {
          dy += diagspd;
          dx += diagspd;
        }
      } else if (direction === 'sw') {
        if (borderCollision.has('s') && !borderCollision.has('w')) {
          dx -= speed;
        } else if (borderCollision.has('w') && !borderCollision.has('s')) {
          dy += speed;
        } else if (!borderCollision.has('s') && !borderCollision.has('w')) {
          dy += diagspd;
          dx -= diagspd;
        }
      } else {
        setMoving(false);
      }
    } else if (l == 0 || l > 2) {
      setMoving(false);
    }

    if (playerId === 1) {
      setPosX1(posX1 + dx);
      setPosY1(posY1 + dy);
      socket.emit('updatePlayer1', { x: posX1, y: posY1 });
    } else {
      setPosX2(posX2 + dx);
      setPosY2(posY2 + dy);
      socket.emit('updatePlayer2', { x: posX2, y: posY2 });
    }
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
    socket.on('updatePlayer1', (pos) => {
      setPosX1(pos.x);
      setPosY1(pos.y);
    });
    socket.on('updatePlayer2', (pos) => {
      setPosX2(pos.x);
      setPosY2(pos.y);
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
            className='player'
            style={{
              top: posY2,
              left: posX2,
              padding: '10px',
              border: '2px solid red',
            }}
          />
        )}
      </div>
    );
  }
}

export default Game;
