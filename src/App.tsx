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
  const [collision1, setCollision1] = useState(false);

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
    if (!moving) {
      if (validKeys.has(e.key) && !collision1) {
        setMoving(true);
        if (e.key === 'ArrowUp' || e.key === 'w') {
          setDirection('n');
        } else if (e.key === 'ArrowDown' || e.key === 's') {
          setDirection('s');
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          setDirection('e');
        } else if (e.key === 'ArrowLeft' || e.key === 'a') {
          setDirection('w');
        }
      }
    } else {
      if (
        validKeys.has(e.key) &&
        !(direction === 'n' && (e.key === 'w' || e.key === 'ArrowUp')) &&
        !(direction === 's' && (e.key === 's' || e.key === 'ArrowDown')) &&
        !(direction === 'e' && (e.key === 'd' || e.key === 'ArrowRight')) &&
        !(direction === 'w' && (e.key === 'a' || e.key === 'ArrowLeft')) &&
        !(
          direction === 'ne' ||
          direction === 'nw' ||
          direction === 'se' ||
          direction === 'sw'
        )
      ) {
        if (direction === 'n') {
          if (e.key === 'ArrowRight' || e.key === 'd') {
            setDirection('ne');
          } else if (e.key === 'ArrowLeft' || e.key === 'a') {
            setDirection('nw');
          } else if (e.key === 'ArrowDown' || e.key === 's') {
            setMoving(false);
            setDirection('');
          }
        } else if (direction === 'e') {
          if (e.key === 'ArrowUp' || e.key === 'w') {
            setDirection('ne');
          } else if (e.key === 'ArrowDown' || e.key === 's') {
            setDirection('se');
          } else if (e.key === 'ArrowLeft' || e.key === 'a') {
            setMoving(false);
            setDirection('');
          }
        } else if (direction === 's') {
          if (e.key === 'ArrowLeft' || e.key === 'a') {
            setDirection('sw');
          } else if (e.key === 'ArrowRight' || e.key === 'd') {
            setDirection('se');
          } else if (e.key === 'ArrowUp' || e.key === 'w') {
            setMoving(false);
            setDirection('');
          }
        } else if (direction === 'w') {
          if (e.key === 'ArrowDown' || e.key === 's') {
            setDirection('sw');
          } else if (e.key === 'ArrowUp' || e.key === 'w') {
            setDirection('nw');
          } else if (e.key === 'ArrowRight' || e.key === 'd') {
            setMoving(false);
            setDirection('');
          }
        }
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (validKeys.has(e.key)) {
      if (direction === 'ne') {
        if (e.key === 'ArrowUp' || e.key === 'w') {
          setDirection('e');
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          setDirection('n');
        }
      } else if (direction === 'nw') {
        if (e.key === 'ArrowUp' || e.key === 'w') {
          setDirection('w');
        } else if (e.key === 'ArrowLeft' || e.key === 'a') {
          setDirection('n');
        }
      } else if (direction === 'se') {
        if (e.key === 'ArrowDown' || e.key === 's') {
          setDirection('e');
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          setDirection('s');
        }
      } else if (direction === 'sw') {
        if (e.key === 'ArrowDown' || e.key === 's') {
          setDirection('w');
        } else if (e.key === 'ArrowLeft' || e.key === 'a') {
          setDirection('s');
        }
      } else {
        setMoving(false);
        setDirection('');
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
    console.log(borderDetected);
    return borderDetected;
  };

  const move = () => {
    let dx = 0;
    let dy = 0;
    const speed = 2;
    const diagspd = 1.4;

    const borderCollision = checkBorderCollision();

    if (direction === 'n' && !borderCollision.has('n')) {
      dy -= speed;
    } else if (direction === 's' && !borderCollision.has('s')) {
      dy += speed;
    } else if (direction === 'w' && !borderCollision.has('w')) {
      dx -= speed;
    } else if (direction === 'e' && !borderCollision.has('e')) {
      dx += speed;
    } else if (
      direction === 'ne' &&
      !borderCollision.has('n') &&
      !borderCollision.has('e')
    ) {
      dy -= diagspd;
      dx += diagspd;
    } else if (
      direction === 'nw' &&
      !borderCollision.has('n') &&
      !borderCollision.has('w')
    ) {
      dy -= diagspd;
      dx -= diagspd;
    } else if (
      direction === 'se' &&
      !borderCollision.has('s') &&
      !borderCollision.has('e')
    ) {
      dy += diagspd;
      dx += diagspd;
    } else if (
      direction === 'sw' &&
      !borderCollision.has('s') &&
      !borderCollision.has('w')
    ) {
      dy += diagspd;
      dx -= diagspd;
    }

    // if (playerId === 1) {
    setPosX1(posX1 + dx);
    setPosY1(posY1 + dy);
    //   socket.emit('updatePlayer1', { x: posX1, y: posY1 });
    // } else {
    //   setPosX2(posX2 + dx);
    //   setPosY2(posY2 + dy);
    //   socket.emit('updatePlayer2', { x: posX2, y: posY2 });
    // }
  };

  // socket listener
  // useEffect(() => {
  //   socket =
  //     process.env.NODE_ENV === 'production'
  //       ? io('https://nycmud.com', {
  //           path: '/socket.io',
  //         })
  //       : io('http://localhost:5000');
  //   socket.on('playerCountUpdate', (count: number) => {
  //     setPlayerCount(count);
  //   });
  //   socket.on('assignPlayerId', (id: number) => {
  //     setPlayerId(id);
  //   });
  //   socket.on('updatePlayer1', (pos) => {
  //     setPosX1(pos.x);
  //     setPosY1(pos.y);
  //   });
  //   socket.on('updatePlayer2', (pos) => {
  //     setPosX2(pos.x);
  //     setPosY2(pos.y);
  //   });
  //   socket.on('display', (res: string) => {
  //     console.log(res);
  //   });
  // }, []);

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
