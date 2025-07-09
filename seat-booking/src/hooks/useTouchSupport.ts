import { useCallback, useRef } from 'react';

export const useTouchSupport = () => {
  const lastTouchDist = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch1.clientX - touch2.clientX, 2) +
      Math.pow(touch1.clientY - touch2.clientY, 2)
    );
  }, []);

  const getTouchCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    if (touches.length === 0) return { x: 0, y: 0 };
    
    let centerX = 0;
    let centerY = 0;
    
    for (let i = 0; i < touches.length; i++) {
      centerX += touches[i].clientX;
      centerY += touches[i].clientY;
    }
    
    return {
      x: centerX / touches.length,
      y: centerY / touches.length
    };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      lastTouchDist.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    }
  }, [getTouchDistance, getTouchCenter]);

  const handleTouchMove = useCallback((
    e: TouchEvent,
    svgElement: SVGSVGElement,
    onPan: (deltaX: number, deltaY: number) => void,
    onZoom: (scale: number, centerX: number, centerY: number) => void
  ) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - panning
      const touch = e.touches[0];
      const currentCenter = getTouchCenter(e.touches);
      
      if (lastTouchCenter.current.x !== 0 || lastTouchCenter.current.y !== 0) {
        const deltaX = currentCenter.x - lastTouchCenter.current.x;
        const deltaY = currentCenter.y - lastTouchCenter.current.y;
        onPan(deltaX, deltaY);
      }
      
      lastTouchCenter.current = currentCenter;
    } else if (e.touches.length === 2) {
      // Two touches - pinch to zoom
      const currentDist = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches);
      
      if (lastTouchDist.current > 0) {
        const scale = currentDist / lastTouchDist.current;
        const rect = svgElement.getBoundingClientRect();
        const centerX = currentCenter.x - rect.left;
        const centerY = currentCenter.y - rect.top;
        
        onZoom(scale, centerX, centerY);
      }
      
      lastTouchDist.current = currentDist;
      lastTouchCenter.current = currentCenter;
    }
  }, [getTouchDistance, getTouchCenter]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = 0;
    lastTouchCenter.current = { x: 0, y: 0 };
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};