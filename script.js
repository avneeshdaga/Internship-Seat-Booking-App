var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    var addCircleBtn = document.getElementById('addCircleBtn');
    var addRectBtn = document.getElementById('addRectBtn');
    var addTextBtn = document.getElementById('addTextBtn');
    var importBgImage = document.getElementById('importBgImage');
    var toggleBgImageBtn = document.getElementById('toggleBgImageBtn');
    var textEditInput = document.getElementById('textEditInput');
    var textSizeSlider = document.getElementById('textSizeSlider');
    var textSizeValue = document.getElementById('textSizeValue');
    var allSeatSizeSlider = document.getElementById('allSeatSizeSlider');
    var allSeatSizeValue = document.getElementById('allSeatSizeValue');
    var shapeWidthSlider = document.getElementById('shapeWidthSlider');
    var shapeWidthValue = document.getElementById('shapeWidthValue');
    var shapeWidthLabel = document.getElementById('shapeWidthLabel');
    var shapeColorInput = document.getElementById('shapeColorInput');
    var shapeColorLabel = document.getElementById('shapeColorLabel');
    var textColorInput = document.getElementById('textColorInput');
    var textColorLabel = document.getElementById('textColorLabel');
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
    var isShapeDragging = false;
    var rectMode = false;
    var selectedRectPath = null;
    var isRectPathDragging = false;
    var rectPathDragStart = { x: 0, y: 0, points: [] };
    var textMode = false;
    var bgImageEl = null;
    var bgImageVisible = true;
    var justSelectedTextBox = false;
    var selectedTextGroup = null;
    var selectedText = null;
    var selectedTextRect = null;
    var selectedCirclePath = null;
    // --- Designer SVG Pan Logic ---  
    designerSVG.addEventListener('mousedown', function (e) {
        // Only pan if not clicking on a shape/handle
        if (e.target !== designerSVG ||
            penMode ||
            isShapeDragging ||
            isRectPathDragging ||
            isPathDragging ||
            dragTarget)
            return;
        isDesignerPanning = true;
        designerPanStart = { x: e.clientX, y: e.clientY };
        designerSVG.style.cursor = 'grab';
    });
    function rgbToHex(rgb) {
        if (rgb.startsWith('#'))
            return rgb;
        var result = rgb.match(/\d+/g);
        if (!result)
            return '#000000';
        return ('#' +
            result
                .slice(0, 3)
                .map(function (x) { return ('0' + parseInt(x).toString(16)).slice(-2); })
                .join(''));
    }
    function showShapeColorInput(path) {
        var color = path.getAttribute('stroke') || '#000000';
        shapeColorInput.value = color.startsWith('#') ? color : '#000000';
        shapeColorLabel.style.display = '';
    }
    function hideShapeColorInput() {
        shapeColorLabel.style.display = 'none';
    }
    function showShapeWidthSlider(path) {
        var width = path.getAttribute('data-stroke-width') || path.getAttribute('stroke-width') || '2';
        shapeWidthSlider.value = width;
        shapeWidthValue.textContent = width;
        shapeWidthLabel.style.display = '';
    }
    function hideShapeWidthSlider() {
        shapeWidthLabel.style.display = 'none';
    }
    function selectCirclePath(path) {
        if (selectedCirclePath && selectedCirclePath !== path) {
            var prev = selectedCirclePath.getAttribute('data-prev-stroke') || '#000';
            selectedCirclePath.setAttribute('stroke', prev);
        }
        path.setAttribute('data-prev-stroke', path.getAttribute('stroke') || '#000');
        selectedCirclePath = path;
        path.setAttribute('stroke', '#f44336');
        showShapeWidthSlider(path);
        showShapeColorInput(path);
    }
    shapeColorInput.addEventListener('input', function () {
        var path = null;
        if (selectedPenPath)
            path = selectedPenPath.path;
        else if (selectedRectPath)
            path = selectedRectPath;
        else if (selectedCirclePath)
            path = selectedCirclePath;
        var color = shapeColorInput.value;
        if (path) {
            path.setAttribute('data-prev-stroke', color); // Store for deselect
        }
    });
    shapeWidthSlider.addEventListener('input', function () {
        var path = null;
        var strokeWidth = parseInt(shapeWidthSlider.value, 10);
        if (selectedPenPath)
            path = selectedPenPath.path;
        else if (selectedRectPath)
            path = selectedRectPath;
        else if (selectedCirclePath)
            path = selectedCirclePath;
        if (path) {
            path.setAttribute('stroke-width', shapeWidthSlider.value);
            path.setAttribute('data-stroke-width', shapeWidthSlider.value);
            shapeWidthValue.textContent = shapeWidthSlider.value;
            //  Update handle sizes for rect/circle 
            if (selectedRectPath && selectedRectPath._resizeHandle) {
                var handle = selectedRectPath._resizeHandle;
                var newR = Math.max(3, Math.round(strokeWidth));
                handle.setAttribute('r', newR.toString());
            }
            if (selectedCirclePath) {
                // Find the resize handle 
                var handles = Array.from(designerSVG.querySelectorAll('circle'));
                handles.forEach(function (handle) {
                    if (handle.style.cursor === 'ew-resize') {
                        var newR = Math.max(3, Math.round(strokeWidth));
                        handle.setAttribute('r', newR.toString());
                    }
                });
            }
            //  Update anchor handles for pen path 
            if (selectedPenPath) {
                for (var _i = 0, _a = selectedPenPath.points; _i < _a.length; _i++) {
                    var pt = _a[_i];
                    if (pt.anchorCircle) {
                        var newR = Math.max(3, Math.round(strokeWidth));
                        pt.anchorCircle.setAttribute('r', newR.toString());
                    }
                }
            }
        }
    });
    allSeatSizeSlider.addEventListener('input', function () {
        var newSize = parseInt(allSeatSizeSlider.value, 10);
        allSeatSizeValue.textContent = newSize.toString();
        // Update all seat circles in seatSVG
        var seatCircles = seatSVG.querySelectorAll('circle[data-seat-id]');
        seatCircles.forEach(function (circle) {
            circle.setAttribute('r', (newSize).toString());
        });
        // Update all seat circles in designerSVG (designer side)
        var designerCircles = designerSVG.querySelectorAll('circle[data-seat-id]');
        designerCircles.forEach(function (circle) {
            circle.setAttribute('r', (newSize).toString());
        });
    });
    window.addEventListener('mousemove', function (e) {
        if (isDesignerPanning) {
            var dx = (e.clientX - designerPanStart.x) * (designerPanW / designerSVG.clientWidth);
            var dy = (e.clientY - designerPanStart.y) * (designerPanH / designerSVG.clientHeight);
            designerPanX -= dx;
            designerPanY -= dy;
            designerPanStart = { x: e.clientX, y: e.clientY };
            clampDesignerPan();
            setDesignerZoom(designerZoomLevel);
        }
    });
    window.addEventListener('mouseup', function () {
        isDesignerPanning = false;
        designerSVG.style.cursor = '';
    });
    // Touch support for designer SVG
    var lastDesignerTouchDist = 0;
    designerSVG.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
            isDesignerPanning = true;
            designerPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        else if (e.touches.length === 2) {
            isDesignerPanning = false;
            lastDesignerTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
    });
    designerSVG.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (e.touches.length === 1 && isDesignerPanning) {
            var dx = (e.touches[0].clientX - designerPanStart.x) * (designerPanW / designerSVG.clientWidth);
            var dy = (e.touches[0].clientY - designerPanStart.y) * (designerPanH / designerSVG.clientHeight);
            designerPanX -= dx;
            designerPanY -= dy;
            designerPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            clampDesignerPan();
            setDesignerZoom(designerZoomLevel);
        }
        else if (e.touches.length === 2) {
            var dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            if (lastDesignerTouchDist) {
                var zoomChange = dist / lastDesignerTouchDist;
                setDesignerZoom(designerZoomLevel * zoomChange);
            }
            lastDesignerTouchDist = dist;
        }
    }, { passive: false });
    designerSVG.addEventListener('touchend', function () {
        isDesignerPanning = false;
        lastDesignerTouchDist = 0;
    });
    importBgImage.addEventListener('change', function (event) {
        var file = importBgImage.files && importBgImage.files[0];
        if (!file)
            return;
        var reader = new FileReader();
        reader.onload = function (e) {
            var _a, _b;
            // Remove old image if present
            if (bgImageEl && bgImageEl.parentNode) {
                bgImageEl.parentNode.removeChild(bgImageEl);
            }
            bgImageEl = document.createElementNS(svgNS, 'image');
            bgImageEl.setAttribute('href', (_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
            bgImageEl.setAttribute('opacity', '0.4'); // Translucent
            bgImageEl.style.pointerEvents = 'none'; // Don't block interaction
            // Get SVG size (from viewBox or width/height)
            var svgW = designerSVG.viewBox.baseVal.width || designerSVG.width.baseVal.value;
            var svgH = designerSVG.viewBox.baseVal.height || designerSVG.height.baseVal.value;
            // Create a JS Image to get natural size
            var img = new window.Image();
            img.onload = function () {
                var imgW = img.naturalWidth;
                var imgH = img.naturalHeight;
                // Calculate scale to fit image inside SVG
                var scale = Math.min(svgW / imgW, svgH / imgH);
                var newW = imgW * scale;
                var newH = imgH * scale;
                var x = (svgW - newW) / 2;
                var y = (svgH - newH) / 2;
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
            img.src = (_b = e.target) === null || _b === void 0 ? void 0 : _b.result;
        };
        reader.readAsDataURL(file);
    });
    toggleBgImageBtn.addEventListener('click', function () {
        if (!bgImageEl)
            return;
        bgImageVisible = !bgImageVisible;
        bgImageEl.style.display = bgImageVisible ? '' : 'none';
        toggleBgImageBtn.textContent = bgImageVisible ? "Hide Background" : "Show Background";
    });
    addTextBtn.addEventListener('click', function () {
        textMode = !textMode;
        addTextBtn.style.background = textMode ? "#4caf50" : "";
    });
    addRectBtn.addEventListener('click', function () {
        rectMode = !rectMode;
        addRectBtn.style.background = rectMode ? "#4caf50" : "";
    });
    addCircleBtn.addEventListener('click', function () {
        shapeMode = shapeMode === 'circle' ? 'none' : 'circle';
        addCircleBtn.style.background = shapeMode === 'circle' ? "#4caf50" : "";
    });
    designerZoomResetBtn.addEventListener('click', function () {
        designerPanX = designerViewX;
        designerPanY = designerViewY;
        designerPanW = designerViewW;
        designerPanH = designerViewH;
        setDesignerZoom(1);
    });
    designerSVG.addEventListener('mouseup', function () {
        dragTarget = null;
    });
    function addRectResizeHandle(path) {
        // Remove old handle if any
        if (path._resizeHandle) {
            path._resizeHandle.remove();
        }
        // Get points (bottom right is points[2])
        var points = path._rectPoints;
        var handle = document.createElementNS(svgNS, 'circle');
        handle.setAttribute('r', '3');
        handle.setAttribute('fill', '#000');
        handle.style.cursor = 'nwse-resize';
        designerSVG.appendChild(handle);
        // Helper to update handle position
        function updateHandle() {
            // Find the point with the largest x+y (visual bottom-right)
            var idx = 0;
            var maxSum = -Infinity;
            for (var i = 0; i < points.length; i++) {
                var sum = points[i].x + points[i].y;
                if (sum > maxSum) {
                    maxSum = sum;
                    idx = i;
                }
            }
            handle.setAttribute('cx', points[idx].x.toString());
            handle.setAttribute('cy', points[idx].y.toString());
            handle.cornerIdx = idx; // Store index for resizing
        }
        updateHandle();
        // Store for later updates
        path._resizeHandle = handle;
        handle._updateHandle = updateHandle;
        // --- Resize logic ---
        var isResizing = false;
        var startPt = { x: 0, y: 0 };
        var origPt = { x: 0, y: 0 };
        var origOppPt = { x: 0, y: 0 };
        var anchorIdx = 0, handleIdx = 0;
        handle.addEventListener('mousedown', function (e) {
            e.stopPropagation();
            isResizing = true;
            startPt = getSVGCoords(designerSVG, e.clientX, e.clientY);
            // Find anchor (top-left) and handle (bottom-right) once at the start
            var minSum = Infinity, maxSum = -Infinity;
            for (var i = 0; i < points.length; i++) {
                var sum = points[i].x + points[i].y;
                if (sum < minSum) {
                    minSum = sum;
                    anchorIdx = i;
                }
                if (sum > maxSum) {
                    maxSum = sum;
                    handleIdx = i;
                }
            }
            handle._anchorIdx = anchorIdx;
            handle._handleIdx = handleIdx;
            origPt = __assign({}, points[handleIdx]);
            origOppPt = __assign({}, points[anchorIdx]); // anchor is the fixed point
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        });
        function onMove(e) {
            if (!isResizing)
                return;
            var curr = getSVGCoords(designerSVG, e.clientX, e.clientY);
            var points = path._rectPoints;
            var anchorIdx = handle._anchorIdx;
            var handleIdx = handle._handleIdx;
            var adj1 = (anchorIdx + 1) % 4;
            var adj2 = (anchorIdx + 3) % 4;
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
    function rotateSelectedRectPath(angleDeg) {
        if (!selectedRectPath)
            return;
        var points = selectedRectPath._rectPoints;
        // Find center
        var cx = points.reduce(function (sum, pt) { return sum + pt.x; }, 0) / 4;
        var cy = points.reduce(function (sum, pt) { return sum + pt.y; }, 0) / 4;
        var angleRad = angleDeg * Math.PI / 180;
        // Update points IN PLACE
        for (var i = 0; i < points.length; i++) {
            var pt = points[i];
            var dx = pt.x - cx, dy = pt.y - cy;
            pt.x = cx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
            pt.y = cy + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
        }
        updateRectPath(selectedRectPath, points);
        selectedRectPath.setAttribute('stroke', '#f44336'); // keep red 
    }
    // Attach to your rotate buttons:
    rotateLeftBtn.addEventListener('click', function () {
        if (selectedRectPath)
            rotateSelectedRectPath(-90);
    });
    rotateRightBtn.addEventListener('click', function () {
        if (selectedRectPath)
            rotateSelectedRectPath(90);
    });
    function selectRectPath(path) {
        if (selectedRectPath && selectedRectPath !== path) {
            // Restore previous color on deselect
            var prev = selectedRectPath.getAttribute('data-prev-stroke') || '#000';
            selectedRectPath.setAttribute('stroke', prev);
        }
        // Store current color before highlighting
        path.setAttribute('data-prev-stroke', path.getAttribute('stroke') || '#000');
        selectedRectPath = path;
        path.setAttribute('stroke', '#f44336');
        showShapeWidthSlider(path);
        showShapeColorInput(path);
    }
    function makeRectPathInteractive(path) {
        // Select on click
        path.addEventListener('click', function (e) {
            e.stopPropagation();
            selectRectPath(path);
        });
        showShapeWidthSlider(path);
        showShapeColorInput(path);
        // Drag on mousedown
        path.addEventListener('mousedown', function (e) {
            if (roleSelect.value !== 'admin')
                return;
            if (selectedRectPath !== path)
                return;
            isRectPathDragging = true;
            rectPathDragStart.x = e.clientX;
            rectPathDragStart.y = e.clientY;
            // Deep copy points
            rectPathDragStart.points = path._rectPoints.map(function (pt) { return (__assign({}, pt)); });
            e.stopPropagation();
        });
    }
    // Drag logic (in your window mousemove handler)
    window.addEventListener('mousemove', function (e) {
        if (isRectPathDragging && selectedRectPath) {
            var svgCoords1 = getSVGCoords(designerSVG, rectPathDragStart.x, rectPathDragStart.y);
            var svgCoords2 = getSVGCoords(designerSVG, e.clientX, e.clientY);
            var dx = svgCoords2.x - svgCoords1.x;
            var dy = svgCoords2.y - svgCoords1.y;
            var origPoints = rectPathDragStart.points;
            // Instead of creating a new array, update the existing one:
            var points = selectedRectPath._rectPoints;
            for (var i = 0; i < points.length; i++) {
                points[i].x = origPoints[i].x + dx;
                points[i].y = origPoints[i].y + dy;
            }
            updateRectPath(selectedRectPath, points);
        }
    });
    window.addEventListener('mouseup', function () {
        isRectPathDragging = false;
    });
    // Update path "d" from points
    function updateRectPath(path, points) {
        var d = "M ".concat(points[0].x, " ").concat(points[0].y, " L ").concat(points[1].x, " ").concat(points[1].y, " L ").concat(points[2].x, " ").concat(points[2].y, " L ").concat(points[3].x, " ").concat(points[3].y, " Z");
        path.setAttribute('d', d);
        // Update handle if present
        if (path._resizeHandle) {
            path._resizeHandle._updateHandle();
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
        // --- Keep text visually constant size ---
        var texts = designerSVG.querySelectorAll('text');
        texts.forEach(function (text) {
            var baseFontSize = parseFloat(text.getAttribute('data-base-font-size') || '18');
            text.setAttribute('font-size', (baseFontSize / designerZoomLevel) + 'px');
            // --- Update rect for each text ---
            var rect = text.previousElementSibling;
            if (rect && rect.tagName === 'rect') {
                var bb = text.getBBox();
                var cx = parseFloat(text.getAttribute('x') || '0');
                var cy = parseFloat(text.getAttribute('y') || '0');
                rect.setAttribute('x', (cx - bb.width / 2 - 8).toString());
                rect.setAttribute('y', (cy - bb.height / 2 - 4).toString());
                rect.setAttribute('width', (bb.width + 16).toString());
                rect.setAttribute('height', (bb.height + 8).toString());
            }
        });
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
                    selectPenPath(selectedPenPath);
                    penDragging = { point: pt, type: 'anchor', offsetX: svgCoords.x - pt.x, offsetY: svgCoords.y - pt.y };
                    return;
                }
                if (e.target === pt.handleInCircle) {
                    selectPenPath(selectedPenPath);
                    penDragging = { point: pt, type: 'handleIn', offsetX: svgCoords.x - ((_k = (_j = pt.handleIn) === null || _j === void 0 ? void 0 : _j.x) !== null && _k !== void 0 ? _k : pt.x), offsetY: svgCoords.y - ((_m = (_l = pt.handleIn) === null || _l === void 0 ? void 0 : _l.y) !== null && _m !== void 0 ? _m : pt.y) };
                    return;
                }
                if (e.target === pt.handleOutCircle) {
                    selectPenPath(selectedPenPath);
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
        var _a, _b, _c, _d, _e, _f;
        // --- 1. Pen Tool anchor/handle dragging ---
        if (penDragging && (currentPenPath || selectedPenPath)) {
            var pathObj = currentPenPath || selectedPenPath;
            // --- Ensure selectedPenPath is set for finished paths ---
            if (!penMode && pathObj && selectedPenPath !== pathObj) {
                selectedPenPath = pathObj;
            }
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
            // Only handle seat group dragging (not shapes/paths)
            var circle = dragTarget.querySelector('circle[data-seat-id]');
            if (circle) {
                // Get current mouse SVG coordinates
                var currSVG = getSVGCoords(designerSVG, e.clientX, e.clientY);
                // Calculate delta in SVG space
                var dx = currSVG.x - dragStart.x;
                var dy = currSVG.y - dragStart.y;
                // Update seat center
                circle.setAttribute('cx', (dragStart.tx + dx).toString());
                circle.setAttribute('cy', (dragStart.ty + dy).toString());
            }
            return;
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
            for (var _i = 0, _g = selectedPenPath.points; _i < _g.length; _i++) {
                var pt = _g[_i];
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
    });
    // --- Pen Tool Mouse Up (End Drag) ---
    var isResizing = false;
    window.addEventListener('mouseup', function () {
        // --- End all drag/rotate states ---
        isResizing = false;
        isShapeDragging = false;
        isPathDragging = false;
        isDesignerPanning = false;
        penDragging = null;
        designerSVG.style.cursor = '';
        isPanning = false;
        seatSVG.style.cursor = '';
        // Restore rect path color after drag if not selected
        if (!isRectPathDragging && selectedRectPath) {
            var prev = selectedRectPath.getAttribute('data-prev-stroke') || '#000';
            selectedRectPath.setAttribute('stroke', prev);
        }
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
            updatePenPath(selectedPenPath, true);
        }
        // do not update data-prev-stroke here
        selectedPenPath = path;
        updatePenPath(path, false); // Show handles
        // Dragging logic
        path.path.onmousedown = function (e) {
            if (!selectedPenPath)
                return;
            isPathDragging = true;
            pathDragStart = { x: e.clientX, y: e.clientY };
            e.stopPropagation();
        };
        showShapeWidthSlider(path.path);
        showShapeColorInput(path.path);
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
        // Pen path color logic: always red when selected and handles are visible, otherwise user color
        if (selectedPenPath && pathObj === selectedPenPath && !hideHandles) {
            pathObj.path.setAttribute('stroke', '#f44336');
        }
        else {
            var prev = pathObj.path.getAttribute('data-prev-stroke') || '#000';
            pathObj.path.setAttribute('stroke', prev);
        }
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
    rotateLeftBtn.addEventListener('click', function () { return rotateSelectedPath(-45); });
    rotateRightBtn.addEventListener('click', function () { return rotateSelectedPath(45); });
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
        // --- Keep text visually constant size on user side ---
        var texts = seatSVG.querySelectorAll('text');
        texts.forEach(function (text) {
            // Use data-base-font-size if available, else fallback to font-size or 18
            var baseFontSize = parseFloat(text.getAttribute('data-base-font-size') || text.getAttribute('font-size') || '18');
            text.setAttribute('font-size', (baseFontSize / userZoomLevel) + 'px');
            // --- Update rect for each text (centered) ---
            var rect = text.previousElementSibling;
            if (rect && rect.tagName === 'rect') {
                var bb = text.getBBox();
                var cx = parseFloat(text.getAttribute('x') || '0');
                var cy = parseFloat(text.getAttribute('y') || '0');
                rect.setAttribute('x', (cx - bb.width / 2 - 8).toString());
                rect.setAttribute('y', (cy - bb.height / 2 - 4).toString());
                rect.setAttribute('width', (bb.width + 16).toString());
                rect.setAttribute('height', (bb.height + 8).toString());
            }
        });
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
                if (seatCircle.hasAttribute('data-seat-id')) {
                    if (occupiedSeats.has(seatId)) {
                        seatCircle.setAttribute('fill', '#d32f2f');
                    }
                    else if (selectedSeats.has(seatId)) {
                        seatCircle.setAttribute('fill', '#4caf50');
                    }
                    else {
                        seatCircle.setAttribute('fill', '#e0e0e0'); // grey for available seats
                    }
                }
                else {
                    seatCircle.setAttribute('fill', 'none'); // no fill for drawn circles
                }
            });
        }
    }
    // Save current SVG layout
    function saveLayout(svg, promptMsg, prefix) {
        var layoutName = prompt(promptMsg);
        if (!layoutName)
            return;
        // --- Remove background image before saving ---
        var removedBgImage = null;
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
            if (seatCircle.hasAttribute('data-seat-id')) {
                if (!occupiedSeats.has(seatId)) {
                    seatCircle.setAttribute('fill', '#e0e0e0');
                }
                else {
                    seatCircle.setAttribute('fill', '#d32f2f');
                }
                seatCircle.style.cursor = 'pointer';
            }
            else {
                seatCircle.setAttribute('fill', 'none'); // no fill for drawn circles
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
    // Used for text interaction state in designer SVG
    var justInteractedWithText = false;
    function makeDraggable(group) {
        group.addEventListener('mousedown', function (e) {
            justDragged = false;
            if (roleSelect.value !== 'admin')
                return;
            dragTarget = group;
            // Find the seat circle inside the group
            var circle = group.querySelector('circle[data-seat-id]');
            // Store SVG coordinates of mouse and seat center at drag start
            var startSVG = getSVGCoords(designerSVG, e.clientX, e.clientY);
            var origCx = parseFloat(circle.getAttribute('cx') || '0');
            var origCy = parseFloat(circle.getAttribute('cy') || '0');
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
                selectedPenPath = null;
                hideShapeWidthSlider();
                hideShapeColorInput();
            }
            if (e.target === designerSVG && selectedRectPath) {
                var prev = selectedRectPath.getAttribute('data-prev-stroke') || '#000';
                selectedRectPath.setAttribute('stroke', prev);
                selectedRectPath = null;
                hideShapeWidthSlider();
                hideShapeColorInput();
            }
            if (e.target === designerSVG && selectedCirclePath) {
                var prev = selectedCirclePath.getAttribute('data-prev-stroke') || '#000';
                selectedCirclePath.setAttribute('stroke', prev);
                selectedCirclePath = null;
                hideShapeWidthSlider();
                hideShapeColorInput();
            }
            if (addMode && e.target === designerSVG) {
                // Add a new seat at the clicked position
                var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
                var seatId = getNextAvailableDesignerSeatId();
                var seatSize = parseInt(allSeatSizeSlider.value, 10);
                // Create a group for the seat
                var group = document.createElementNS(svgNS, 'g');
                // Create the seat circle
                var circle_1 = document.createElementNS(svgNS, 'circle');
                circle_1.setAttribute('cx', svgCoords.x.toString());
                circle_1.setAttribute('cy', svgCoords.y.toString());
                circle_1.setAttribute('r', seatSize.toString());
                circle_1.setAttribute('fill', '#49D44B');
                circle_1.setAttribute('stroke', '#222');
                circle_1.setAttribute('data-seat-id', seatId);
                circle_1.style.cursor = 'pointer';
                group.appendChild(circle_1);
                designerSVG.appendChild(group);
                makeDraggable(group);
                selectDesignerSeat(circle_1);
                circle_1.addEventListener('click', function (e) {
                    e.stopPropagation();
                    selectDesignerSeat(circle_1);
                });
            }
            // --- Handle shape drawing ---
            if (shapeMode === 'circle' && e.target === designerSVG) {
                var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
                var cx_1 = svgCoords.x;
                var cy_1 = svgCoords.y;
                var rx_1 = 40;
                var ry_1 = 40;
                // Create circle as a path
                var circlePath_1 = document.createElementNS(svgNS, 'path');
                circlePath_1.setAttribute('stroke', '#000');
                circlePath_1.setAttribute('stroke-width', '2');
                circlePath_1.setAttribute('fill', 'none');
                circlePath_1.style.cursor = 'pointer';
                // Helper to update path "d" for circle
                function updateCirclePath() {
                    var d = "\n            M ".concat(cx_1 - rx_1, ",").concat(cy_1, "\n            a ").concat(rx_1, ",").concat(ry_1, " 0 1,0 ").concat(2 * rx_1, ",0\n            a ").concat(rx_1, ",").concat(ry_1, " 0 1,0 ").concat(-2 * rx_1, ",0\n          ");
                    circlePath_1.setAttribute('d', d);
                }
                updateCirclePath();
                designerSVG.appendChild(circlePath_1);
                circlePath_1.addEventListener('click', function (e) {
                    e.stopPropagation();
                    selectCirclePath(circlePath_1);
                });
                //  Center dot
                var centerDot_1 = document.createElementNS(svgNS, 'circle');
                centerDot_1.setAttribute('cx', cx_1.toString());
                centerDot_1.setAttribute('cy', cy_1.toString());
                centerDot_1.setAttribute('r', '2');
                centerDot_1.setAttribute('fill', '#000');
                centerDot_1.style.cursor = 'move';
                designerSVG.appendChild(centerDot_1);
                //  Drag logic (center dot) 
                centerDot_1.addEventListener('mousedown', function (e) {
                    var dragStart = getSVGCoords(designerSVG, e.clientX, e.clientY);
                    var origCx = cx_1, origCy = cy_1;
                    e.stopPropagation();
                    function onMove(ev) {
                        var curr = getSVGCoords(designerSVG, ev.clientX, ev.clientY);
                        cx_1 = origCx + (curr.x - dragStart.x);
                        cy_1 = origCy + (curr.y - dragStart.y);
                        centerDot_1.setAttribute('cx', cx_1.toString());
                        centerDot_1.setAttribute('cy', cy_1.toString());
                        updateCirclePath();
                        updateHandle();
                    }
                    function onUp() {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                    }
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                });
                // --- Resize logic (handle on right edge, always keeps a circle) ---
                var handle_1 = document.createElementNS(svgNS, 'circle');
                handle_1.setAttribute('r', '3');
                handle_1.setAttribute('fill', '#000');
                handle_1.style.cursor = 'ew-resize';
                designerSVG.appendChild(handle_1);
                function updateHandle() {
                    handle_1.setAttribute('cx', (cx_1 + rx_1).toString());
                    handle_1.setAttribute('cy', cy_1.toString());
                }
                updateHandle();
                handle_1.addEventListener('mousedown', function (e) {
                    var resizeStart = e.clientX;
                    var origR = rx_1; // Always keep rx == ry
                    e.stopPropagation();
                    function onMove(ev) {
                        var dx = ev.clientX - resizeStart;
                        var newR = Math.max(10, origR + dx);
                        rx_1 = newR;
                        ry_1 = newR; // Keep it a circle
                        updateCirclePath();
                        updateHandle();
                    }
                    function onUp() {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                    }
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                });
                shapeMode = 'none';
                addCircleBtn.style.background = "";
            }
            if (rectMode && e.target === designerSVG) {
                var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
                var w = 80, h = 60;
                var cx = svgCoords.x, cy = svgCoords.y;
                // Rectangle corners (clockwise from top-left)
                var points = [
                    { x: cx - w / 2, y: cy - h / 2 },
                    { x: cx + w / 2, y: cy - h / 2 },
                    { x: cx + w / 2, y: cy + h / 2 },
                    { x: cx - w / 2, y: cy + h / 2 }
                ];
                // Create path data
                var d = "M ".concat(points[0].x, " ").concat(points[0].y, " L ").concat(points[1].x, " ").concat(points[1].y, " L ").concat(points[2].x, " ").concat(points[2].y, " L ").concat(points[3].x, " ").concat(points[3].y, " Z");
                var path = document.createElementNS(svgNS, 'path');
                path.setAttribute('d', d);
                path.setAttribute('stroke', '#000');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('fill', 'none');
                path.style.cursor = 'pointer';
                designerSVG.appendChild(path);
                // Store points for manipulation BEFORE adding handle!
                path._rectPoints = points;
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
                var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
                // Create group for text and background
                var textGroup_1 = document.createElementNS(svgNS, 'g');
                // Create text element
                var text_1 = document.createElementNS(svgNS, 'text');
                text_1.setAttribute('x', svgCoords.x.toString());
                text_1.setAttribute('y', svgCoords.y.toString());
                text_1.setAttribute('font-size', '18');
                text_1.setAttribute('data-base-font-size', '18');
                text_1.setAttribute('fill', '#000');
                text_1.setAttribute('text-anchor', 'middle');
                text_1.setAttribute('dominant-baseline', 'middle');
                text_1.textContent = 'Edit text...';
                text_1.style.cursor = '';
                // Create a rect as a background/border for the text
                var rect_1 = document.createElementNS(svgNS, 'rect');
                rect_1.setAttribute('fill', 'rgba(0,0,0,0)');
                rect_1.setAttribute('stroke', 'none');
                rect_1.setAttribute('stroke-width', '2');
                rect_1.style.cursor = 'move';
                textGroup_1.appendChild(rect_1);
                textGroup_1.appendChild(text_1);
                designerSVG.appendChild(textGroup_1);
                // Update rect to fit text after rendering
                setTimeout(function () {
                    var bb = text_1.getBBox();
                    rect_1.setAttribute('x', (bb.x - 8).toString());
                    rect_1.setAttribute('y', (bb.y - 4).toString());
                    rect_1.setAttribute('width', (bb.width + 16).toString());
                    rect_1.setAttribute('height', (bb.height + 8).toString());
                });
                // --- Drag and Select Logic ---
                var isTextDragging_1 = false;
                var dragStart_1 = { x: 0, y: 0, origX: 0, origY: 0 };
                var dragTimeout_1 = null;
                var moved_1 = false;
                // Helper to select and show editor
                function selectTextBox() {
                    if (selectedTextRect) {
                        selectedTextRect.setAttribute('stroke', 'none');
                        selectedTextRect.setAttribute('stroke-dasharray', '');
                    }
                    selectedTextGroup = textGroup_1;
                    selectedText = text_1;
                    selectedTextRect = rect_1;
                    rect_1.setAttribute('stroke', '#888');
                    rect_1.setAttribute('stroke-width', '2');
                    textEditInput.style.display = '';
                    textEditInput.value = text_1.textContent || '';
                    textEditInput.focus();
                    textSizeSlider.style.display = '';
                    textSizeValue.style.display = '';
                    textSizeSlider.value = text_1.getAttribute('data-base-font-size') || '18';
                    textSizeValue.textContent = textSizeSlider.value;
                    // --- Show and sync text color input ---
                    textColorInput.value = rgbToHex(text_1.getAttribute('fill') || '#000');
                    textColorLabel.style.display = '';
                }
                // Click-hold-move to drag, click to select
                rect_1.addEventListener('mousedown', function (ev) {
                    ev.stopPropagation();
                    moved_1 = false;
                    justSelectedTextBox = true;
                    dragTimeout_1 = window.setTimeout(function () {
                        isTextDragging_1 = true;
                        dragStart_1.x = ev.clientX;
                        dragStart_1.y = ev.clientY;
                        dragStart_1.origX = parseFloat(text_1.getAttribute('x') || '0');
                        dragStart_1.origY = parseFloat(text_1.getAttribute('y') || '0');
                        moved_1 = true;
                    }, 120);
                    function onMove(moveEv) {
                        if (isTextDragging_1) {
                            var svgCoords1 = getSVGCoords(designerSVG, dragStart_1.x, dragStart_1.y);
                            var svgCoords2 = getSVGCoords(designerSVG, moveEv.clientX, moveEv.clientY);
                            var dx = svgCoords2.x - svgCoords1.x;
                            var dy = svgCoords2.y - svgCoords1.y;
                            var newX = dragStart_1.origX + dx;
                            var newY = dragStart_1.origY + dy;
                            text_1.setAttribute('x', newX.toString());
                            text_1.setAttribute('y', newY.toString());
                            var bb = text_1.getBBox();
                            rect_1.setAttribute('x', (bb.x - 8).toString());
                            rect_1.setAttribute('y', (bb.y - 4).toString());
                            rect_1.setAttribute('width', (bb.width + 16).toString());
                            rect_1.setAttribute('height', (bb.height + 8).toString());
                        }
                    }
                    function onUp() {
                        if (dragTimeout_1)
                            clearTimeout(dragTimeout_1);
                        if (!moved_1)
                            selectTextBox();
                        isTextDragging_1 = false;
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                    }
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                });
                // Also allow clicking on the text to select
                text_1.addEventListener('mousedown', function (ev) {
                    ev.stopPropagation();
                    justSelectedTextBox = true;
                    selectTextBox();
                });
                textColorInput.addEventListener('input', function () {
                    if (selectedText) {
                        selectedText.setAttribute('fill', textColorInput.value);
                    }
                });
                // Touch support (optional, similar logic)
                rect_1.addEventListener('touchstart', function (ev) {
                    ev.stopPropagation();
                    moved_1 = false;
                    justSelectedTextBox = true;
                    dragTimeout_1 = window.setTimeout(function () {
                        isTextDragging_1 = true;
                        var touch = ev.touches[0];
                        dragStart_1.x = touch.clientX;
                        dragStart_1.y = touch.clientY;
                        dragStart_1.origX = parseFloat(text_1.getAttribute('x') || '0');
                        dragStart_1.origY = parseFloat(text_1.getAttribute('y') || '0');
                        moved_1 = true;
                    }, 120);
                    function onMove(moveEv) {
                        if (isTextDragging_1) {
                            var touch = moveEv.touches[0];
                            var svgCoords1 = getSVGCoords(designerSVG, dragStart_1.x, dragStart_1.y);
                            var svgCoords2 = getSVGCoords(designerSVG, touch.clientX, touch.clientY);
                            var dx = svgCoords2.x - svgCoords1.x;
                            var dy = svgCoords2.y - svgCoords1.y;
                            var newX = dragStart_1.origX + dx;
                            var newY = dragStart_1.origY + dy;
                            text_1.setAttribute('x', newX.toString());
                            text_1.setAttribute('y', newY.toString());
                            var bb = text_1.getBBox();
                            rect_1.setAttribute('x', (bb.x - 8).toString());
                            rect_1.setAttribute('y', (bb.y - 4).toString());
                            rect_1.setAttribute('width', (bb.width + 16).toString());
                            rect_1.setAttribute('height', (bb.height + 8).toString());
                        }
                    }
                    function onUp() {
                        if (dragTimeout_1)
                            clearTimeout(dragTimeout_1);
                        if (!moved_1)
                            selectTextBox();
                        isTextDragging_1 = false;
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
            if (!textMode &&
                selectedTextRect &&
                e.target !== selectedTextRect &&
                e.target !== selectedText) {
                selectedTextRect.setAttribute('stroke', 'none');
                selectedTextRect.setAttribute('stroke-dasharray', '');
                selectedTextGroup = null;
                selectedText = null;
                selectedTextRect = null;
                textEditInput.style.display = 'none';
                textSizeSlider.style.display = 'none';
                textSizeValue.style.display = 'none';
                textColorLabel.style.display = 'none';
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
        });
    }
    // --- Designer Text Editing ---
    textEditInput.addEventListener('input', function () {
        if (selectedText && selectedTextRect) {
            selectedText.textContent = textEditInput.value;
            var bb = selectedText.getBBox();
            var cx = parseFloat(selectedText.getAttribute('x') || '0');
            var cy = parseFloat(selectedText.getAttribute('y') || '0');
            selectedTextRect.setAttribute('x', (cx - bb.width / 2 - 8).toString());
            selectedTextRect.setAttribute('y', (cy - bb.height / 2 - 4).toString());
            selectedTextRect.setAttribute('width', (bb.width + 16).toString());
            selectedTextRect.setAttribute('height', (bb.height + 8).toString());
        }
    });
    textSizeSlider.addEventListener('input', function () {
        if (selectedText && selectedTextRect) {
            var size = parseInt(textSizeSlider.value, 10);
            selectedText.setAttribute('font-size', size.toString());
            selectedText.setAttribute('data-base-font-size', size.toString());
            textSizeValue.textContent = size.toString();
            var bb = selectedText.getBBox();
            var cx = parseFloat(selectedText.getAttribute('x') || '0');
            var cy = parseFloat(selectedText.getAttribute('y') || '0');
            selectedTextRect.setAttribute('x', (cx - bb.width / 2 - 8).toString());
            selectedTextRect.setAttribute('y', (cy - bb.height / 2 - 4).toString());
            selectedTextRect.setAttribute('width', (bb.width + 16).toString());
            selectedTextRect.setAttribute('height', (bb.height + 8).toString());
        }
    });
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
