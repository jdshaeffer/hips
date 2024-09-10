import { forwardRef, useEffect, useState } from 'react';
import PunchLine from './PunchLine';
import '../styles/App.css';

interface Props {
  punchRef: React.RefObject<HTMLDivElement>;
  x: number;
  y: number;
  dir: string;
  punching: boolean;
  color: string;
}

function Sprite({ punchRef, x, y, dir, punching, color }: Props, ref: any) {
  const [punchDir, setPunchDir] = useState('n');

  useEffect(() => {
    if (dir !== '') setPunchDir(dir);
  }, [dir]);

  return (
    <>
      <div
        id='sprite'
        ref={ref}
        style={{
          position: 'absolute',
          top: y,
          left: x,
          zIndex: y,
          padding: '10px',
          border: `2px solid ${color}`,
        }}
      />
      {punching && (
        <PunchLine
          punchRef={punchRef}
          punchDirection={punchDir}
          posX={x}
          posY={y}
          color={color}
        />
      )}
    </>
  );
}

export default forwardRef(Sprite);
