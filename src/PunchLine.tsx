import { useEffect } from 'react';

interface Props {
  punchDirection: string;
  posX: number;
  posY: number;
  color: string;
}

function PunchLine({ punchDirection, posX, posY, color }: Props) {
  useEffect(() => {
    console.log({ punchDirection });
  }, [punchDirection]);

  const punchDirectionMap = {
    n: { top: posY - 10, left: posX },
    e: { top: posY + 11, left: posX + 21, transform: 'rotate(90deg)' },
    s: { top: posY + 32, left: posX },
    w: { top: posY + 11, left: posX - 21, transform: 'rotate(90deg)' },
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
