(function () {
  // --- Constants & State ---
  const svgNS = "http://www.w3.org/2000/svg";
  const pricePerSeat = 200;
  let selectedSeats: Set<string> = new Set();
  let occupiedSeats: Set<string> = new Set();
  let seatMapType: 'grid' | 'svg' = 'grid';
  let lastSVGString: string = '';
  let maxSelectableSeats: number | null = null;
  let selectedDesignerSeat: SVGRectElement | null = null;
  let addMode = false;

  let dragTarget: SVGGElement | null = null;

  let userZoomLevel = 1;
  const minZoom = 1;
  const maxZoom = 3;
  const zoomStep = 0.04;

  // Rotation 
  let rotationHandle: SVGCircleElement | null = null;
  let rotatingGroup: SVGGElement | null = null;
  let rotationOrigin = { cx: 0, cy: 0 };
  let startAngle = 0; 
  let startMouseAngle = 0;
  let isRotating = false;
  let justRotated = false;
  let justDragged = false;

  // --- DOM Elements ---
  const roleSelect = document.getElementById('roleSelect') as HTMLSelectElement;
  const adminPanel = document.getElementById('adminPanel') as HTMLDivElement;
  const userPanel = document.getElementById('userPanel') as HTMLDivElement;
  const rowInput = document.getElementById('rowInput') as HTMLInputElement;
  const colInput = document.getElementById('colInput') as HTMLInputElement;
  const seatSizeInput = document.getElementById('seatSizeInput') as HTMLInputElement;
  const createSeatsBtn = document.getElementById('createSeatsBtn') as HTMLButtonElement;

  const seatSVG = document.getElementById('seatSVG') as unknown as SVGSVGElement;
  const selectedDisplay = document.getElementById('selected') as HTMLParagraphElement;
  const totalDisplay = document.getElementById('total') as HTMLParagraphElement;
  const confirmBtn = document.getElementById('confirmBtn') as HTMLButtonElement;
  const svgUpload = document.getElementById('svgUpload') as HTMLInputElement;
  const saveLayoutBtn = document.getElementById('saveLayoutBtn') as HTMLButtonElement;
  const zoomResetBtn = document.getElementById('zoomResetBtn') as HTMLButtonElement;

  const savedLayoutsDropdown = document.getElementById('savedLayoutsDropdown') as HTMLSelectElement;
  const loadLayoutBtn = document.getElementById('loadLayoutBtn') as HTMLButtonElement;
  const deleteLayoutBtn = document.getElementById('deleteLayoutBtn') as HTMLButtonElement;

  const addSeatBtn = document.getElementById('addSeatBtn') as HTMLButtonElement;
  const deleteSeatBtn = document.getElementById('deleteSeatBtn') as HTMLButtonElement;
  const seatIdInput = document.getElementById('seatIdInput') as HTMLInputElement;
  const updateSeatIdBtn = document.getElementById('updateSeatIdBtn') as HTMLButtonElement;

  const saveDesignerLayoutBtn = document.getElementById('saveDesignerLayoutBtn') as HTMLButtonElement;
  const saveUploadedLayoutBtn = document.getElementById('saveUploadedLayoutBtn') as HTMLButtonElement;
  const designerSVG = document.getElementById('designerSVG') as unknown as SVGSVGElement; 
  
  // Show rotation handle next to the seat
  function showRotationHandle(rect: SVGRectElement) {
    if (rotationHandle) {
      rotationHandle.remove();
      rotationHandle = null;
    }
    const group = rect.parentNode as SVGGElement;
  
    // Get seat center in local group coordinates
    const x = parseFloat(rect.getAttribute('x') || "0");
    const y = parseFloat(rect.getAttribute('y') || "0");
    const w = parseFloat(rect.getAttribute('width') || "0");
    const h = parseFloat(rect.getAttribute('height') || "0");
    const localCx = x + w / 2;
    const localCy = y + h / 2;
  
    // Get seat center in SVG coordinates (for handle position)
    let cx = localCx, cy = localCy;
    const ctm = group.getCTM();
    if (ctm) {
      const pt = designerSVG.createSVGPoint();
      pt.x = localCx;
      pt.y = localCy;
      const svgPt = pt.matrixTransform(ctm);
      cx = svgPt.x;
      cy = svgPt.y;
    }
  
    // Get current group rotation in degrees
    const transform = group.getAttribute('transform') || '';
    const match = /rotate\((-?\d+(\.\d+)?)/.exec(transform);
    const angle = match ? parseFloat(match[1]) : 0;
    const rad = (angle * Math.PI) / 180;
  
    // Offset: 25px at 45° from the seat center, rotated with the seat
    const offset = 25;
    const baseAngle = Math.PI / 4; // 45 degrees
    const handleX = cx + offset * Math.cos(baseAngle + rad);
    const handleY = cy + offset * Math.sin(baseAngle + rad);
  
    rotationHandle = document.createElementNS(svgNS, 'circle');
    rotationHandle.setAttribute('cx', handleX.toString());
    rotationHandle.setAttribute('cy', handleY.toString());
    rotationHandle.setAttribute('r', '3');
    rotationHandle.setAttribute('fill', '#000');
    rotationHandle.style.cursor = 'pointer';
    designerSVG.appendChild(rotationHandle);
  
    rotationHandle.onmousedown = (e) => {
      e.stopPropagation();
      rotatingGroup = group;
      // Use local coordinates for rotation center!
      rotationOrigin = { cx: localCx, cy: localCy };
      // Get current group rotation
      const transform = group.getAttribute('transform') || '';
      const match = /rotate\((-?\d+(\.\d+)?)/.exec(transform);
      startAngle = match ? parseFloat(match[1]) : 0;
      // Mouse angle from center (in SVG coordinates)
      const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
      startMouseAngle = Math.atan2(svgCoords.y - cy, svgCoords.x - cx) * 180 / Math.PI;
      document.body.style.cursor = 'crosshair';
    };
  }
  
  // Listen for mousemove/mouseup on window for rotation
  window.addEventListener('mousemove', (e) => {
    if (rotatingGroup) {
      // Get local center for rotation
      const rect = rotatingGroup.querySelector('rect');
      if (!rect) return;
      const x = parseFloat(rect.getAttribute('x') || "0");
      const y = parseFloat(rect.getAttribute('y') || "0");
      const w = parseFloat(rect.getAttribute('width') || "0");
      const h = parseFloat(rect.getAttribute('height') || "0");
      const localCx = x + w / 2;
      const localCy = y + h / 2;
  
      // Get seat center in SVG coordinates (for mouse angle and handle)
      let cx = localCx, cy = localCy;
      const ctm = rotatingGroup.getCTM();
      if (ctm) {
        const pt = designerSVG.createSVGPoint();
        pt.x = localCx;
        pt.y = localCy;
        const svgPt = pt.matrixTransform(ctm);
        cx = svgPt.x;
        cy = svgPt.y;
      }
  
      const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
      const mouseAngle = Math.atan2(svgCoords.y - cy, svgCoords.x - cx) * 180 / Math.PI;
      let newAngle = startAngle + (mouseAngle - startMouseAngle);
      newAngle = ((newAngle % 360) + 360) % 360;
  
      // Keep any translation
      const transform = rotatingGroup.getAttribute('transform') || '';
      const transMatch = /translate\(([^,]+),([^)]+)\)/.exec(transform);
      let transPart = '';
      if (transMatch) transPart = `translate(${transMatch[1]},${transMatch[2]}) `;
      rotatingGroup.setAttribute('transform', `${transPart}rotate(${newAngle} ${localCx} ${localCy})`);
  
      // Move handle visually (in SVG coordinates)
      if (rotationHandle) {
        const rad = (newAngle * Math.PI) / 180;
        const offset = 25;
        const baseAngle = Math.PI / 4;
        rotationHandle.setAttribute('cx', (cx + offset * Math.cos(baseAngle + rad)).toString());
        rotationHandle.setAttribute('cy', (cy + offset * Math.sin(baseAngle + rad)).toString());
      }
    }
  });
  
  window.addEventListener('mouseup', () => {
    if (rotatingGroup) {
      rotatingGroup = null;
      document.body.style.cursor = '';
    }
  }); 

  // --- Original View ---
  let originalViewBox = seatSVG.getAttribute('viewBox');
  if (!originalViewBox) {
    originalViewBox = `0 0 ${seatSVG.width.baseVal.value} ${seatSVG.height.baseVal.value}`;
    seatSVG.setAttribute('viewBox', originalViewBox);
  }
  let [viewX, viewY, viewW, viewH] = originalViewBox.split(' ').map(Number);

  let panX = viewX, panY = viewY, panW = viewW, panH = viewH;
  
  // --- Zoom Logic ---
  function setUserZoom(zoom: number, centerX?: number, centerY?: number) {
    userZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoom));
    const newW = viewW / userZoomLevel;
    const newH = viewH / userZoomLevel;
  
    if (userZoomLevel === minZoom) {
      // At min zoom, always reset to original viewBox
      panX = viewX;
      panY = viewY;
      panW = viewW;
      panH = viewH;
    } else {
      // If zooming on a point, adjust pan so that point stays under the cursor
      if (typeof centerX === 'number' && typeof centerY === 'number') {
        // centerX/centerY are in SVG coordinates
        const zoomRatio = newW / panW;
        panX = centerX - (centerX - panX) * zoomRatio;
        panY = centerY - (centerY - panY) * zoomRatio;
      }
      panW = newW;
      panH = newH;
      clampPan();
    }
    seatSVG.setAttribute('viewBox', `${panX} ${panY} ${panW} ${panH}`);
  }
  
  // --- Pan Logic ---
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  
  seatSVG.addEventListener('mousedown', (e) => {
    if ((e.target as Element).tagName === 'rect') return;
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    seatSVG.style.cursor = 'grab';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const dx = (e.clientX - panStart.x) * (panW / seatSVG.clientWidth);
    const dy = (e.clientY - panStart.y) * (panH / seatSVG.clientHeight);
    panX -= dx;
    panY -= dy;
    panStart = { x: e.clientX, y: e.clientY };
    setUserZoom(userZoomLevel); // Always use setUserZoom to update viewBox and clamp
  });
  
  function clampPan() {
    // Clamp panX and panY so the viewBox stays within the SVG bounds
    if (panW > viewW) panX = viewX;
    else panX = Math.max(viewX, Math.min(panX, viewX + viewW - panW));
    if (panH > viewH) panY = viewY;
    else panY = Math.max(viewY, Math.min(panY, viewY + viewH - panH));
  }

  // --- Touch Pan & Pinch Zoom ---
  let lastTouchDist = 0;
  seatSVG.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isPanning = true;
      panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isPanning = false;
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  });
  seatSVG.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isPanning) {
      const dx = (e.touches[0].clientX - panStart.x) * (panW / seatSVG.clientWidth);
      const dy = (e.touches[0].clientY - panStart.y) * (panH / seatSVG.clientHeight);
      panX -= dx;
      panY -= dy;
      panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setUserZoom(userZoomLevel); // Always use setUserZoom to update viewBox and clamp
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastTouchDist) {
        const zoomChange = dist / lastTouchDist;
        setUserZoom(userZoomLevel * zoomChange);
      }
      lastTouchDist = dist;
    }
  }, { passive: false });
  seatSVG.addEventListener('touchend', () => {
    isPanning = false;
    lastTouchDist = 0;
  });
  
  // --- Mouse Wheel & Touchpad Zoom ---
  seatSVG.addEventListener('wheel', (e) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    const rect = seatSVG.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * panW + panX;
    const mouseY = ((e.clientY - rect.top) / rect.height) * panH + panY;
    setUserZoom(userZoomLevel + direction * zoomStep, mouseX, mouseY);
  }, { passive: false });
  
  // --- Reset Button ---
  zoomResetBtn.addEventListener('click', () => {
    panX = viewX;
    panY = viewY;
    panW = viewW;
    panH = viewH;
    setUserZoom(1);
  });

  // --- Utility Functions ---
  function updateSavedLayoutsDropdown(): void {
    savedLayoutsDropdown.innerHTML = '<option value="">Select Saved Layout</option>';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('seatLayout_') || key.startsWith('designerLayout_'))) {
        const name = key.replace('seatLayout_', '').replace('designerLayout_', '[Designer] ');
        const option = document.createElement('option');
        option.value = key;
        option.textContent = name;
        savedLayoutsDropdown.appendChild(option);
      }
    }
  }

  function updateUI(): void {
    selectedDisplay.textContent = `Selected Seats: ${[...selectedSeats].join(', ') || 'None'}`;
    totalDisplay.textContent = `Total: ₹${selectedSeats.size * pricePerSeat}`;
    if (seatMapType === 'svg') {
      const seatRects = seatSVG.querySelectorAll('rect');
      seatRects.forEach((rect, idx) => {
        const seatRect = rect as SVGRectElement;
        const seatId = seatRect.getAttribute('data-seat-id') || `${idx}`;
        if (occupiedSeats.has(seatId)) {
          seatRect.setAttribute('fill', '#d32f2f');
        } else if (selectedSeats.has(seatId)) {
          seatRect.setAttribute('fill', '#4caf50');
        } else if (seatRect.getAttribute('width') && seatRect.getAttribute('height') && parseFloat(seatRect.getAttribute('width') || "0") < 50 && parseFloat(seatRect.getAttribute('height') || "0") < 50) {
          seatRect.setAttribute('fill', '#e0e0e0');
        }
      });
    }
  }

  // Save current SVG layout
    function saveLayout(svg: SVGSVGElement, promptMsg: string, prefix: string) {
    const layoutName = prompt(promptMsg);
    if (!layoutName) return;
    localStorage.setItem(prefix + layoutName, svg.outerHTML);
    updateSavedLayoutsDropdown();
    alert('Layout saved!');
  }
  
  // Usage:
  function saveLayoutHandler(svg: SVGSVGElement, promptMsg: string, prefix: string) {
    return () => saveLayout(svg, promptMsg, prefix);
  }
  saveDesignerLayoutBtn.addEventListener('click', saveLayoutHandler(designerSVG, "Enter a name for this designer layout:", 'seatLayout_'));
  saveUploadedLayoutBtn.addEventListener('click', saveLayoutHandler(seatSVG, "Enter a name for this uploaded layout:", 'seatLayout_'));
  saveLayoutBtn.addEventListener('click', saveLayoutHandler(seatSVG, "Enter a name for this layout:", 'seatLayout_'));

  // --- Role Toggle ---
  roleSelect.addEventListener('change', () => {
    if (roleSelect.value === 'admin') {
      adminPanel.style.display = 'block';
      userPanel.style.display = 'none';
    } else {
      adminPanel.style.display = 'none';
      userPanel.style.display = 'block';
    }
  });

  // --- Grid Logic ---
  function generateSVGSeats(rows: number, cols: number, seatSize: number): void {
    const gap = 10;
    const totalWidth = cols * (seatSize + gap);
    const totalHeight = rows * (seatSize + gap);
    seatSVG.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seatId = String.fromCharCode(65 + r) + (c + 1);
        const x = c * (seatSize + gap);
        const y = r * (seatSize + gap);
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', y.toString());
        rect.setAttribute('width', seatSize.toString());
        rect.setAttribute('height', seatSize.toString());
        rect.setAttribute('fill', occupiedSeats.has(seatId) ? '#d32f2f' : '#e0e0e0');
        rect.setAttribute('stroke', '#444');
        rect.setAttribute('data-seat-id', seatId);
        if (!occupiedSeats.has(seatId)) {
          rect.style.cursor = 'pointer';
        }
        seatSVG.appendChild(rect);
      }
    }
  }

  createSeatsBtn.addEventListener('click', () => {
    seatMapType = 'grid';
    const rows = parseInt(rowInput.value);
    const cols = parseInt(colInput.value);
    const seatSize = parseInt(seatSizeInput.value);
    selectedSeats.clear();
    seatSVG.innerHTML = '';
    generateSVGSeats(rows, cols, seatSize);
    updateUI();
  });

  // --- SVG Upload Logic ---
  svgUpload.addEventListener('change', function(event: Event) {
    seatMapType = 'svg';
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e: ProgressEvent<FileReader>) {
      seatSVG.innerHTML = '';
      lastSVGString = e.target?.result as string;
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
      const importedSVG = svgDoc.documentElement;
      ['width', 'height', 'viewBox'].forEach(attr => {
        if (importedSVG.hasAttribute(attr)) {
          seatSVG.setAttribute(attr, importedSVG.getAttribute(attr) || "");
        } else {
          seatSVG.removeAttribute(attr);
        }
      });
      seatSVG.innerHTML = importedSVG.innerHTML;
      attachSVGSeatListeners();
      updateUI();
    };
    reader.readAsText(file);
  });

  // --- Layout Management ---

  function fixDuplicateSeatIds(svg: SVGSVGElement) {
    const ids = new Set<string>();
    const rects = svg.querySelectorAll('rect');
    let counter = 1;
    rects.forEach(rect => {
      let id = rect.getAttribute('data-seat-id')?.trim();
      if (!id || ids.has(id.toLowerCase())) {
        // Assign a new unique ID
        while (ids.has(`seat${counter}`.toLowerCase())) counter++;
        id = `Seat${counter}`;
        rect.setAttribute('data-seat-id', id);
      }
      ids.add(id.toLowerCase());
    });
  }
  
  function countAvailableSeats(): number {
    const seatRects = seatSVG.querySelectorAll('rect');
    let count = 0;
    seatRects.forEach(rect => {
      const seatId = rect.getAttribute('data-seat-id');
      if (seatId && !occupiedSeats.has(seatId)) count++;
    });
    return count;
  }

  loadLayoutBtn.addEventListener('click', () => {
    seatMapType = 'svg';
    const key = savedLayoutsDropdown.value;
    if (!key) return;
    lastSVGString = localStorage.getItem(key) || "";
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
    const importedSVG = svgDoc.documentElement;
    ['width', 'height', 'viewBox'].forEach(attr => {
      if (importedSVG.hasAttribute(attr)) {
        seatSVG.setAttribute(attr, importedSVG.getAttribute(attr) || "");
      } else {
        seatSVG.removeAttribute(attr);
      }
    });
    seatSVG.innerHTML = importedSVG.innerHTML;
    fixDuplicateSeatIds(seatSVG);
    attachSVGSeatListeners();
    updateUI();
  });

  deleteLayoutBtn.addEventListener('click', () => {
    const key = savedLayoutsDropdown.value;
    if (!key) {
      alert('Please select a layout to delete.');
      return;
    }
    if (confirm('Are you sure you want to delete this layout?')) {
      localStorage.removeItem(key);
      updateSavedLayoutsDropdown();
      alert('Layout deleted!');
    }
  });

  updateSavedLayoutsDropdown();

    seatSVG.addEventListener('click', (e) => {
      const target = e.target as SVGRectElement;
      if (
        target.tagName === 'rect' &&
        target.hasAttribute('data-seat-id') &&
        !occupiedSeats.has(target.getAttribute('data-seat-id')!)
      ) {
        const seatId = target.getAttribute('data-seat-id')!;
        toggleSVGSeat(seatId, target);
      }
    });

  // --- Seat Selection Logic ---
  function attachSVGSeatListeners(): void {
    const seatRects = seatSVG.querySelectorAll('rect');
    seatRects.forEach((rect, idx) => {
      const seatRect = rect as SVGRectElement;
      const seatId = seatRect.getAttribute('data-seat-id') || `${idx}`;
      const width = parseFloat(seatRect.getAttribute('width') || "0");
      const height = parseFloat(seatRect.getAttribute('height') || "0");
      let x = seatRect.hasAttribute('x') ? parseFloat(seatRect.getAttribute('x') || "0") : undefined;
      let y = seatRect.hasAttribute('y') ? parseFloat(seatRect.getAttribute('y') || "0") : undefined;
      if (x === undefined || y === undefined) {
        const bbox = seatRect.getBBox();
        x = bbox.x;
        y = bbox.y;
      }
      if ((x === 0 && y === 0 && !seatRect.hasAttribute('data-seat-id')) || width === 0 || height === 0) {
        return;
      }
      if (width < 50 && height < 50) {
        seatRect.style.cursor = 'pointer';
        if (!occupiedSeats.has(seatId)) {
          seatRect.setAttribute('fill', '#e0e0e0');
        } else {
          seatRect.setAttribute('fill', '#d32f2f');
        }
      } else {
        seatRect.setAttribute('fill', '#bdbdbd');
        seatRect.style.cursor = 'default';
      }
    });
  }

  function promptForSeatCount() {
    const availableSeats = countAvailableSeats();
    const input = prompt(`How many seats do you want to select? (Available: ${availableSeats})`);
    if (!input) {
      maxSelectableSeats = null;
      alert("Please enter a number to proceed.");
      return false;
    }
    const num = parseInt(input);
    if (isNaN(num) || num <= 0) {
      maxSelectableSeats = null;
      alert("Please enter a valid positive number.");
      return false;
    }
    if (num > availableSeats) {
      maxSelectableSeats = null;
      alert(`Only ${availableSeats} seats are available. Please enter a lower number.`);
      return false;
    }
    maxSelectableSeats = num;
    selectedSeats.clear();
    updateUI();
    alert(`You can now select up to ${maxSelectableSeats} seats.`);
    return true;
 }

  function toggleSVGSeat(seatId: string, rect: SVGRectElement): void {
    if (maxSelectableSeats === null) {
      if (!promptForSeatCount()) return;
    }
    if (selectedSeats.has(seatId)) {
      selectedSeats.delete(seatId);
      rect.setAttribute('fill', '#e0e0e0');
    } else {
      if (selectedSeats.size >= (maxSelectableSeats ?? 0)) {
        alert(`You can only select up to ${maxSelectableSeats} seats.`);
        return;
      }
      selectedSeats.add(seatId);
      rect.setAttribute('fill', '#4caf50');
    }
    updateUI();
  }

  // --- Booking Logic ---
  confirmBtn.addEventListener('click', () => {
    if (selectedSeats.size === 0) {
      alert("No seats selected.");
      return;
    }
    const seatsList = [...selectedSeats].join(', ');
    const total = selectedSeats.size * pricePerSeat;
    alert(`Booking confirmed!\nSeats: ${seatsList}\nTotal: ₹${total}`);
    selectedSeats.forEach(seatId => {
      occupiedSeats.add(seatId);
    });
    selectedSeats.clear();
    seatSVG.innerHTML = '';
    if (seatMapType === 'grid') {
      generateSVGSeats(parseInt(rowInput.value), parseInt(colInput.value), parseInt(seatSizeInput.value));
    } else if (seatMapType === 'svg') {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
      const importedSVG = svgDoc.documentElement;
      ['width', 'height', 'viewBox'].forEach(attr => {
        if (importedSVG.hasAttribute(attr)) {
          seatSVG.setAttribute(attr, importedSVG.getAttribute(attr) || "");
        } else {
          seatSVG.removeAttribute(attr);
        }
      });
      seatSVG.innerHTML = importedSVG.innerHTML;
      attachSVGSeatListeners();
    }
    maxSelectableSeats = null;
    updateUI();
  });

  // --- Reset Selection Button ---
  const resetBtn = document.createElement('button');
  resetBtn.textContent = "Reset Selection";
  resetBtn.onclick = () => {
    maxSelectableSeats = null;
    selectedSeats.clear();
    updateUI();
    alert("Selection reset. Please select how many seats you want again.");
  };
  userPanel.appendChild(resetBtn);

  function getNextAvailableDesignerSeatId(): string {
    // Collect all used numbers from data-seat-id attributes
    const usedNumbers = new Set<number>();
    const rects = designerSVG.querySelectorAll('rect');
    rects.forEach(rect => {
      const id = rect.getAttribute('data-seat-id');
      if (id && /^Seat\d+$/.test(id)) {
        const num = parseInt(id.replace('Seat', ''), 10);
        if (!isNaN(num)) usedNumbers.add(num);
      }
    });
    // Find the lowest unused number
    let next = 1;
    while (usedNumbers.has(next)) next++;
    return `Seat${next}`;
  }

  function getSVGCoords(svg: SVGSVGElement, clientX: number, clientY: number) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      return pt.matrixTransform(ctm.inverse());
    }
    return { x: clientX, y: clientY };
  }

  // --- Designer Logic ---
    
    let dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
  
  function makeDraggable(group: SVGGElement) {
    group.addEventListener('mousedown', (e: MouseEvent) => {
      justDragged = false;
      if (isRotating) return;
      if (roleSelect.value !== 'admin') return;
      dragTarget = group;
      const transform = group.getAttribute('transform') || '';
      const match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
      dragStart = {
        x: e.clientX,
        y: e.clientY,
        tx: match ? parseFloat(match[1]) : 0,
        ty: match ? parseFloat(match[2]) : 0
      };
      e.stopPropagation();
    });
  }
  
  designerSVG.addEventListener('mousemove', (e: MouseEvent) => {
    if (dragTarget && roleSelect.value === 'admin') {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const tx = dragStart.tx + dx;
      const ty = dragStart.ty + dy;
      // Keep any rotation
      const transform = dragTarget.getAttribute('transform') || '';
      const rotMatch = /rotate\(([^)]+)\)/.exec(transform);
      let rotPart = '';
      if (rotMatch) rotPart = ` rotate(${rotMatch[1]})`;
      dragTarget.setAttribute('transform', `translate(${tx},${ty})${rotPart}`);
      // Move handle visually
      if (selectedDesignerSeat && selectedDesignerSeat.parentNode === dragTarget) {
        showRotationHandle(selectedDesignerSeat);
      }
    }
  });
  
  designerSVG.addEventListener('mouseup', () => {
    if (dragTarget) {
      justDragged = true;
    }
    dragTarget = null;
  });
  
  designerSVG.addEventListener('mouseleave', () => {
    if (dragTarget) {
      justDragged = true;
    }
    dragTarget = null;
  });

  if (designerSVG && roleSelect.value === 'admin') {
    addSeatBtn.addEventListener('click', () => {
      addMode = !addMode;
      addSeatBtn.textContent = addMode ? "Adding... (Click SVG)" : "Add Seat";
      addSeatBtn.style.background = addMode ? "#4caf50" : "";
    });

    designerSVG.addEventListener('click', (e) => {
      if (justDragged) {
        justDragged = false;
        return;
      }
      if (justRotated) {
        justRotated = false; // Reset the flag
        return; 
      }
      if (isRotating){
        isRotating = false; // Stop rotation on click
        return; // Ignore clicks while rotating
      } 
      if (!addMode) {
        if (e.target === designerSVG) {
          if (selectedDesignerSeat) selectedDesignerSeat.setAttribute('stroke', '#222');
          selectedDesignerSeat = null;
          seatIdInput.value = '';
          // Remove rotation handle 
          if (rotationHandle) {
            rotationHandle.remove();
            rotationHandle = null;
          }
        }
        return;
      }
      if (e.target !== designerSVG) return;
      const rect = document.createElementNS(svgNS, 'rect');
      const group = document.createElementNS(svgNS, 'g');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', '20');
      rect.setAttribute('height', '15');
      rect.setAttribute('fill', '#49D44B');
      rect.setAttribute('stroke', '#222');
      rect.setAttribute('data-seat-id', getNextAvailableDesignerSeatId());      
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', (evt) => {
        evt.stopPropagation();
        selectDesignerSeat(rect);
      });
      group.appendChild(rect);
      group.setAttribute('transform', `translate(${e.offsetX},${e.offsetY})`);
      designerSVG.appendChild(group);
      makeDraggable(group); // Pass the group, not the rect
      selectDesignerSeat(rect);
    });
  }

  function selectDesignerSeat(rect: SVGRectElement) {
    if (selectedDesignerSeat) {
      selectedDesignerSeat.setAttribute('stroke', '#222');
    }
    selectedDesignerSeat = rect;
    rect.setAttribute('stroke', '#f00');
    seatIdInput.value = rect.getAttribute('data-seat-id') || '';
    showRotationHandle(rect);
  }

  updateSeatIdBtn.addEventListener('click', () => {
    if (selectedDesignerSeat) {
      const newId = seatIdInput.value.trim();
      if (!newId) {
        alert('Seat ID cannot be empty.');
        return;
      }
      // Check for duplicate ID (case-insensitive, trimmed)
      const rects = designerSVG.querySelectorAll('rect');
      for (const rect of Array.from(rects)) {
        if (
          rect !== selectedDesignerSeat &&
          rect.getAttribute('data-seat-id')?.trim().toLowerCase() === newId.toLowerCase()
        ) {
          alert('This Seat ID is already used. Please choose a unique ID.');
          return;
        }
      }
      selectedDesignerSeat.setAttribute('data-seat-id', newId);
      seatIdInput.value = newId; // reflect the update
    }
  });

  deleteSeatBtn.addEventListener('click', () => {
    if (selectedDesignerSeat && designerSVG) {
      const group = selectedDesignerSeat.parentNode as SVGGElement;
      designerSVG.removeChild(group);
      selectedDesignerSeat = null;
      seatIdInput.value = '';
      if (rotationHandle) {
        rotationHandle.remove();
        rotationHandle = null;
      }
    }
  });

})();