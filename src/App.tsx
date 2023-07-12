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
    if (validKeys.includes(e.key)) {
      setMoving(true);
      // console.log('Key pressed: ' + e.key);
      if((e.key === 'ArrowUp' || e.key === 'w') && direction.indexOf('n') == -1) setDirection(direction + 'n');
      else if((e.key === 'ArrowDown' || e.key === 's') && direction.indexOf('s') == -1) setDirection(direction + 's');
      else if((e.key === 'ArrowRight' || e.key === 'd') && direction.indexOf('e') == -1) setDirection(direction + 'e');
      else if((e.key === 'ArrowLeft' || e.key === 'a') && direction.indexOf('w') == -1) setDirection(direction + 'w');
      console.log('Key down: ' + e.key);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if(validKeys.includes(e.key)) {
      if(e.key === 'ArrowUp' || e.key === 'w') {
        let i = direction.indexOf('n');
        setDirection(direction.substring(0,i)+direction.substring(i+1));
      }
      else if(e.key === 'ArrowDown' || e.key === 's') {
        let i = direction.indexOf('s');
        setDirection(direction.substring(0,i)+direction.substring(i+1));
      }
      else if(e.key === 'ArrowRight' || e.key === 'd') {
        let i = direction.indexOf('e');
        setDirection(direction.substring(0,i)+direction.substring(i+1));
      }
      else if(e.key === 'ArrowLeft' || e.key === 'a') {
        let i = direction.indexOf('w');
        setDirection(direction.substring(0,i)+direction.substring(i+1));
      }
      console.log('Key up: ' + e.key);
      if(direction.length == 0) setMoving(false);
    }
  };

  const move = () => {
    let dx = 0;
    let dy = 0;
    const speed = 2;
    const diagspd = 1.4;
    let l = direction.length;
    if(l == 1) {
      if(direction === 'n') dy -= speed;
      else if(direction === 's') dy += speed;
      else if(direction === 'e') dx += speed;
      else if(direction === 'w') dx -= speed;
    } else if(l == 2) {
      if(direction === 'ne' || direction === 'en') { dx += diagspd; dy -= diagspd; }
      else if (direction === 'se' || direction === 'es') { dx += diagspd; dy += diagspd; }
      else if (direction === 'sw' || direction === 'ws') { dx -= diagspd; dy += diagspd; }
      else if (direction === 'nw' || direction === 'wn') { dx -= diagspd; dy -= diagspd; }
      else setMoving(false);
    } else if(l == 0 || l > 2) {
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
