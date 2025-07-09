export interface Seat {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  r: number;
  occupied: boolean;
  selected: boolean;
}

export interface SeatGridConfig {
  rows: number;
  cols: number;
  seatSize: number;
  gap: number;
}

export type SeatMapType = 'grid' | 'svg';
