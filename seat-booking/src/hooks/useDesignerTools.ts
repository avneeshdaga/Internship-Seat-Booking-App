import { useState, useCallback } from 'react';
import { ToolMode } from '../types/designer.types';

export const useDesignerTools = () => {
  const [activeTools, setActiveTools] = useState<{
    pen: boolean;
    text: boolean;
    rect: boolean;
    circle: boolean;
    seat: boolean;
  }>({
    pen: false,
    text: false,
    rect: false,
    circle: false,
    seat: false
  });

  const toggleTool = useCallback((tool: ToolMode) => {
    setActiveTools(prev => {
      // Turn off all other tools
      const newState = {
        pen: false,
        text: false,
        rect: false,
        circle: false,
        seat: false
      };
      
      // Toggle the selected tool
      if (tool !== 'none') {
        newState[tool] = !prev[tool];
      }
      
      return newState;
    });
  }, []);

  const deactivateAllTools = useCallback(() => {
    setActiveTools({
      pen: false,
      text: false,
      rect: false,
      circle: false,
      seat: false
    });
  }, []);

  const getActiveTool = useCallback((): ToolMode => {
    if (activeTools.pen) return 'pen';
    if (activeTools.text) return 'text';
    if (activeTools.rect) return 'rect';
    if (activeTools.circle) return 'circle';
    if (activeTools.seat) return 'seat';
    return 'none';
  }, [activeTools]);

  return {
    activeTools,
    toggleTool,
    deactivateAllTools,
    getActiveTool
  };
};