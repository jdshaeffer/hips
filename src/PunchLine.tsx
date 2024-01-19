import { useEffect } from 'react';

interface Props {
  punchDirection: string;
  posX: number;
  posY: number;
  color: string;
}

function PunchLine({ punchDirection, posX, posY, color }: Props) {
  const punchDirectionMap = {
    n: { top: posY - 10, left: posX },
    e: { top: posY + 11, left: posX + 21, transform: 'rotate(90deg)' },
    s: { top: posY + 32, left: posX },
    w: { top: posY + 11, left: posX - 21, transform: 'rotate(90deg)' },
    ne: { top: posY - 5, left: posX + 16, transform: 'rotate(45deg)' },
    en: { top: posY - 5, left: posX + 16, transform: 'rotate(45deg)' },
    se: { top: posY + 28, left: posX + 17, transform: 'rotate(135deg)' },
    es: { top: posY + 28, left: posX + 17, transform: 'rotate(135deg)' },
    sw: { top: posY + 28, left: posX - 16, transform: 'rotate(45deg)' },
    ws: { top: posY + 28, left: posX - 16, transform: 'rotate(45deg)' },
    nw: { top: posY - 5, left: posX - 16, transform: 'rotate(135deg)' },
    wn: { top: posY - 5, left: posX - 16, transform: 'rotate(135deg)' },
  };

  return (
    <div
      className='punch-line'
      style={{
        ...punchDirectionMap[punchDirection as keyof typeof punchDirectionMap],
        backgroundColor: color,
      }}
    />
  );
}

export default PunchLine;
