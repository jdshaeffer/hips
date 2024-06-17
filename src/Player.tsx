import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import PunchLine from './PunchLine';
import getMoveDirection from './getMoveDirection';
import './App.css';
import { PlayerData } from '../models/PlayerData';
import { PosData } from '../models/PosData';

interface Props {
  borderRef: any;
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  isRemote: boolean; // only needed when this player component belongs to a remote client
  clientId: string; // only needed when this player component belongs to a remote client
}

// function Player(isLocal = true, socketId = "") {
function Player({ borderRef, socket, isRemote, clientId }: Props) {
  const [punching, setPunching] = useState(false);
  const [punchDir, setPunchDir] = useState('');

  const [id, setId] = useState('');
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [name, setName] = useState('Bob');
  const [color, setColor] = useState('#ffffff');
  const [direction, setDirection] = useState('');

  // const [playerData, setPlayerData] = useState({
  //   id: '',
  //   color: 'white',
  //   name: 'Bob',
  //   dir: '',
  //   x: 50,
  //   y: 50,
  // });

  // html ref
  const playerRef = useRef<HTMLDivElement>(null);

  // other state
  const [moving, setMoving] = useState(false);
  const [lastDirection, setLastDirection] = useState('n');

  // ================= LOCAL ONLY ====================

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
    }

    if (e.key === ' ' && !e.repeat) {
      const punchDirection =
        direction === '' ? lastDirection : validPunchDirection();
      setPunchDir(punchDirection);
      setTimeout(() => setPunching(false), 150);
      setPunching(true);
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
    const playerDiv = playerRef.current;
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

  const move = () => {
    if (borderRef === null) return;

    const [dx, dy] = getMoveDirection(direction, checkBorderCollision());

    if (direction.length === 0) {
      setMoving(false);
      return;
    } else {
      updatePlayerPosition(dx, dy);
    }
  };

  const emitPlayerUpdate = () => {
    if (socket !== undefined && !isRemote)
      socket.emit(`playerUpdate${socket.id}`, {
        pos: {
          x,
          y,
          dir: direction,
        },
        id: socket.id,
        color: color,
        name: name,
      });
  };

  const emitPositionUpdate = () => {
    if (socket !== undefined && !isRemote)
      socket.emit(`positionUpdate${socket.id}`, { x, y, dir: direction });
  };

  const updatePlayerPosition = (dx: number, dy: number) => {
    setX(x + dx);
    setY(y + dy);
    // emitPositionUpdate();
  };

  const randColor = () => {
    return (
      '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0')
    );
  };

  useEffect(() => {
    const color = randColor();
    setColor(color);
    if (!isRemote) {
      emitPlayerUpdate();
    } else {
      socket.on(`playerUpdate${clientId}`, (playerChanges: PlayerData) => {
        if (playerChanges.pos.x !== x) setX(playerChanges.pos.x);
        if (playerChanges.pos.y !== y) setY(playerChanges.pos.y);
        if (playerChanges.pos.dir !== direction)
          setDirection(playerChanges.pos.dir);
        if (playerChanges.color !== color) {
          setColor(color);
        }
      });
      socket.on(`positionUpdate${clientId}`, (posChanges: PosData) => {
        if (posChanges.x !== x) setX(posChanges.x);
        if (posChanges.y !== y) setY(posChanges.y);
        if (posChanges.dir !== direction) setDirection(posChanges.dir);
      });
      
      // request initial data for player
      socket.emit(`requestCacheDump${socket.id}`);
    }
  }, []);

  useEffect(() => {
    if (!isRemote) {
      emitPlayerUpdate();
    }
  }, [color, name, x, y, direction]);

  // Initialize
  useEffect(() => {
    if (!isRemote) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (moving) requestAnimationFrame(move);
  });

  return (
    <>
      <div
        id='player'
        ref={playerRef}
        className='player'
        style={{
          top: y,
          left: x,
          padding: '10px',
          border: `2px solid ${color}`,
        }}
      />
      {punching && (
        <PunchLine punchDirection={punchDir} posX={x} posY={y} color={color} />
      )}
    </>
  );
}

export default Player;
