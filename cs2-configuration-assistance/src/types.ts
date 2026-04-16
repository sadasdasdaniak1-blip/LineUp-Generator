export type ThrowType = 'WJT' | 'JT' | 'WSJT' | 'DSJT';
export type GrenadeType = 'smoke' | 'flash' | 'he' | 'molotov';

export interface Lineup {
  id: string;
  name: string;
  description: string;
  map: string;
  grenadeType: GrenadeType;
  throwType: ThrowType;
  posX: string;       // setpos X
  posY: string;       // setpos Y
  posZ: string;       // setpos Z
  yaw: string;        // yaw value (raw ticks)
  pitch: string;      // pitch value (raw ticks)
  slot: number;       // tab slot (0,1,2) → position in radial menu (1-8)
  tab: number;        // which tab (0,1,2)
  tags: string[];
}

export interface MapData {
  id: string;
  name: string;
  lineups: Lineup[];
}
