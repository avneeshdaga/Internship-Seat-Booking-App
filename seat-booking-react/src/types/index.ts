// current state types replicated exactly from script.ts
export interface Seat {
  id: string;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  occupied: boolean;
  selected: boolean;
  rotation?: number;
}

export interface PenPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
  anchorCircle?: SVGCircleElement;
  anchorDot?: SVGCircleElement;
  handleInCircle?: SVGCircleElement;
  handleOutCircle?: SVGCircleElement;
  handleLineIn?: SVGLineElement;
  handleLineOut?: SVGLineElement;
  _dragStart?: { x: number; y: number };
}

export interface PenPath {
  points: PenPoint[];
  path: SVGPathElement;
  closed: boolean;
}

export interface TextElement {
  id: string;
  x: number;
  y: number;
  content: string;
  fontSize: number;
  color: string;
  element?: SVGTextElement;
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DragState {
  target: SVGGElement | null;
  startX: number;
  startY: number;
  startTx: number;
  startTy: number;
}

export type ShapeMode = 'none' | 'circle';
export type SeatMapType = 'grid' | 'svg';

export interface SVGCoords {
  x: number;
  y: number;
}

export interface PanState {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export interface ZoomState {
  level: number;
  panX: number;
  panY: number;
  panW: number;
  panH: number;
}