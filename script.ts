(function () {
  // --- Constants & State ---
  const svgNS = "http://www.w3.org/2000/svg";
  const pricePerSeat = 200;
  let selectedSeats: Set<string> = new Set();
  let occupiedSeats: Set<string> = new Set();
  let seatMapType: 'grid' | 'svg' = 'grid';
  let lastSVGString: string = '';
  let maxSelectableSeats: number | null = null;
  let selectedDesignerSeat: SVGCircleElement | null = null;
  let addMode = false;

  let dragTarget: SVGGElement | null = null;

  let userZoomLevel = 1;
  const minZoom = 1;
  const maxZoom = 3;
  const zoomStep = 0.04;

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

  const designerZoomResetBtn = document.getElementById('designerZoomResetBtn') as HTMLButtonElement;
  const drawCurveBtn = document.getElementById('drawCurveBtn') as HTMLButtonElement;

  const rotateLeftBtn = document.getElementById('rotateLeftBtn') as HTMLButtonElement;
  const rotateRightBtn = document.getElementById('rotateRightBtn') as HTMLButtonElement;
  const addCircleBtn = document.getElementById('addCircleBtn') as HTMLButtonElement;
  const addRectBtn = document.getElementById('addRectBtn') as HTMLButtonElement;
  const addTextBtn = document.getElementById('addTextBtn') as HTMLButtonElement;
  const importBgImage = document.getElementById('importBgImage') as HTMLInputElement;
  const toggleBgImageBtn = document.getElementById('toggleBgImageBtn') as HTMLButtonElement;
  const textEditInput = document.getElementById('textEditInput') as HTMLInputElement;
  const textSizeSlider = document.getElementById('textSizeSlider') as HTMLInputElement;
  const textSizeValue = document.getElementById('textSizeValue') as HTMLSpanElement;

  const allSeatSizeSlider = document.getElementById('allSeatSizeSlider') as HTMLInputElement;
  const allSeatSizeValue = document.getElementById('allSeatSizeValue') as HTMLSpanElement;

  // Designer SVG pan/zoom state
  let designerOriginalViewBox = designerSVG.getAttribute('viewBox');
  if (!designerOriginalViewBox) {
    designerOriginalViewBox = `0 0 ${designerSVG.width.baseVal.value} ${designerSVG.height.baseVal.value}`;
    designerSVG.setAttribute('viewBox', designerOriginalViewBox);
  }
  let [designerViewX, designerViewY, designerViewW, designerViewH] = designerOriginalViewBox.split(' ').map(Number);

  let designerPanX = designerViewX, designerPanY = designerViewY, designerPanW = designerViewW, designerPanH = designerViewH;
  let designerZoomLevel = 1;
  const designerMinZoom = 1;
  const designerMaxZoom = 3;
  const designerZoomStep = 0.04;

  let isDesignerPanning = false;
  let designerPanStart = { x: 0, y: 0 };

  // --- Original View ---
  const svgWidth = seatSVG.width.baseVal.value;
  const svgHeight = seatSVG.height.baseVal.value;
  // Always force the viewBox to match the SVG's width/height
  const originalViewBox = `0 0 ${svgWidth} ${svgHeight}`;
  seatSVG.setAttribute('viewBox', originalViewBox);
  let [viewX, viewY, viewW, viewH] = [0, 0, svgWidth, svgHeight];

  let panX = viewX, panY = viewY, panW = viewW, panH = viewH;

  let isPathDragging = false;
  let pathDragStart = { x: 0, y: 0 };

  let shapeMode: 'none' | 'circle' = 'none';
  let selectedShape: SVGCircleElement | null = null;
  let isShapeDragging = false;
  let shapeDragStart = { x: 0, y: 0, origX: 0, origY: 0, origAngle: 0, w: 0, h: 0 };

  let rectMode = false;
  let selectedRectPath: SVGPathElement | null = null;
  let isRectPathDragging = false;
  let rectPathDragStart = { x: 0, y: 0, points: [] as { x: number, y: number }[] };

  let textMode = false;
  let bgImageEl: SVGImageElement | null = null;
  let bgImageVisible = true;
  let justSelectedTextBox = false;
  let selectedTextGroup: SVGGElement | null = null;
  let selectedText: SVGTextElement | null = null;
  let selectedTextRect: SVGRectElement | null = null;

  // --- Designer SVG Pan Logic ---  
  designerSVG.addEventListener('mousedown', (e) => {
    // Only pan if not clicking on a shape/handle
    if (
      e.target !== designerSVG ||
      penMode ||
      isShapeDragging ||
      isRectPathDragging ||
      isPathDragging ||
      dragTarget
    ) return;
    isDesignerPanning = true;
    designerPanStart = { x: e.clientX, y: e.clientY };
    designerSVG.style.cursor = 'grab';
  });

  allSeatSizeSlider.addEventListener('input', () => {
    const newSize = parseInt(allSeatSizeSlider.value, 10);
    allSeatSizeValue.textContent = newSize.toString();

    // Update all seat circles in seatSVG
    const seatCircles = seatSVG.querySelectorAll('circle[data-seat-id]');
    seatCircles.forEach(circle => {
      circle.setAttribute('r', (newSize).toString());
    });

    // Update all seat circles in designerSVG (designer side)
    const designerCircles = designerSVG.querySelectorAll('circle[data-seat-id]');
    designerCircles.forEach(circle => {
      circle.setAttribute('r', (newSize).toString());
    });
  });

  window.addEventListener('mousemove', (e) => {
    if (isDesignerPanning) {
      const dx = (e.clientX - designerPanStart.x) * (designerPanW / designerSVG.clientWidth);
      const dy = (e.clientY - designerPanStart.y) * (designerPanH / designerSVG.clientHeight);
      designerPanX -= dx;
      designerPanY -= dy;
      designerPanStart = { x: e.clientX, y: e.clientY };
      clampDesignerPan();
      setDesignerZoom(designerZoomLevel);
    }
  });

  window.addEventListener('mouseup', () => {
    isDesignerPanning = false;
    designerSVG.style.cursor = '';
  });

  // Touch support for designer SVG
  let lastDesignerTouchDist = 0;
  designerSVG.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDesignerPanning = true;
      designerPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDesignerPanning = false;
      lastDesignerTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  });
  designerSVG.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDesignerPanning) {
      const dx = (e.touches[0].clientX - designerPanStart.x) * (designerPanW / designerSVG.clientWidth);
      const dy = (e.touches[0].clientY - designerPanStart.y) * (designerPanH / designerSVG.clientHeight);
      designerPanX -= dx;
      designerPanY -= dy;
      designerPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      clampDesignerPan();
      setDesignerZoom(designerZoomLevel);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastDesignerTouchDist) {
        const zoomChange = dist / lastDesignerTouchDist;
        setDesignerZoom(designerZoomLevel * zoomChange);
      }
      lastDesignerTouchDist = dist;
    }
  }, { passive: false });
  designerSVG.addEventListener('touchend', () => {
    isDesignerPanning = false;
    lastDesignerTouchDist = 0;
  });

  importBgImage.addEventListener('change', function (event) {
    const file = importBgImage.files && importBgImage.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      // Remove old image if present
      if (bgImageEl && bgImageEl.parentNode) {
        bgImageEl.parentNode.removeChild(bgImageEl);
      }
      bgImageEl = document.createElementNS(svgNS, 'image');
      bgImageEl.setAttribute('href', e.target?.result as string);
      bgImageEl.setAttribute('opacity', '0.4'); // Translucent
      bgImageEl.style.pointerEvents = 'none'; // Don't block interaction

      // Get SVG size (from viewBox or width/height)
      let svgW = designerSVG.viewBox.baseVal.width || designerSVG.width.baseVal.value;
      let svgH = designerSVG.viewBox.baseVal.height || designerSVG.height.baseVal.value;

      // Create a JS Image to get natural size
      const img = new window.Image();
      img.onload = function () {
        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;

        // Calculate scale to fit image inside SVG
        const scale = Math.min(svgW / imgW, svgH / imgH);
        const newW = imgW * scale;
        const newH = imgH * scale;
        const x = (svgW - newW) / 2;
        const y = (svgH - newH) / 2;

        if (bgImageEl) {
          bgImageEl.setAttribute('x', x.toString());
          bgImageEl.setAttribute('y', y.toString());
          bgImageEl.setAttribute('width', newW.toString());
          bgImageEl.setAttribute('height', newH.toString());

          // Insert as first child (bottom layer)
          designerSVG.insertBefore(bgImageEl, designerSVG.firstChild);

          bgImageVisible = true;
          toggleBgImageBtn.textContent = "Hide Background";
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

  toggleBgImageBtn.addEventListener('click', () => {
    if (!bgImageEl) return;
    bgImageVisible = !bgImageVisible;
    bgImageEl.style.display = bgImageVisible ? '' : 'none';
    toggleBgImageBtn.textContent = bgImageVisible ? "Hide Background" : "Show Background";
  });

  addTextBtn.addEventListener('click', () => {
    textMode = !textMode;
    addTextBtn.style.background = textMode ? "#4caf50" : "";
  });

  addRectBtn.addEventListener('click', () => {
    rectMode = !rectMode;
    addRectBtn.style.background = rectMode ? "#4caf50" : "";
  });

  addCircleBtn.addEventListener('click', () => {
    shapeMode = shapeMode === 'circle' ? 'none' : 'circle';
    addCircleBtn.style.background = shapeMode === 'circle' ? "#4caf50" : "";
  });

  designerZoomResetBtn.addEventListener('click', () => {
    designerPanX = designerViewX;
    designerPanY = designerViewY;
    designerPanW = designerViewW;
    designerPanH = designerViewH;
    setDesignerZoom(1);
  });

  designerSVG.addEventListener('mouseup', () => {
    dragTarget = null;
  });

  function addRectResizeHandle(path: SVGPathElement) {
    // Remove old handle if any
    if ((path as any)._resizeHandle) {
      (path as any)._resizeHandle.remove();
    }

    // Get points (bottom right is points[2])
    const points = (path as any)._rectPoints as { x: number, y: number }[];
    const handle = document.createElementNS(svgNS, 'circle');
    handle.setAttribute('r', '3');
    handle.setAttribute('fill', '#000');
    handle.style.cursor = 'nwse-resize';
    designerSVG.appendChild(handle);

    // Helper to update handle position
    function updateHandle() {
      // Find the point with the largest x+y (visual bottom-right)
      let idx = 0;
      let maxSum = -Infinity;
      for (let i = 0; i < points.length; i++) {
        const sum = points[i].x + points[i].y;
        if (sum > maxSum) {
          maxSum = sum;
          idx = i;
        }
      }
      handle.setAttribute('cx', points[idx].x.toString());
      handle.setAttribute('cy', points[idx].y.toString());
      (handle as any).cornerIdx = idx; // Store index for resizing
    }
    updateHandle();
    // Store for later updates
    (path as any)._resizeHandle = handle;
    (handle as any)._updateHandle = updateHandle;

    // --- Resize logic ---
    let isResizing = false;
    let startPt = { x: 0, y: 0 };
    let origPt = { x: 0, y: 0 };
    let origOppPt = { x: 0, y: 0 };
    let anchorIdx = 0, handleIdx = 0;
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isResizing = true;
      startPt = getSVGCoords(designerSVG, e.clientX, e.clientY);

      // Find anchor (top-left) and handle (bottom-right) once at the start
      let minSum = Infinity, maxSum = -Infinity;
      for (let i = 0; i < points.length; i++) {
        const sum = points[i].x + points[i].y;
        if (sum < minSum) { minSum = sum; anchorIdx = i; }
        if (sum > maxSum) { maxSum = sum; handleIdx = i; }
      }
      (handle as any)._anchorIdx = anchorIdx;
      (handle as any)._handleIdx = handleIdx;
      origPt = { ...points[handleIdx] };
      origOppPt = { ...points[anchorIdx] }; // anchor is the fixed point
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    function onMove(e: MouseEvent) {
      if (!isResizing) return;
      const curr = getSVGCoords(designerSVG, e.clientX, e.clientY);
      const points = (path as any)._rectPoints as { x: number, y: number }[];

      const anchorIdx = (handle as any)._anchorIdx;
      const handleIdx = (handle as any)._handleIdx;
      const adj1 = (anchorIdx + 1) % 4;
      const adj2 = (anchorIdx + 3) % 4;

      // Move the handle point to the cursor
      points[handleIdx].x = curr.x;
      points[handleIdx].y = curr.y;

      // Project adjacents:
      // adj1: shares y with anchor, x with handle
      points[adj1].x = curr.x;
      points[adj1].y = points[anchorIdx].y;
      // adj2: shares x with anchor, y with handle
      points[adj2].x = points[anchorIdx].x;
      points[adj2].y = curr.y;

      // Anchor stays fixed!
      updateRectPath(path, points);
      updateHandle();
    }

    function onUp() {
      isResizing = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
  }

  function rotateSelectedRectPath(angleDeg: number) {
    if (!selectedRectPath) return;
    let points = (selectedRectPath as any)._rectPoints as { x: number, y: number }[];
    // Find center
    const cx = points.reduce((sum, pt) => sum + pt.x, 0) / 4;
    const cy = points.reduce((sum, pt) => sum + pt.y, 0) / 4;
    const angleRad = angleDeg * Math.PI / 180;
    // Update points IN PLACE
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const dx = pt.x - cx, dy = pt.y - cy;
      pt.x = cx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      pt.y = cy + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
    }
    updateRectPath(selectedRectPath, points);
  }

  // Attach to your rotate buttons:
  rotateLeftBtn.addEventListener('click', () => {
    if (selectedRectPath) rotateSelectedRectPath(-90);
  });
  rotateRightBtn.addEventListener('click', () => {
    if (selectedRectPath) rotateSelectedRectPath(90);
  });

  function selectRectPath(path: SVGPathElement) {
    if (selectedRectPath && selectedRectPath !== path) {
      selectedRectPath.setAttribute('stroke', '#000');
    }
    selectedRectPath = path;
    path.setAttribute('stroke', '#f44336');
  }

  function makeRectPathInteractive(path: SVGPathElement) {
    // Select on click
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      selectRectPath(path);
    });

    // Drag on mousedown
    path.addEventListener('mousedown', (e) => {
      if (roleSelect.value !== 'admin') return;
      if (selectedRectPath !== path) return;
      isRectPathDragging = true;
      rectPathDragStart.x = e.clientX;
      rectPathDragStart.y = e.clientY;
      // Deep copy points
      rectPathDragStart.points = ((path as any)._rectPoints as { x: number, y: number }[]).map(pt => ({ ...pt }));
      e.stopPropagation();
    });
  }

  // Drag logic (in your window mousemove handler)
  window.addEventListener('mousemove', (e) => {
    if (isRectPathDragging && selectedRectPath) {
      const svgCoords1 = getSVGCoords(designerSVG, rectPathDragStart.x, rectPathDragStart.y);
      const svgCoords2 = getSVGCoords(designerSVG, e.clientX, e.clientY);
      const dx = svgCoords2.x - svgCoords1.x;
      const dy = svgCoords2.y - svgCoords1.y;
      const origPoints = rectPathDragStart.points;
      // Instead of creating a new array, update the existing one:
      const points = (selectedRectPath as any)._rectPoints as { x: number, y: number }[];
      for (let i = 0; i < points.length; i++) {
        points[i].x = origPoints[i].x + dx;
        points[i].y = origPoints[i].y + dy;
      }
      updateRectPath(selectedRectPath, points);
    }
  });

  window.addEventListener('mouseup', () => {
    isRectPathDragging = false;
  });

  // Update path "d" from points
  function updateRectPath(path: SVGPathElement, points: { x: number, y: number }[]) {
    const d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
    path.setAttribute('d', d);
    // Update handle if present
    if ((path as any)._resizeHandle) {
      (path as any)._resizeHandle._updateHandle();
    }
  }
  // Shape resizing 
  function makeShapeInteractive(shape: SVGRectElement | SVGCircleElement) {
    // Remove old handles if any
    if ((shape as any)._resizeHandles) {
      (shape as any)._resizeHandles.forEach((h: SVGCircleElement) => h.remove());
    }
    // --- CIRCLE LOGIC ---
    if (shape instanceof SVGCircleElement) {
      // Circle: 1 handle on right edge
      const handle = document.createElementNS(svgNS, 'circle');
      handle.setAttribute('r', '3');
      handle.setAttribute('fill', '#000');
      handle.style.cursor = 'ew-resize';
      handle.style.pointerEvents = 'all';
      designerSVG.appendChild(handle);

      const updateHandle = () => {
        const cx = parseFloat(shape.getAttribute('cx') || '0');
        const cy = parseFloat(shape.getAttribute('cy') || '0');
        const r = parseFloat(shape.getAttribute('r') || '0');
        handle.setAttribute('cx', (cx + r).toString());
        handle.setAttribute('cy', cy.toString());
        designerSVG.appendChild(handle);
      };
      (handle as any).__updateHandle = updateHandle;

      let isResizing = false;
      let start = { x: 0, r: 0 };

      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizing = true;
        start.x = e.clientX;
        start.r = parseFloat(shape.getAttribute('r') || '0');

        function onMove(ev: MouseEvent) {
          if (!isResizing) return;
          const dx = ev.clientX - start.x;
          let newR = Math.max(5, start.r + dx);
          shape.setAttribute('r', newR.toString());
          updateHandle();
        }

        function onUp() {
          isResizing = false;
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }); // save

      // --- DRAG LOGIC ---
      shape.addEventListener('mousedown', (e) => {
        if ((e as MouseEvent).shiftKey) return; // Don't drag if resizing
        isShapeDragging = true;
        shapeDragStart.x = (e as MouseEvent).clientX;
        shapeDragStart.y = (e as MouseEvent).clientY;
        shapeDragStart.origX = parseFloat(shape.getAttribute('cx') || '0');
        shapeDragStart.origY = parseFloat(shape.getAttribute('cy') || '0');
        selectedShape = shape;
        (e as MouseEvent).stopPropagation();
      });

      //  Drag centre dot
      window.addEventListener('mousemove', (e) => {
        if (isShapeDragging && selectedShape === shape) {
          const svgCoords1 = getSVGCoords(designerSVG, shapeDragStart.x, shapeDragStart.y);
          const svgCoords2 = getSVGCoords(designerSVG, e.clientX, e.clientY);
          const dx = svgCoords2.x - svgCoords1.x;
          const dy = svgCoords2.y - svgCoords1.y;
          shape.setAttribute('cx', (shapeDragStart.origX + dx).toString());
          shape.setAttribute('cy', (shapeDragStart.origY + dy).toString());
          // Move the center dot too
          const centerDot = (shape as any)._centerDot as SVGCircleElement;
          if (centerDot) {
            centerDot.setAttribute('cx', (shapeDragStart.origX + dx).toString());
            centerDot.setAttribute('cy', (shapeDragStart.origY + dy).toString());
          }
          if ((shape as any)._resizeHandles?.[0]) {
            const updateHandle = (shape as any)._resizeHandles[0].__updateHandle;
            if (updateHandle) updateHandle();
          }
          return;
        }
      });

      // --- INITIAL HANDLE POSITION ---
      updateHandle();
      (shape as any)._resizeHandles = [handle];
    }
  }

  // --- Designer SVG Zoom/Pan Logic ---
  function setDesignerZoom(zoom: number, centerX?: number, centerY?: number) {
    designerZoomLevel = Math.max(designerMinZoom, Math.min(designerMaxZoom, zoom));
    const newW = designerViewW / designerZoomLevel;
    const newH = designerViewH / designerZoomLevel;

    if (designerZoomLevel === designerMinZoom) {
      designerPanX = designerViewX;
      designerPanY = designerViewY;
      designerPanW = designerViewW;
      designerPanH = designerViewH;
    } else {
      if (typeof centerX === 'number' && typeof centerY === 'number') {
        const zoomRatio = newW / designerPanW;
        designerPanX = centerX - (centerX - designerPanX) * zoomRatio;
        designerPanY = centerY - (centerY - designerPanY) * zoomRatio;
      }
      designerPanW = newW;
      designerPanH = newH;
      clampDesignerPan();
    }
    designerSVG.setAttribute('viewBox', `${designerPanX} ${designerPanY} ${designerPanW} ${designerPanH}`);

    // --- Keep text visually constant size ---
    const texts = designerSVG.querySelectorAll('text');
    texts.forEach(text => {
      const baseFontSize = parseFloat(text.getAttribute('data-base-font-size') || '18');
      text.setAttribute('font-size', (baseFontSize / designerZoomLevel) + 'px');

      // --- Update rect for each text ---
      const rect = text.previousElementSibling as SVGRectElement | null;
      if (rect && rect.tagName === 'rect') {
        const bb = text.getBBox();
        const cx = parseFloat(text.getAttribute('x') || '0');
        const cy = parseFloat(text.getAttribute('y') || '0');
        rect.setAttribute('x', (cx - bb.width / 2 - 8).toString());
        rect.setAttribute('y', (cy - bb.height / 2 - 4).toString());
        rect.setAttribute('width', (bb.width + 16).toString());
        rect.setAttribute('height', (bb.height + 8).toString());
      }
    });
  }

  function clampDesignerPan() {
    if (designerPanW > designerViewW) designerPanX = designerViewX;
    else designerPanX = Math.max(designerViewX, Math.min(designerPanX, designerViewX + designerViewW - designerPanW));
    if (designerPanH > designerViewH) designerPanY = designerViewY;
    else designerPanY = Math.max(designerViewY, Math.min(designerPanY, designerViewY + designerViewH - designerPanH));
  }

  // --- Designer Mouse Wheel & Touchpad Zoom ---
  designerSVG.addEventListener('wheel', (e) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    const circle = designerSVG.getBoundingClientRect();
    const mouseX = ((e.clientX - circle.left) / circle.width) * designerPanW + designerPanX;
    const mouseY = ((e.clientY - circle.top) / circle.height) * designerPanH + designerPanY;
    setDesignerZoom(designerZoomLevel + direction * designerZoomStep, mouseX, mouseY);
  }, { passive: false });

  // --- Pen Tool for Cubic Bezier Paths with Selection ---
  type PenPoint = {
    x: number,
    y: number,
    handleIn?: { x: number, y: number },
    handleOut?: { x: number, y: number },
    anchorCircle?: SVGCircleElement,
    anchorDot?: SVGCircleElement,
    handleInCircle?: SVGCircleElement,
    handleOutCircle?: SVGCircleElement,
    handleLineIn?: SVGLineElement,
    handleLineOut?: SVGLineElement,
    _dragStart?: { x: number, y: number }
  };
  type PenPath = {
    points: PenPoint[],
    path: SVGPathElement,
    closed: boolean
  };

  let penMode = false;
  let currentPenPath: PenPath | null = null;
  let penDragging: { point: PenPoint, type: 'anchor' | 'handleIn' | 'handleOut', offsetX: number, offsetY: number } | null = null;
  let penPreviewLine: SVGLineElement | null = null;
  let penPreviewHandle: SVGLineElement | null = null;
  let finishedPenPaths: PenPath[] = [];
  let selectedPenPath: PenPath | null = null;

  // --- Pen Tool Toggle ---
  drawCurveBtn.addEventListener('click', () => {
    penMode = !penMode;
    drawCurveBtn.textContent = penMode ? "Draw Tool: ON" : "Draw Tool";
    if (!penMode) finishPenPath();
  });

  // --- Pen Tool Mouse Down (Add/Select/Drag) ---
  designerSVG.addEventListener('mousedown', (e) => {
    const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);

    // --- Pen Tool: Drawing/Editing ---
    if (penMode) {
      if (e.button !== 0) return;

      // Snap/close if clicking first anchor
      if (
        currentPenPath &&
        currentPenPath.points.length > 1 &&
        e.target === currentPenPath.points[0].anchorCircle
      ) {
        finishPenPath(true);
        return;
      }

      // Drag existing anchor/handle
      if (currentPenPath) {
        for (const pt of currentPenPath.points) {
          if (e.target === pt.anchorCircle) {
            penDragging = { point: pt, type: 'anchor', offsetX: svgCoords.x - pt.x, offsetY: svgCoords.y - pt.y };
            return;
          }
          if (e.target === pt.handleInCircle) {
            penDragging = { point: pt, type: 'handleIn', offsetX: svgCoords.x - (pt.handleIn?.x ?? pt.x), offsetY: svgCoords.y - (pt.handleIn?.y ?? pt.y) };
            return;
          }
          if (e.target === pt.handleOutCircle) {
            penDragging = { point: pt, type: 'handleOut', offsetX: svgCoords.x - (pt.handleOut?.x ?? pt.x), offsetY: svgCoords.y - (pt.handleOut?.y ?? pt.y) };
            return;
          }
        }
      }

      // Add new point
      if (!currentPenPath) {
        currentPenPath = {
          points: [],
          path: document.createElementNS(svgNS, 'path'),
          closed: false
        };
        currentPenPath.path.setAttribute('stroke', '#000');
        currentPenPath.path.setAttribute('stroke-width', '2');
        currentPenPath.path.setAttribute('fill', 'none');
        designerSVG.appendChild(currentPenPath.path);
      }
      let x = svgCoords.x;
      let y = svgCoords.y;
      if (e.shiftKey && currentPenPath.points.length > 0) {
        const prev = currentPenPath.points[currentPenPath.points.length - 1];
        const dx = x - prev.x;
        const dy = y - prev.y;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        x = prev.x + Math.cos(snapAngle) * length;
        y = prev.y + Math.sin(snapAngle) * length;
      }
      const newPt: PenPoint = { x, y };
      currentPenPath.points.push(newPt);

      // Real anchor
      newPt.anchorCircle = document.createElementNS(svgNS, 'circle');
      newPt.anchorCircle.setAttribute('cx', newPt.x.toString());
      newPt.anchorCircle.setAttribute('cy', newPt.y.toString());
      newPt.anchorCircle.setAttribute('r', '7');
      newPt.anchorCircle.setAttribute('fill', 'rgba(0,0,0,0)');
      newPt.anchorCircle.setAttribute('stroke', 'none'); // Always no stroke
      newPt.anchorCircle.style.cursor = 'pointer';
      newPt.anchorCircle.style.pointerEvents = 'all';
      designerSVG.appendChild(newPt.anchorCircle);

      // Small visible anchor for UI
      newPt.anchorDot = document.createElementNS(svgNS, 'circle');
      newPt.anchorDot.setAttribute('cx', newPt.x.toString());
      newPt.anchorDot.setAttribute('cy', newPt.y.toString());
      newPt.anchorDot.setAttribute('r', '3');
      newPt.anchorDot.setAttribute('fill', 'rgb(0, 0, 0)');
      newPt.anchorDot.style.pointerEvents = 'none';
      designerSVG.appendChild(newPt.anchorDot);

      // Start handle creation (drag)
      penDragging = { point: newPt, type: 'handleOut', offsetX: 0, offsetY: 0 };
      newPt._dragStart = { x: svgCoords.x, y: svgCoords.y };

      updatePenPath(currentPenPath, false);
      penPreviewLine?.remove();
      penPreviewHandle?.remove();
      return;
    }

    // --- Pen Tool: Editing existing path (not in penMode) ---
    if (!penMode && selectedPenPath) {
      for (const pt of selectedPenPath.points) {
        if (e.target === pt.anchorCircle) {
          penDragging = { point: pt, type: 'anchor', offsetX: svgCoords.x - pt.x, offsetY: svgCoords.y - pt.y };
          return;
        }
        if (e.target === pt.handleInCircle) {
          penDragging = { point: pt, type: 'handleIn', offsetX: svgCoords.x - (pt.handleIn?.x ?? pt.x), offsetY: svgCoords.y - (pt.handleIn?.y ?? pt.y) };
          return;
        }
        if (e.target === pt.handleOutCircle) {
          penDragging = { point: pt, type: 'handleOut', offsetX: svgCoords.x - (pt.handleOut?.x ?? pt.x), offsetY: svgCoords.y - (pt.handleOut?.y ?? pt.y) };
          return;
        }
      }
    }

    // --- Admin: Select seat/group ---
    if (roleSelect.value === 'admin' && !addMode) {
      // If clicking on a circle (seat), select it
      if (e.target instanceof SVGCircleElement) {
        selectDesignerSeat(e.target);
        return;
      }
      // If clicking on SVG background, deselect
      if (e.target === designerSVG) {
        if (selectedDesignerSeat) selectedDesignerSeat.setAttribute('stroke', '#222');
        selectedDesignerSeat = null;
        seatIdInput.value = '';
        return;
      }
    }
  });

  window.addEventListener('mousemove', (e) => {
    // --- 1. Pen Tool anchor/handle dragging ---
    if (penDragging && (currentPenPath || selectedPenPath)) {
      const pathObj = currentPenPath || selectedPenPath;
      const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
      const pt = penDragging.point;

      if (penDragging.type === 'anchor') {
        pt.x = svgCoords.x - penDragging.offsetX;
        pt.y = svgCoords.y - penDragging.offsetY;
        pt.anchorCircle?.setAttribute('cx', pt.x.toString());
        pt.anchorCircle?.setAttribute('cy', pt.y.toString());
        pt.anchorDot?.setAttribute('cx', pt.x.toString());
        pt.anchorDot?.setAttribute('cy', pt.y.toString());
        if (pt.handleIn) {
          pt.handleIn.x += svgCoords.x - pt.x - penDragging.offsetX;
          pt.handleIn.y += svgCoords.y - pt.y - penDragging.offsetY;
        }
        if (pt.handleOut) {
          pt.handleOut.x += svgCoords.x - pt.x - penDragging.offsetX;
          pt.handleOut.y += svgCoords.y - pt.y - penDragging.offsetY;
        }
      } else if (penDragging.type === 'handleIn') {
        let x = svgCoords.x - penDragging.offsetX;
        let y = svgCoords.y - penDragging.offsetY;
        if (e.shiftKey) {
          const dx = x - pt.x;
          const dy = y - pt.y;
          const angle = Math.atan2(dy, dx);
          const length = Math.sqrt(dx * dx + dy * dy);
          const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          x = pt.x + Math.cos(snapAngle) * length;
          y = pt.y + Math.sin(snapAngle) * length;
        }
        pt.handleIn = { x, y };
        if (!e.altKey) {
          const dx = pt.x - pt.handleIn.x, dy = pt.y - pt.handleIn.y;
          pt.handleOut = { x: pt.x + dx, y: pt.y + dy };
        }
      } else if (penDragging.type === 'handleOut') {
        let x = svgCoords.x - penDragging.offsetX;
        let y = svgCoords.y - penDragging.offsetY;
        if (e.shiftKey) {
          const dx = x - pt.x;
          const dy = y - pt.y;
          const angle = Math.atan2(dy, dx);
          const length = Math.sqrt(dx * dx + dy * dy);
          const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          x = pt.x + Math.cos(snapAngle) * length;
          y = pt.y + Math.sin(snapAngle) * length;
        }
        pt.handleOut = { x, y };
        if (typeof pt._dragStart !== 'undefined') {
          if (!e.altKey) {
            const dx = pt.x - pt.handleOut.x, dy = pt.y - pt.handleOut.y;
            pt.handleIn = { x: pt.x + dx, y: pt.y + dy };
          }
        } else if (!e.altKey) {
          const dx = pt.x - pt.handleOut.x, dy = pt.y - pt.handleOut.y;
          pt.handleIn = { x: pt.x + dx, y: pt.y + dy };
        }
      }
      if (pathObj != null) {
        updatePenPath(pathObj, false);
        return;
      }
    }

    // --- 2. Group (shape) dragging ---
    if (dragTarget && roleSelect.value === 'admin') {
      // Only handle seat group dragging (not shapes/paths)
      const circle = dragTarget.querySelector('circle[data-seat-id]') as SVGCircleElement;
      if (circle) {
        // Get current mouse SVG coordinates
        const currSVG = getSVGCoords(designerSVG, e.clientX, e.clientY);
        // Calculate delta in SVG space
        const dx = currSVG.x - dragStart.x;
        const dy = currSVG.y - dragStart.y;
        // Update seat center
        circle.setAttribute('cx', (dragStart.tx + dx).toString());
        circle.setAttribute('cy', (dragStart.ty + dy).toString());
      }
      return;
    } else {
      designerSVG.style.cursor = 'click';
    }

    // --- 3. Preview logic ---
    if (penMode && !penDragging && currentPenPath) {
      const lastPt = currentPenPath.points[currentPenPath.points.length - 1];
      if (!lastPt) return;
      let svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);

      penPreviewLine?.remove();
      penPreviewHandle?.remove();

      if (e.shiftKey) {
        const dx = svgCoords.x - lastPt.x;
        const dy = svgCoords.y - lastPt.y;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        svgCoords = {
          x: lastPt.x + Math.cos(snapAngle) * length,
          y: lastPt.y + Math.sin(snapAngle) * length
        };
      }

      if (lastPt.handleOut) {
        penPreviewHandle = document.createElementNS(svgNS, 'line');
        penPreviewHandle.setAttribute('x1', lastPt.x.toString());
        penPreviewHandle.setAttribute('y1', lastPt.y.toString());
        penPreviewHandle.setAttribute('x2', lastPt.handleOut.x.toString());
        penPreviewHandle.setAttribute('y2', lastPt.handleOut.y.toString());
        penPreviewHandle.setAttribute('stroke', '#bbb');
        penPreviewHandle.setAttribute('stroke-dasharray', '2,2');
        designerSVG.appendChild(penPreviewHandle);
      }

      penPreviewLine = document.createElementNS(svgNS, 'line');
      penPreviewLine.setAttribute('x1', lastPt.x.toString());
      penPreviewLine.setAttribute('y1', lastPt.y.toString());
      penPreviewLine.setAttribute('x2', svgCoords.x.toString());
      penPreviewLine.setAttribute('y2', svgCoords.y.toString());
      penPreviewLine.setAttribute('stroke', '#2196f3');
      penPreviewLine.setAttribute('stroke-dasharray', '4,2');
      designerSVG.appendChild(penPreviewLine);

      // Snap highlight
      const firstPt = currentPenPath.points[0];
      if (
        firstPt &&
        currentPenPath.points.length > 1 &&
        Math.hypot(svgCoords.x - firstPt.x, svgCoords.y - firstPt.y) < 12
      ) {
        firstPt.anchorCircle?.setAttribute('fill', '#f44336');
      } else {
        firstPt.anchorCircle?.setAttribute('fill', '#2196f3');
      }
    }

    // --- 4. Designer SVG panning ---
    if (isDesignerPanning) {
      const dx = (e.clientX - designerPanStart.x) * (designerPanW / designerSVG.clientWidth);
      const dy = (e.clientY - designerPanStart.y) * (designerPanH / designerSVG.clientHeight);
      designerPanX -= dx;
      designerPanY -= dy;
      designerPanStart = { x: e.clientX, y: e.clientY };
      setDesignerZoom(designerZoomLevel);
      return;
    }

    // --- 5. User SVG panning ---
    if (isPanning) {
      const dx = (e.clientX - panStart.x) * (panW / seatSVG.clientWidth);
      const dy = (e.clientY - panStart.y) * (panH / seatSVG.clientHeight);
      panX -= dx;
      panY -= dy;
      panStart = { x: e.clientX, y: e.clientY };
      clampPan();
      seatSVG.setAttribute('viewBox', `${panX} ${panY} ${panW} ${panH}`);
      return;
    }

    // --- 6. Path dragging ---
    if (isPathDragging && selectedPenPath) {
      const dx = e.clientX - pathDragStart.x;
      const dy = e.clientY - pathDragStart.y;
      pathDragStart = { x: e.clientX, y: e.clientY };

      // Convert dx/dy from screen to SVG coordinates
      const svgCoords1 = getSVGCoords(designerSVG, 0, 0);
      const svgCoords2 = getSVGCoords(designerSVG, dx, dy);
      const deltaX = svgCoords2.x - svgCoords1.x;
      const deltaY = svgCoords2.y - svgCoords1.y;

      for (const pt of selectedPenPath.points) {
        pt.x += deltaX;
        pt.y += deltaY;
        if (pt.handleIn) {
          pt.handleIn.x += deltaX;
          pt.handleIn.y += deltaY;
        }
        if (pt.handleOut) {
          pt.handleOut.x += deltaX;
          pt.handleOut.y += deltaY;
        }
      }
      updatePenPath(selectedPenPath, false);
      return;
    }

    // --- 7. Shape dragging/resizing ---
    if (isShapeDragging && selectedShape) {
      if (selectedShape instanceof SVGCircleElement) {
        // For circles, just move cx/cy as before (no rotation needed)
        const svgCoords1 = getSVGCoords(designerSVG, shapeDragStart.x, shapeDragStart.y);
        const svgCoords2 = getSVGCoords(designerSVG, e.clientX, e.clientY);
        const dx = svgCoords2.x - svgCoords1.x;
        const dy = svgCoords2.y - svgCoords1.y;
        selectedShape.setAttribute('cx', (shapeDragStart.origX + dx).toString());
        selectedShape.setAttribute('cy', (shapeDragStart.origY + dy).toString());
        if ((selectedShape as any)._resizeHandles?.[0]) {
          const updateHandle = (selectedShape as any)._resizeHandles[0].__updateHandle;
          if (updateHandle) updateHandle();
        }
        return;
      }
    }
  });

  // --- Pen Tool Mouse Up (End Drag) ---
  let isResizing = false;
  window.addEventListener('mouseup', () => {
    // --- End all drag/rotate states ---
    isResizing = false;
    isShapeDragging = false;
    selectedShape = null;
    isPathDragging = false;
    isDesignerPanning = false;
    penDragging = null;
    designerSVG.style.cursor = '';
    isPanning = false;
    seatSVG.style.cursor = '';

    // HandleOut if it was a click, not a drag
    if (penDragging && (penDragging as { type: string }).type === 'handleOut' && (penDragging as any).point._dragStart) {
      const pt = (penDragging as any).point;
      const dx = pt.handleOut ? pt.handleOut.x - pt.x : 0;
      const dy = pt.handleOut ? pt.handleOut.y - pt.y : 0;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        pt.handleOut = undefined;
        pt.handleIn = undefined;
      }
      delete pt._dragStart;
    }

    // End group drag
    if (dragTarget) {
      justDragged = true;
      dragTarget = null;
    }
  });

  // --- Remove preview on mouse leave or down ---
  designerSVG.addEventListener('mouseleave', () => {
    penPreviewLine?.remove();
    penPreviewHandle?.remove();
    designerSVG.style.cursor = '';
  });

  // --- Undo/Redo ---
  window.addEventListener('keydown', (e) => {
    if (!penMode || !currentPenPath) return;

    // Remove last anchor point (and handles) with Backspace/Delete or Ctrl+Z
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z")
    ) {
      e.preventDefault();
      const pt = currentPenPath.points.pop();
      if (pt) {
        pt.anchorCircle?.remove();
        pt.handleInCircle?.remove();
        pt.handleOutCircle?.remove();
        pt.handleLineIn?.remove();
        pt.handleLineOut?.remove();
        pt.anchorDot?.remove();
        if (penPreviewLine) penPreviewLine.remove();
        if (penPreviewHandle) penPreviewHandle.remove();
        updatePenPath(currentPenPath, false);
      }
      if (currentPenPath.points.length === 0) {
        currentPenPath.path.remove();
        currentPenPath = null;
      }
    }
  });

  // --- Finish Path ---
  function finishPenPath(close = false) {
    if (!currentPenPath) return;
    if (close && currentPenPath.points.length > 1) {
      currentPenPath.closed = true;
      updatePenPath(currentPenPath, true); // Hide handles by default
    }
    currentPenPath.points.forEach(pt => {
      pt.anchorCircle?.setAttribute('fill', 'rgba(0,0,0,0)');
      pt.handleInCircle?.setAttribute('fill', '#bbb');
      pt.handleOutCircle?.setAttribute('fill', '#bbb');
    });
    finishedPenPaths.push(currentPenPath);
    currentPenPath.path.style.cursor = 'pointer';
    const thisPath = currentPenPath;
    currentPenPath.path.addEventListener('click', () => {
      selectPenPath(thisPath);
    });
    currentPenPath = null;
    penDragging = null;
    drawCurveBtn.textContent = "Pen Tool";
    penMode = false;
    penPreviewLine?.remove();
    penPreviewHandle?.remove();
    penPreviewLine = null;
    penPreviewHandle = null;
  }

  // --- Path selection logic ---
  function selectPenPath(path: PenPath) {
    // Deselect previous
    if (selectedPenPath && selectedPenPath !== path) {
      updatePenPath(selectedPenPath, true); // Hide handles
      selectedPenPath.path.setAttribute('stroke', '#000');
    }
    selectedPenPath = path;
    updatePenPath(path, false); // Show handles
    path.path.setAttribute('stroke', '#f44336');
    // Dragging logic
    path.path.onmousedown = (e: MouseEvent) => {
      if (!selectedPenPath) return;
      isPathDragging = true;
      pathDragStart = { x: e.clientX, y: e.clientY };
      e.stopPropagation();
    };
  }

  // --- Update Path & Handles ---
  function updatePenPath(pathObj: PenPath, hideHandles = false) {
    for (const pt of pathObj.points) {
      pt.handleLineIn?.remove();
      pt.handleLineOut?.remove();
      pt.handleInCircle?.remove();
      pt.handleOutCircle?.remove();
      pt.anchorCircle?.remove();
      pt.anchorDot?.remove();
      pt.handleLineIn = pt.handleLineOut = pt.handleInCircle = pt.handleOutCircle = undefined;
    }
    for (let i = 0; i < pathObj.points.length; i++) {
      const pt = pathObj.points[i];

      // Large invisible anchor for hit-testing
      pt.anchorCircle = document.createElementNS(svgNS, 'circle');
      pt.anchorCircle.setAttribute('cx', pt.x.toString());
      pt.anchorCircle.setAttribute('cy', pt.y.toString());
      pt.anchorCircle.setAttribute('r', '7');
      pt.anchorCircle.setAttribute('fill', 'rgba(0,0,0,0)');
      pt.anchorCircle.setAttribute('stroke', 'none'); // Always no stroke
      pt.anchorCircle.style.cursor = 'pointer';
      pt.anchorCircle.style.pointerEvents = 'all';
      designerSVG.appendChild(pt.anchorCircle);

      // Small visible anchor for UI
      pt.anchorDot = document.createElementNS(svgNS, 'circle');
      pt.anchorDot.setAttribute('cx', pt.x.toString());
      pt.anchorDot.setAttribute('cy', pt.y.toString());
      pt.anchorDot.setAttribute('r', '3');
      pt.anchorDot.setAttribute('fill', 'rgb(0,0,0)');
      pt.anchorDot.style.pointerEvents = 'none';
      designerSVG.appendChild(pt.anchorDot);


      if (!hideHandles) {
        // Handle In
        if (pt.handleIn) {
          pt.handleLineIn = document.createElementNS(svgNS, 'line');
          pt.handleLineIn.setAttribute('x1', pt.x.toString());
          pt.handleLineIn.setAttribute('y1', pt.y.toString());
          pt.handleLineIn.setAttribute('x2', pt.handleIn.x.toString());
          pt.handleLineIn.setAttribute('y2', pt.handleIn.y.toString());
          pt.handleLineIn.setAttribute('stroke', '#bbb');
          pt.handleLineIn.setAttribute('stroke-dasharray', '2,2');
          designerSVG.appendChild(pt.handleLineIn);

          pt.handleInCircle = document.createElementNS(svgNS, 'circle');
          pt.handleInCircle.setAttribute('cx', pt.handleIn.x.toString());
          pt.handleInCircle.setAttribute('cy', pt.handleIn.y.toString());
          pt.handleInCircle.setAttribute('r', '3');
          pt.handleInCircle.setAttribute('fill', '#ff9800');
          pt.handleInCircle.style.cursor = 'pointer';
          designerSVG.appendChild(pt.handleInCircle);
        }
        // Handle Out
        if (pt.handleOut) {
          pt.handleLineOut = document.createElementNS(svgNS, 'line');
          pt.handleLineOut.setAttribute('x1', pt.x.toString());
          pt.handleLineOut.setAttribute('y1', pt.y.toString());
          pt.handleLineOut.setAttribute('x2', pt.handleOut.x.toString());
          pt.handleLineOut.setAttribute('y2', pt.handleOut.y.toString());
          pt.handleLineOut.setAttribute('stroke', '#bbb');
          pt.handleLineOut.setAttribute('stroke-dasharray', '2,2');
          designerSVG.appendChild(pt.handleLineOut);

          pt.handleOutCircle = document.createElementNS(svgNS, 'circle');
          pt.handleOutCircle.setAttribute('cx', pt.handleOut.x.toString());
          pt.handleOutCircle.setAttribute('cy', pt.handleOut.y.toString());
          pt.handleOutCircle.setAttribute('r', '3');
          pt.handleOutCircle.setAttribute('fill', '#ff9800');
          pt.handleOutCircle.style.cursor = 'pointer';
          designerSVG.appendChild(pt.handleOutCircle);
        }
      }
    }
    // Build path string
    let d = '';
    for (let i = 0; i < pathObj.points.length; i++) {
      const pt = pathObj.points[i];
      if (i === 0) {
        d += `M ${pt.x} ${pt.y}`;
      } else {
        const prev = pathObj.points[i - 1];
        const c1 = prev.handleOut || prev;
        const c2 = pt.handleIn || pt;
        d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${pt.x} ${pt.y}`;
      }
    }
    if (pathObj.closed) {
      // Close with a cubic segment to the first point
      const last = pathObj.points[pathObj.points.length - 1];
      const first = pathObj.points[0];
      const c1 = last.handleOut || last;
      const c2 = first.handleIn || first;
      d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${first.x} ${first.y} Z`;
    }
    pathObj.path.setAttribute('d', d);
  }

  // Rotate selected path around its center
  function rotateSelectedPath(angleDeg: number) {
    if (!selectedPenPath) return;
    // Find center of path
    const points = selectedPenPath.points;
    if (points.length === 0) return;
    const cx = points.reduce((sum, pt) => sum + pt.x, 0) / points.length;
    const cy = points.reduce((sum, pt) => sum + pt.y, 0) / points.length;
    const angleRad = angleDeg * Math.PI / 180;
    for (const pt of points) {
      // Rotate anchor
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      pt.x = cx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      pt.y = cy + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
      // Rotate handles if present
      if (pt.handleIn) {
        const hdx = pt.handleIn.x - cx;
        const hdy = pt.handleIn.y - cy;
        pt.handleIn.x = cx + hdx * Math.cos(angleRad) - hdy * Math.sin(angleRad);
        pt.handleIn.y = cy + hdx * Math.sin(angleRad) + hdy * Math.cos(angleRad);
      }
      if (pt.handleOut) {
        const hdx = pt.handleOut.x - cx;
        const hdy = pt.handleOut.y - cy;
        pt.handleOut.x = cx + hdx * Math.cos(angleRad) - hdy * Math.sin(angleRad);
        pt.handleOut.y = cy + hdx * Math.sin(angleRad) + hdy * Math.cos(angleRad);
      }
    }
    updatePenPath(selectedPenPath, false);
  }

  rotateLeftBtn.addEventListener('click', () => rotateSelectedPath(-45));
  rotateRightBtn.addEventListener('click', () => rotateSelectedPath(45));

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
        // Calculate the relative position of the zoom center
        const relX = (centerX - panX) / panW;
        const relY = (centerY - panY) / panH;
        panW = newW;
        panH = newH;
        panX = centerX - relX * panW;
        panY = centerY - relY * panH;
      } else {
        panW = newW;
        panH = newH;
      }
      clampPan();
    }
    seatSVG.setAttribute('viewBox', `${panX} ${panY} ${panW} ${panH}`);

    // --- Keep text visually constant size on user side ---
    const texts = seatSVG.querySelectorAll('text');
    texts.forEach(text => {
      // Use data-base-font-size if available, else fallback to font-size or 18
      let baseFontSize = parseFloat(text.getAttribute('data-base-font-size') || text.getAttribute('font-size') || '18');
      text.setAttribute('font-size', (baseFontSize / userZoomLevel) + 'px');

      // --- Update rect for each text (centered) ---
      const rect = text.previousElementSibling as SVGRectElement | null;
      if (rect && rect.tagName === 'rect') {
        const bb = text.getBBox();
        const cx = parseFloat(text.getAttribute('x') || '0');
        const cy = parseFloat(text.getAttribute('y') || '0');
        rect.setAttribute('x', (cx - bb.width / 2 - 8).toString());
        rect.setAttribute('y', (cy - bb.height / 2 - 4).toString());
        rect.setAttribute('width', (bb.width + 16).toString());
        rect.setAttribute('height', (bb.height + 8).toString());
      }
    });
  }

  // --- Pan Logic ---
  let isPanning = false;
  let panStart = { x: 0, y: 0 };

  seatSVG.addEventListener('mousedown', (e) => {
    if ((e.target as Element).tagName === 'circle') return;
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    seatSVG.style.cursor = 'grab';
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
    e.preventDefault();
    if (e.touches.length === 1 && isPanning) {
      const dx = (e.touches[0].clientX - panStart.x) * (panW / seatSVG.clientWidth);
      const dy = (e.touches[0].clientY - panStart.y) * (panH / seatSVG.clientHeight);
      panX -= dx;
      panY -= dy;
      panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      clampPan();
      seatSVG.setAttribute('viewBox', `${panX} ${panY} ${panW} ${panH}`);
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
    const circle = seatSVG.getBoundingClientRect();
    const mouseX = ((e.clientX - circle.left) / circle.width) * panW + panX;
    const mouseY = ((e.clientY - circle.top) / circle.height) * panH + panY;
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
      const seatCircles = seatSVG.querySelectorAll('circle[data-seat-id]');
      seatCircles.forEach((circle, idx) => {
        const seatCircle = circle as SVGCircleElement;
        const seatId = seatCircle.getAttribute('data-seat-id') || `${idx}`;
        if (seatCircle.hasAttribute('data-seat-id')) {
          if (occupiedSeats.has(seatId)) {
            seatCircle.setAttribute('fill', '#d32f2f');
          } else if (selectedSeats.has(seatId)) {
            seatCircle.setAttribute('fill', '#4caf50');
          } else {
            seatCircle.setAttribute('fill', '#e0e0e0'); // grey for available seats
          }
        } else {
          seatCircle.setAttribute('fill', 'none'); // no fill for drawn circles
        }
      });
    }
  }

  // Save current SVG layout
  function saveLayout(svg: SVGSVGElement, promptMsg: string, prefix: string) {
    const layoutName = prompt(promptMsg);
    if (!layoutName) return;
    // --- Remove background image before saving ---
    let removedBgImage: SVGImageElement | null = null;
    if (svg === designerSVG && bgImageEl && bgImageEl.parentNode) {
      removedBgImage = bgImageEl;
      bgImageEl.parentNode.removeChild(bgImageEl);
    }
    // Save SVG outerHTML (without background image)
    localStorage.setItem(prefix + layoutName, svg.outerHTML);
    // Restore background image if it was removed
    if (removedBgImage) {
      svg.insertBefore(removedBgImage, svg.firstChild);
    }
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
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', (x + seatSize / 2).toString());
        circle.setAttribute('cy', (y + seatSize / 2).toString());
        circle.setAttribute('r', (seatSize / 2).toString());
        circle.setAttribute('fill', occupiedSeats.has(seatId) ? '#d32f2f' : '#e0e0e0');
        circle.setAttribute('stroke', '#444');
        circle.setAttribute('data-seat-id', seatId);
        if (!occupiedSeats.has(seatId)) {
          circle.style.cursor = 'pointer';
        }
        seatSVG.appendChild(circle);
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
  svgUpload.addEventListener('change', function (event: Event) {
    seatMapType = 'svg';
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e: ProgressEvent<FileReader>) {
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
    const circles = svg.querySelectorAll('circle[data-seat-id]');
    let counter = 1;
    circles.forEach(circle => {
      let id = circle.getAttribute('data-seat-id')?.trim();
      if (!id || ids.has(id.toLowerCase())) {
        // Assign a new unique ID
        while (ids.has(`seat${counter}`.toLowerCase())) counter++;
        id = `Seat${counter}`;
        circle.setAttribute('data-seat-id', id);
      }
      ids.add(id.toLowerCase());
    });
  }

  function countAvailableSeats(): number {
    const seatCircles = seatSVG.querySelectorAll('circle[data-seat-id]');
    let count = 0;
    seatCircles.forEach(circle => {
      const seatId = circle.getAttribute('data-seat-id');
      // Only count if seatId is non-empty and not occupied
      if (seatId && seatId.trim() !== '' && !occupiedSeats.has(seatId)) count++;
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
    const target = e.target as SVGCircleElement;
    if (
      target.tagName === 'circle' &&
      target.hasAttribute('data-seat-id') &&
      !occupiedSeats.has(target.getAttribute('data-seat-id')!)
    ) {
      const seatId = target.getAttribute('data-seat-id')!;
      toggleSVGSeat(seatId, target);
    }
  });

  // --- Seat Selection Logic ---
  function attachSVGSeatListeners(): void {
    const seatCircles = seatSVG.querySelectorAll('circle');
    seatCircles.forEach((circle, idx) => {
      const seatCircle = circle as SVGCircleElement;
      const seatId = seatCircle.getAttribute('data-seat-id') || `${idx}`;
      const radius = parseFloat(seatCircle.getAttribute('r') || "0");
      let cx = seatCircle.hasAttribute('cx') ? parseFloat(seatCircle.getAttribute('cx') || "0") : undefined;
      let cy = seatCircle.hasAttribute('cy') ? parseFloat(seatCircle.getAttribute('cy') || "0") : undefined;
      if (cx === undefined || cy === undefined) {
        const bbox = seatCircle.getBBox();
        cx = bbox.x + bbox.width / 2;
        cy = bbox.y + bbox.height / 2;
      }
      if ((cx === 0 && cy === 0 && !seatCircle.hasAttribute('data-seat-id')) || radius === 0) {
        return;
      }
      if (seatCircle.hasAttribute('data-seat-id')) {
        if (!occupiedSeats.has(seatId)) {
          seatCircle.setAttribute('fill', '#e0e0e0');
        } else {
          seatCircle.setAttribute('fill', '#d32f2f');
        }
        seatCircle.style.cursor = 'pointer';
      } else {
        seatCircle.setAttribute('fill', 'none'); // no fill for drawn circles
        seatCircle.style.cursor = 'default';
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

  function toggleSVGSeat(seatId: string, circle: SVGCircleElement): void {
    if (maxSelectableSeats === null) {
      if (!promptForSeatCount()) return;
    }
    if (selectedSeats.has(seatId)) {
      selectedSeats.delete(seatId);
      circle.setAttribute('fill', '#e0e0e0');
    } else {
      if (selectedSeats.size >= (maxSelectableSeats ?? 0)) {
        alert(`You can only select up to ${maxSelectableSeats} seats.`);
        return;
      }
      selectedSeats.add(seatId);
      circle.setAttribute('fill', '#4caf50');
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
    const circles = designerSVG.querySelectorAll('circle');
    circles.forEach(circle => {
      const id = circle.getAttribute('data-seat-id');
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

  // Used for text interaction state in designer SVG
  let justInteractedWithText = false;

  function makeDraggable(group: SVGGElement) {
    group.addEventListener('mousedown', (e: MouseEvent) => {
      justDragged = false;
      if (roleSelect.value !== 'admin') return;
      dragTarget = group;
      // Find the seat circle inside the group
      const circle = group.querySelector('circle[data-seat-id]') as SVGCircleElement;
      // Store SVG coordinates of mouse and seat center at drag start
      const startSVG = getSVGCoords(designerSVG, e.clientX, e.clientY);
      const origCx = parseFloat(circle.getAttribute('cx') || '0');
      const origCy = parseFloat(circle.getAttribute('cy') || '0');
      // Store in dragStart for use in global handler
      dragStart = {
        x: startSVG.x,
        y: startSVG.y,
        tx: origCx,
        ty: origCy
      };
      e.stopPropagation();
    });
  }

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
      // --- Deselect on SVG background click ---
      if (!penMode && e.target === designerSVG && selectedPenPath) {
        updatePenPath(selectedPenPath, true);
        selectedPenPath.path.setAttribute('stroke', '#000');
        selectedPenPath = null;
      }
      if (e.target === designerSVG && selectedRectPath) {
        selectedRectPath.setAttribute('stroke', '#000');
        selectedRectPath = null;
      }
      // --- Handle shape drawing ---
      if (shapeMode === 'circle' && e.target === designerSVG) {
        const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', svgCoords.x.toString());
        circle.setAttribute('cy', svgCoords.y.toString());
        circle.setAttribute('r', '40');
        circle.setAttribute('stroke', '#000');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('pointer-events', 'stroke'); // Only edge is draggable
        circle.style.cursor = 'grab';

        const centerDot = document.createElementNS(svgNS, 'circle');
        centerDot.setAttribute('cx', svgCoords.x.toString());
        centerDot.setAttribute('cy', svgCoords.y.toString());
        centerDot.setAttribute('r', '2');
        centerDot.setAttribute('fill', '#000');
        designerSVG.appendChild(circle);
        designerSVG.appendChild(centerDot);
        makeShapeInteractive(circle);
        (circle as any)._centerDot = centerDot; // Store for drag
        shapeMode = 'none';
        addCircleBtn.style.background = "";
      }

      if (rectMode && e.target === designerSVG) {
        const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
        const w = 80, h = 60;
        const cx = svgCoords.x, cy = svgCoords.y;
        // Rectangle corners (clockwise from top-left)
        const points = [
          { x: cx - w / 2, y: cy - h / 2 },
          { x: cx + w / 2, y: cy - h / 2 },
          { x: cx + w / 2, y: cy + h / 2 },
          { x: cx - w / 2, y: cy + h / 2 }
        ];
        // Create path data
        const d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#000');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.style.cursor = 'pointer';
        designerSVG.appendChild(path);

        // Store points for manipulation BEFORE adding handle!
        (path as any)._rectPoints = points;

        addRectResizeHandle(path); // <-- Now points are available

        // Add interaction
        makeRectPathInteractive(path);

        // Select it
        selectRectPath(path);

        rectMode = false;
        addRectBtn.style.background = "";
      }

      if (justDragged) {
        justDragged = false;
        return;
      }

      if (justSelectedTextBox) {
        justSelectedTextBox = false;
        return;
      }

      // --- Text Mode ---
      if (textMode && e.target === designerSVG) {
        const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);

        // Create group for text and background
        const textGroup = document.createElementNS(svgNS, 'g');

        // Create text element
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', svgCoords.x.toString());
        text.setAttribute('y', svgCoords.y.toString());
        text.setAttribute('font-size', '18');
        text.setAttribute('data-base-font-size', '18');
        text.setAttribute('fill', '#000');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = 'Add Text';
        text.style.cursor = '';

        // Create a rect as a background/border for the text
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('fill', 'rgba(0,0,0,0)');
        rect.setAttribute('stroke', 'none');
        rect.setAttribute('stroke-width', '2');
        rect.style.cursor = 'move';

        textGroup.appendChild(rect);
        textGroup.appendChild(text);
        designerSVG.appendChild(textGroup);

        // Update rect to fit text after rendering
        setTimeout(() => {
          const bb = text.getBBox();
          rect.setAttribute('x', (bb.x - 8).toString());
          rect.setAttribute('y', (bb.y - 4).toString());
          rect.setAttribute('width', (bb.width + 16).toString());
          rect.setAttribute('height', (bb.height + 8).toString());
        });

        // --- Drag and Select Logic ---
        let isTextDragging = false;
        let dragStart = { x: 0, y: 0, origX: 0, origY: 0 };
        let dragTimeout: number | null = null;
        let moved = false;

        // Helper to select and show editor
        function selectTextBox() {
          if (selectedTextRect) {
            selectedTextRect.setAttribute('stroke', 'none');
            selectedTextRect.setAttribute('stroke-dasharray', '');
          }
          selectedTextGroup = textGroup;
          selectedText = text;
          selectedTextRect = rect;
          rect.setAttribute('stroke', '#888');
          rect.setAttribute('stroke-width', '2');
          textEditInput.style.display = '';
          textEditInput.value = text.textContent || '';
          textEditInput.focus();
          textSizeSlider.style.display = '';
          textSizeValue.style.display = '';
          textSizeSlider.value = text.getAttribute('data-base-font-size') || '18';
          textSizeValue.textContent = textSizeSlider.value;
        }

        // Click-hold-move to drag, click to select
        rect.addEventListener('mousedown', (ev) => {
          ev.stopPropagation();
          moved = false;
          justSelectedTextBox = true;
          dragTimeout = window.setTimeout(() => {
            isTextDragging = true;
            dragStart.x = ev.clientX;
            dragStart.y = ev.clientY;
            dragStart.origX = parseFloat(text.getAttribute('x') || '0');
            dragStart.origY = parseFloat(text.getAttribute('y') || '0');
            moved = true;
          }, 120);

          function onMove(moveEv: MouseEvent) {
            if (isTextDragging) {
              const svgCoords1 = getSVGCoords(designerSVG, dragStart.x, dragStart.y);
              const svgCoords2 = getSVGCoords(designerSVG, moveEv.clientX, moveEv.clientY);
              const dx = svgCoords2.x - svgCoords1.x;
              const dy = svgCoords2.y - svgCoords1.y;
              const newX = dragStart.origX + dx;
              const newY = dragStart.origY + dy;
              text.setAttribute('x', newX.toString());
              text.setAttribute('y', newY.toString());
              const bb = text.getBBox();
              rect.setAttribute('x', (bb.x - 8).toString());
              rect.setAttribute('y', (bb.y - 4).toString());
              rect.setAttribute('width', (bb.width + 16).toString());
              rect.setAttribute('height', (bb.height + 8).toString());
            }
          }

          function onUp() {
            if (dragTimeout) clearTimeout(dragTimeout);
            if (!moved) selectTextBox();
            isTextDragging = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          }

          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        });

        // Also allow clicking on the text to select
        text.addEventListener('mousedown', (ev) => {
          ev.stopPropagation();
          justSelectedTextBox = true;
          selectTextBox();
        });

        // Touch support (optional, similar logic)
        rect.addEventListener('touchstart', (ev) => {
          ev.stopPropagation();
          moved = false;
          justSelectedTextBox = true;
          dragTimeout = window.setTimeout(() => {
            isTextDragging = true;
            const touch = ev.touches[0];
            dragStart.x = touch.clientX;
            dragStart.y = touch.clientY;
            dragStart.origX = parseFloat(text.getAttribute('x') || '0');
            dragStart.origY = parseFloat(text.getAttribute('y') || '0');
            moved = true;
          }, 120);

          function onMove(moveEv: TouchEvent) {
            if (isTextDragging) {
              const touch = moveEv.touches[0];
              const svgCoords1 = getSVGCoords(designerSVG, dragStart.x, dragStart.y);
              const svgCoords2 = getSVGCoords(designerSVG, touch.clientX, touch.clientY);
              const dx = svgCoords2.x - svgCoords1.x;
              const dy = svgCoords2.y - svgCoords1.y;
              const newX = dragStart.origX + dx;
              const newY = dragStart.origY + dy;
              text.setAttribute('x', newX.toString());
              text.setAttribute('y', newY.toString());
              const bb = text.getBBox();
              rect.setAttribute('x', (bb.x - 8).toString());
              rect.setAttribute('y', (bb.y - 4).toString());
              rect.setAttribute('width', (bb.width + 16).toString());
              rect.setAttribute('height', (bb.height + 8).toString());
            }
          }

          function onUp() {
            if (dragTimeout) clearTimeout(dragTimeout);
            if (!moved) selectTextBox();
            isTextDragging = false;
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
          }

          window.addEventListener('touchmove', onMove, { passive: false });
          window.addEventListener('touchend', onUp);
        });

        // Exit text mode after placing
        textMode = false;
        addTextBtn.style.background = "";
      }

      if (
        !textMode &&
        selectedTextRect &&
        e.target !== selectedTextRect &&
        e.target !== selectedText
      ) {
        selectedTextRect.setAttribute('stroke', 'none');
        selectedTextRect.setAttribute('stroke-dasharray', '');
        selectedTextGroup = null;
        selectedText = null;
        selectedTextRect = null;
        textEditInput.style.display = 'none';
        textSizeSlider.style.display = 'none';
        textSizeValue.style.display = 'none';
      }

      if (!addMode) {
        if (e.target === designerSVG) {
          if (selectedDesignerSeat) selectedDesignerSeat.setAttribute('stroke', '#222');
          selectedDesignerSeat = null;
          seatIdInput.value = '';
        }
        return;
      }
      if (e.target !== designerSVG) return;
      const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
      const circle = document.createElementNS(svgNS, 'circle');
      const group = document.createElementNS(svgNS, 'g');
      circle.setAttribute('cx', svgCoords.x.toString());
      circle.setAttribute('cy', svgCoords.y.toString());
      const newSize = parseInt(allSeatSizeSlider.value, 10);
      circle.setAttribute('r', (newSize).toString());
      circle.setAttribute('fill', '#49D44B');
      circle.setAttribute('stroke', '#222');
      circle.setAttribute('data-seat-id', getNextAvailableDesignerSeatId());
      circle.style.cursor = 'pointer';
      circle.setAttribute('pointer-events', 'all');
      circle.addEventListener('click', (evt) => {
        selectDesignerSeat(circle);
      });
      group.appendChild(circle);
      designerSVG.appendChild(group);
      makeDraggable(group); // Pass the group, not the circle
      selectDesignerSeat(circle);

    });
  }

  // --- Designer Text Editing ---
  textEditInput.addEventListener('input', () => {
    if (selectedText && selectedTextRect) {
      selectedText.textContent = textEditInput.value;
      const bb = selectedText.getBBox();
      const cx = parseFloat(selectedText.getAttribute('x') || '0');
      const cy = parseFloat(selectedText.getAttribute('y') || '0');
      selectedTextRect.setAttribute('x', (cx - bb.width / 2 - 8).toString());
      selectedTextRect.setAttribute('y', (cy - bb.height / 2 - 4).toString());
      selectedTextRect.setAttribute('width', (bb.width + 16).toString());
      selectedTextRect.setAttribute('height', (bb.height + 8).toString());
    }
  });

  textSizeSlider.addEventListener('input', () => {
    if (selectedText && selectedTextRect) {
      const size = parseInt(textSizeSlider.value, 10);
      selectedText.setAttribute('font-size', size.toString());
      selectedText.setAttribute('data-base-font-size', size.toString());
      textSizeValue.textContent = size.toString();
      const bb = selectedText.getBBox();
      const cx = parseFloat(selectedText.getAttribute('x') || '0');
      const cy = parseFloat(selectedText.getAttribute('y') || '0');
      selectedTextRect.setAttribute('x', (cx - bb.width / 2 - 8).toString());
      selectedTextRect.setAttribute('y', (cy - bb.height / 2 - 4).toString());
      selectedTextRect.setAttribute('width', (bb.width + 16).toString());
      selectedTextRect.setAttribute('height', (bb.height + 8).toString());
    }
  });

  function selectDesignerSeat(circle: SVGCircleElement) {
    // Only apply stroke if this is a seat (not a pen tool anchor)
    if (circle.hasAttribute('data-seat-id')) {
      if (selectedDesignerSeat) {
        selectedDesignerSeat.setAttribute('stroke', '#222');
      }
      selectedDesignerSeat = circle;
      circle.setAttribute('stroke', '#f00');
      seatIdInput.value = circle.getAttribute('data-seat-id') || '';
    } else {
      // For pen tool anchors, do not set stroke
      selectedDesignerSeat = null;
      seatIdInput.value = '';
    }
  }

  updateSeatIdBtn.addEventListener('click', () => {
    if (selectedDesignerSeat) {
      const newId = seatIdInput.value.trim();
      if (!newId) {
        alert('Seat ID cannot be empty.');
        return;
      }
      // Check for duplicate ID (case-insensitive, trimmed)
      const circles = designerSVG.querySelectorAll('circle');
      for (const circle of Array.from(circles)) {
        if (
          circle !== selectedDesignerSeat &&
          circle.getAttribute('data-seat-id')?.trim().toLowerCase() === newId.toLowerCase()
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
    }
  });

})();