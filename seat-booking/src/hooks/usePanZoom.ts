import { useState, useCallback, useRef } from 'react';
import { ViewBox } from '../types/designer.types';
import { clampValue } from '../utils/geometryUtils';

interface PanZoomConfig {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
}

export const usePanZoom = (
  initialViewBox: ViewBox,
  config: PanZoomConfig = { minZoom: 1, maxZoom: 3, zoomStep: 0.04 }
) => {
  const [viewBox, setViewBox] = useState<ViewBox>(initialViewBox);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const originalViewBox = useRef<ViewBox>(initialViewBox);

  const clampPan = useCallback((newViewBox: ViewBox) => {
    const { x: viewX, y: viewY, width: viewW, height: viewH } = originalViewBox.current;
    const { x: panX, y: panY, width: panW, height: panH } = newViewBox;
    
    let clampedX = panX;
    let clampedY = panY;
    
    if (panW > viewW) {
      clampedX = viewX;
    } else {
      clampedX = clampValue(panX, viewX, viewX + viewW - panW);
    }
    
    if (panH > viewH) {
      clampedY = viewY;
    } else {
      clampedY = clampValue(panY, viewY, viewY + viewH - panH);
    }
    
    return { ...newViewBox, x: clampedX, y: clampedY };
  }, []);

  const handleWheel = useCallback((
    e: WheelEvent,
    svgElement: SVGSVGElement
  ) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    const newZoom = clampValue(
      zoomLevel + direction * config.zoomStep,
      config.minZoom,
      config.maxZoom
    );
    
    const rect = svgElement.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
    const mouseY = ((e.clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;
    
    setZoom(newZoom, mouseX, mouseY);
  }, [viewBox, zoomLevel, config]);

  const setZoom = useCallback((
    zoom: number,
    centerX?: number,
    centerY?: number
  ) => {
    const clampedZoom = clampValue(zoom, config.minZoom, config.maxZoom);
    const { width: viewW, height: viewH } = originalViewBox.current;
    
    const newW = viewW / clampedZoom;
    const newH = viewH / clampedZoom;
    
    if (clampedZoom === config.minZoom) {
      const resetViewBox = { ...originalViewBox.current };
      setViewBox(resetViewBox);
      setZoomLevel(config.minZoom);
      return;
    }
    
    let newViewBox: ViewBox;
    
    if (typeof centerX === 'number' && typeof centerY === 'number') {
      const zoomRatio = newW / viewBox.width;
      newViewBox = {
        x: centerX - (centerX - viewBox.x) * zoomRatio,
        y: centerY - (centerY - viewBox.y) * zoomRatio,
        width: newW,
        height: newH
      };
    } else {
      newViewBox = {
        ...viewBox,
        width: newW,
        height: newH
      };
    }
    
    const clampedViewBox = clampPan(newViewBox);
    setViewBox(clampedViewBox);
    setZoomLevel(clampedZoom);
  }, [viewBox, config, clampPan]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    panStart.current = { x: clientX, y: clientY };
  }, []);

  const updatePan = useCallback((
    clientX: number,
    clientY: number,
    svgElement: SVGSVGElement
  ) => {
    if (!isPanning) return;
    
    const dx = (clientX - panStart.current.x) * (viewBox.width / svgElement.clientWidth);
    const dy = (clientY - panStart.current.y) * (viewBox.height / svgElement.clientHeight);
    
    const newViewBox = {
      ...viewBox,
      x: viewBox.x - dx,
      y: viewBox.y - dy
    };
    
    const clampedViewBox = clampPan(newViewBox);
    setViewBox(clampedViewBox);
    
    panStart.current = { x: clientX, y: clientY };
  }, [isPanning, viewBox, clampPan]);

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetZoom = useCallback(() => {
    setViewBox({ ...originalViewBox.current });
    setZoomLevel(config.minZoom);
  }, [config.minZoom]);

  return {
    viewBox,
    zoomLevel,
    isPanning,
    handleWheel,
    setZoom,
    startPan,
    updatePan,
    endPan,
    resetZoom
  };
};