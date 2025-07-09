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

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DragState {
  target: SVGGElement | null;
  start: { x: number; y: number; tx: number; ty: number };
  isActive: boolean;
}

export interface PenDragState {
  point: PenPoint;
  type: 'anchor' | 'handleIn' | 'handleOut';
  offsetX: number;
  offsetY: number;
}

export interface ShapeDragState {
  x: number;
  y: number;
  origX: number;
  origY: number;
  origAngle: number;
  w: number;
  h: number;
}

export interface DesignerState {
  // Selection states
  selectedDesignerSeat: SVGCircleElement | null;
  selectedPenPath: PenPath | null;
  selectedRectPath: SVGPathElement | null;
  selectedCirclePath: SVGPathElement | null;
  selectedTextGroup: SVGGElement | null;
  selectedText: SVGTextElement | null;
  selectedTextRect: SVGRectElement | null;
  
  // Tool modes
  addMode: boolean;
  penMode: boolean;
  textMode: boolean;
  rectMode: boolean;
  shapeMode: 'none' | 'circle';
  
  // Background image
  bgImageVisible: boolean;
  bgImageEl: SVGImageElement | null;
  
  // Pan and zoom
  userZoomLevel: number;
  designerZoomLevel: number;
  userViewBox: ViewBox;
  designerViewBox: ViewBox;
  
  // Drag states
  dragTarget: SVGGElement | null;
  penDragging: PenDragState | null;
  isPathDragging: boolean;
  isRectPathDragging: boolean;
  isShapeDragging: boolean;
  isDesignerPanning: boolean;
  isPanning: boolean;
  isTextDragging: boolean;
  
  // Path and shape management
  finishedPenPaths: PenPath[];
  currentPenPath: PenPath | null;
  selectedShape: SVGPathElement | null;
  justDragged: boolean;
  justSelectedTextBox: boolean;
  
  // Preview elements
  penPreviewLine: SVGLineElement | null;
  penPreviewHandle: SVGLineElement | null;
}

export type ShapeMode = 'none' | 'circle' | 'rect';
export type ToolMode = 'pen' | 'text' | 'rect' | 'circle' | 'seat' | 'none';