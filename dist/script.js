"use strict";
(function () {
    // --- Constants & State ---
    const svgNS = "http://www.w3.org/2000/svg";
    const pricePerSeat = 200;
    let selectedSeats = new Set();
    let occupiedSeats = new Set();
    let seatMapType = 'grid';
    let lastSVGString = '';
    let maxSelectableSeats = null;
    let selectedDesignerSeat = null;
    let addMode = false;
    let dragTarget = null;
    let userZoomLevel = 1;
    const minZoom = 1;
    const maxZoom = 3;
    const zoomStep = 0.04;
    // Rotation 
    let rotationHandle = null;
    let rotatingGroup = null;
    let rotationOrigin = { cx: 0, cy: 0 };
    let startAngle = 0;
    let startMouseAngle = 0;
    let isRotating = false;
    let justRotated = false;
    let justDragged = false;
    // Curve Drawing
    let drawCurveMode = false;
    let curvePoints = [];
    let tempCurve = null;
    let curvePointCircles = [];
    let selectedCurve = null;
    let curveHandles = [];
    let editingCurve = null;
    let editingPointIndex = null;
    // --- DOM Elements ---
    const roleSelect = document.getElementById('roleSelect');
    const adminPanel = document.getElementById('adminPanel');
    const userPanel = document.getElementById('userPanel');
    const rowInput = document.getElementById('rowInput');
    const colInput = document.getElementById('colInput');
    const seatSizeInput = document.getElementById('seatSizeInput');
    const createSeatsBtn = document.getElementById('createSeatsBtn');
    const seatSVG = document.getElementById('seatSVG');
    const selectedDisplay = document.getElementById('selected');
    const totalDisplay = document.getElementById('total');
    const confirmBtn = document.getElementById('confirmBtn');
    const svgUpload = document.getElementById('svgUpload');
    const saveLayoutBtn = document.getElementById('saveLayoutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const savedLayoutsDropdown = document.getElementById('savedLayoutsDropdown');
    const loadLayoutBtn = document.getElementById('loadLayoutBtn');
    const deleteLayoutBtn = document.getElementById('deleteLayoutBtn');
    const addSeatBtn = document.getElementById('addSeatBtn');
    const deleteSeatBtn = document.getElementById('deleteSeatBtn');
    const seatIdInput = document.getElementById('seatIdInput');
    const updateSeatIdBtn = document.getElementById('updateSeatIdBtn');
    const saveDesignerLayoutBtn = document.getElementById('saveDesignerLayoutBtn');
    const saveUploadedLayoutBtn = document.getElementById('saveUploadedLayoutBtn');
    const designerSVG = document.getElementById('designerSVG');
    const drawCurveBtn = document.getElementById('drawCurveBtn');
    const deleteCurveBtn = document.getElementById('deleteCurveBtn');
    const designerZoomResetBtn = document.getElementById('designerZoomResetBtn');
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
    let dragCurve = null;
    let dragCurveStart = { x: 0, y: 0, origD: "" };
    designerZoomResetBtn.addEventListener('click', () => {
        designerPanX = designerViewX;
        designerPanY = designerViewY;
        designerPanW = designerViewW;
        designerPanH = designerViewH;
        setDesignerZoom(1);
    });
    // --- Designer SVG Zoom/Pan Logic ---
    function setDesignerZoom(zoom, centerX, centerY) {
        designerZoomLevel = Math.max(designerMinZoom, Math.min(designerMaxZoom, zoom));
        const newW = designerViewW / designerZoomLevel;
        const newH = designerViewH / designerZoomLevel;
        if (designerZoomLevel === designerMinZoom) {
            designerPanX = designerViewX;
            designerPanY = designerViewY;
            designerPanW = designerViewW;
            designerPanH = designerViewH;
        }
        else {
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
    }
    function clampDesignerPan() {
        if (designerPanW > designerViewW)
            designerPanX = designerViewX;
        else
            designerPanX = Math.max(designerViewX, Math.min(designerPanX, designerViewX + designerViewW - designerPanW));
        if (designerPanH > designerViewH)
            designerPanY = designerViewY;
        else
            designerPanY = Math.max(designerViewY, Math.min(designerPanY, designerViewY + designerViewH - designerPanH));
    }
    designerSVG.addEventListener('mousedown', (e) => {
        if (selectedCurve && e.target === selectedCurve) {
            dragCurve = selectedCurve;
            dragCurveStart.x = e.clientX;
            dragCurveStart.y = e.clientY;
            dragCurveStart.origD = selectedCurve.getAttribute('d') || "";
            designerSVG.style.cursor = 'grab';
            e.stopPropagation();
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDesignerPanning)
            return;
        const dx = (e.clientX - designerPanStart.x) * (designerPanW / designerSVG.clientWidth);
        const dy = (e.clientY - designerPanStart.y) * (designerPanH / designerSVG.clientHeight);
        designerPanX -= dx;
        designerPanY -= dy;
        designerPanStart = { x: e.clientX, y: e.clientY };
        setDesignerZoom(designerZoomLevel);
    });
    window.addEventListener('mouseup', () => {
        isDesignerPanning = false;
        designerSVG.style.cursor = '';
        editingCurve = null;
        editingPointIndex = null;
        if (dragCurve) {
            dragCurve = null;
            designerSVG.style.cursor = '';
        }
    });
    designerSVG.addEventListener('mouseleave', () => {
        if (dragCurve) {
            dragCurve = null;
            designerSVG.style.cursor = '';
        }
    });
    // --- Designer Mouse Wheel & Touchpad Zoom ---
    designerSVG.addEventListener('wheel', (e) => {
        e.preventDefault();
        const direction = e.deltaY < 0 ? 1 : -1;
        const rect = designerSVG.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * designerPanW + designerPanX;
        const mouseY = ((e.clientY - rect.top) / rect.height) * designerPanH + designerPanY;
        setDesignerZoom(designerZoomLevel + direction * designerZoomStep, mouseX, mouseY);
    }, { passive: false });
    // --- Curve Editing Handles ---
    function showCurveHandles(curve) {
        curveHandles.forEach(h => h.remove());
        curveHandles = [];
        const match = /M\s*([-\d.]+)\s+([-\d.]+)\s+Q\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/.exec(curve.getAttribute('d') || "");
        if (!match)
            return;
        const points = [
            { x: +match[1], y: +match[2] },
            { x: +match[3], y: +match[4] },
            { x: +match[5], y: +match[6] }
        ];
        points.forEach((pt, idx) => {
            const handle = document.createElementNS(svgNS, 'circle');
            handle.setAttribute('cx', pt.x.toString());
            handle.setAttribute('cy', pt.y.toString());
            handle.setAttribute('r', '6');
            handle.setAttribute('fill', idx === 1 ? '#ff9800' : '#2196f3');
            handle.style.cursor = 'pointer';
            designerSVG.appendChild(handle);
            curveHandles.push(handle);
            handle.addEventListener('mousedown', (e) => {
                editingCurve = curve;
                editingPointIndex = idx;
                e.stopPropagation();
            });
        });
    }
    function removeCurveHandles() {
        curveHandles.forEach(h => h.remove());
        curveHandles = [];
        editingCurve = null;
        editingPointIndex = null;
    }
    // --- Drawing curve button ---
    drawCurveBtn.addEventListener('click', () => {
        drawCurveMode = !drawCurveMode;
        if (drawCurveMode) {
            drawCurveBtn.textContent = "Drawing Curve...";
            drawCurveBtn.style.background = "#2196f3";
            drawCurveBtn.style.color = "#fff";
        }
        else {
            drawCurveBtn.textContent = "Draw Curve";
            drawCurveBtn.style.background = "";
            drawCurveBtn.style.color = "";
        }
        curvePoints = [];
        if (tempCurve) {
            tempCurve.remove();
            tempCurve = null;
        }
        curvePointCircles.forEach(c => c.remove());
        curvePointCircles = [];
        removeCurveHandles();
    });
    // --- Designer SVG click for curve points and selection ---
    designerSVG.addEventListener('click', (e) => {
        // --- Draw Curve Mode ---
        if (drawCurveMode) {
            const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            curvePoints.push({ x: svgCoords.x, y: svgCoords.y });
            const pointCircle = document.createElementNS(svgNS, 'circle');
            pointCircle.setAttribute('cx', svgCoords.x.toString());
            pointCircle.setAttribute('cy', svgCoords.y.toString());
            pointCircle.setAttribute('r', '2');
            pointCircle.setAttribute('fill', '#808080');
            designerSVG.appendChild(pointCircle);
            curvePointCircles.push(pointCircle);
            if (curvePoints.length === 3) {
                const [p0, p1, p2] = curvePoints;
                const path = document.createElementNS(svgNS, 'path');
                path.setAttribute('d', `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`);
                path.setAttribute('stroke', '#000');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('fill', 'none');
                designerSVG.appendChild(path);
                if (tempCurve) {
                    tempCurve.remove();
                    tempCurve = null;
                }
                curvePointCircles.forEach(c => c.remove());
                curvePointCircles = [];
                curvePoints = [];
                drawCurveMode = false;
                drawCurveBtn.textContent = "Draw Curve";
                drawCurveBtn.style.background = "";
                drawCurveBtn.style.color = "";
                tempCurve = null;
            }
            else if (curvePoints.length === 2) {
                if (!tempCurve) {
                    tempCurve = document.createElementNS(svgNS, 'path');
                    tempCurve.setAttribute('stroke', '#808080');
                    tempCurve.setAttribute('stroke-width', '2');
                    tempCurve.setAttribute('fill', 'none');
                    designerSVG.appendChild(tempCurve);
                }
            }
            return;
        }
        // --- Curve Selection Mode ---
        if (!addMode && e.target instanceof SVGPathElement) {
            if (selectedCurve) {
                selectedCurve.setAttribute('stroke', '#000');
                selectedCurve.setAttribute('stroke-width', '2');
            }
            selectedCurve = e.target;
            selectedCurve.setAttribute('stroke', '#f44336');
            selectedCurve.setAttribute('stroke-width', '4');
            removeCurveHandles();
            showCurveHandles(selectedCurve);
            if (selectedDesignerSeat) {
                selectedDesignerSeat.setAttribute('stroke', '#222');
                selectedDesignerSeat = null;
                seatIdInput.value = '';
                if (rotationHandle) {
                    rotationHandle.remove();
                    rotationHandle = null;
                }
            }
            return;
        }
        // --- Deselect curve if clicking on blank SVG ---
        if (!addMode && e.target === designerSVG) {
            removeCurveHandles();
            if (selectedCurve) {
                selectedCurve.setAttribute('stroke', '#000');
                selectedCurve.setAttribute('stroke-width', '2');
                selectedCurve = null;
            }
        }
    });
    // Live preview for curve while drawing
    designerSVG.addEventListener('mousemove', (e) => {
        if (drawCurveMode && curvePoints.length === 2 && tempCurve) {
            const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            const [p0, p1] = curvePoints;
            tempCurve.setAttribute('d', `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${svgCoords.x} ${svgCoords.y}`);
        }
    });
    // --- Curve Editing: Drag handles to edit curve ---
    window.addEventListener('mousemove', (e) => {
        if (editingCurve && editingPointIndex !== null) {
            const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            const match = /M\s*([-\d.]+)\s+([-\d.]+)\s+Q\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/.exec(editingCurve.getAttribute('d') || "");
            if (!match)
                return;
            const points = [
                { x: +match[1], y: +match[2] },
                { x: +match[3], y: +match[4] },
                { x: +match[5], y: +match[6] }
            ];
            points[editingPointIndex] = { x: svgCoords.x, y: svgCoords.y };
            editingCurve.setAttribute('d', `M ${points[0].x} ${points[0].y} Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`);
            curveHandles[editingPointIndex].setAttribute('cx', svgCoords.x.toString());
            curveHandles[editingPointIndex].setAttribute('cy', svgCoords.y.toString());
        }
    });
    // --- Curve Dragging ---
    window.addEventListener('mousemove', (e) => {
        if (dragCurve) {
            const dx = e.clientX - dragCurveStart.x;
            const dy = e.clientY - dragCurveStart.y;
            const match = /M\s*([-\d.]+)\s+([-\d.]+)\s+Q\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/.exec(dragCurveStart.origD);
            if (!match)
                return;
            let [_, x0, y0, x1, y1, x2, y2] = match.map(Number);
            const svgRect = designerSVG.getBoundingClientRect();
            const scaleX = (designerPanW / svgRect.width);
            const scaleY = (designerPanH / svgRect.height);
            let svgDx = dx * scaleX;
            let svgDy = dy * scaleY;
            const minX = Math.min(x0 + svgDx, x1 + svgDx, x2 + svgDx);
            const minY = Math.min(y0 + svgDy, y1 + svgDy, y2 + svgDy);
            const maxX = Math.max(x0 + svgDx, x1 + svgDx, x2 + svgDx);
            const maxY = Math.max(y0 + svgDy, y1 + svgDy, y2 + svgDy);
            let clampDx = svgDx, clampDy = svgDy;
            if (minX < designerPanX)
                clampDx += designerPanX - minX;
            if (maxX > designerPanX + designerPanW)
                clampDx -= maxX - (designerPanX + designerPanW);
            if (minY < designerPanY)
                clampDy += designerPanY - minY;
            if (maxY > designerPanY + designerPanH)
                clampDy -= maxY - (designerPanY + designerPanH);
            dragCurve.setAttribute('d', `M ${x0 + clampDx} ${y0 + clampDy} Q ${x1 + clampDx} ${y1 + clampDy} ${x2 + clampDx} ${y2 + clampDy}`);
            // Also update handles if curve is selected and being dragged
            if (selectedCurve === dragCurve && curveHandles.length === 3) {
                const newPoints = [
                    { x: x0 + clampDx, y: y0 + clampDy },
                    { x: x1 + clampDx, y: y1 + clampDy },
                    { x: x2 + clampDx, y: y2 + clampDy }
                ];
                curveHandles.forEach((h, idx) => {
                    h.setAttribute('cx', newPoints[idx].x.toString());
                    h.setAttribute('cy', newPoints[idx].y.toString());
                });
            }
        }
    });
    // --- Delete curve button ---
    deleteCurveBtn.addEventListener('click', () => {
        if (selectedCurve && designerSVG.contains(selectedCurve)) {
            designerSVG.removeChild(selectedCurve);
            removeCurveHandles();
            selectedCurve = null;
        }
    });
    // Show rotation handle next to the seat
    function showRotationHandle(rect) {
        if (rotationHandle) {
            rotationHandle.remove();
            rotationHandle = null;
        }
        const group = rect.parentNode;
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
            if (!rect)
                return;
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
            if (transMatch)
                transPart = `translate(${transMatch[1]},${transMatch[2]}) `;
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
        // Curve dragging
        if (dragCurve) {
            const dx = e.clientX - dragCurveStart.x;
            const dy = e.clientY - dragCurveStart.y;
            // Parse original path (quadratic Bezier: M x0 y0 Q x1 y1 x2 y2)
            const match = /M\s*([-\d.]+)\s+([-\d.]+)\s+Q\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/.exec(dragCurveStart.origD);
            if (!match)
                return;
            let [_, x0, y0, x1, y1, x2, y2] = match.map(Number);
            // Convert dx/dy from client to SVG coordinates
            const svgRect = designerSVG.getBoundingClientRect();
            const scaleX = (designerPanW / svgRect.width);
            const scaleY = (designerPanH / svgRect.height);
            let svgDx = dx * scaleX;
            let svgDy = dy * scaleY;
            // Clamp: compute bounding box after move
            const minX = Math.min(x0 + svgDx, x1 + svgDx, x2 + svgDx);
            const minY = Math.min(y0 + svgDy, y1 + svgDy, y2 + svgDy);
            const maxX = Math.max(x0 + svgDx, x1 + svgDx, x2 + svgDx);
            const maxY = Math.max(y0 + svgDy, y1 + svgDy, y2 + svgDy);
            // Clamp so curve stays inside SVG viewBox
            let clampDx = svgDx, clampDy = svgDy;
            if (minX < designerPanX)
                clampDx += designerPanX - minX;
            if (maxX > designerPanX + designerPanW)
                clampDx -= maxX - (designerPanX + designerPanW);
            if (minY < designerPanY)
                clampDy += designerPanY - minY;
            if (maxY > designerPanY + designerPanH)
                clampDy -= maxY - (designerPanY + designerPanH);
            // Update path
            dragCurve.setAttribute('d', `M ${x0 + clampDx} ${y0 + clampDy} Q ${x1 + clampDx} ${y1 + clampDy} ${x2 + clampDx} ${y2 + clampDy}`);
        }
    });
    window.addEventListener('mouseup', () => {
        if (rotatingGroup) {
            rotatingGroup = null;
            document.body.style.cursor = '';
            justRotated = true; // to not let new seat creation interfere
        }
        if (dragCurve) {
            dragCurve = null;
            designerSVG.style.cursor = '';
        }
    });
    designerSVG.addEventListener('mouseleave', () => {
        if (dragCurve) {
            dragCurve = null;
            designerSVG.style.cursor = '';
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
    function setUserZoom(zoom, centerX, centerY) {
        userZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoom));
        const newW = viewW / userZoomLevel;
        const newH = viewH / userZoomLevel;
        if (userZoomLevel === minZoom) {
            // At min zoom, always reset to original viewBox
            panX = viewX;
            panY = viewY;
            panW = viewW;
            panH = viewH;
        }
        else {
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
        if (e.target.tagName === 'rect')
            return;
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        seatSVG.style.cursor = 'grab';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isPanning)
            return;
        const dx = (e.clientX - panStart.x) * (panW / seatSVG.clientWidth);
        const dy = (e.clientY - panStart.y) * (panH / seatSVG.clientHeight);
        panX -= dx;
        panY -= dy;
        panStart = { x: e.clientX, y: e.clientY };
        setUserZoom(userZoomLevel); // Always use setUserZoom to update viewBox and clamp
    });
    function clampPan() {
        // Clamp panX and panY so the viewBox stays within the SVG bounds
        if (panW > viewW)
            panX = viewX;
        else
            panX = Math.max(viewX, Math.min(panX, viewX + viewW - panW));
        if (panH > viewH)
            panY = viewY;
        else
            panY = Math.max(viewY, Math.min(panY, viewY + viewH - panH));
    }
    // --- Touch Pan & Pinch Zoom ---
    let lastTouchDist = 0;
    seatSVG.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isPanning = true;
            panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        else if (e.touches.length === 2) {
            isPanning = false;
            lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
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
        }
        else if (e.touches.length === 2) {
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
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
    function updateSavedLayoutsDropdown() {
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
    function updateUI() {
        selectedDisplay.textContent = `Selected Seats: ${[...selectedSeats].join(', ') || 'None'}`;
        totalDisplay.textContent = `Total: ₹${selectedSeats.size * pricePerSeat}`;
        if (seatMapType === 'svg') {
            const seatRects = seatSVG.querySelectorAll('rect');
            seatRects.forEach((rect, idx) => {
                const seatRect = rect;
                const seatId = seatRect.getAttribute('data-seat-id') || `${idx}`;
                if (occupiedSeats.has(seatId)) {
                    seatRect.setAttribute('fill', '#d32f2f');
                }
                else if (selectedSeats.has(seatId)) {
                    seatRect.setAttribute('fill', '#4caf50');
                }
                else if (seatRect.getAttribute('width') && seatRect.getAttribute('height') && parseFloat(seatRect.getAttribute('width') || "0") < 50 && parseFloat(seatRect.getAttribute('height') || "0") < 50) {
                    seatRect.setAttribute('fill', '#e0e0e0');
                }
            });
        }
    }
    // Save current SVG layout
    function saveLayout(svg, promptMsg, prefix) {
        const layoutName = prompt(promptMsg);
        if (!layoutName)
            return;
        localStorage.setItem(prefix + layoutName, svg.outerHTML);
        updateSavedLayoutsDropdown();
        alert('Layout saved!');
    }
    // Usage:
    function saveLayoutHandler(svg, promptMsg, prefix) {
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
        }
        else {
            adminPanel.style.display = 'none';
            userPanel.style.display = 'block';
        }
    });
    // --- Grid Logic ---
    function generateSVGSeats(rows, cols, seatSize) {
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
    svgUpload.addEventListener('change', function (event) {
        seatMapType = 'svg';
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = function (e) {
            var _a;
            seatSVG.innerHTML = '';
            lastSVGString = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
            const importedSVG = svgDoc.documentElement;
            ['width', 'height', 'viewBox'].forEach(attr => {
                if (importedSVG.hasAttribute(attr)) {
                    seatSVG.setAttribute(attr, importedSVG.getAttribute(attr) || "");
                }
                else {
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
    function fixDuplicateSeatIds(svg) {
        const ids = new Set();
        const rects = svg.querySelectorAll('rect');
        let counter = 1;
        rects.forEach(rect => {
            var _a;
            let id = (_a = rect.getAttribute('data-seat-id')) === null || _a === void 0 ? void 0 : _a.trim();
            if (!id || ids.has(id.toLowerCase())) {
                // Assign a new unique ID
                while (ids.has(`seat${counter}`.toLowerCase()))
                    counter++;
                id = `Seat${counter}`;
                rect.setAttribute('data-seat-id', id);
            }
            ids.add(id.toLowerCase());
        });
    }
    function countAvailableSeats() {
        const seatRects = seatSVG.querySelectorAll('rect');
        let count = 0;
        seatRects.forEach(rect => {
            const seatId = rect.getAttribute('data-seat-id');
            if (seatId && !occupiedSeats.has(seatId))
                count++;
        });
        return count;
    }
    loadLayoutBtn.addEventListener('click', () => {
        seatMapType = 'svg';
        const key = savedLayoutsDropdown.value;
        if (!key)
            return;
        lastSVGString = localStorage.getItem(key) || "";
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
        const importedSVG = svgDoc.documentElement;
        ['width', 'height', 'viewBox'].forEach(attr => {
            if (importedSVG.hasAttribute(attr)) {
                seatSVG.setAttribute(attr, importedSVG.getAttribute(attr) || "");
            }
            else {
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
        const target = e.target;
        if (target.tagName === 'rect' &&
            target.hasAttribute('data-seat-id') &&
            !occupiedSeats.has(target.getAttribute('data-seat-id'))) {
            const seatId = target.getAttribute('data-seat-id');
            toggleSVGSeat(seatId, target);
        }
    });
    // --- Seat Selection Logic ---
    function attachSVGSeatListeners() {
        const seatRects = seatSVG.querySelectorAll('rect');
        seatRects.forEach((rect, idx) => {
            const seatRect = rect;
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
                }
                else {
                    seatRect.setAttribute('fill', '#d32f2f');
                }
            }
            else {
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
    function toggleSVGSeat(seatId, rect) {
        if (maxSelectableSeats === null) {
            if (!promptForSeatCount())
                return;
        }
        if (selectedSeats.has(seatId)) {
            selectedSeats.delete(seatId);
            rect.setAttribute('fill', '#e0e0e0');
        }
        else {
            if (selectedSeats.size >= (maxSelectableSeats !== null && maxSelectableSeats !== void 0 ? maxSelectableSeats : 0)) {
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
        }
        else if (seatMapType === 'svg') {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
            const importedSVG = svgDoc.documentElement;
            ['width', 'height', 'viewBox'].forEach(attr => {
                if (importedSVG.hasAttribute(attr)) {
                    seatSVG.setAttribute(attr, importedSVG.getAttribute(attr) || "");
                }
                else {
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
    function getNextAvailableDesignerSeatId() {
        // Collect all used numbers from data-seat-id attributes
        const usedNumbers = new Set();
        const rects = designerSVG.querySelectorAll('rect');
        rects.forEach(rect => {
            const id = rect.getAttribute('data-seat-id');
            if (id && /^Seat\d+$/.test(id)) {
                const num = parseInt(id.replace('Seat', ''), 10);
                if (!isNaN(num))
                    usedNumbers.add(num);
            }
        });
        // Find the lowest unused number
        let next = 1;
        while (usedNumbers.has(next))
            next++;
        return `Seat${next}`;
    }
    function getSVGCoords(svg, clientX, clientY) {
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
    function makeDraggable(group) {
        group.addEventListener('mousedown', (e) => {
            justDragged = false;
            if (isRotating)
                return;
            if (roleSelect.value !== 'admin')
                return;
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
    designerSVG.addEventListener('mousemove', (e) => {
        if (dragTarget && roleSelect.value === 'admin') {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            let tx = dragStart.tx + dx;
            let ty = dragStart.ty + dy;
            // Clamp tx, ty to SVG bounds
            const svgRect = designerSVG.getBoundingClientRect();
            const groupRect = dragTarget.getBBox();
            tx = Math.max(0, Math.min(tx, svgRect.width - groupRect.width));
            ty = Math.max(0, Math.min(ty, svgRect.height - groupRect.height));
            // Keep any rotation
            const transform = dragTarget.getAttribute('transform') || '';
            const rotMatch = /rotate\(([^)]+)\)/.exec(transform);
            let rotPart = '';
            if (rotMatch)
                rotPart = ` rotate(${rotMatch[1]})`;
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
            if (isRotating) {
                isRotating = false; // Stop rotation on click
                return; // Ignore clicks while rotating
            }
            if (!addMode) {
                if (e.target === designerSVG) {
                    if (selectedDesignerSeat)
                        selectedDesignerSeat.setAttribute('stroke', '#222');
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
            if (e.target !== designerSVG)
                return;
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
    function selectDesignerSeat(rect) {
        if (selectedDesignerSeat) {
            selectedDesignerSeat.setAttribute('stroke', '#222');
        }
        selectedDesignerSeat = rect;
        rect.setAttribute('stroke', '#f00');
        seatIdInput.value = rect.getAttribute('data-seat-id') || '';
        showRotationHandle(rect);
    }
    updateSeatIdBtn.addEventListener('click', () => {
        var _a;
        if (selectedDesignerSeat) {
            const newId = seatIdInput.value.trim();
            if (!newId) {
                alert('Seat ID cannot be empty.');
                return;
            }
            // Check for duplicate ID (case-insensitive, trimmed)
            const rects = designerSVG.querySelectorAll('rect');
            for (const rect of Array.from(rects)) {
                if (rect !== selectedDesignerSeat &&
                    ((_a = rect.getAttribute('data-seat-id')) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) === newId.toLowerCase()) {
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
            const group = selectedDesignerSeat.parentNode;
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
