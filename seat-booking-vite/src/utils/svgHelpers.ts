// Complete SVG helper functions from your vanilla script
export const SVG_NS = "http://www.w3.org/2000/svg";

export interface SVGCoords {
  x: number;
  y: number;
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getSVGCoords(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (ctm) {
    return pt.matrixTransform(ctm.inverse());
  }
  return { x: clientX, y: clientY };
}

// Create SVG element with namespace
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tagName: K
): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tagName);
}

// Set multiple attributes at once
export function setSVGAttributes(
  element: SVGElement, 
  attributes: Record<string, string | number>
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value.toString());
  });
}

// Calculate distance between two points
export function distance(p1: SVGCoords, p2: SVGCoords): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Constrain pan values to keep content visible
export function clampPan(
  panX: number, 
  panY: number, 
  panW: number, 
  panH: number,
  minX: number = 0,
  minY: number = 0,
  maxW: number = 1000,
  maxH: number = 500
): { x: number; y: number } {
  const clampedX = Math.max(minX, Math.min(panX, maxW - panW));
  const clampedY = Math.max(minY, Math.min(panY, maxH - panH));
  return { x: clampedX, y: clampedY };
}

// Generate seat ID from row and column (like your vanilla implementation)
export function generateSeatId(row: number, col: number): string {
  return String.fromCharCode(65 + row) + (col + 1);
}

// Convert RGB to Hex (replicating your rgbToHex function)
export function rgbToHex(rgb: string): string {
  if (rgb.startsWith('#')) return rgb;
  
  const result = rgb.match(/\d+/g);
  if (!result) return '#000000';
  
  return '#' + result
    .slice(0, 3)
    .map(x => ('0' + parseInt(x).toString(16)).slice(-2))
    .join('');
}

// Calculate bezier curve control points
export function calculateBezierControls(
  p1: SVGCoords, 
  p2: SVGCoords, 
  tension: number = 0.3
): { c1: SVGCoords; c2: SVGCoords } {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  
  return {
    c1: { x: p1.x + dx * tension, y: p1.y + dy * tension },
    c2: { x: p2.x - dx * tension, y: p2.y - dy * tension }
  };
}

// Snap angle to 45-degree increments (for shift+drag)
export function snapAngle(angle: number): number {
  const snapIncrement = 45;
  return Math.round(angle / snapIncrement) * snapIncrement;
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for frequent events
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}