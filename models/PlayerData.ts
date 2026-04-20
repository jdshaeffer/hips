import type { PosData } from './PosData';
import type { HitBox } from './HitBox';

export interface PlayerData {
  color: string;
  name: string;
  pos: PosData;
  hitBox: HitBox;
}
