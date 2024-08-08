import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { PlayerData } from '../../models/PlayerData';
import { PosData } from '../../models/PosData';
import Sprite from './Sprite';
import '../styles/App.css';

interface Props {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  clientId: string;
  color: string;
}

function RemotePlayer({ socket, clientId, color }: Props) {
  const punchRef = useRef<HTMLDivElement>(null);

  const [isPunching, setIsPunching] = useState(false);
  const [x, setX] = useState(135);
  const [y, setY] = useState(135);
  const [direction, setDirection] = useState('');

  // html ref
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on(`playerUpdate${clientId}`, (playerChanges: PlayerData) => {
      if (playerChanges.pos.x !== x) setX(playerChanges.pos.x);
      if (playerChanges.pos.y !== y) setY(playerChanges.pos.y);
      if (playerChanges.pos.dir !== direction)
        setDirection(playerChanges.pos.dir);
      // if (playerChanges.color !== color) {
      //   setColor(playerChanges.color);
      // }
    });
    socket.on(`positionUpdate${clientId}`, (posChanges: PosData) => {
      if (posChanges.x !== x) setX(posChanges.x);
      if (posChanges.y !== y) setY(posChanges.y);
      if (posChanges.dir !== direction) {
        setDirection(posChanges.dir);
      }
    });
    socket.on(`punchUpdate${clientId}`, (isPunching: boolean) => {
      setIsPunching(isPunching);
    });
  }, [socket]);

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

export default RemotePlayer;
