import { PosData } from './PosData';
import { HitBox } from './HitBox';

export interface PlayerData {
  color: string;
  name: string;
  pos: PosData;
  hitBox: HitBox;
}
