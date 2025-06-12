(function () {
  // --- Constants & State ---
  const svgNS = "http://www.w3.org/2000/svg";
  const pricePerSeat = 200;
  let selectedSeats: Set<string> = new Set();
  let occupiedSeats: Set<string> = new Set();
  let seatMapType: 'grid' | 'svg' = 'grid';

  let lastSVGString: string = '';
  let maxSelectableSeats: number | null = null;
  let designerSeats: SVGRectElement[] = [];
  let selectedDesignerSeat: SVGRectElement | null = null;
  let addMode = false;

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


  const savedLayoutsDropdown = document.getElementById('savedLayoutsDropdown') as HTMLSelectElement;
  const loadLayoutBtn = document.getElementById('loadLayoutBtn') as HTMLButtonElement;
  const deleteLayoutBtn = document.getElementById('deleteLayoutBtn') as HTMLButtonElement;

  const addSeatBtn = document.getElementById('addSeatBtn') as HTMLButtonElement;
  const deleteSeatBtn = document.getElementById('deleteSeatBtn') as HTMLButtonElement;
  const seatIdInput = document.getElementById('seatIdInput') as HTMLInputElement;
  const updateSeatIdBtn = document.getElementById('updateSeatIdBtn') as HTMLButtonElement;

  const saveDesignerLayoutBtn = document.getElementById('saveDesignerLayoutBtn') as HTMLButtonElement;
  const saveUploadedLayoutBtn = document.getElementById('saveUploadedLayoutBtn') as HTMLButtonElement;
  const designerSVGElement = document.getElementById('designerSVG');
  const designerSVG = (designerSVGElement instanceof SVGSVGElement) ? designerSVGElement : null;

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
      const seatRects = seatSVG.querySelectorAll('rect');
      seatRects.forEach((rect, idx) => {
        const seatRect = rect as SVGRectElement;
        const seatId = seatRect.getAttribute('data-seat-id') || `${idx}`;
        if (occupiedSeats.has(seatId)) {
          seatRect.setAttribute('fill', '#d32f2f');
        } else if (selectedSeats.has(seatId)) {
          seatRect.setAttribute('fill', '#4caf50');
        } else if (seatRect.getAttribute('width') && seatRect.getAttribute('height') && parseFloat(seatRect.getAttribute('width') || "0") < 50 && parseFloat(seatRect.getAttribute('height') || "0") < 50) {
          seatRect.setAttribute('fill', '#e0e0e0');
        }
      });
    }
  }

  // Save current SVG layout
    saveLayoutBtn.addEventListener('click', () => {
        const layoutName = prompt("Enter a name for this layout:");
        if (!layoutName) return;
        localStorage.setItem('seatLayout_' + layoutName, seatSVG.outerHTML);
        updateSavedLayoutsDropdown();
        alert('Layout saved!');
    });

  saveDesignerLayoutBtn.addEventListener('click', () => {
      const layoutName = prompt("Enter a name for this designer layout:");
      if (!layoutName) return;
      if (designerSVG) {
        localStorage.setItem('seatLayout_' + layoutName, designerSVG.outerHTML);
        updateSavedLayoutsDropdown();
        alert('Designer layout saved!');
      } else {
        alert('Designer SVG is not available.');
      }
  });
  
  saveUploadedLayoutBtn.addEventListener('click', () => {
      const layoutName = prompt("Enter a name for this uploaded layout:");
      if (!layoutName) return;
        localStorage.setItem('seatLayout_' + layoutName, seatSVG.outerHTML);
        updateSavedLayoutsDropdown();
        alert('Uploaded SVG layout saved!');
  });

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
          rect.addEventListener('click', () => toggleSVGSeat(seatId, rect));
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
  svgUpload.addEventListener('change', function(event: Event) {
    seatMapType = 'svg';
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e: ProgressEvent<FileReader>) {
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

  // --- Seat Selection Logic ---
  function attachSVGSeatListeners(): void {
    const seatRects = seatSVG.querySelectorAll('rect');
    seatRects.forEach((rect, idx) => {
      const seatRect = rect as SVGRectElement;
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
          seatRect.addEventListener('click', () => toggleSVGSeat(seatId, seatRect));
        } else {
          seatRect.setAttribute('fill', '#d32f2f');
        }
      } else {
        seatRect.setAttribute('fill', '#bdbdbd');
        seatRect.style.cursor = 'default';
      }
    });
  }

  function promptForSeatCount() {
    const input = prompt("How many seats do you want to select?");
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
    maxSelectableSeats = num;
    selectedSeats.clear();
    updateUI();
    alert(`You can now select up to ${maxSelectableSeats} seats.`);
    return true;
  }

  function toggleSVGSeat(seatId: string, rect: SVGRectElement): void {
    if (maxSelectableSeats === null) {
      if (!promptForSeatCount()) return;
    }
    if (selectedSeats.has(seatId)) {
      selectedSeats.delete(seatId);
      rect.setAttribute('fill', '#e0e0e0');
    } else {
      if (selectedSeats.size >= (maxSelectableSeats ?? 0)) {
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

  // --- Designer Logic ---
  if (designerSVG) {
    addSeatBtn.addEventListener('click', () => {
      addMode = !addMode;
      addSeatBtn.textContent = addMode ? "Adding... (Click SVG)" : "Add Seat";
      addSeatBtn.style.background = addMode ? "#4caf50" : "";
    });

    designerSVG.addEventListener('click', (e) => {
      if (!addMode) {
        if (e.target === designerSVG) {
          if (selectedDesignerSeat) selectedDesignerSeat.setAttribute('stroke', '#222');
          selectedDesignerSeat = null;
          seatIdInput.value = '';
        }
        return;
      }
      if (e.target !== designerSVG) return;
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', (e.offsetX - 10).toString());
      rect.setAttribute('y', (e.offsetY - 7).toString());
      rect.setAttribute('width', '20');
      rect.setAttribute('height', '15');
      rect.setAttribute('fill', '#49D44B');
      rect.setAttribute('stroke', '#222');
      rect.setAttribute('data-seat-id', `Seat${designerSeats.length + 1}`);
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', (evt) => {
        evt.stopPropagation();
        selectDesignerSeat(rect);
      });
      designerSVG.appendChild(rect);
      designerSeats.push(rect);
      selectDesignerSeat(rect);
    });
  }

  function selectDesignerSeat(rect: SVGRectElement) {
    if (selectedDesignerSeat) {
      selectedDesignerSeat.setAttribute('stroke', '#222');
    }
    selectedDesignerSeat = rect;
    rect.setAttribute('stroke', '#f00');
    seatIdInput.value = rect.getAttribute('data-seat-id') || '';
  }

  updateSeatIdBtn.addEventListener('click', () => {
    if (selectedDesignerSeat) {
      selectedDesignerSeat.setAttribute('data-seat-id', seatIdInput.value);
    }
  });

  deleteSeatBtn.addEventListener('click', () => {
    if (selectedDesignerSeat && designerSVG) {
      designerSVG.removeChild(selectedDesignerSeat);
      designerSeats = designerSeats.filter(r => r !== selectedDesignerSeat);
      selectedDesignerSeat = null;
      seatIdInput.value = '';
    }
  });

})();