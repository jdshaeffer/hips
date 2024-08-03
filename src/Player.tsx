import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import getMoveDirection from './getMoveDirection';
import './App.css';
import Sprite from './Sprite';

interface Props {
  borderRef: any;
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
}

// function Player(isLocal = true, socketId = "") {
function Player({ borderRef, socket }: Props) {
  const [punching, setPunching] = useState(false);
  const [punchDir, setPunchDir] = useState('');

  const [x, setX] = useState(135);
  const [y, setY] = useState(135);
  const [color, setColor] = useState('#ffffff');
  const [direction, setDirection] = useState('');

  // html ref
  const playerRef = useRef<HTMLDivElement>(null);
  const punchRef = useRef<HTMLDivElement>(null);
  const [punchDiv, setPunchDiv] = useState<HTMLDivElement | null>(null);

  // other state
  const [moving, setMoving] = useState(false);
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

  const punch = () => {
    const punchDirection =
      direction === '' ? lastDirection : validPunchDirection();
    setPunchDir(punchDirection);
    setPunching(true);
    setTimeout(() => setPunching(false), 150);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isValidDirection(e.key, direction)) {
      setMoving(true);
      setDirection(direction + directionMap[e.key]);
    }

    if (e.key === ' ' && !e.repeat) {
      punch();
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

   const getPlayerRefInfo = () => {
     if (playerRef) {
       const playerDiv = playerRef.current;
       return playerDiv!.getBoundingClientRect();
     }
   };

   const getOpponentRefInfo = () => {
     // optional since there may just be p1 running around, no p2 present
     const opponentDiv = playerRef.current;
     const opponentHitBox = opponentDiv
       ? opponentDiv.getBoundingClientRect()
       : null;
     return opponentHitBox;
   };

   const checkPunchCollision = () => {
     const punchHitBox = punchDiv?.getBoundingClientRect();
     if (punchHitBox) {
       const {
         bottom: pBottom,
         top: pTop,
         left: pLeft,
         right: pRight,
       } = punchHitBox;
       if (pBottom && pTop && pLeft && pRight) {
         const opponentHitBox = getOpponentRefInfo();
         if (opponentHitBox) {
           const {
             bottom: oBottom,
             top: oTop,
             left: oLeft,
             right: oRight,
           } = opponentHitBox;
           if (
             (pLeft >= oLeft || pRight >= oLeft) &&
             (pLeft <= oRight || pRight <= oRight) &&
             (pBottom <= oBottom || pTop <= oBottom) &&
             (pBottom >= oTop || pTop >= oTop)
           ) {
             console.log('punch hit!');
           }
         }
       }
     }
   };


   const checkBorderCollision = () => {
     const borderBuffer = 4;
     const playerHitBox = getPlayerRefInfo();
     const borderDiv = borderRef.current;
     const borderHitBox = borderDiv!.getBoundingClientRect();

     let borderDetected = new Set<string>();
     if (playerHitBox) {
       const checkCollision = (side: keyof DOMRect) =>
         +playerHitBox[side] <= +borderHitBox[side] + borderBuffer;

       const checkCollisionAlt = (side: keyof DOMRect) =>
         +playerHitBox[side] >= +borderHitBox[side] - borderBuffer;

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
    if (socket !== undefined) {
      socket.emit(`playerUpdate${socket.id}`, {
        pos: {
          x,
          y,
          dir: direction,
        },
        color: color,
        name: 'bob',
      });
    }
  };

  const emitPunchingUpdate = () => {
			socket?.emit(`punchUpdate${socket.id}`, punching);
  };

  const emitPositionUpdate = () => {
      socket?.emit(`positionUpdate${socket.id}`, { x, y, dir: direction });
  };

  const updatePlayerPosition = (dx: number, dy: number) => {
    setX(x + dx);
    setY(y + dy);
  };

  const randColor = () => {
    return (
      '#' +
      ((Math.random() * 0x888888 + 0x888888) << 0).toString(16).padStart(6, '0')
    );
  };

  useEffect(() => {
    emitPlayerUpdate();
  }, [color]);

  useEffect(() => {
    emitPunchingUpdate();
    // else if (punching) punch();
  }, [punching]);

  useEffect(() => {
    emitPositionUpdate();
  }, [x, y, direction]);

  useEffect(() => {
    const color = randColor();
    setColor(color);
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
    if (moving) requestAnimationFrame(move);
		if (punching) {
      const punchDiv = punchRef.current;
      if (punchDiv) {
        setPunchDiv(punchDiv);
        checkPunchCollision();
      }
    }
  });

  return (
    <>
      <Sprite
        // id='player'
				punchRef={punchRef}
        ref={playerRef}
        x={x}
        y={y}
        dir={direction}
        punching={punching}
        color={color}
      />
    </>
  );
}

export default Player;
