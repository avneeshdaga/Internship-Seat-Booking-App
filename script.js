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
    // Rotation 
    var rotationHandle = null;
    var rotatingGroup = null;
    var rotationOrigin = { cx: 0, cy: 0 };
    var startAngle = 0;
    var startMouseAngle = 0;
    var isRotating = false;
    var justRotated = false;
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
    // Show rotation handle next to the seat
    function showRotationHandle(rect) {
        if (rotationHandle) {
            rotationHandle.remove();
            rotationHandle = null;
        }
        var group = rect.parentNode;
        // Get seat center in local group coordinates
        var x = parseFloat(rect.getAttribute('x') || "0");
        var y = parseFloat(rect.getAttribute('y') || "0");
        var w = parseFloat(rect.getAttribute('width') || "0");
        var h = parseFloat(rect.getAttribute('height') || "0");
        var localCx = x + w / 2;
        var localCy = y + h / 2;
        // Get seat center in SVG coordinates (for handle position)
        var cx = localCx, cy = localCy;
        var ctm = group.getCTM();
        if (ctm) {
            var pt = designerSVG.createSVGPoint();
            pt.x = localCx;
            pt.y = localCy;
            var svgPt = pt.matrixTransform(ctm);
            cx = svgPt.x;
            cy = svgPt.y;
        }
        // Get current group rotation in degrees
        var transform = group.getAttribute('transform') || '';
        var match = /rotate\((-?\d+(\.\d+)?)/.exec(transform);
        var angle = match ? parseFloat(match[1]) : 0;
        var rad = (angle * Math.PI) / 180;
        // Offset: 25px at 45° from the seat center, rotated with the seat
        var offset = 25;
        var baseAngle = Math.PI / 4; // 45 degrees
        var handleX = cx + offset * Math.cos(baseAngle + rad);
        var handleY = cy + offset * Math.sin(baseAngle + rad);
        rotationHandle = document.createElementNS(svgNS, 'circle');
        rotationHandle.setAttribute('cx', handleX.toString());
        rotationHandle.setAttribute('cy', handleY.toString());
        rotationHandle.setAttribute('r', '3');
        rotationHandle.setAttribute('fill', '#000');
        rotationHandle.style.cursor = 'pointer';
        designerSVG.appendChild(rotationHandle);
        rotationHandle.onmousedown = function (e) {
            e.stopPropagation();
            rotatingGroup = group;
            // Use local coordinates for rotation center!
            rotationOrigin = { cx: localCx, cy: localCy };
            // Get current group rotation
            var transform = group.getAttribute('transform') || '';
            var match = /rotate\((-?\d+(\.\d+)?)/.exec(transform);
            startAngle = match ? parseFloat(match[1]) : 0;
            // Mouse angle from center (in SVG coordinates)
            var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            startMouseAngle = Math.atan2(svgCoords.y - cy, svgCoords.x - cx) * 180 / Math.PI;
            document.body.style.cursor = 'crosshair';
        };
    }
    // Listen for mousemove/mouseup on window for rotation
    window.addEventListener('mousemove', function (e) {
        if (rotatingGroup) {
            // Get local center for rotation
            var rect = rotatingGroup.querySelector('rect');
            if (!rect)
                return;
            var x = parseFloat(rect.getAttribute('x') || "0");
            var y = parseFloat(rect.getAttribute('y') || "0");
            var w = parseFloat(rect.getAttribute('width') || "0");
            var h = parseFloat(rect.getAttribute('height') || "0");
            var localCx = x + w / 2;
            var localCy = y + h / 2;
            // Get seat center in SVG coordinates (for mouse angle and handle)
            var cx = localCx, cy = localCy;
            var ctm = rotatingGroup.getCTM();
            if (ctm) {
                var pt = designerSVG.createSVGPoint();
                pt.x = localCx;
                pt.y = localCy;
                var svgPt = pt.matrixTransform(ctm);
                cx = svgPt.x;
                cy = svgPt.y;
            }
            var svgCoords = getSVGCoords(designerSVG, e.clientX, e.clientY);
            var mouseAngle = Math.atan2(svgCoords.y - cy, svgCoords.x - cx) * 180 / Math.PI;
            var newAngle = startAngle + (mouseAngle - startMouseAngle);
            newAngle = ((newAngle % 360) + 360) % 360;
            // Keep any translation
            var transform = rotatingGroup.getAttribute('transform') || '';
            var transMatch = /translate\(([^,]+),([^)]+)\)/.exec(transform);
            var transPart = '';
            if (transMatch)
                transPart = "translate(".concat(transMatch[1], ",").concat(transMatch[2], ") ");
            rotatingGroup.setAttribute('transform', "".concat(transPart, "rotate(").concat(newAngle, " ").concat(localCx, " ").concat(localCy, ")"));
            // Move handle visually (in SVG coordinates)
            if (rotationHandle) {
                var rad = (newAngle * Math.PI) / 180;
                var offset = 25;
                var baseAngle = Math.PI / 4;
                rotationHandle.setAttribute('cx', (cx + offset * Math.cos(baseAngle + rad)).toString());
                rotationHandle.setAttribute('cy', (cy + offset * Math.sin(baseAngle + rad)).toString());
            }
        }
    });
    window.addEventListener('mouseup', function () {
        if (rotatingGroup) {
            rotatingGroup = null;
            document.body.style.cursor = '';
        }
    });
    // --- Original View ---
    var originalViewBox = seatSVG.getAttribute('viewBox');
    if (!originalViewBox) {
        originalViewBox = "0 0 ".concat(seatSVG.width.baseVal.value, " ").concat(seatSVG.height.baseVal.value);
        seatSVG.setAttribute('viewBox', originalViewBox);
    }
    var _a = originalViewBox.split(' ').map(Number), viewX = _a[0], viewY = _a[1], viewW = _a[2], viewH = _a[3];
    var panX = viewX, panY = viewY, panW = viewW, panH = viewH;
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
                var zoomRatio = newW / panW;
                panX = centerX - (centerX - panX) * zoomRatio;
                panY = centerY - (centerY - panY) * zoomRatio;
            }
            panW = newW;
            panH = newH;
            clampPan();
        }
        seatSVG.setAttribute('viewBox', "".concat(panX, " ").concat(panY, " ").concat(panW, " ").concat(panH));
    }
    // --- Pan Logic ---
    var isPanning = false;
    var panStart = { x: 0, y: 0 };
    seatSVG.addEventListener('mousedown', function (e) {
        if (e.target.tagName === 'rect')
            return;
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        seatSVG.style.cursor = 'grab';
    });
    window.addEventListener('mousemove', function (e) {
        if (!isPanning)
            return;
        var dx = (e.clientX - panStart.x) * (panW / seatSVG.clientWidth);
        var dy = (e.clientY - panStart.y) * (panH / seatSVG.clientHeight);
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
        if (e.touches.length === 1 && isPanning) {
            var dx = (e.touches[0].clientX - panStart.x) * (panW / seatSVG.clientWidth);
            var dy = (e.touches[0].clientY - panStart.y) * (panH / seatSVG.clientHeight);
            panX -= dx;
            panY -= dy;
            panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            setUserZoom(userZoomLevel); // Always use setUserZoom to update viewBox and clamp
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
        var rect = seatSVG.getBoundingClientRect();
        var mouseX = ((e.clientX - rect.left) / rect.width) * panW + panX;
        var mouseY = ((e.clientY - rect.top) / rect.height) * panH + panY;
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
            var seatRects = seatSVG.querySelectorAll('rect');
            seatRects.forEach(function (rect, idx) {
                var seatRect = rect;
                var seatId = seatRect.getAttribute('data-seat-id') || "".concat(idx);
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
                var rect = document.createElementNS(svgNS, 'rect');
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
        var rects = svg.querySelectorAll('rect');
        var counter = 1;
        rects.forEach(function (rect) {
            var _a;
            var id = (_a = rect.getAttribute('data-seat-id')) === null || _a === void 0 ? void 0 : _a.trim();
            if (!id || ids.has(id.toLowerCase())) {
                // Assign a new unique ID
                while (ids.has("seat".concat(counter).toLowerCase()))
                    counter++;
                id = "Seat".concat(counter);
                rect.setAttribute('data-seat-id', id);
            }
            ids.add(id.toLowerCase());
        });
    }
    function countAvailableSeats() {
        var seatRects = seatSVG.querySelectorAll('rect');
        var count = 0;
        seatRects.forEach(function (rect) {
            var seatId = rect.getAttribute('data-seat-id');
            if (seatId && !occupiedSeats.has(seatId))
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
        if (target.tagName === 'rect' &&
            target.hasAttribute('data-seat-id') &&
            !occupiedSeats.has(target.getAttribute('data-seat-id'))) {
            var seatId = target.getAttribute('data-seat-id');
            toggleSVGSeat(seatId, target);
        }
    });
    // --- Seat Selection Logic ---
    function attachSVGSeatListeners() {
        var seatRects = seatSVG.querySelectorAll('rect');
        seatRects.forEach(function (rect, idx) {
            var seatRect = rect;
            var seatId = seatRect.getAttribute('data-seat-id') || "".concat(idx);
            var width = parseFloat(seatRect.getAttribute('width') || "0");
            var height = parseFloat(seatRect.getAttribute('height') || "0");
            var x = seatRect.hasAttribute('x') ? parseFloat(seatRect.getAttribute('x') || "0") : undefined;
            var y = seatRect.hasAttribute('y') ? parseFloat(seatRect.getAttribute('y') || "0") : undefined;
            if (x === undefined || y === undefined) {
                var bbox = seatRect.getBBox();
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
                alert("You can only select up to ".concat(maxSelectableSeats, " seats."));
                return;
            }
            selectedSeats.add(seatId);
            rect.setAttribute('fill', '#4caf50');
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
        var rects = designerSVG.querySelectorAll('rect');
        rects.forEach(function (rect) {
            var id = rect.getAttribute('data-seat-id');
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
            if (isRotating)
                return;
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
    designerSVG.addEventListener('mousemove', function (e) {
        if (dragTarget && roleSelect.value === 'admin') {
            var dx = e.clientX - dragStart.x;
            var dy = e.clientY - dragStart.y;
            var tx = dragStart.tx + dx;
            var ty = dragStart.ty + dy;
            // Keep any rotation
            var transform = dragTarget.getAttribute('transform') || '';
            var rotMatch = /rotate\(([^)]+)\)/.exec(transform);
            var rotPart = '';
            if (rotMatch)
                rotPart = " rotate(".concat(rotMatch[1], ")");
            dragTarget.setAttribute('transform', "translate(".concat(tx, ",").concat(ty, ")").concat(rotPart));
            // Move handle visually
            if (selectedDesignerSeat && selectedDesignerSeat.parentNode === dragTarget) {
                showRotationHandle(selectedDesignerSeat);
            }
        }
    });
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
            var rect = document.createElementNS(svgNS, 'rect');
            var group = document.createElementNS(svgNS, 'g');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', '0');
            rect.setAttribute('width', '20');
            rect.setAttribute('height', '15');
            rect.setAttribute('fill', '#49D44B');
            rect.setAttribute('stroke', '#222');
            rect.setAttribute('data-seat-id', getNextAvailableDesignerSeatId());
            rect.style.cursor = 'pointer';
            rect.addEventListener('click', function (evt) {
                evt.stopPropagation();
                selectDesignerSeat(rect);
            });
            group.appendChild(rect);
            group.setAttribute('transform', "translate(".concat(e.offsetX, ",").concat(e.offsetY, ")"));
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
    updateSeatIdBtn.addEventListener('click', function () {
        var _a;
        if (selectedDesignerSeat) {
            var newId = seatIdInput.value.trim();
            if (!newId) {
                alert('Seat ID cannot be empty.');
                return;
            }
            // Check for duplicate ID (case-insensitive, trimmed)
            var rects = designerSVG.querySelectorAll('rect');
            for (var _i = 0, _b = Array.from(rects); _i < _b.length; _i++) {
                var rect = _b[_i];
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
    deleteSeatBtn.addEventListener('click', function () {
        if (selectedDesignerSeat && designerSVG) {
            var group = selectedDesignerSeat.parentNode;
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
