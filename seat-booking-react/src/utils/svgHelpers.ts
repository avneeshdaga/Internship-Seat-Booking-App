// SVG utility functions replicating your vanilla script functionality

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

// Get SVG coordinates from client coordinates (exact replica of your getSVGCoords)
export function getSVGCoords(svg: SVGSVGElement, clientX: number, clientY: number): SVGCoords {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  
  // Calculate relative position within the SVG element
  const relativeX = (clientX - rect.left) / rect.width;
  const relativeY = (clientY - rect.top) / rect.height;
  
  // Convert to SVG coordinate space
  const x = viewBox.x + (relativeX * viewBox.width);
  const y = viewBox.y + (relativeY * viewBox.height);
  
  return { x, y };
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
  const clampedX = Math.max(minX, Math.min(maxW - panW, panX));
  const clampedY = Math.max(minY, Math.min(maxH - panH, panY));
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
    c1: {
      x: p1.x + dx * tension,
      y: p1.y + dy * tension
    },
    c2: {
      x: p2.x - dx * tension,
      y: p2.y - dy * tension
    }
  };
}

// Snap angle to 45-degree increments (for shift+drag)
export function snapAngle(angle: number): number {
  return Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
}

// Check if point is near another point (for snapping)
export function isNearPoint(
  p1: SVGCoords, 
  p2: SVGCoords, 
  threshold: number = 12
): boolean {
  return distance(p1, p2) < threshold;
}

// Create grid pattern definition
export function createGridPattern(
  svg: SVGSVGElement, 
  size: number = 20, 
  color: string = '#e5e7eb'
): void {
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = createSVGElement('defs');
    svg.appendChild(defs);
  }
  
  const pattern = createSVGElement('pattern');
  setSVGAttributes(pattern, {
    id: 'grid',
    width: size,
    height: size,
    patternUnits: 'userSpaceOnUse'
  });
  
  const path = createSVGElement('path');
  setSVGAttributes(path, {
    d: `M ${size} 0 L 0 0 0 ${size}`,
    fill: 'none',
    stroke: color,
    'stroke-width': '0.5'
  });
  
  pattern.appendChild(path);
  defs.appendChild(pattern);
}

// Rotate point around center
export function rotatePoint(
  point: SVGCoords, 
  center: SVGCoords, 
  angleRad: number
): SVGCoords {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos)
  };
}

// Get bounding box of multiple points
export function getBoundingBox(points: SVGCoords[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
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