export const getSVGCoords = (svg: SVGSVGElement, clientX: number, clientY: number) => {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (ctm) {
    return pt.matrixTransform(ctm.inverse());
  }
  return { x: clientX, y: clientY };
};

export const rgbToHex = (rgb: string): string => {
  if (rgb.startsWith('#')) return rgb;
  const result = rgb.match(/\d+/g);
  if (!result) return '#000000';
  return (
    '#' +
    result
      .slice(0, 3)
      .map(x => ('0' + parseInt(x).toString(16)).slice(-2))
      .join('')
  );
};

export const getNextAvailableDesignerSeatId = (svg: SVGSVGElement): string => {
  const usedNumbers = new Set<number>();
  const circles = svg.querySelectorAll('circle[data-seat-id]');
  
  circles.forEach(circle => {
    const id = circle.getAttribute('data-seat-id');
    if (id && /^Seat\d+$/.test(id)) {
      const num = parseInt(id.replace('Seat', ''), 10);
      if (!isNaN(num)) usedNumbers.add(num);
    }
  });
  
  let next = 1;
  while (usedNumbers.has(next)) next++;
  return `Seat${next}`;
};

export const fixDuplicateSeatIds = (svg: SVGSVGElement): void => {
  const ids = new Set<string>();
  const circles = svg.querySelectorAll('circle[data-seat-id]');
  let counter = 1;
  
  circles.forEach(circle => {
    const id = circle.getAttribute('data-seat-id')?.trim();
    if (!id || ids.has(id.toLowerCase())) {
      while (ids.has(`seat${counter}`.toLowerCase())) counter++;
      const newId = `Seat${counter}`;
      circle.setAttribute('data-seat-id', newId);
      ids.add(newId.toLowerCase());
    } else {
      ids.add(id.toLowerCase());
    }
  });
};

export const countAvailableSeats = (occupiedSeats: Set<string>, svg: SVGSVGElement): number => {
  const circles = svg.querySelectorAll('circle[data-seat-id]');
  let available = 0;
  
  circles.forEach(circle => {
    const seatId = circle.getAttribute('data-seat-id');
    if (seatId && !occupiedSeats.has(seatId)) {
      available++;
    }
  });
  
  return available;
};