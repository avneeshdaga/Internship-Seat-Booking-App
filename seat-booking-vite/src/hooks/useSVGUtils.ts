// Complete SVG utilities with exact vanilla functionality
import { useCallback } from "react";
import { useSeatStore } from "./useSeatStore";
import { useEffect } from "react";
import {
  getSVGCoords,
  createSVGElement,
  setSVGAttributes,
} from "../utils/svgHelpers";

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
    setDesignerZoom,
    updatePan,
    startPanning,
    stopPanning,
  } = useSeatStore();

  const updateTextFontSizeForZoom = useSeatStore(state => state.updateTextFontSizeForZoom);

  // Handle SVG coordinate conversion
  const getSVGCoordsFromEvent = useCallback(
    (svg: SVGSVGElement, event: React.MouseEvent) => {
      return getSVGCoords(svg, event.clientX, event.clientY);
    },
    []
  );

  useEffect(() => {
    updateTextFontSizeForZoom(userZoomLevel);
  }, [userZoomLevel, updateTextFontSizeForZoom]);
  
  useEffect(() => {
    updateTextFontSizeForZoom(designerZoomLevel);
  }, [designerZoomLevel, updateTextFontSizeForZoom]);


  // Handle zoom for user SVG (seat selection)
  const handleUserZoom = useCallback(
    (direction: "in" | "out" | "reset", centerX?: number, centerY?: number) => {
      if (direction === "reset") {
        setUserZoom(1);
        return;
      }

      const zoomFactor = direction === "in" ? 1.1 : 0.8;
      const newZoom = Math.max(1, Math.min(3, userZoomLevel * zoomFactor));
      setUserZoom(newZoom, centerX, centerY);
      const svg = document.getElementById("seatSVG") as SVGSVGElement | null;
      if (svg) updateTextFontSizeForZoom(newZoom);
    },
    [userZoomLevel, setUserZoom, updateTextFontSizeForZoom]
  );

  // Handle zoom for designer SVG (layout creation)
  const handleDesignerZoom = useCallback(
    (direction: "in" | "out" | "reset", centerX?: number, centerY?: number) => {
      if (direction === "reset") {
        setDesignerZoom(1);
        return;
      }

      const zoomFactor = direction === "in" ? 1.1 : 0.8;
      const newZoom = Math.max(1, Math.min(3, designerZoomLevel * zoomFactor));
      setDesignerZoom(newZoom, centerX, centerY);
      const svg = document.getElementById(
        "designerSVG"
      ) as SVGSVGElement | null;
      if (svg) updateTextFontSizeForZoom(newZoom);
    },
    [designerZoomLevel, setDesignerZoom, updateTextFontSizeForZoom]
  );

  // Get current viewBox for user SVG
  const getUserViewBox = useCallback(() => {
    return `${userPanX} ${userPanY} ${userPanW} ${userPanH}`;
  }, [userPanX, userPanY, userPanW, userPanH]);

  // Get current viewBox for designer SVG
  const getDesignerViewBox = useCallback(() => {
    return `${designerPanX} ${designerPanY} ${designerPanW} ${designerPanH}`;
  }, [designerPanX, designerPanY, designerPanW, designerPanH]);

  // Handle wheel zoom (exact replica from vanilla)
  const handleWheelZoom = useCallback(
    (event: React.WheelEvent<SVGSVGElement>, isDesigner: boolean = false) => {
      event.preventDefault();

      // Convert to SVG coordinates
      const svgCoords = getSVGCoords(
        event.currentTarget,
        event.clientX,
        event.clientY
      );

      const direction = event.deltaY < 0 ? "in" : "out";

      if (isDesigner) {
        handleDesignerZoom(direction, svgCoords.x, svgCoords.y);
      } else {
        handleUserZoom(direction, svgCoords.x, svgCoords.y);
      }
    },
    [handleUserZoom, handleDesignerZoom]
  );

  return {
    // Core coordinate utilities
    getSVGCoordsFromEvent,

    // Zoom and pan utilities
    handleUserZoom,
    handleDesignerZoom,
    getUserViewBox,
    getDesignerViewBox,
    handleWheelZoom,

    // Current state access
    userZoom: userZoomLevel,
    designerZoom: designerZoomLevel,
    userViewBox: { x: userPanX, y: userPanY, w: userPanW, h: userPanH },
    designerViewBox: {
      x: designerPanX,
      y: designerPanY,
      w: designerPanW,
      h: designerPanH,
    },
  };
};
