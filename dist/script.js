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
    let justDragged = false;
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
    const designerZoomResetBtn = document.getElementById('designerZoomResetBtn');
    const drawCurveBtn = document.getElementById('drawCurveBtn');
    const rotateLeftBtn = document.getElementById('rotateLeftBtn');
    const rotateRightBtn = document.getElementById('rotateRightBtn');
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
    // --- Designer Mouse Wheel & Touchpad Zoom ---
    designerSVG.addEventListener('wheel', (e) => {
        e.preventDefault();
        const direction = e.deltaY < 0 ? 1 : -1;
        const circle = designerSVG.getBoundingClientRect();
        const mouseX = ((e.clientX - circle.left) / circle.width) * designerPanW + designerPanX;
        const mouseY = ((e.clientY - circle.top) / circle.height) * designerPanH + designerPanY;
        setDesignerZoom(designerZoomLevel + direction * designerZoomStep, mouseX, mouseY);
    }, { passive: false });
    let penMode = false;
    let currentPenPath = null;
    let penDragging = null;
    let penPreviewLine = null;
    let penPreviewHandle = null;
    let finishedPenPaths = [];
    let selectedPenPath = null;
    // --- Pen Tool Toggle ---
    drawCurveBtn.addEventListener('click', () => {
        penMode = !penMode;
        drawCurveBtn.textContent = penMode ? "Draw Tool: ON" : "Draw Tool";
        if (!penMode)
            finishPenPath();
    });
    // --- Pen Tool Mouse Down (Add/Select/Drag) ---
    designerSVG.addEventListener('mousedown', (e) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
        // --- Pen Tool: Drawing/Editing ---
        if (penMode) {
            if (e.button !== 0)
                return;
            // Snap/close if clicking first anchor
            if (currentPenPath &&
                currentPenPath.points.length > 1 &&
                e.target === currentPenPath.points[0].anchorCircle) {
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
                        penDragging = { point: pt, type: 'handleIn', offsetX: svgCoords.x - ((_b = (_a = pt.handleIn) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : pt.x), offsetY: svgCoords.y - ((_d = (_c = pt.handleIn) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : pt.y) };
                        return;
                    }
                    if (e.target === pt.handleOutCircle) {
                        penDragging = { point: pt, type: 'handleOut', offsetX: svgCoords.x - ((_f = (_e = pt.handleOut) === null || _e === void 0 ? void 0 : _e.x) !== null && _f !== void 0 ? _f : pt.x), offsetY: svgCoords.y - ((_h = (_g = pt.handleOut) === null || _g === void 0 ? void 0 : _g.y) !== null && _h !== void 0 ? _h : pt.y) };
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
            const newPt = { x, y };
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
            penPreviewLine === null || penPreviewLine === void 0 ? void 0 : penPreviewLine.remove();
            penPreviewHandle === null || penPreviewHandle === void 0 ? void 0 : penPreviewHandle.remove();
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
                    penDragging = { point: pt, type: 'handleIn', offsetX: svgCoords.x - ((_k = (_j = pt.handleIn) === null || _j === void 0 ? void 0 : _j.x) !== null && _k !== void 0 ? _k : pt.x), offsetY: svgCoords.y - ((_m = (_l = pt.handleIn) === null || _l === void 0 ? void 0 : _l.y) !== null && _m !== void 0 ? _m : pt.y) };
                    return;
                }
                if (e.target === pt.handleOutCircle) {
                    penDragging = { point: pt, type: 'handleOut', offsetX: svgCoords.x - ((_p = (_o = pt.handleOut) === null || _o === void 0 ? void 0 : _o.x) !== null && _p !== void 0 ? _p : pt.x), offsetY: svgCoords.y - ((_r = (_q = pt.handleOut) === null || _q === void 0 ? void 0 : _q.y) !== null && _r !== void 0 ? _r : pt.y) };
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
                if (selectedDesignerSeat)
                    selectedDesignerSeat.setAttribute('stroke', '#222');
                selectedDesignerSeat = null;
                seatIdInput.value = '';
                return;
            }
        }
    });
    window.addEventListener('mousemove', (e) => {
        var _a, _b, _c, _d, _e, _f;
        // --- 1. Pen Tool anchor/handle dragging ---
        if (penDragging && (currentPenPath || selectedPenPath)) {
            const pathObj = currentPenPath || selectedPenPath;
            const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            const pt = penDragging.point;
            if (penDragging.type === 'anchor') {
                pt.x = svgCoords.x - penDragging.offsetX;
                pt.y = svgCoords.y - penDragging.offsetY;
                (_a = pt.anchorCircle) === null || _a === void 0 ? void 0 : _a.setAttribute('cx', pt.x.toString());
                (_b = pt.anchorCircle) === null || _b === void 0 ? void 0 : _b.setAttribute('cy', pt.y.toString());
                (_c = pt.anchorDot) === null || _c === void 0 ? void 0 : _c.setAttribute('cx', pt.x.toString());
                (_d = pt.anchorDot) === null || _d === void 0 ? void 0 : _d.setAttribute('cy', pt.y.toString());
                if (pt.handleIn) {
                    pt.handleIn.x += svgCoords.x - pt.x - penDragging.offsetX;
                    pt.handleIn.y += svgCoords.y - pt.y - penDragging.offsetY;
                }
                if (pt.handleOut) {
                    pt.handleOut.x += svgCoords.x - pt.x - penDragging.offsetX;
                    pt.handleOut.y += svgCoords.y - pt.y - penDragging.offsetY;
                }
            }
            else if (penDragging.type === 'handleIn') {
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
            }
            else if (penDragging.type === 'handleOut') {
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
                }
                else if (!e.altKey) {
                    const dx = pt.x - pt.handleOut.x, dy = pt.y - pt.handleOut.y;
                    pt.handleIn = { x: pt.x + dx, y: pt.y + dy };
                }
            }
            if (pathObj != null) {
                updatePenPath(pathObj, false);
                return;
            }
        }
        // --- 2. Group (seat) dragging ---
        if (dragTarget && roleSelect.value === 'admin') {
            designerSVG.style.cursor = 'grab';
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            const tx = dragStart.tx + dx;
            const ty = dragStart.ty + dy;
            dragTarget.setAttribute('transform', `translate(${tx},${ty})`);
        }
        else {
            designerSVG.style.cursor = '';
        }
        // --- 3. Preview logic ---
        if (penMode && !penDragging && currentPenPath) {
            const lastPt = currentPenPath.points[currentPenPath.points.length - 1];
            if (!lastPt)
                return;
            let svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            penPreviewLine === null || penPreviewLine === void 0 ? void 0 : penPreviewLine.remove();
            penPreviewHandle === null || penPreviewHandle === void 0 ? void 0 : penPreviewHandle.remove();
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
            if (firstPt &&
                currentPenPath.points.length > 1 &&
                Math.hypot(svgCoords.x - firstPt.x, svgCoords.y - firstPt.y) < 12) {
                (_e = firstPt.anchorCircle) === null || _e === void 0 ? void 0 : _e.setAttribute('fill', '#f44336');
            }
            else {
                (_f = firstPt.anchorCircle) === null || _f === void 0 ? void 0 : _f.setAttribute('fill', '#2196f3');
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
    });
    // --- Pen Tool Mouse Up (End Drag) ---
    window.addEventListener('mouseup', () => {
        // --- End all drag/rotate states ---
        isDesignerPanning = false;
        penDragging = null;
        designerSVG.style.cursor = '';
        isPanning = false;
        seatSVG.style.cursor = '';
        // HandleOut if it was a click, not a drag
        if (penDragging && penDragging.type === 'handleOut' && penDragging.point._dragStart) {
            const pt = penDragging.point;
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
        penPreviewLine === null || penPreviewLine === void 0 ? void 0 : penPreviewLine.remove();
        penPreviewHandle === null || penPreviewHandle === void 0 ? void 0 : penPreviewHandle.remove();
        designerSVG.style.cursor = '';
    });
    // --- Undo/Redo ---
    window.addEventListener('keydown', (e) => {
        var _a, _b, _c, _d, _e, _f;
        if (!penMode || !currentPenPath)
            return;
        // Remove last anchor point (and handles) with Backspace/Delete or Ctrl+Z
        if (e.key === "Backspace" ||
            e.key === "Delete" ||
            ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z")) {
            e.preventDefault();
            const pt = currentPenPath.points.pop();
            if (pt) {
                (_a = pt.anchorCircle) === null || _a === void 0 ? void 0 : _a.remove();
                (_b = pt.handleInCircle) === null || _b === void 0 ? void 0 : _b.remove();
                (_c = pt.handleOutCircle) === null || _c === void 0 ? void 0 : _c.remove();
                (_d = pt.handleLineIn) === null || _d === void 0 ? void 0 : _d.remove();
                (_e = pt.handleLineOut) === null || _e === void 0 ? void 0 : _e.remove();
                (_f = pt.anchorDot) === null || _f === void 0 ? void 0 : _f.remove();
                if (penPreviewLine)
                    penPreviewLine.remove();
                if (penPreviewHandle)
                    penPreviewHandle.remove();
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
        if (!currentPenPath)
            return;
        if (close && currentPenPath.points.length > 1) {
            currentPenPath.closed = true;
            updatePenPath(currentPenPath, true); // Hide handles by default
        }
        currentPenPath.points.forEach(pt => {
            var _a, _b, _c;
            (_a = pt.anchorCircle) === null || _a === void 0 ? void 0 : _a.setAttribute('fill', 'rgba(0,0,0,0)');
            (_b = pt.handleInCircle) === null || _b === void 0 ? void 0 : _b.setAttribute('fill', '#bbb');
            (_c = pt.handleOutCircle) === null || _c === void 0 ? void 0 : _c.setAttribute('fill', '#bbb');
        });
        finishedPenPaths.push(currentPenPath);
        currentPenPath.path.style.cursor = "pointer";
        const thisPath = currentPenPath;
        currentPenPath.path.addEventListener('click', () => {
            selectPenPath(thisPath);
        });
        currentPenPath = null;
        penDragging = null;
        drawCurveBtn.textContent = "Pen Tool";
        penMode = false;
        penPreviewLine === null || penPreviewLine === void 0 ? void 0 : penPreviewLine.remove();
        penPreviewHandle === null || penPreviewHandle === void 0 ? void 0 : penPreviewHandle.remove();
        penPreviewLine = null;
        penPreviewHandle = null;
    }
    // --- Path selection logic ---
    function selectPenPath(path) {
        // Deselect previous
        if (selectedPenPath && selectedPenPath !== path) {
            updatePenPath(selectedPenPath, true); // Hide handles
            selectedPenPath.path.setAttribute('stroke', '#000');
        }
        selectedPenPath = path;
        updatePenPath(path, false); // Show handles
        path.path.setAttribute('stroke', '#f44336');
    }
    // --- Deselect on SVG background click ---
    designerSVG.addEventListener('click', (e) => {
        if (!penMode && e.target === designerSVG && selectedPenPath) {
            updatePenPath(selectedPenPath, true);
            selectedPenPath.path.setAttribute('stroke', '#000');
            selectedPenPath = null;
        }
    });
    // --- Update Path & Handles ---
    function updatePenPath(pathObj, hideHandles = false) {
        var _a, _b, _c, _d, _e, _f;
        for (const pt of pathObj.points) {
            (_a = pt.handleLineIn) === null || _a === void 0 ? void 0 : _a.remove();
            (_b = pt.handleLineOut) === null || _b === void 0 ? void 0 : _b.remove();
            (_c = pt.handleInCircle) === null || _c === void 0 ? void 0 : _c.remove();
            (_d = pt.handleOutCircle) === null || _d === void 0 ? void 0 : _d.remove();
            (_e = pt.anchorCircle) === null || _e === void 0 ? void 0 : _e.remove();
            (_f = pt.anchorDot) === null || _f === void 0 ? void 0 : _f.remove();
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
            }
            else {
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
    function rotateSelectedPath(angleDeg) {
        if (!selectedPenPath)
            return;
        // Find center of path
        const points = selectedPenPath.points;
        if (points.length === 0)
            return;
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
    // --- Original View ---
    const svgWidth = seatSVG.width.baseVal.value;
    const svgHeight = seatSVG.height.baseVal.value;
    // Always force the viewBox to match the SVG's width/height
    const originalViewBox = `0 0 ${svgWidth} ${svgHeight}`;
    seatSVG.setAttribute('viewBox', originalViewBox);
    let [viewX, viewY, viewW, viewH] = [0, 0, svgWidth, svgHeight];
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
                // Calculate the relative position of the zoom center
                const relX = (centerX - panX) / panW;
                const relY = (centerY - panY) / panH;
                panW = newW;
                panH = newH;
                panX = centerX - relX * panW;
                panY = centerY - relY * panH;
            }
            else {
                panW = newW;
                panH = newH;
            }
            clampPan();
        }
        seatSVG.setAttribute('viewBox', `${panX} ${panY} ${panW} ${panH}`);
    }
    // --- Pan Logic ---
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    seatSVG.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'circle')
            return;
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        seatSVG.style.cursor = 'grab';
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
        e.preventDefault();
        if (e.touches.length === 1 && isPanning) {
            const dx = (e.touches[0].clientX - panStart.x) * (panW / seatSVG.clientWidth);
            const dy = (e.touches[0].clientY - panStart.y) * (panH / seatSVG.clientHeight);
            panX -= dx;
            panY -= dy;
            panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            clampPan();
            seatSVG.setAttribute('viewBox', `${panX} ${panY} ${panW} ${panH}`);
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
            const seatCircles = seatSVG.querySelectorAll('circle[data-seat-id]');
            seatCircles.forEach((circle, idx) => {
                const seatCircle = circle;
                const seatId = seatCircle.getAttribute('data-seat-id') || `${idx}`;
                if (occupiedSeats.has(seatId)) {
                    seatCircle.setAttribute('fill', '#d32f2f');
                }
                else if (selectedSeats.has(seatId)) {
                    seatCircle.setAttribute('fill', '#4caf50');
                }
                else if (seatCircle.getAttribute('r') && parseFloat(seatCircle.getAttribute('r') || "0") < 25) {
                    seatCircle.setAttribute('fill', '#e0e0e0');
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
        const circles = svg.querySelectorAll('circle[data-seat-id]');
        let counter = 1;
        circles.forEach(circle => {
            var _a;
            let id = (_a = circle.getAttribute('data-seat-id')) === null || _a === void 0 ? void 0 : _a.trim();
            if (!id || ids.has(id.toLowerCase())) {
                // Assign a new unique ID
                while (ids.has(`seat${counter}`.toLowerCase()))
                    counter++;
                id = `Seat${counter}`;
                circle.setAttribute('data-seat-id', id);
            }
            ids.add(id.toLowerCase());
        });
    }
    function countAvailableSeats() {
        const seatCircles = seatSVG.querySelectorAll('circle[data-seat-id]');
        let count = 0;
        seatCircles.forEach(circle => {
            const seatId = circle.getAttribute('data-seat-id');
            // Only count if seatId is non-empty and not occupied
            if (seatId && seatId.trim() !== '' && !occupiedSeats.has(seatId))
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
        if (target.tagName === 'circle' &&
            target.hasAttribute('data-seat-id') &&
            !occupiedSeats.has(target.getAttribute('data-seat-id'))) {
            const seatId = target.getAttribute('data-seat-id');
            toggleSVGSeat(seatId, target);
        }
    });
    // --- Seat Selection Logic ---
    function attachSVGSeatListeners() {
        const seatCircles = seatSVG.querySelectorAll('circle');
        seatCircles.forEach((circle, idx) => {
            const seatCircle = circle;
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
            if (radius < 25) {
                seatCircle.style.cursor = 'pointer';
                if (!occupiedSeats.has(seatId)) {
                    seatCircle.setAttribute('fill', '#e0e0e0');
                }
                else {
                    seatCircle.setAttribute('fill', '#d32f2f');
                }
            }
            else {
                seatCircle.setAttribute('fill', '#bdbdbd');
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
    function toggleSVGSeat(seatId, circle) {
        if (maxSelectableSeats === null) {
            if (!promptForSeatCount())
                return;
        }
        if (selectedSeats.has(seatId)) {
            selectedSeats.delete(seatId);
            circle.setAttribute('fill', '#e0e0e0');
        }
        else {
            if (selectedSeats.size >= (maxSelectableSeats !== null && maxSelectableSeats !== void 0 ? maxSelectableSeats : 0)) {
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
        const circles = designerSVG.querySelectorAll('circle');
        circles.forEach(circle => {
            const id = circle.getAttribute('data-seat-id');
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
            if (!addMode) {
                if (e.target === designerSVG) {
                    if (selectedDesignerSeat)
                        selectedDesignerSeat.setAttribute('stroke', '#222');
                    selectedDesignerSeat = null;
                    seatIdInput.value = '';
                }
                return;
            }
            if (e.target !== designerSVG)
                return;
            const svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            const circle = document.createElementNS(svgNS, 'circle');
            const group = document.createElementNS(svgNS, 'g');
            circle.setAttribute('cx', svgCoords.x.toString());
            circle.setAttribute('cy', svgCoords.y.toString());
            circle.setAttribute('r', '7');
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
    function selectDesignerSeat(circle) {
        // Only apply stroke if this is a seat (not a pen tool anchor)
        if (circle.hasAttribute('data-seat-id')) {
            if (selectedDesignerSeat) {
                selectedDesignerSeat.setAttribute('stroke', '#222');
            }
            selectedDesignerSeat = circle;
            circle.setAttribute('stroke', '#f00');
            seatIdInput.value = circle.getAttribute('data-seat-id') || '';
        }
        else {
            // For pen tool anchors, do not set stroke
            selectedDesignerSeat = null;
            seatIdInput.value = '';
        }
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
            const circles = designerSVG.querySelectorAll('circle');
            for (const circle of Array.from(circles)) {
                if (circle !== selectedDesignerSeat &&
                    ((_a = circle.getAttribute('data-seat-id')) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) === newId.toLowerCase()) {
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
        }
    });
})();
