export const calculatePathCenter = (points: { x: number; y: number }[]): { x: number; y: number } => {
  if (points.length === 0) return { x: 0, y: 0 };
  
  const cx = points.reduce((sum, pt) => sum + pt.x, 0) / points.length;
  const cy = points.reduce((sum, pt) => sum + pt.y, 0) / points.length;
  
  return { x: cx, y: cy };
};

export const rotatePoint = (
  point: { x: number; y: number },
  center: { x: number; y: number },
  angleRad: number
): { x: number; y: number } => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
    y: center.y + dx * Math.sin(angleRad) + dy * Math.cos(angleRad)
  };
};

export const snapAngle = (angle: number, snapIncrement: number = Math.PI / 4): number => {
  return Math.round(angle / snapIncrement) * snapIncrement;
};

export const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const clampValue = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};