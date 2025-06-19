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
    let offsetX = 0, offsetY = 0;
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
    // --- Designer Logic ---
    function makeDraggable(rect) {
        rect.addEventListener('mousedown', (e) => {
            // Only allow drag if in admin mode 
            if (roleSelect.value !== 'admin')
                return;
            dragTarget = rect;
            offsetX = e.offsetX - parseFloat(rect.getAttribute('x') || "0");
            offsetY = e.offsetY - parseFloat(rect.getAttribute('y') || "0");
            e.stopPropagation();
        });
    }
    designerSVG.addEventListener('mousemove', (e) => {
        if (dragTarget && roleSelect.value === 'admin') {
            let newX = e.offsetX - offsetX;
            let newY = e.offsetY - offsetY;
            dragTarget.setAttribute('x', newX.toString());
            dragTarget.setAttribute('y', newY.toString());
        }
    });
    designerSVG.addEventListener('mouseup', () => {
        dragTarget = null;
    });
    designerSVG.addEventListener('mouseleave', () => {
        dragTarget = null;
    });
    if (designerSVG && roleSelect.value === 'admin') {
        addSeatBtn.addEventListener('click', () => {
            addMode = !addMode;
            addSeatBtn.textContent = addMode ? "Adding... (Click SVG)" : "Add Seat";
            addSeatBtn.style.background = addMode ? "#4caf50" : "";
        });
        designerSVG.addEventListener('click', (e) => {
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
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', (e.offsetX - 10).toString());
            rect.setAttribute('y', (e.offsetY - 7).toString());
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
            makeDraggable(rect); // Enable dragging for this seat
            designerSVG.appendChild(rect);
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
            designerSVG.removeChild(selectedDesignerSeat);
            selectedDesignerSeat = null;
            seatIdInput.value = '';
        }
    });
})();
