export const isValidSeatId = (seatId: string): boolean => {
  return /^[A-Za-z0-9]+$/.test(seatId) && seatId.length > 0;
};

export const isValidLayoutName = (name: string): boolean => {
  return name.trim().length > 0 && name.length <= 50;
};

export const validateSVGContent = (svgString: string): boolean => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    return !parserError;
  } catch {
    return false;
  }
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};