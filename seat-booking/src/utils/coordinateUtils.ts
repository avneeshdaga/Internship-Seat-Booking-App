export const convertScreenToSVG = (
  svg: SVGSVGElement, 
  screenX: number, 
  screenY: number
): { x: number; y: number } => {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  
  const scaleX = viewBox.width / rect.width;
  const scaleY = viewBox.height / rect.height;
  
  return {
    x: viewBox.x + (screenX - rect.left) * scaleX,
    y: viewBox.y + (screenY - rect.top) * scaleY
  };
};

export const applyTransform = (
  element: SVGElement,
  transform: string
): void => {
  element.setAttribute('transform', transform);
};

export const getElementTransform = (element: SVGElement): {
  translateX: number;
  translateY: number;
  rotation: number;
  centerX: number;
  centerY: number;
} => {
  const transform = element.getAttribute('transform') || '';
  
  const translateMatch = /translate\(([^,]+),([^)]+)\)/.exec(transform);
  const rotateMatch = /rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/.exec(transform);
  
  return {
    translateX: translateMatch ? parseFloat(translateMatch[1]) : 0,
    translateY: translateMatch ? parseFloat(translateMatch[2]) : 0,
    rotation: rotateMatch ? parseFloat(rotateMatch[1]) : 0,
    centerX: rotateMatch ? parseFloat(rotateMatch[2]) : 0,
    centerY: rotateMatch ? parseFloat(rotateMatch[3]) : 0
  };
};