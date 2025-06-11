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
    var svgNS = "http://www.w3.org/2000/svg";
    var pricePerSeat = 200;
    var selectedSeats = new Set();
    var occupiedSeats = new Set();
    var seatMapType = 'grid'; // 'grid' or 'svg'
    var lastSVGString = ''; // Store last uploaded/loaded SVG string
    var roleSelect = document.getElementById('roleSelect');
    var adminPanel = document.getElementById('adminPanel');
    var userPanel = document.getElementById('userPanel');
    var rowInput = document.getElementById('rowInput');
    var colInput = document.getElementById('colInput');
    var createSeatsBtn = document.getElementById('createSeatsBtn');
    var seatSVG = document.getElementById('seatSVG');
    var selectedDisplay = document.getElementById('selected');
    var totalDisplay = document.getElementById('total');
    var confirmBtn = document.getElementById('confirmBtn');
    var svgUpload = document.getElementById('svgUpload');
    var saveLayoutBtn = document.getElementById('saveLayoutBtn');
    var savedLayoutsDropdown = document.getElementById('savedLayoutsDropdown');
    var loadLayoutBtn = document.getElementById('loadLayoutBtn');
    var seatSizeInput = document.getElementById('seatSizeInput');
    var deleteLayoutBtn = document.getElementById('deleteLayoutBtn');
    // Role toggle
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
    function attachSVGSeatListeners() {
        // Remove old text elements if needed
        //seatSVG.querySelectorAll('text').forEach(t => t.remove());
        var seatRects = seatSVG.querySelectorAll('rect');
        seatRects.forEach(function (rect, idx) {
            var seatRect = rect;
            var seatId = seatRect.getAttribute('data-seat-id') || "".concat(idx);
            var width = parseFloat(seatRect.getAttribute('width') || "0");
            var height = parseFloat(seatRect.getAttribute('height') || "0");
            // Try to get x/y from attributes, fallback to getBBox if missing
            var x = seatRect.hasAttribute('x') ? parseFloat(seatRect.getAttribute('x') || "0") : undefined;
            var y = seatRect.hasAttribute('y') ? parseFloat(seatRect.getAttribute('y') || "0") : undefined;
            if (x === undefined || y === undefined) {
                var bbox = seatRect.getBBox();
                x = bbox.x;
                y = bbox.y;
            }
            if (width < 50 && height < 50) {
                seatRect.style.cursor = 'pointer';
                if (!occupiedSeats.has(seatId)) {
                    seatRect.setAttribute('fill', '#e0e0e0');
                    seatRect.addEventListener('click', function () {
                        if (selectedSeats.has(seatId)) {
                            selectedSeats.delete(seatId);
                            seatRect.setAttribute('fill', '#e0e0e0');
                        }
                        else {
                            selectedSeats.add(seatId);
                            seatRect.setAttribute('fill', '#4caf50');
                        }
                        updateUI();
                    });
                }
                else {
                    seatRect.setAttribute('fill', '#d32f2f');
                }
                // --- Add seat ID as text if not already present ---
                // Check if a <text> element already exists at this position
                var existingText = Array.from(seatSVG.querySelectorAll('text')).find(function (t) {
                    return Math.abs(parseFloat(t.getAttribute('x') || "0") - (parseFloat(seatRect.getAttribute('x') || "0") + width / 2)) < 1 &&
                        Math.abs(parseFloat(t.getAttribute('y') || "0") - (parseFloat(seatRect.getAttribute('y') || "0") + height / 2 + 5)) < 1;
                });
                if (!existingText) {
                    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    text.setAttribute('x', (parseFloat(seatRect.getAttribute('x') || "0") + width / 2).toString());
                    text.setAttribute('y', (parseFloat(seatRect.getAttribute('y') || "0") + height / 2 + 5).toString());
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('fill', 'black');
                    text.setAttribute('pointer-events', 'none');
                    text.textContent = seatId;
                    seatSVG.appendChild(text);
                }
            }
            else {
                seatRect.setAttribute('fill', '#bdbdbd');
                seatRect.style.cursor = 'default';
            }
        });
    }
    svgUpload.addEventListener('change', function (event) {
        seatMapType = 'svg';
        var input = event.target;
        var file = input.files && input.files[0];
        if (!file)
            return;
        var SIZE_THRESHOLD = 50;
        var reader = new FileReader();
        reader.onload = function (e) {
            var _a;
            seatSVG.innerHTML = '';
            lastSVGString = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            var parser = new DOMParser();
            var svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
            var importedSVG = svgDoc.documentElement;
            // Copy SVG attributes for proper display
            ['width', 'height', 'viewBox'].forEach(function (attr) {
                if (importedSVG.hasAttribute(attr)) {
                    seatSVG.setAttribute(attr, importedSVG.getAttribute(attr) || "");
                }
                else {
                    seatSVG.removeAttribute(attr);
                }
            });
            // Import all children of the uploaded SVG into #seatSVG
            seatSVG.innerHTML = importedSVG.innerHTML;
            // Attach seat selection logic to each rect
            attachSVGSeatListeners();
            updateUI();
        };
        reader.readAsText(file);
    });
    // Save current SVG layout
    saveLayoutBtn.addEventListener('click', function () {
        var layoutName = prompt("Enter a name for this layout:");
        if (!layoutName)
            return;
        localStorage.setItem('seatLayout_' + layoutName, seatSVG.outerHTML);
        updateSavedLayoutsDropdown();
        alert('Layout saved!');
    });
    // Populate dropdown with saved layouts
    function updateSavedLayoutsDropdown() {
        savedLayoutsDropdown.innerHTML = '<option value="">Select Saved Layout</option>';
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && key.startsWith('seatLayout_')) {
                var name_1 = key.replace('seatLayout_', '');
                var option = document.createElement('option');
                option.value = key;
                option.textContent = name_1;
                savedLayoutsDropdown.appendChild(option);
            }
        }
    }
    // Load selected layout
    loadLayoutBtn.addEventListener('click', function () {
        seatMapType = 'svg';
        var key = savedLayoutsDropdown.value;
        if (!key)
            return;
        lastSVGString = localStorage.getItem(key) || "";
        // Parse the SVG string and insert it into seatSVG
        var parser = new DOMParser();
        var svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
        var importedSVG = svgDoc.documentElement;
        // Copy SVG attributes for proper display
        ['width', 'height', 'viewBox'].forEach(function (attr) {
            if (importedSVG.hasAttribute(attr)) {
                seatSVG.setAttribute(attr, importedSVG.getAttribute(attr) || "");
            }
            else {
                seatSVG.removeAttribute(attr);
            }
        });
        seatSVG.innerHTML = importedSVG.innerHTML;
        // Attach seat selection logic to each rect
        attachSVGSeatListeners();
        updateUI();
    });
    updateSavedLayoutsDropdown();
    // Admin creates seats
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
    // Generate SVG seat grid with seat IDs inside
    function generateSVGSeats(rows, cols, seatSize) {
        var gap = 10;
        var totalWidth = cols * (seatSize + gap);
        var totalHeight = rows * (seatSize + gap);
        seatSVG.setAttribute("viewBox", "0 0 ".concat(totalWidth, " ").concat(totalHeight));
        for (var r = 0; r < rows; r++) {
            var _loop_1 = function (c) {
                var seatId = String.fromCharCode(65 + r) + (c + 1); // A1, A2, B1, etc.
                var x = c * (seatSize + gap);
                var y = r * (seatSize + gap);
                // Seat Rectangle
                var rect = document.createElementNS(svgNS, 'rect');
                rect.setAttribute('x', x.toString());
                rect.setAttribute('y', y.toString());
                rect.setAttribute('width', seatSize.toString());
                rect.setAttribute('height', seatSize.toString());
                rect.setAttribute('fill', occupiedSeats.has(seatId) ? '#d32f2f' : '#e0e0e0');
                rect.setAttribute('stroke', '#444');
                rect.setAttribute('data-seat-id', seatId);
                // Seat Text (ID inside the box)
                var text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', (x + seatSize / 2).toString());
                text.setAttribute('y', (y + seatSize / 2 + 5).toString());
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.setAttribute('fill', 'black');
                text.setAttribute('pointer-events', 'none'); // so clicks go to the rect
                text.textContent = seatId;
                if (!occupiedSeats.has(seatId)) {
                    rect.style.cursor = 'pointer';
                    rect.addEventListener('click', function () { return toggleSVGSeat(seatId, rect, text); });
                }
                seatSVG.appendChild(rect);
                seatSVG.appendChild(text);
            };
            for (var c = 0; c < cols; c++) {
                _loop_1(c);
            }
        }
    }
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
    // Handle seat selection toggle
    function toggleSVGSeat(seatId, rect, textElement) {
        if (selectedSeats.has(seatId)) {
            selectedSeats.delete(seatId);
            rect.setAttribute('fill', '#e0e0e0');
        }
        else {
            selectedSeats.add(seatId);
            rect.setAttribute('fill', '#4caf50');
        }
        updateUI();
    }
    // Update selected display
    function updateUI() {
        var seatsArray = __spreadArray([], selectedSeats, true);
        if (seatsArray.length > 0) {
            selectedDisplay.textContent = "Selected Seats: ".concat(seatsArray.join(', '));
        }
        else {
            selectedDisplay.textContent = 'Selected Seats: None';
        }
        totalDisplay.textContent = "Total: \u20B9".concat(seatsArray.length * pricePerSeat);
    }
    // Confirm booking
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
            // Re-parse and redraw the last SVG
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
            // Re-attach event listeners
            attachSVGSeatListeners();
        }
        updateUI();
    });
})(); // End IIFE
