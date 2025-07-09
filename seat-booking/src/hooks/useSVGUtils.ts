import { useCallback } from 'react';
import { getSVGCoords, rgbToHex, getNextAvailableDesignerSeatId, fixDuplicateSeatIds } from '../utils/svgHelpers';

export const useSVGUtils = () => {
  const getSVGCoordsCallback = useCallback((svg: SVGSVGElement, clientX: number, clientY: number) => {
    return getSVGCoords(svg, clientX, clientY);
  }, []);

  const rgbToHexCallback = useCallback((rgb: string): string => {
    return rgbToHex(rgb);
  }, []);

  const getNextSeatIdCallback = useCallback((svg: SVGSVGElement): string => {
    return getNextAvailableDesignerSeatId(svg);
  }, []);

  const fixDuplicateIdsCallback = useCallback((svg: SVGSVGElement): void => {
    fixDuplicateSeatIds(svg);
  }, []);

  return {
    getSVGCoords: getSVGCoordsCallback,
    rgbToHex: rgbToHexCallback,
    getNextAvailableDesignerSeatId: getNextSeatIdCallback,
    fixDuplicateSeatIds: fixDuplicateIdsCallback
  };
};