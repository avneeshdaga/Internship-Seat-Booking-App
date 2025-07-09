import { PenPath } from '../types/designer.types';

export const generatePathD = (pathObj: PenPath): string => {
  let d = '';
  
  for (let i = 0; i < pathObj.points.length; i++) {
    const pt = pathObj.points[i];
    
    if (i === 0) {
      d += `M ${pt.x} ${pt.y}`;
    } else {
      const prev = pathObj.points[i - 1];
      const c1 = prev.handleOut || prev;
      const c2 = pt.handleIn || pt;
      d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${pt.x} ${pt.y}`;
    }
  }
  
  if (pathObj.closed && pathObj.points.length > 1) {
    const last = pathObj.points[pathObj.points.length - 1];
    const first = pathObj.points[0];
    const c1 = last.handleOut || last;
    const c2 = first.handleIn || first;
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${first.x} ${first.y} Z`;
  }
  
  return d;
};

export const updateRectPath = (path: SVGPathElement, points: { x: number; y: number }[]): void => {
  if (points.length !== 4) return;
  
  const d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
  path.setAttribute('d', d);
};

export const updateCirclePath = (path: SVGPathElement, cx: number, cy: number, rx: number, ry: number = rx): void => {
  const d = `
    M ${cx - rx},${cy}
    a ${rx},${ry} 0 1,0 ${2 * rx},0
    a ${rx},${ry} 0 1,0 ${-2 * rx},0
  `;
  path.setAttribute('d', d);
};