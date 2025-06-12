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
    var maxSelectableSeats = null;
    // --- DOM Elements ---
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
    // --- Designer Elements ---
    var designerSVGElement = document.getElementById('designerSVG');
    var designerSVG = (designerSVGElement instanceof SVGSVGElement) ? designerSVGElement : null;
    var addSeatBtn = document.getElementById('addSeatBtn');
    var deleteSeatBtn = document.getElementById('deleteSeatBtn');
    var seatIdInput = document.getElementById('seatIdInput');
    var updateSeatIdBtn = document.getElementById('updateSeatIdBtn');
    var designerSeats = [];
    var selectedDesignerSeat = null;
    // --- Utility Functions ---
    /**
     * Save a layout (grid or designer) to localStorage with a unique key.
     */
    function saveLayout(type, svg) {
        var layoutName = prompt("Enter a name for this ".concat(type === 'designer' ? 'designer' : 'admin/grid', " layout:"));
        if (!layoutName)
            return;
        var key = (type === 'designer' ? 'designerLayout_' : 'seatLayout_') + layoutName;
        localStorage.setItem(key, svg.outerHTML);
        updateSavedLayoutsDropdown();
        alert("".concat(type === 'designer' ? 'Designer' : 'Admin/Grid', " layout saved!"));
    }
    /**
     * Populate the dropdown with all saved layouts (grid and designer).
     */
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
    // --- Admin/Grid Seat Creation ---
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
    /**
     * Generate SVG seat grid with seat IDs inside.
     */
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
                if (!occupiedSeats.has(seatId)) {
                    rect.style.cursor = 'pointer';
                    rect.addEventListener('click', function () { return toggleSVGSeat(seatId, rect); });
                }
                seatSVG.appendChild(rect);
            };
            for (var c = 0; c < cols; c++) {
                _loop_1(c);
            }
        }
    }
    // --- SVG Upload ---
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
    // --- Save Layouts ---
    saveLayoutBtn.addEventListener('click', function () { return saveLayout('grid', seatSVG); });
    // --- Load Layouts ---
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
    // --- Seat Selection Logic ---
    function attachSVGSeatListeners() {
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
            // Skip rectangles at (0,0) with no data-seat-id or with width/height 0
            if ((x === 0 && y === 0 && !seatRect.hasAttribute('data-seat-id')) || width === 0 || height === 0) {
                return;
            }
            if (width < 50 && height < 50) {
                seatRect.style.cursor = 'pointer';
                if (!occupiedSeats.has(seatId)) {
                    seatRect.setAttribute('fill', '#e0e0e0');
                    seatRect.addEventListener('click', function () { return toggleSVGSeat(seatId, seatRect); });
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
    // --- Seat Selection Limit ---
    function promptForSeatCount() {
        var input = prompt("How many seats do you want to select?");
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
        maxSelectableSeats = num;
        selectedSeats.clear();
        updateUI();
        alert("You can now select up to ".concat(maxSelectableSeats, " seats."));
        return true;
    }
    // --- Toggle SVG Seat Selection ---
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
    // --- Booking Confirmation ---
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
        maxSelectableSeats = null; // Reset for next booking
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
    // --- UI Update ---
    function updateUI() {
        // Update selected and total displays
        selectedDisplay.textContent = "Selected Seats: ".concat(__spreadArray([], selectedSeats, true).join(', ') || 'None');
        totalDisplay.textContent = "Total: \u20B9".concat(selectedSeats.size * pricePerSeat);
        // Optionally, update seat colors for SVG seats (in case of external changes)
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
    // --- Designer Logic ---
    if (designerSVG) {
        // Add seat on click in designer SVG
        designerSVG.addEventListener('click', function (e) {
            if (e.target !== designerSVG)
                return;
            var rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', (e.offsetX - 10).toString());
            rect.setAttribute('y', (e.offsetY - 7).toString());
            rect.setAttribute('width', '20');
            rect.setAttribute('height', '15');
            rect.setAttribute('fill', '#49D44B');
            rect.setAttribute('stroke', '#222');
            rect.setAttribute('data-seat-id', "Seat".concat(designerSeats.length + 1));
            rect.style.cursor = 'pointer';
            rect.addEventListener('click', function (evt) {
                evt.stopPropagation();
                selectDesignerSeat(rect);
            });
            designerSVG.appendChild(rect);
            designerSeats.push(rect);
            selectDesignerSeat(rect);
        });
        // Deselect seat when clicking empty SVG area
        designerSVG.addEventListener('click', function (e) {
            if (e.target === designerSVG) {
                if (selectedDesignerSeat)
                    selectedDesignerSeat.setAttribute('stroke', '#222');
                selectedDesignerSeat = null;
                seatIdInput.value = '';
            }
        });
    }
    // Select a designer seat
    function selectDesignerSeat(rect) {
        if (selectedDesignerSeat) {
            selectedDesignerSeat.setAttribute('stroke', '#222');
        }
        selectedDesignerSeat = rect;
        rect.setAttribute('stroke', '#f00');
        seatIdInput.value = rect.getAttribute('data-seat-id') || '';
    }
    // Update seat ID in designer
    updateSeatIdBtn.addEventListener('click', function () {
        if (selectedDesignerSeat) {
            selectedDesignerSeat.setAttribute('data-seat-id', seatIdInput.value);
        }
    });
    // Delete selected seat in designer
    deleteSeatBtn.addEventListener('click', function () {
        if (selectedDesignerSeat && designerSVG) {
            designerSVG.removeChild(selectedDesignerSeat);
            designerSeats = designerSeats.filter(function (r) { return r !== selectedDesignerSeat; });
            selectedDesignerSeat = null;
            seatIdInput.value = '';
        }
    });
})(); // End IIFE
