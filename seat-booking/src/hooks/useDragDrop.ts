import { useState, useCallback, useRef } from 'react';
import { DragState } from '../types/designer.types';

export const useDragDrop = () => {
  const [dragState, setDragState] = useState<DragState>({
    target: null,
    start: { x: 0, y: 0, tx: 0, ty: 0 },
    isActive: false
  });
  
  const justDragged = useRef(false);

  const startDrag = useCallback((
    target: SVGGElement,
    clientX: number,
    clientY: number,
    initialTransform?: { tx: number; ty: number }
  ) => {
    setDragState({
      target,
      start: {
        x: clientX,
        y: clientY,
        tx: initialTransform?.tx || 0,
        ty: initialTransform?.ty || 0
      },
      isActive: true
    });
  }, []);

  const updateDrag = useCallback((
    clientX: number,
    clientY: number,
    svgElement: SVGSVGElement,
    onUpdate?: (deltaX: number, deltaY: number) => void
  ) => {
    if (!dragState.isActive || !dragState.target) return;

    const dx = clientX - dragState.start.x;
    const dy = clientY - dragState.start.y;

    if (onUpdate) {
      onUpdate(dx, dy);
    }
  }, [dragState]);

  const endDrag = useCallback(() => {
    if (dragState.isActive) {
      justDragged.current = true;
      setTimeout(() => {
        justDragged.current = false;
      }, 10);
    }
    
    setDragState({
      target: null,
      start: { x: 0, y: 0, tx: 0, ty: 0 },
      isActive: false
    });
  }, [dragState.isActive]);

  return {
    dragState,
    justDragged: justDragged.current,
    startDrag,
    updateDrag,
    endDrag
  };
};