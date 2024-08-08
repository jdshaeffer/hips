import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import getMoveDirection from '../hooks/getMoveDirection';
import Sprite from './Sprite';
import { HitBox } from '../../models/HitBox';
import '../styles/App.css';

interface Props {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  color: string;
  borderRef: React.RefObject<HTMLDivElement>;
}

function Player({ borderRef, socket, color }: Props) {
  const [isPunching, setIsPunching] = useState(false);
  const [x, setX] = useState(135);
  const [y, setY] = useState(135);
  const [direction, setDirection] = useState('');

  // html refs and hitboxes
  const playerRef = useRef<HTMLDivElement>(null);
  const punchRef = useRef<HTMLDivElement>(null);
  const [playerHitBox, setPlayerHitBox] = useState<HitBox>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [borderHitBox, setBorderHitBox] = useState<HitBox>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  // other state
  const [isMoving, setIsMoving] = useState(false);
  const [lastDirection, setLastDirection] = useState('n');

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

  // const validPunchDirection = () => {
  //   let dir = direction.slice(0, 2);
  //   if (dir === 'ew' || dir === 'we' || dir === 'sn' || dir === 'ns') {
  //     return direction[1];
  //   } else {
  //     return dir;
  //   }
  // };

  const isValidDirection = (key: string, dir: string) =>
    ((key === 'ArrowUp' || key === 'w') && !dir.includes('n')) ||
    ((key === 'ArrowDown' || key === 's') && !dir.includes('s')) ||
    ((key === 'ArrowRight' || key === 'd') && !dir.includes('e')) ||
    ((key === 'ArrowLeft' || key === 'a') && !dir.includes('w'));

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isValidDirection(e.key, direction)) {
      setIsMoving(true);
      setDirection(direction + directionMap[e.key]);
    }

    if (e.key === ' ' && !e.repeat) {
      setIsPunching(true);
      setTimeout(() => setIsPunching(false), 150);
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
        setIsMoving(false);
      }
    }
  };

  const checkBorderCollision = () => {
    let borderDetected = new Set<string>();
    if (playerHitBox) {
      console.log('player', playerHitBox);
      const hasCollided = (side: string) =>
        0 < playerHitBox[side] && playerHitBox[side] < 5;

      if (hasCollided('left')) {
        borderDetected.add('w');
      } else {
        borderDetected.delete('w');
      }
      if (hasCollided('right')) {
        borderDetected.add('e');
      } else {
        borderDetected.delete('e');
      }
      if (hasCollided('bottom')) {
        borderDetected.add('s');
      } else {
        borderDetected.delete('s');
      }
      if (hasCollided('top')) {
        borderDetected.add('n');
      } else {
        borderDetected.delete('n');
      }
    }
    return borderDetected;
  };

  const move = () => {
    const [dx, dy] = getMoveDirection(direction, checkBorderCollision());

    if (direction.length === 0) {
      setIsMoving(false);
      return;
    } else {
      updatePlayerPosition(dx, dy);
      const playerDiv = playerRef?.current?.getBoundingClientRect();
      if (playerDiv) {
        setPlayerHitBox({
          top: playerDiv.top - borderHitBox.top,
          bottom: borderHitBox.bottom - playerDiv.bottom,
          right: borderHitBox.right - playerDiv.right,
          left: playerDiv.left - borderHitBox.left,
        });
      }
    }
  };

  const updatePlayerPosition = (dx: number, dy: number) => {
    setX(x + dx);
    setY(y + dy);
  };

  // set initial player and border hit boxes
  useEffect(() => {
    if (playerRef && borderRef) {
      const playerDiv = playerRef.current?.getBoundingClientRect();
      const borderDiv = borderRef.current?.getBoundingClientRect();
      if (borderDiv) {
        setBorderHitBox({
          top: borderDiv.top,
          bottom: borderDiv.bottom,
          left: borderDiv.left,
          right: borderDiv.right,
        });
        if (playerDiv) {
          setPlayerHitBox({
            top: playerDiv.top - borderDiv.top,
            bottom: borderDiv.bottom - playerDiv.bottom,
            right: borderDiv.right - playerDiv.right,
            left: playerDiv.left - borderDiv.left,
          });
        }
      }
    }
  }, []);

  // emit punching update when isPunching changes
  useEffect(() => {
    if (socket) {
      socket.emit(`punchUpdate${socket.id}`, { isPunching });
    }
  }, [isPunching]);

  // emit position update when x/y/direction changes
  useEffect(() => {
    if (socket) {
      socket.emit(`positionUpdate${socket.id}`, {
        pos: { x, y, dir: direction },
        hitBox: playerHitBox,
      });
    }
  }, [x, y, direction]);

  // set initial server values after client mounts
  useEffect(() => {
    if (socket) {
      socket.emit('initializePlayerData', {
        pos: {
          x,
          y,
          dir: direction,
        },
        color: color,
        name: 'bob',
        hitBox: playerHitBox,
      });
    }
  }, [socket]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (isMoving) requestAnimationFrame(move);
    if (isPunching) {
      const punchDiv = punchRef.current?.getBoundingClientRect();
      if (punchDiv) {
        console.log(borderHitBox);
        const punchHitBox = {
          top: punchDiv.top - borderHitBox.top,
          bottom: borderHitBox.bottom - punchDiv.bottom,
          right: borderHitBox.right - punchDiv.right,
          left: punchDiv.left - borderHitBox.left,
        };

        // send the player's punchHitBox to the server, check there if it hits any opponent's hitboxes
        if (socket) {
          socket.emit(
            `punchCollision${socket.id}`,
            punchHitBox,
            (response: any) => {
              console.log(response.status);
            }
          );
        }
      }
    }
  });

  return (
    <>
      <Sprite
        punchRef={punchRef}
        ref={playerRef}
        x={x}
        y={y}
        dir={direction}
        punching={isPunching}
        color={color}
      />
    </>
  );
}

export default Player;
