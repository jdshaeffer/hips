const getMoveDirection = (direction: string, border: Set<string>) => {
  let dx = 0,
    dy = 0;
  const speed = 2;
  const diagspd = 1.4;

  const n = () => !border.has('n') && (dy -= speed);
  const s = () => !border.has('s') && (dy += speed);
  const e = () => !border.has('e') && (dx += speed);
  const w = () => !border.has('w') && (dx -= speed);
  const ne = () => {
    if (border.has('n') && !border.has('e')) {
      dx += speed;
    } else if (border.has('e') && !border.has('n')) {
      dy -= speed;
    } else if (!border.has('n') && !border.has('e')) {
      dy -= diagspd;
      dx += diagspd;
    }
  };
  const nw = () => {
    if (border.has('n') && !border.has('w')) {
      dx -= speed;
    } else if (border.has('w') && !border.has('n')) {
      dy -= speed;
    } else if (!border.has('n') && !border.has('w')) {
      dy -= diagspd;
      dx -= diagspd;
    }
  };
  const se = () => {
    if (border.has('s') && !border.has('e')) {
      dx += speed;
    } else if (border.has('e') && !border.has('s')) {
      dy += speed;
    } else if (!border.has('s') && !border.has('e')) {
      dy += diagspd;
      dx += diagspd;
    }
  };
  const sw = () => {
    if (border.has('s') && !border.has('w')) {
      dx -= speed;
    } else if (border.has('w') && !border.has('s')) {
      dy += speed;
    } else if (!border.has('s') && !border.has('w')) {
      dy += diagspd;
      dx -= diagspd;
    }
  };

  // prefer hardcoded directions to get constant lookup
  const moveMap = {
    n: n,
    s: s,
    e: e,
    w: w,
    ne: ne,
    en: ne,
    se: se,
    es: se,
    sw: sw,
    ws: sw,
    nw: nw,
    wn: nw,
    nse: e,
    nsw: w,
    nes: e,
    new: n,
    nws: w,
    nwe: n,
    ens: e,
    enw: n,
    esn: e,
    esw: s,
    ewn: n,
    ews: s,
    sne: e,
    snw: w,
    sen: e,
    sew: s,
    swn: w,
    swe: s,
    wne: n,
    wns: w,
    wse: s,
    wsn: w,
    wen: n,
    wes: s,
  };

  if (moveMap.hasOwnProperty(direction)) {
    moveMap[direction as keyof typeof moveMap]();
  }

  return [dx, dy];
};

export default getMoveDirection;
