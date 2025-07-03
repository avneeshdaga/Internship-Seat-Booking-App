var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    // --- Constants & State ---
    var svgNS = "http://www.w3.org/2000/svg";
    var pricePerSeat = 200;
    var selectedSeats = new Set();
    var occupiedSeats = new Set();
    var seatMapType = 'grid';
    var lastSVGString = '';
    var maxSelectableSeats = null;
    var selectedDesignerSeat = null;
    var addMode = false;
    var dragTarget = null;
    var userZoomLevel = 1;
    var minZoom = 1;
    var maxZoom = 3;
    var zoomStep = 0.04;
    var justDragged = false;
    // --- DOM Elements ---
    var roleSelect = document.getElementById('roleSelect');
    var adminPanel = document.getElementById('adminPanel');
    var userPanel = document.getElementById('userPanel');
    var rowInput = document.getElementById('rowInput');
    var colInput = document.getElementById('colInput');
    var seatSizeInput = document.getElementById('seatSizeInput');
    var createSeatsBtn = document.getElementById('createSeatsBtn');
    var seatSVG = document.getElementById('seatSVG');
    var selectedDisplay = document.getElementById('selected');
    var totalDisplay = document.getElementById('total');
    var confirmBtn = document.getElementById('confirmBtn');
    var svgUpload = document.getElementById('svgUpload');
    var saveLayoutBtn = document.getElementById('saveLayoutBtn');
    var zoomResetBtn = document.getElementById('zoomResetBtn');
    var savedLayoutsDropdown = document.getElementById('savedLayoutsDropdown');
    var loadLayoutBtn = document.getElementById('loadLayoutBtn');
    var deleteLayoutBtn = document.getElementById('deleteLayoutBtn');
    var addSeatBtn = document.getElementById('addSeatBtn');
    var deleteSeatBtn = document.getElementById('deleteSeatBtn');
    var seatIdInput = document.getElementById('seatIdInput');
    var updateSeatIdBtn = document.getElementById('updateSeatIdBtn');
    var saveDesignerLayoutBtn = document.getElementById('saveDesignerLayoutBtn');
    var saveUploadedLayoutBtn = document.getElementById('saveUploadedLayoutBtn');
    var designerSVG = document.getElementById('designerSVG');
    var designerZoomResetBtn = document.getElementById('designerZoomResetBtn');
    var drawCurveBtn = document.getElementById('drawCurveBtn');
    var rotateLeftBtn = document.getElementById('rotateLeftBtn');
    var rotateRightBtn = document.getElementById('rotateRightBtn');
    var addRectBtn = document.getElementById('addRectBtn');
    var addCircleBtn = document.getElementById('addCircleBtn');
    var addTextBtn = document.getElementById('addTextBtn');
    // Designer SVG pan/zoom state
    var designerOriginalViewBox = designerSVG.getAttribute('viewBox');
    if (!designerOriginalViewBox) {
        designerOriginalViewBox = "0 0 ".concat(designerSVG.width.baseVal.value, " ").concat(designerSVG.height.baseVal.value);
        designerSVG.setAttribute('viewBox', designerOriginalViewBox);
    }
    var _a = designerOriginalViewBox.split(' ').map(Number), designerViewX = _a[0], designerViewY = _a[1], designerViewW = _a[2], designerViewH = _a[3];
    var designerPanX = designerViewX, designerPanY = designerViewY, designerPanW = designerViewW, designerPanH = designerViewH;
    var designerZoomLevel = 1;
    var designerMinZoom = 1;
    var designerMaxZoom = 3;
    var designerZoomStep = 0.04;
    var isDesignerPanning = false;
    var designerPanStart = { x: 0, y: 0 };
    // --- Original View ---
    var svgWidth = seatSVG.width.baseVal.value;
    var svgHeight = seatSVG.height.baseVal.value;
    // Always force the viewBox to match the SVG's width/height
    var originalViewBox = "0 0 ".concat(svgWidth, " ").concat(svgHeight);
    seatSVG.setAttribute('viewBox', originalViewBox);
    var _b = [0, 0, svgWidth, svgHeight], viewX = _b[0], viewY = _b[1], viewW = _b[2], viewH = _b[3];
    var panX = viewX, panY = viewY, panW = viewW, panH = viewH;
    var isPathDragging = false;
    var pathDragStart = { x: 0, y: 0 };
    var shapeMode = 'none';
    var selectedShape = null;
    var isShapeDragging = false;
    var shapeDragStart = { x: 0, y: 0, origX: 0, origY: 0, origAngle: 0, w: 0, h: 0 };
    var selectedRect = null;
    addRectBtn.addEventListener('click', function () {
        shapeMode = shapeMode === 'rect' ? 'none' : 'rect';
        addRectBtn.style.background = shapeMode === 'rect' ? "#4caf50" : "";
        addCircleBtn.style.background = "";
    });
    addCircleBtn.addEventListener('click', function () {
        shapeMode = shapeMode === 'circle' ? 'none' : 'circle';
        addCircleBtn.style.background = shapeMode === 'circle' ? "#4caf50" : "";
        addRectBtn.style.background = "";
    });
    designerZoomResetBtn.addEventListener('click', function () {
        designerPanX = designerViewX;
        designerPanY = designerViewY;
        designerPanW = designerViewW;
        designerPanH = designerViewH;
        setDesignerZoom(1);
    });
    designerSVG.addEventListener('mousemove', function (e) {
        if (dragTarget) {
            // Extract current translation and rotation (with center)
            var transform = dragTarget.getAttribute('transform') || '';
            var transMatch = /translate\(([^,]+),([^)]+)\)/.exec(transform);
            var rotMatch = /rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/.exec(transform);
            var prevTx = 0, prevTy = 0;
            if (transMatch) {
                prevTx = parseFloat(transMatch[1]);
                prevTy = parseFloat(transMatch[2]);
            }
            var angle = 0, rotCx = 0, rotCy = 0;
            if (rotMatch) {
                angle = parseFloat(rotMatch[1]);
                rotCx = parseFloat(rotMatch[2]);
                rotCy = parseFloat(rotMatch[3]);
            }
            // Calculate mouse movement in screen coords
            var dx = e.clientX - dragStart.x;
            var dy = e.clientY - dragStart.y;
            // Project movement into the rotated coordinate system
            var tx = dragStart.tx, ty = dragStart.ty;
            if (angle !== 0) {
                var rad = angle * Math.PI / 180;
                var localDx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
                var localDy = dx * Math.sin(-rad) + dy * Math.cos(-rad);
                tx = dragStart.tx + localDx;
                ty = dragStart.ty + localDy;
            }
            else {
                tx = dragStart.tx + dx;
                ty = dragStart.ty + dy;
            }
            // Rebuild transform string, preserving rotation center
            var rotPart = '';
            if (rotMatch) {
                rotPart = " rotate(".concat(angle, " ").concat(rotCx, " ").concat(rotCy, ")");
            }
            dragTarget.setAttribute('transform', "translate(".concat(tx, ",").concat(ty, ")").concat(rotPart));
            // Update handle
            var rect = dragTarget.querySelector('rect');
            if (rect)
                showResizeHandle(rect);
        }
    });
    designerSVG.addEventListener('mouseup', function () {
        dragTarget = null;
    });
    function showResizeHandle(rect) {
        // Remove old handle if any
        if (rect._resizeHandle) {
            rect._resizeHandle.remove();
            rect._resizeHandle = null;
        }
        var group = rect.parentNode;
        // Get rect geometry
        var x = parseFloat(rect.getAttribute('x') || "0");
        var y = parseFloat(rect.getAttribute('y') || "0");
        var w = parseFloat(rect.getAttribute('width') || "0");
        var h = parseFloat(rect.getAttribute('height') || "0");
        var localHx = x + w;
        var localHy = y + h;
        // --- Apply rectangle's own rotation (if any) ---
        var hx = localHx, hy = localHy;
        var tf = rect.getAttribute('transform');
        if (tf && tf.includes('rotate')) {
            // Parse: rotate(angle cx cy)
            var match = /rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/.exec(tf);
            if (match) {
                var angle = parseFloat(match[1]);
                var cx = parseFloat(match[2]);
                var cy = parseFloat(match[3]);
                var rad = angle * Math.PI / 180;
                var dx = localHx - cx;
                var dy = localHy - cy;
                hx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
                hy = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
            }
        }
        // --- Apply group transform (if any) ---
        var ctm = group.getCTM();
        if (ctm) {
            var pt = designerSVG.createSVGPoint();
            pt.x = hx;
            pt.y = hy;
            var svgPt = pt.matrixTransform(ctm);
            hx = svgPt.x;
            hy = svgPt.y;
        }
        // Draw handle
        var resizeHandle = document.createElementNS(svgNS, 'circle');
        resizeHandle.setAttribute('cx', hx.toString());
        resizeHandle.setAttribute('cy', hy.toString());
        resizeHandle.setAttribute('r', '3');
        resizeHandle.setAttribute('fill', '#000');
        resizeHandle.style.cursor = 'nwse-resize';
        designerSVG.appendChild(resizeHandle);
        rect._resizeHandle = resizeHandle;
        // --- Resize logic (unchanged) ---
        var isResizing = false;
        var start = { x: 0, y: 0, w: 0, h: 0 };
        resizeHandle.addEventListener('mousedown', function (e) {
            e.stopPropagation();
            isResizing = true;
            start.x = e.clientX;
            start.y = e.clientY;
            start.w = w;
            start.h = h;
            function onMove(ev) {
                if (!isResizing)
                    return;
                // Calculate mouse movement in SVG coordinates
                var svgCoords1 = getSVGCoords(designerSVG, start.x, start.y);
                var svgCoords2 = getSVGCoords(designerSVG, ev.clientX, ev.clientY);
                var dx = svgCoords2.x - svgCoords1.x;
                var dy = svgCoords2.y - svgCoords1.y;
                var newW = Math.max(10, start.w + dx);
                var newH = Math.max(10, start.h + dy);
                rect.setAttribute('width', newW.toString());
                rect.setAttribute('height', newH.toString());
                showResizeHandle(rect); // Update handle position
            }
            function onUp() {
                isResizing = false;
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            }
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        });
    }
    // Shape resizing 
    function makeShapeInteractive(shape) {
        // Remove old handles if any
        if (shape._resizeHandles) {
            shape._resizeHandles.forEach(function (h) { return h.remove(); });
        }
        // --- RECTANGLE LOGIC ---
        if (shape instanceof SVGRectElement) {
            // --- DRAG LOGIC ---
            var group_1 = shape.parentNode;
            // Attach drag to rect
            shape.addEventListener('mousedown', function (e) {
                if (roleSelect.value !== 'admin')
                    return;
                dragTarget = group_1;
                var transform = group_1.getAttribute('transform') || '';
                var match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
                dragStart = {
                    x: e.clientX,
                    y: e.clientY,
                    tx: match ? parseFloat(match[1]) : 0,
                    ty: match ? parseFloat(match[2]) : 0
                };
                e.stopPropagation();
            });
            // Attach drag to group (so you can drag even if you click the group, not just the rect)
            group_1.addEventListener('mousedown', function (e) {
                if (roleSelect.value !== 'admin')
                    return;
                dragTarget = group_1;
                var transform = group_1.getAttribute('transform') || '';
                var match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
                dragStart = {
                    x: e.clientX,
                    y: e.clientY,
                    tx: match ? parseFloat(match[1]) : 0,
                    ty: match ? parseFloat(match[2]) : 0
                };
                e.stopPropagation();
            });
            // --- SELECTION LOGIC ---
            shape.addEventListener('click', function (e) {
                e.stopPropagation();
                selectRect(shape);
            });
            // --- INITIAL HANDLE POSITION ---
            showResizeHandle(shape); // <-- Show handle on create
        }
        // --- CIRCLE LOGIC ---
        else if (shape instanceof SVGCircleElement) {
            // Circle: 1 handle on right edge
            var handle_1 = document.createElementNS(svgNS, 'circle');
            handle_1.setAttribute('r', '3');
            handle_1.setAttribute('fill', '#000');
            handle_1.style.cursor = 'ew-resize';
            handle_1.style.pointerEvents = 'all';
            designerSVG.appendChild(handle_1);
            var updateHandle_1 = function () {
                var cx = parseFloat(shape.getAttribute('cx') || '0');
                var cy = parseFloat(shape.getAttribute('cy') || '0');
                var r = parseFloat(shape.getAttribute('r') || '0');
                handle_1.setAttribute('cx', (cx + r).toString());
                handle_1.setAttribute('cy', cy.toString());
                designerSVG.appendChild(handle_1);
            };
            handle_1.__updateHandle = updateHandle_1;
            var isResizing_1 = false;
            var start_1 = { x: 0, r: 0 };
            handle_1.addEventListener('mousedown', function (e) {
                e.stopPropagation();
                isResizing_1 = true;
                start_1.x = e.clientX;
                start_1.r = parseFloat(shape.getAttribute('r') || '0');
                function onMove(ev) {
                    if (!isResizing_1)
                        return;
                    var dx = ev.clientX - start_1.x;
                    var newR = Math.max(5, start_1.r + dx);
                    shape.setAttribute('r', newR.toString());
                    updateHandle_1();
                }
                function onUp() {
                    isResizing_1 = false;
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                }
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            });
            // --- DRAG LOGIC ---
            shape.addEventListener('mousedown', function (e) {
                if (e.shiftKey)
                    return; // Don't drag if resizing
                isShapeDragging = true;
                shapeDragStart.x = e.clientX;
                shapeDragStart.y = e.clientY;
                shapeDragStart.origX = parseFloat(shape.getAttribute('cx') || '0');
                shapeDragStart.origY = parseFloat(shape.getAttribute('cy') || '0');
                selectedShape = shape;
                e.stopPropagation();
            });
            // --- INITIAL HANDLE POSITION ---
            updateHandle_1();
            shape._resizeHandles = [handle_1];
        }
    }
    // --- Designer SVG Zoom/Pan Logic ---
    function setDesignerZoom(zoom, centerX, centerY) {
        designerZoomLevel = Math.max(designerMinZoom, Math.min(designerMaxZoom, zoom));
        var newW = designerViewW / designerZoomLevel;
        var newH = designerViewH / designerZoomLevel;
        if (designerZoomLevel === designerMinZoom) {
            designerPanX = designerViewX;
            designerPanY = designerViewY;
            designerPanW = designerViewW;
            designerPanH = designerViewH;
        }
        else {
            if (typeof centerX === 'number' && typeof centerY === 'number') {
                var zoomRatio = newW / designerPanW;
                designerPanX = centerX - (centerX - designerPanX) * zoomRatio;
                designerPanY = centerY - (centerY - designerPanY) * zoomRatio;
            }
            designerPanW = newW;
            designerPanH = newH;
            clampDesignerPan();
        }
        designerSVG.setAttribute('viewBox', "".concat(designerPanX, " ").concat(designerPanY, " ").concat(designerPanW, " ").concat(designerPanH));
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
    designerSVG.addEventListener('wheel', function (e) {
        e.preventDefault();
        var direction = e.deltaY < 0 ? 1 : -1;
        var circle = designerSVG.getBoundingClientRect();
        var mouseX = ((e.clientX - circle.left) / circle.width) * designerPanW + designerPanX;
        var mouseY = ((e.clientY - circle.top) / circle.height) * designerPanH + designerPanY;
        setDesignerZoom(designerZoomLevel + direction * designerZoomStep, mouseX, mouseY);
    }, { passive: false });
    var penMode = false;
    var currentPenPath = null;
    var penDragging = null;
    var penPreviewLine = null;
    var penPreviewHandle = null;
    var finishedPenPaths = [];
    var selectedPenPath = null;
    // --- Pen Tool Toggle ---
    drawCurveBtn.addEventListener('click', function () {
        penMode = !penMode;
        drawCurveBtn.textContent = penMode ? "Draw Tool: ON" : "Draw Tool";
        if (!penMode)
            finishPenPath();
    });
    // --- Pen Tool Mouse Down (Add/Select/Drag) ---
    designerSVG.addEventListener('mousedown', function (e) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
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
                for (var _i = 0, _s = currentPenPath.points; _i < _s.length; _i++) {
                    var pt = _s[_i];
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
            var x = svgCoords.x;
            var y = svgCoords.y;
            if (e.shiftKey && currentPenPath.points.length > 0) {
                var prev = currentPenPath.points[currentPenPath.points.length - 1];
                var dx = x - prev.x;
                var dy = y - prev.y;
                var angle = Math.atan2(dy, dx);
                var length_1 = Math.sqrt(dx * dx + dy * dy);
                var snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                x = prev.x + Math.cos(snapAngle) * length_1;
                y = prev.y + Math.sin(snapAngle) * length_1;
            }
            var newPt = { x: x, y: y };
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
            for (var _t = 0, _u = selectedPenPath.points; _t < _u.length; _t++) {
                var pt = _u[_t];
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
    window.addEventListener('mousemove', function (e) {
        var _a, _b, _c, _d, _e, _f, _g;
        // --- 1. Pen Tool anchor/handle dragging ---
        if (penDragging && (currentPenPath || selectedPenPath)) {
            var pathObj = currentPenPath || selectedPenPath;
            var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            var pt = penDragging.point;
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
                var x = svgCoords.x - penDragging.offsetX;
                var y = svgCoords.y - penDragging.offsetY;
                if (e.shiftKey) {
                    var dx = x - pt.x;
                    var dy = y - pt.y;
                    var angle = Math.atan2(dy, dx);
                    var length_2 = Math.sqrt(dx * dx + dy * dy);
                    var snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                    x = pt.x + Math.cos(snapAngle) * length_2;
                    y = pt.y + Math.sin(snapAngle) * length_2;
                }
                pt.handleIn = { x: x, y: y };
                if (!e.altKey) {
                    var dx = pt.x - pt.handleIn.x, dy = pt.y - pt.handleIn.y;
                    pt.handleOut = { x: pt.x + dx, y: pt.y + dy };
                }
            }
            else if (penDragging.type === 'handleOut') {
                var x = svgCoords.x - penDragging.offsetX;
                var y = svgCoords.y - penDragging.offsetY;
                if (e.shiftKey) {
                    var dx = x - pt.x;
                    var dy = y - pt.y;
                    var angle = Math.atan2(dy, dx);
                    var length_3 = Math.sqrt(dx * dx + dy * dy);
                    var snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                    x = pt.x + Math.cos(snapAngle) * length_3;
                    y = pt.y + Math.sin(snapAngle) * length_3;
                }
                pt.handleOut = { x: x, y: y };
                if (typeof pt._dragStart !== 'undefined') {
                    if (!e.altKey) {
                        var dx = pt.x - pt.handleOut.x, dy = pt.y - pt.handleOut.y;
                        pt.handleIn = { x: pt.x + dx, y: pt.y + dy };
                    }
                }
                else if (!e.altKey) {
                    var dx = pt.x - pt.handleOut.x, dy = pt.y - pt.handleOut.y;
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
            designerSVG.style.cursor = 'grab';
            // Extract current translation and rotation (with center)
            var transform = dragTarget.getAttribute('transform') || '';
            var transMatch = /translate\(([^,]+),([^)]+)\)/.exec(transform);
            var rotMatch = /rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/.exec(transform);
            var prevTx = 0, prevTy = 0;
            if (transMatch) {
                prevTx = parseFloat(transMatch[1]);
                prevTy = parseFloat(transMatch[2]);
            }
            var angle = 0, rotCx = 0, rotCy = 0;
            if (rotMatch) {
                angle = parseFloat(rotMatch[1]);
                rotCx = parseFloat(rotMatch[2]);
                rotCy = parseFloat(rotMatch[3]);
            }
            // Calculate mouse movement in screen coords
            var dx = e.clientX - dragStart.x;
            var dy = e.clientY - dragStart.y;
            // Project movement into the rotated coordinate system
            var tx = dragStart.tx, ty = dragStart.ty;
            if (angle !== 0) {
                var rad = angle * Math.PI / 180;
                var localDx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
                var localDy = dx * Math.sin(-rad) + dy * Math.cos(-rad);
                tx = dragStart.tx + localDx;
                ty = dragStart.ty + localDy;
            }
            else {
                tx = dragStart.tx + dx;
                ty = dragStart.ty + dy;
            }
            // Rebuild transform string, preserving rotation center
            var rotPart = '';
            if (rotMatch) {
                rotPart = " rotate(".concat(angle, " ").concat(rotCx, " ").concat(rotCy, ")");
            }
            dragTarget.setAttribute('transform', "translate(".concat(tx, ",").concat(ty, ")").concat(rotPart));
            // Update handle for rectangles
            var rect = dragTarget.querySelector('rect');
            if (rect)
                showResizeHandle(rect);
        }
        else {
            designerSVG.style.cursor = 'click';
        }
        // --- 3. Preview logic ---
        if (penMode && !penDragging && currentPenPath) {
            var lastPt = currentPenPath.points[currentPenPath.points.length - 1];
            if (!lastPt)
                return;
            var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            penPreviewLine === null || penPreviewLine === void 0 ? void 0 : penPreviewLine.remove();
            penPreviewHandle === null || penPreviewHandle === void 0 ? void 0 : penPreviewHandle.remove();
            if (e.shiftKey) {
                var dx = svgCoords.x - lastPt.x;
                var dy = svgCoords.y - lastPt.y;
                var angle = Math.atan2(dy, dx);
                var length_4 = Math.sqrt(dx * dx + dy * dy);
                var snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                svgCoords = {
                    x: lastPt.x + Math.cos(snapAngle) * length_4,
                    y: lastPt.y + Math.sin(snapAngle) * length_4
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
            var firstPt = currentPenPath.points[0];
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
            var dx = (e.clientX - designerPanStart.x) * (designerPanW / designerSVG.clientWidth);
            var dy = (e.clientY - designerPanStart.y) * (designerPanH / designerSVG.clientHeight);
            designerPanX -= dx;
            designerPanY -= dy;
            designerPanStart = { x: e.clientX, y: e.clientY };
            setDesignerZoom(designerZoomLevel);
            return;
        }
        // --- 5. User SVG panning ---
        if (isPanning) {
            var dx = (e.clientX - panStart.x) * (panW / seatSVG.clientWidth);
            var dy = (e.clientY - panStart.y) * (panH / seatSVG.clientHeight);
            panX -= dx;
            panY -= dy;
            panStart = { x: e.clientX, y: e.clientY };
            clampPan();
            seatSVG.setAttribute('viewBox', "".concat(panX, " ").concat(panY, " ").concat(panW, " ").concat(panH));
            return;
        }
        // --- 6. Path dragging ---
        if (isPathDragging && selectedPenPath) {
            var dx = e.clientX - pathDragStart.x;
            var dy = e.clientY - pathDragStart.y;
            pathDragStart = { x: e.clientX, y: e.clientY };
            // Convert dx/dy from screen to SVG coordinates
            var svgCoords1 = getSVGCoords(designerSVG, 0, 0);
            var svgCoords2 = getSVGCoords(designerSVG, dx, dy);
            var deltaX = svgCoords2.x - svgCoords1.x;
            var deltaY = svgCoords2.y - svgCoords1.y;
            for (var _i = 0, _h = selectedPenPath.points; _i < _h.length; _i++) {
                var pt = _h[_i];
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
                var svgCoords1 = getSVGCoords(designerSVG, shapeDragStart.x, shapeDragStart.y);
                var svgCoords2 = getSVGCoords(designerSVG, e.clientX, e.clientY);
                var dx = svgCoords2.x - svgCoords1.x;
                var dy = svgCoords2.y - svgCoords1.y;
                selectedShape.setAttribute('cx', (shapeDragStart.origX + dx).toString());
                selectedShape.setAttribute('cy', (shapeDragStart.origY + dy).toString());
                if ((_g = selectedShape._resizeHandles) === null || _g === void 0 ? void 0 : _g[0]) {
                    var updateHandle = selectedShape._resizeHandles[0].__updateHandle;
                    if (updateHandle)
                        updateHandle();
                }
                return;
            }
        }
    });
    // --- Pen Tool Mouse Up (End Drag) ---
    var isResizing = false;
    window.addEventListener('mouseup', function () {
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
        if (penDragging && penDragging.type === 'handleOut' && penDragging.point._dragStart) {
            var pt = penDragging.point;
            var dx = pt.handleOut ? pt.handleOut.x - pt.x : 0;
            var dy = pt.handleOut ? pt.handleOut.y - pt.y : 0;
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
    designerSVG.addEventListener('mouseleave', function () {
        penPreviewLine === null || penPreviewLine === void 0 ? void 0 : penPreviewLine.remove();
        penPreviewHandle === null || penPreviewHandle === void 0 ? void 0 : penPreviewHandle.remove();
        designerSVG.style.cursor = '';
    });
    // --- Undo/Redo ---
    window.addEventListener('keydown', function (e) {
        var _a, _b, _c, _d, _e, _f;
        if (!penMode || !currentPenPath)
            return;
        // Remove last anchor point (and handles) with Backspace/Delete or Ctrl+Z
        if (e.key === "Backspace" ||
            e.key === "Delete" ||
            ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z")) {
            e.preventDefault();
            var pt = currentPenPath.points.pop();
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
    function finishPenPath(close) {
        if (close === void 0) { close = false; }
        if (!currentPenPath)
            return;
        if (close && currentPenPath.points.length > 1) {
            currentPenPath.closed = true;
            updatePenPath(currentPenPath, true); // Hide handles by default
        }
        currentPenPath.points.forEach(function (pt) {
            var _a, _b, _c;
            (_a = pt.anchorCircle) === null || _a === void 0 ? void 0 : _a.setAttribute('fill', 'rgba(0,0,0,0)');
            (_b = pt.handleInCircle) === null || _b === void 0 ? void 0 : _b.setAttribute('fill', '#bbb');
            (_c = pt.handleOutCircle) === null || _c === void 0 ? void 0 : _c.setAttribute('fill', '#bbb');
        });
        finishedPenPaths.push(currentPenPath);
        currentPenPath.path.style.cursor = 'pointer';
        var thisPath = currentPenPath;
        currentPenPath.path.addEventListener('click', function () {
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
        // Dragging logic
        path.path.onmousedown = function (e) {
            if (!selectedPenPath)
                return;
            isPathDragging = true;
            pathDragStart = { x: e.clientX, y: e.clientY };
            e.stopPropagation();
        };
    }
    // --- Update Path & Handles ---
    function updatePenPath(pathObj, hideHandles) {
        var _a, _b, _c, _d, _e, _f;
        if (hideHandles === void 0) { hideHandles = false; }
        for (var _i = 0, _g = pathObj.points; _i < _g.length; _i++) {
            var pt = _g[_i];
            (_a = pt.handleLineIn) === null || _a === void 0 ? void 0 : _a.remove();
            (_b = pt.handleLineOut) === null || _b === void 0 ? void 0 : _b.remove();
            (_c = pt.handleInCircle) === null || _c === void 0 ? void 0 : _c.remove();
            (_d = pt.handleOutCircle) === null || _d === void 0 ? void 0 : _d.remove();
            (_e = pt.anchorCircle) === null || _e === void 0 ? void 0 : _e.remove();
            (_f = pt.anchorDot) === null || _f === void 0 ? void 0 : _f.remove();
            pt.handleLineIn = pt.handleLineOut = pt.handleInCircle = pt.handleOutCircle = undefined;
        }
        for (var i = 0; i < pathObj.points.length; i++) {
            var pt = pathObj.points[i];
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
        var d = '';
        for (var i = 0; i < pathObj.points.length; i++) {
            var pt = pathObj.points[i];
            if (i === 0) {
                d += "M ".concat(pt.x, " ").concat(pt.y);
            }
            else {
                var prev = pathObj.points[i - 1];
                var c1 = prev.handleOut || prev;
                var c2 = pt.handleIn || pt;
                d += " C ".concat(c1.x, " ").concat(c1.y, " ").concat(c2.x, " ").concat(c2.y, " ").concat(pt.x, " ").concat(pt.y);
            }
        }
        if (pathObj.closed) {
            // Close with a cubic segment to the first point
            var last = pathObj.points[pathObj.points.length - 1];
            var first = pathObj.points[0];
            var c1 = last.handleOut || last;
            var c2 = first.handleIn || first;
            d += " C ".concat(c1.x, " ").concat(c1.y, " ").concat(c2.x, " ").concat(c2.y, " ").concat(first.x, " ").concat(first.y, " Z");
        }
        pathObj.path.setAttribute('d', d);
    }
    // Rotate selected path around its center
    function rotateSelectedPath(angleDeg) {
        if (!selectedPenPath)
            return;
        // Find center of path
        var points = selectedPenPath.points;
        if (points.length === 0)
            return;
        var cx = points.reduce(function (sum, pt) { return sum + pt.x; }, 0) / points.length;
        var cy = points.reduce(function (sum, pt) { return sum + pt.y; }, 0) / points.length;
        var angleRad = angleDeg * Math.PI / 180;
        for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
            var pt = points_1[_i];
            // Rotate anchor
            var dx = pt.x - cx;
            var dy = pt.y - cy;
            pt.x = cx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
            pt.y = cy + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
            // Rotate handles if present
            if (pt.handleIn) {
                var hdx = pt.handleIn.x - cx;
                var hdy = pt.handleIn.y - cy;
                pt.handleIn.x = cx + hdx * Math.cos(angleRad) - hdy * Math.sin(angleRad);
                pt.handleIn.y = cy + hdx * Math.sin(angleRad) + hdy * Math.cos(angleRad);
            }
            if (pt.handleOut) {
                var hdx = pt.handleOut.x - cx;
                var hdy = pt.handleOut.y - cy;
                pt.handleOut.x = cx + hdx * Math.cos(angleRad) - hdy * Math.sin(angleRad);
                pt.handleOut.y = cy + hdx * Math.sin(angleRad) + hdy * Math.cos(angleRad);
            }
        }
        updatePenPath(selectedPenPath, false);
    }
    rotateLeftBtn.addEventListener('click', function () { return rotateSelectedPath(-90); });
    rotateRightBtn.addEventListener('click', function () { return rotateSelectedPath(90); });
    function selectRect(rect) {
        if (selectedRect && selectedRect !== rect) {
            selectedRect.setAttribute('stroke', '#000');
        }
        selectedRect = rect;
        rect.setAttribute('stroke', '#f44336');
        rect.removeAttribute('transform'); // Ensure no transform on rect itself
        showResizeHandle(rect);
    }
    // Rectangle Rotation Logic
    function rotateSelectedRect(angleDeg) {
        if (!selectedRect)
            return;
        var group = selectedRect.parentNode;
        // Get group center (rect center in group coordinates)
        var x = parseFloat(selectedRect.getAttribute('x') || '0');
        var y = parseFloat(selectedRect.getAttribute('y') || '0');
        var w = parseFloat(selectedRect.getAttribute('width') || '0');
        var h = parseFloat(selectedRect.getAttribute('height') || '0');
        var cx = x + w / 2;
        var cy = y + h / 2;
        // Get current rotation
        var prev = group.getAttribute('transform') || '';
        var prevAngle = 0;
        var prevTrans = '';
        var rotMatch = /rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/.exec(prev);
        var transMatch = /translate\(([^,]+),([^)]+)\)/.exec(prev);
        if (rotMatch)
            prevAngle = parseFloat(rotMatch[1]);
        if (transMatch)
            prevTrans = "translate(".concat(transMatch[1], ",").concat(transMatch[2], ") ");
        var newAngle = prevAngle + angleDeg;
        group.setAttribute('transform', "".concat(prevTrans, "rotate(").concat(newAngle, " ").concat(cx, " ").concat(cy, ")"));
        showResizeHandle(selectedRect);
    }
    rotateLeftBtn.addEventListener('click', function () {
        if (selectedPenPath)
            rotateSelectedPath(-45);
        else if (selectedRect)
            rotateSelectedRect(-45);
    });
    rotateRightBtn.addEventListener('click', function () {
        if (selectedPenPath)
            rotateSelectedPath(45);
        else if (selectedRect)
            rotateSelectedRect(45);
    });
    // --- Zoom Logic ---
    function setUserZoom(zoom, centerX, centerY) {
        userZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoom));
        var newW = viewW / userZoomLevel;
        var newH = viewH / userZoomLevel;
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
                var relX = (centerX - panX) / panW;
                var relY = (centerY - panY) / panH;
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
        seatSVG.setAttribute('viewBox', "".concat(panX, " ").concat(panY, " ").concat(panW, " ").concat(panH));
    }
    // --- Pan Logic ---
    var isPanning = false;
    var panStart = { x: 0, y: 0 };
    seatSVG.addEventListener('mousedown', function (e) {
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
    var lastTouchDist = 0;
    seatSVG.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
            isPanning = true;
            panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        else if (e.touches.length === 2) {
            isPanning = false;
            lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
    });
    seatSVG.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (e.touches.length === 1 && isPanning) {
            var dx = (e.touches[0].clientX - panStart.x) * (panW / seatSVG.clientWidth);
            var dy = (e.touches[0].clientY - panStart.y) * (panH / seatSVG.clientHeight);
            panX -= dx;
            panY -= dy;
            panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            clampPan();
            seatSVG.setAttribute('viewBox', "".concat(panX, " ").concat(panY, " ").concat(panW, " ").concat(panH));
        }
        else if (e.touches.length === 2) {
            var dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            if (lastTouchDist) {
                var zoomChange = dist / lastTouchDist;
                setUserZoom(userZoomLevel * zoomChange);
            }
            lastTouchDist = dist;
        }
    }, { passive: false });
    seatSVG.addEventListener('touchend', function () {
        isPanning = false;
        lastTouchDist = 0;
    });
    // --- Mouse Wheel & Touchpad Zoom ---
    seatSVG.addEventListener('wheel', function (e) {
        e.preventDefault();
        var direction = e.deltaY < 0 ? 1 : -1;
        var circle = seatSVG.getBoundingClientRect();
        var mouseX = ((e.clientX - circle.left) / circle.width) * panW + panX;
        var mouseY = ((e.clientY - circle.top) / circle.height) * panH + panY;
        setUserZoom(userZoomLevel + direction * zoomStep, mouseX, mouseY);
    }, { passive: false });
    // --- Reset Button ---
    zoomResetBtn.addEventListener('click', function () {
        panX = viewX;
        panY = viewY;
        panW = viewW;
        panH = viewH;
        setUserZoom(1);
    });
    // --- Utility Functions ---
    function updateSavedLayoutsDropdown() {
        savedLayoutsDropdown.innerHTML = '<option value="">Select Saved Layout</option>';
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && (key.startsWith('seatLayout_') || key.startsWith('designerLayout_'))) {
                var name_1 = key.replace('seatLayout_', '').replace('designerLayout_', '[Designer] ');
                var option = document.createElement('option');
                option.value = key;
                option.textContent = name_1;
                savedLayoutsDropdown.appendChild(option);
            }
        }
    }
    function updateUI() {
        selectedDisplay.textContent = "Selected Seats: ".concat(__spreadArray([], selectedSeats, true).join(', ') || 'None');
        totalDisplay.textContent = "Total: \u20B9".concat(selectedSeats.size * pricePerSeat);
        if (seatMapType === 'svg') {
            var seatCircles = seatSVG.querySelectorAll('circle[data-seat-id]');
            seatCircles.forEach(function (circle, idx) {
                var seatCircle = circle;
                var seatId = seatCircle.getAttribute('data-seat-id') || "".concat(idx);
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
        var layoutName = prompt(promptMsg);
        if (!layoutName)
            return;
        localStorage.setItem(prefix + layoutName, svg.outerHTML);
        updateSavedLayoutsDropdown();
        alert('Layout saved!');
    }
    // Usage:
    function saveLayoutHandler(svg, promptMsg, prefix) {
        return function () { return saveLayout(svg, promptMsg, prefix); };
    }
    saveDesignerLayoutBtn.addEventListener('click', saveLayoutHandler(designerSVG, "Enter a name for this designer layout:", 'seatLayout_'));
    saveUploadedLayoutBtn.addEventListener('click', saveLayoutHandler(seatSVG, "Enter a name for this uploaded layout:", 'seatLayout_'));
    saveLayoutBtn.addEventListener('click', saveLayoutHandler(seatSVG, "Enter a name for this layout:", 'seatLayout_'));
    // --- Role Toggle ---
    roleSelect.addEventListener('change', function () {
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
        var gap = 10;
        var totalWidth = cols * (seatSize + gap);
        var totalHeight = rows * (seatSize + gap);
        seatSVG.setAttribute("viewBox", "0 0 ".concat(totalWidth, " ").concat(totalHeight));
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var seatId = String.fromCharCode(65 + r) + (c + 1);
                var x = c * (seatSize + gap);
                var y = r * (seatSize + gap);
                var circle = document.createElementNS(svgNS, 'circle');
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
    createSeatsBtn.addEventListener('click', function () {
        seatMapType = 'grid';
        var rows = parseInt(rowInput.value);
        var cols = parseInt(colInput.value);
        var seatSize = parseInt(seatSizeInput.value);
        selectedSeats.clear();
        seatSVG.innerHTML = '';
        generateSVGSeats(rows, cols, seatSize);
        updateUI();
    });
    // --- SVG Upload Logic ---
    svgUpload.addEventListener('change', function (event) {
        seatMapType = 'svg';
        var input = event.target;
        var file = input.files && input.files[0];
        if (!file)
            return;
        var reader = new FileReader();
        reader.onload = function (e) {
            var _a;
            seatSVG.innerHTML = '';
            lastSVGString = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            var parser = new DOMParser();
            var svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
            var importedSVG = svgDoc.documentElement;
            ['width', 'height', 'viewBox'].forEach(function (attr) {
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
        var ids = new Set();
        var circles = svg.querySelectorAll('circle[data-seat-id]');
        var counter = 1;
        circles.forEach(function (circle) {
            var _a;
            var id = (_a = circle.getAttribute('data-seat-id')) === null || _a === void 0 ? void 0 : _a.trim();
            if (!id || ids.has(id.toLowerCase())) {
                // Assign a new unique ID
                while (ids.has("seat".concat(counter).toLowerCase()))
                    counter++;
                id = "Seat".concat(counter);
                circle.setAttribute('data-seat-id', id);
            }
            ids.add(id.toLowerCase());
        });
    }
    function countAvailableSeats() {
        var seatCircles = seatSVG.querySelectorAll('circle[data-seat-id]');
        var count = 0;
        seatCircles.forEach(function (circle) {
            var seatId = circle.getAttribute('data-seat-id');
            // Only count if seatId is non-empty and not occupied
            if (seatId && seatId.trim() !== '' && !occupiedSeats.has(seatId))
                count++;
        });
        return count;
    }
    loadLayoutBtn.addEventListener('click', function () {
        seatMapType = 'svg';
        var key = savedLayoutsDropdown.value;
        if (!key)
            return;
        lastSVGString = localStorage.getItem(key) || "";
        var parser = new DOMParser();
        var svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
        var importedSVG = svgDoc.documentElement;
        ['width', 'height', 'viewBox'].forEach(function (attr) {
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
    deleteLayoutBtn.addEventListener('click', function () {
        var key = savedLayoutsDropdown.value;
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
    seatSVG.addEventListener('click', function (e) {
        var target = e.target;
        if (target.tagName === 'circle' &&
            target.hasAttribute('data-seat-id') &&
            !occupiedSeats.has(target.getAttribute('data-seat-id'))) {
            var seatId = target.getAttribute('data-seat-id');
            toggleSVGSeat(seatId, target);
        }
    });
    // --- Seat Selection Logic ---
    function attachSVGSeatListeners() {
        var seatCircles = seatSVG.querySelectorAll('circle');
        seatCircles.forEach(function (circle, idx) {
            var seatCircle = circle;
            var seatId = seatCircle.getAttribute('data-seat-id') || "".concat(idx);
            var radius = parseFloat(seatCircle.getAttribute('r') || "0");
            var cx = seatCircle.hasAttribute('cx') ? parseFloat(seatCircle.getAttribute('cx') || "0") : undefined;
            var cy = seatCircle.hasAttribute('cy') ? parseFloat(seatCircle.getAttribute('cy') || "0") : undefined;
            if (cx === undefined || cy === undefined) {
                var bbox = seatCircle.getBBox();
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
        var availableSeats = countAvailableSeats();
        var input = prompt("How many seats do you want to select? (Available: ".concat(availableSeats, ")"));
        if (!input) {
            maxSelectableSeats = null;
            alert("Please enter a number to proceed.");
            return false;
        }
        var num = parseInt(input);
        if (isNaN(num) || num <= 0) {
            maxSelectableSeats = null;
            alert("Please enter a valid positive number.");
            return false;
        }
        if (num > availableSeats) {
            maxSelectableSeats = null;
            alert("Only ".concat(availableSeats, " seats are available. Please enter a lower number."));
            return false;
        }
        maxSelectableSeats = num;
        selectedSeats.clear();
        updateUI();
        alert("You can now select up to ".concat(maxSelectableSeats, " seats."));
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
                alert("You can only select up to ".concat(maxSelectableSeats, " seats."));
                return;
            }
            selectedSeats.add(seatId);
            circle.setAttribute('fill', '#4caf50');
        }
        updateUI();
    }
    // --- Booking Logic ---
    confirmBtn.addEventListener('click', function () {
        if (selectedSeats.size === 0) {
            alert("No seats selected.");
            return;
        }
        var seatsList = __spreadArray([], selectedSeats, true).join(', ');
        var total = selectedSeats.size * pricePerSeat;
        alert("Booking confirmed!\nSeats: ".concat(seatsList, "\nTotal: \u20B9").concat(total));
        selectedSeats.forEach(function (seatId) {
            occupiedSeats.add(seatId);
        });
        selectedSeats.clear();
        seatSVG.innerHTML = '';
        if (seatMapType === 'grid') {
            generateSVGSeats(parseInt(rowInput.value), parseInt(colInput.value), parseInt(seatSizeInput.value));
        }
        else if (seatMapType === 'svg') {
            var parser = new DOMParser();
            var svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
            var importedSVG_1 = svgDoc.documentElement;
            ['width', 'height', 'viewBox'].forEach(function (attr) {
                if (importedSVG_1.hasAttribute(attr)) {
                    seatSVG.setAttribute(attr, importedSVG_1.getAttribute(attr) || "");
                }
                else {
                    seatSVG.removeAttribute(attr);
                }
            });
            seatSVG.innerHTML = importedSVG_1.innerHTML;
            attachSVGSeatListeners();
        }
        maxSelectableSeats = null;
        updateUI();
    });
    // --- Reset Selection Button ---
    var resetBtn = document.createElement('button');
    resetBtn.textContent = "Reset Selection";
    resetBtn.onclick = function () {
        maxSelectableSeats = null;
        selectedSeats.clear();
        updateUI();
        alert("Selection reset. Please select how many seats you want again.");
    };
    userPanel.appendChild(resetBtn);
    function getNextAvailableDesignerSeatId() {
        // Collect all used numbers from data-seat-id attributes
        var usedNumbers = new Set();
        var circles = designerSVG.querySelectorAll('circle');
        circles.forEach(function (circle) {
            var id = circle.getAttribute('data-seat-id');
            if (id && /^Seat\d+$/.test(id)) {
                var num = parseInt(id.replace('Seat', ''), 10);
                if (!isNaN(num))
                    usedNumbers.add(num);
            }
        });
        // Find the lowest unused number
        var next = 1;
        while (usedNumbers.has(next))
            next++;
        return "Seat".concat(next);
    }
    function getSVGCoords(svg, clientX, clientY) {
        var pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        var ctm = svg.getScreenCTM();
        if (ctm) {
            return pt.matrixTransform(ctm.inverse());
        }
        return { x: clientX, y: clientY };
    }
    // --- Designer Logic ---
    var dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
    function makeDraggable(group) {
        group.addEventListener('mousedown', function (e) {
            justDragged = false;
            if (roleSelect.value !== 'admin')
                return;
            dragTarget = group;
            var transform = group.getAttribute('transform') || '';
            var match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
            dragStart = {
                x: e.clientX,
                y: e.clientY,
                tx: match ? parseFloat(match[1]) : 0,
                ty: match ? parseFloat(match[2]) : 0
            };
            e.stopPropagation();
        });
    }
    designerSVG.addEventListener('mouseup', function () {
        if (dragTarget) {
            justDragged = true;
        }
        dragTarget = null;
    });
    designerSVG.addEventListener('mouseleave', function () {
        if (dragTarget) {
            justDragged = true;
        }
        dragTarget = null;
    });
    if (designerSVG && roleSelect.value === 'admin') {
        addSeatBtn.addEventListener('click', function () {
            addMode = !addMode;
            addSeatBtn.textContent = addMode ? "Adding... (Click SVG)" : "Add Seat";
            addSeatBtn.style.background = addMode ? "#4caf50" : "";
        });
        designerSVG.addEventListener('click', function (e) {
            // --- Deselect on SVG background click ---
            if (!penMode && e.target === designerSVG && selectedPenPath) {
                updatePenPath(selectedPenPath, true);
                selectedPenPath.path.setAttribute('stroke', '#000');
                selectedPenPath = null;
            }
            if (e.target === designerSVG && selectedRect) {
                selectedRect.setAttribute('stroke', '#000');
                selectedRect = null;
            }
            // --- Handle shape drawing ---
            if (shapeMode === 'rect' && e.target === designerSVG) {
                var svgCoords_1 = getSVGCoords(designerSVG, e.clientX, e.clientY);
                var rect = document.createElementNS(svgNS, 'rect');
                rect.setAttribute('x', (svgCoords_1.x - 40).toString());
                rect.setAttribute('y', (svgCoords_1.y - 30).toString());
                rect.setAttribute('width', '80');
                rect.setAttribute('height', '60');
                rect.setAttribute('stroke', '#000');
                rect.setAttribute('stroke-width', '2');
                rect.setAttribute('fill', 'none');
                var group_2 = document.createElementNS(svgNS, 'g');
                group_2.appendChild(rect);
                designerSVG.appendChild(group_2);
                makeDraggable(group_2);
                makeShapeInteractive(rect);
                showResizeHandle(rect);
                shapeMode = 'none';
                addRectBtn.style.background = "";
            }
            else if (shapeMode === 'circle' && e.target === designerSVG) {
                var svgCoords_2 = getSVGCoords(designerSVG, e.clientX, e.clientY);
                var circle_1 = document.createElementNS(svgNS, 'circle');
                circle_1.setAttribute('cx', svgCoords_2.x.toString());
                circle_1.setAttribute('cy', svgCoords_2.y.toString());
                circle_1.setAttribute('r', '40');
                circle_1.setAttribute('stroke', '#000');
                circle_1.setAttribute('stroke-width', '2');
                circle_1.setAttribute('fill', 'none');
                circle_1.style.cursor = 'grab';
                designerSVG.appendChild(circle_1);
                makeShapeInteractive(circle_1);
                shapeMode = 'none';
                addCircleBtn.style.background = "";
            }
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
            var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            var circle = document.createElementNS(svgNS, 'circle');
            var group = document.createElementNS(svgNS, 'g');
            circle.setAttribute('cx', svgCoords.x.toString());
            circle.setAttribute('cy', svgCoords.y.toString());
            circle.setAttribute('r', '7');
            circle.setAttribute('fill', '#49D44B');
            circle.setAttribute('stroke', '#222');
            circle.setAttribute('data-seat-id', getNextAvailableDesignerSeatId());
            circle.style.cursor = 'pointer';
            circle.setAttribute('pointer-events', 'all');
            circle.addEventListener('click', function (evt) {
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
    updateSeatIdBtn.addEventListener('click', function () {
        var _a;
        if (selectedDesignerSeat) {
            var newId = seatIdInput.value.trim();
            if (!newId) {
                alert('Seat ID cannot be empty.');
                return;
            }
            // Check for duplicate ID (case-insensitive, trimmed)
            var circles = designerSVG.querySelectorAll('circle');
            for (var _i = 0, _b = Array.from(circles); _i < _b.length; _i++) {
                var circle = _b[_i];
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
    deleteSeatBtn.addEventListener('click', function () {
        if (selectedDesignerSeat && designerSVG) {
            var group = selectedDesignerSeat.parentNode;
            designerSVG.removeChild(group);
            selectedDesignerSeat = null;
            seatIdInput.value = '';
        }
    });
})();
