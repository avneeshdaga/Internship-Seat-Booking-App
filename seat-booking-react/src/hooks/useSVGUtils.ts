import { useCallback } from 'react';
import { useSeatStore } from './useSeatStore';
import { getSVGCoords, createSVGElement, setSVGAttributes } from '../utils/svgHelpers';

export const useSVGUtils = () => {
  const {
    userZoomLevel,
    userPanX,
    userPanY,
    userPanW,
    userPanH,
    designerZoomLevel,
    designerPanX,
    designerPanY,
    designerPanW,
    designerPanH,
    setUserZoom,
    setDesignerZoom
  } = useSeatStore();

  // Handle SVG coordinate conversion
  const getSVGCoordsFromEvent = useCallback((
    svg: SVGSVGElement, 
    event: React.MouseEvent
  ) => {
    return getSVGCoords(svg, event.clientX, event.clientY);
  }, []);

  // Handle zoom for user SVG
  const handleUserZoom = useCallback((
    direction: 'in' | 'out' | 'reset',
    centerX?: number,
    centerY?: number
  ) => {
    if (direction === 'reset') {
      setUserZoom(1, 0, 0);
      return;
    }
    
    const zoomFactor = direction === 'in' ? 1.2 : 0.8;
    const newZoom = Math.max(1, Math.min(3, userZoomLevel * zoomFactor));
    setUserZoom(newZoom, centerX, centerY);
  }, [userZoomLevel, setUserZoom]);

  // Handle zoom for designer SVG
  const handleDesignerZoom = useCallback((
    direction: 'in' | 'out' | 'reset',
    centerX?: number,
    centerY?: number
  ) => {
    if (direction === 'reset') {
      setDesignerZoom(1, 0, 0);
      return;
    }
    
    const zoomFactor = direction === 'in' ? 1.2 : 0.8;
    const newZoom = Math.max(1, Math.min(3, designerZoomLevel * zoomFactor));
    setDesignerZoom(newZoom, centerX, centerY);
  }, [designerZoomLevel, setDesignerZoom]);

  // Get current viewBox for user SVG
  const getUserViewBox = useCallback(() => {
    return `${userPanX} ${userPanY} ${userPanW} ${userPanH}`;
  }, [userPanX, userPanY, userPanW, userPanH]);

  // Get current viewBox for designer SVG
  const getDesignerViewBox = useCallback(() => {
    return `${designerPanX} ${designerPanY} ${designerPanW} ${designerPanH}`;
  }, [designerPanX, designerPanY, designerPanW, designerPanH]);

  // Handle wheel zoom
  const handleWheelZoom = useCallback((
    event: React.WheelEvent<SVGSVGElement>,
    isDesigner: boolean = false
  ) => {
    event.preventDefault();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    
    // Convert to SVG coordinates
    const svgCoords = getSVGCoords(
      event.currentTarget, 
      event.clientX, 
      event.clientY
    );
    
    const direction = event.deltaY < 0 ? 'in' : 'out';
    
    if (isDesigner) {
      handleDesignerZoom(direction, svgCoords.x, svgCoords.y);
    } else {
      handleUserZoom(direction, svgCoords.x, svgCoords.y);
    }
  }, [handleUserZoom, handleDesignerZoom]);

  // Create draggable group for elements
  const makeDraggable = useCallback((element: SVGGElement) => {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startTx = 0;
    let startTy = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const transform = element.getAttribute('transform') || '';
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      
      if (match) {
        startTx = parseFloat(match[1]);
        startTy = parseFloat(match[2]);
      } else {
        startTx = 0;
        startTy = 0;
      }
      
      e.stopPropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // Scale movement by zoom level
      const scale = 1000 / (designerPanW || 1000);
      const newTx = startTx + (dx / scale);
      const newTy = startTy + (dy / scale);
      
      element.setAttribute('transform', `translate(${newTx},${newTy})`);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Return cleanup function
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [designerPanW]);

  // Generate unique seat ID
  const generateSeatId = useCallback((row: number, col: number): string => {
    return String.fromCharCode(65 + row) + (col + 1);
  }, []);

  // Create SVG element with proper namespace
  const createSVGElementWithNS = useCallback(<K extends keyof SVGElementTagNameMap>(
    tagName: K
  ): SVGElementTagNameMap[K] => {
    return createSVGElement(tagName);
  }, []);

  // Set multiple SVG attributes at once
  const setSVGAttributesHelper = useCallback((
    element: SVGElement, 
    attributes: Record<string, string | number>
  ): void => {
    setSVGAttributes(element, attributes);
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((
    p1: { x: number; y: number }, 
    p2: { x: number; y: number }
  ): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Snap point to grid
  const snapToGrid = useCallback((
    point: { x: number; y: number }, 
    gridSize: number = 10
  ): { x: number; y: number } => {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }, []);

  // Check if point is within bounds
  const isPointInBounds = useCallback((
    point: { x: number; y: number },
    bounds: { x: number; y: number; width: number; height: number }
  ): boolean => {
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height;
  }, []);

  // Convert RGB to Hex
  const rgbToHex = useCallback((rgb: string): string => {
    if (rgb.startsWith('#')) return rgb;
    
    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';
    
    return '#' + result
      .slice(0, 3)
      .map(x => ('0' + parseInt(x).toString(16)).slice(-2))
      .join('');
  }, []);

  // Debounce function for performance
  const debounce = useCallback(<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  // Throttle function for frequent events
  const throttle = useCallback(<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  return {
    // Core coordinate utilities
    getSVGCoordsFromEvent,
    
    // Zoom and pan utilities
    handleUserZoom,
    handleDesignerZoom,
    getUserViewBox,
    getDesignerViewBox,
    handleWheelZoom,
    
    // Element creation and manipulation
    createSVGElementWithNS,
    setSVGAttributesHelper,
    makeDraggable,
    
    // Geometry utilities
    calculateDistance,
    snapToGrid,
    isPointInBounds,
    
    // ID and styling utilities
    generateSeatId,
    rgbToHex,
    
    // Performance utilities
    debounce,
    throttle,
    
    // Current zoom levels
    userZoom: userZoomLevel,
    designerZoom: designerZoomLevel,
    
    // Current viewBox data
    userViewBox: { x: userPanX, y: userPanY, w: userPanW, h: userPanH },
    designerViewBox: { x: designerPanX, y: designerPanY, w: designerPanW, h: designerPanH }
  };
};