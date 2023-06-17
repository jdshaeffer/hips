import { useEffect, useState } from 'react';
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!moving) {
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowRight',
          'ArrowLeft',
          'w',
          'a',
          's',
          'd',
        ].includes(e.key)
      ) {
        setMoving(true);
        setDirection(e.key);
      }
    }
  };

  const handleKeyUp = () => {
    setMoving(false);
    setDirection('');
  };

  const move = () => {
    let dx = 0;
    let dy = 0;
    const speed = 2;
    if (direction === 'ArrowUp' || direction === 'w') {
      dy -= speed;
    } else if (direction === 'ArrowDown' || direction === 's') {
      dy += speed;
    } else if (direction === 'ArrowLeft' || direction === 'a') {
      dx -= speed;
    } else if (direction === 'ArrowRight' || direction === 'd') {
      dx += speed;
    }

    // check for diagonal movement - TODO: doesn't work yet
    // calculate it once
    // if (dx !== 0 && dy !== 0) {
    //   // move diagonally with a speed of sqrt(2)/2
    //   dx *= Math.sqrt(2) / 2;
    //   dy *= Math.sqrt(2) / 2;
    // }

    // if (playerId === 1) {
    setPosX1(posX1 + dx);
    setPosY1(posY1 + dy);
    // socket.emit('updatePlayer1', { x: posX1, y: posY1 });
    // } else {
    // setPosX2(posX2 + dx);
    // setPosY2(posY2 + dy);
    // socket.emit('updatePlayer2', { x: posX2, y: posY2 });
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
      <div className='center-box'>
        <h1
          id='player1'
          className='player'
          style={{
            top: posY1,
            left: posX1,
          }}
        >
          @
        </h1>
        {playerCount > 1 && (
          <h1
            id='player2'
            className='player'
            style={{
              top: posY2,
              left: posX2,
              color: 'red',
            }}
          >
            @
          </h1>
        )}
      </div>
    );
  }
}

export default Game;
