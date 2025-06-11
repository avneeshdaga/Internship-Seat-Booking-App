(function () {
    const svgNS = "http://www.w3.org/2000/svg";
    const pricePerSeat = 200;
    let selectedSeats = new Set();
    let occupiedSeats = new Set();
    let seatMapType = 'grid'; // 'grid' or 'svg'
    let lastSVGString = ''; // Store last uploaded/loaded SVG string
    const roleSelect = document.getElementById('roleSelect');
    const adminPanel = document.getElementById('adminPanel');
    const userPanel = document.getElementById('userPanel');
    const rowInput = document.getElementById('rowInput');
    const colInput = document.getElementById('colInput');
    const createSeatsBtn = document.getElementById('createSeatsBtn');
    const seatSVG = document.getElementById('seatSVG');
    const selectedDisplay = document.getElementById('selected');
    const totalDisplay = document.getElementById('total');
    const confirmBtn = document.getElementById('confirmBtn');
    const svgUpload = document.getElementById('svgUpload');
    const saveLayoutBtn = document.getElementById('saveLayoutBtn');
    const savedLayoutsDropdown = document.getElementById('savedLayoutsDropdown');
    const loadLayoutBtn = document.getElementById('loadLayoutBtn');
    const seatSizeInput = document.getElementById('seatSizeInput');
    const deleteLayoutBtn = document.getElementById('deleteLayoutBtn');
    // Role toggle
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
    function attachSVGSeatListeners() {
        // Remove old text elements if needed
        seatSVG.querySelectorAll('text').forEach(t => t.remove());
        const seatRects = seatSVG.querySelectorAll('rect');
        seatRects.forEach((rect, idx) => {
            const seatRect = rect;
            const seatId = seatRect.getAttribute('data-seat-id') || `${idx}`;
            const width = parseFloat(seatRect.getAttribute('width') || "0");
            const height = parseFloat(seatRect.getAttribute('height') || "0");
            if (width < 50 && height < 50) {
                seatRect.style.cursor = 'pointer';
                if (!occupiedSeats.has(seatId)) {
                    seatRect.setAttribute('fill', '#e0e0e0');
                    seatRect.addEventListener('click', () => {
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
                // Add seat ID as text
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute('x', (parseFloat(seatRect.getAttribute('x') || "0") + width / 2).toString());
                text.setAttribute('y', (parseFloat(seatRect.getAttribute('y') || "0") + height / 2 + 5).toString());
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.setAttribute('fill', 'black');
                text.setAttribute('pointer-events', 'none');
                text.textContent = seatId;
                seatSVG.appendChild(text);
            }
            else {
                seatRect.setAttribute('fill', '#bdbdbd');
                seatRect.style.cursor = 'default';
            }
        });
    }
    svgUpload.addEventListener('change', function (event) {
        seatMapType = 'svg';
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file)
            return;
        const SIZE_THRESHOLD = 50;
        const reader = new FileReader();
        reader.onload = function (e) {
            var _a;
            seatSVG.innerHTML = '';
            lastSVGString = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
            const importedSVG = svgDoc.documentElement;
            // Copy SVG attributes for proper display
            ['width', 'height', 'viewBox'].forEach(attr => {
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
    saveLayoutBtn.addEventListener('click', () => {
        const layoutName = prompt("Enter a name for this layout:");
        if (!layoutName)
            return;
        localStorage.setItem('seatLayout_' + layoutName, seatSVG.outerHTML);
        updateSavedLayoutsDropdown();
        alert('Layout saved!');
    });
    // Populate dropdown with saved layouts
    function updateSavedLayoutsDropdown() {
        savedLayoutsDropdown.innerHTML = '<option value="">Select Saved Layout</option>';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('seatLayout_')) {
                const name = key.replace('seatLayout_', '');
                const option = document.createElement('option');
                option.value = key;
                option.textContent = name;
                savedLayoutsDropdown.appendChild(option);
            }
        }
    }
    // Load selected layout
    loadLayoutBtn.addEventListener('click', () => {
        seatMapType = 'svg';
        const key = savedLayoutsDropdown.value;
        if (!key)
            return;
        lastSVGString = localStorage.getItem(key) || "";
        // Parse the SVG string and insert it into seatSVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(lastSVGString, "image/svg+xml");
        const importedSVG = svgDoc.documentElement;
        // Copy SVG attributes for proper display
        ['width', 'height', 'viewBox'].forEach(attr => {
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
    // Generate SVG seat grid with seat IDs inside
    function generateSVGSeats(rows, cols, seatSize) {
        const gap = 10;
        const totalWidth = cols * (seatSize + gap);
        const totalHeight = rows * (seatSize + gap);
        seatSVG.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const seatId = String.fromCharCode(65 + r) + (c + 1); // A1, A2, B1, etc.
                const x = c * (seatSize + gap);
                const y = r * (seatSize + gap);
                // Seat Rectangle
                const rect = document.createElementNS(svgNS, 'rect');
                rect.setAttribute('x', x.toString());
                rect.setAttribute('y', y.toString());
                rect.setAttribute('width', seatSize.toString());
                rect.setAttribute('height', seatSize.toString());
                rect.setAttribute('fill', occupiedSeats.has(seatId) ? '#d32f2f' : '#e0e0e0');
                rect.setAttribute('stroke', '#444');
                rect.setAttribute('data-seat-id', seatId);
                // Seat Text (ID inside the box)
                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', (x + seatSize / 2).toString());
                text.setAttribute('y', (y + seatSize / 2 + 5).toString());
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.setAttribute('fill', 'black');
                text.setAttribute('pointer-events', 'none'); // so clicks go to the rect
                text.textContent = seatId;
                if (!occupiedSeats.has(seatId)) {
                    rect.style.cursor = 'pointer';
                    rect.addEventListener('click', () => toggleSVGSeat(seatId, rect, text));
                }
                seatSVG.appendChild(rect);
                seatSVG.appendChild(text);
            }
        }
    }
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
        const seatsArray = [...selectedSeats];
        if (seatsArray.length > 0) {
            selectedDisplay.textContent = `Selected Seats: ${seatsArray.join(', ')}`;
        }
        else {
            selectedDisplay.textContent = 'Selected Seats: None';
        }
        totalDisplay.textContent = `Total: ₹${seatsArray.length * pricePerSeat}`;
    }
    // Confirm booking
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
            // Re-parse and redraw the last SVG
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
            // Re-attach event listeners
            attachSVGSeatListeners();
        }
        updateUI();
    });
})(); // End IIFE
