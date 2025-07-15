import { create } from "zustand";
import {
  Seat,
  PenPath,
  TextElement,
  ShapeMode,
  SeatMapType,
  PenDragState,
} from "../types";

// Add this helper function at the top of the file, before the interface
function getSVGCoordsFromClient(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();

  if (ctm) {
    return pt.matrixTransform(ctm.inverse());
  }

  return { x: clientX, y: clientY };
}

interface SeatState {
  // Constants & Core State
  svgNS: string;
  pricePerSeat: number;
  selectedSeats: Set<string>;
  occupiedSeats: Set<string>;
  seatMapType: SeatMapType;
  lastSVGString: string;
  maxSelectableSeats: number | null;

  // Phase 4: Designer seat selection (string ID, not object)
  selectedDesignerSeat: string | null;
  addMode: boolean;
  isDragging: boolean;
  dragStart: { x: number; y: number; seatX: number; seatY: number } | null;

  // Phase 4: Drag state (string ID, not DOM element)
  dragTarget: string | null;

  // Zoom/Pan state
  userZoomLevel: number;
  justDragged: boolean;
  designerPanX: number;
  designerPanY: number;
  designerPanW: number;
  designerPanH: number;
  designerZoomLevel: number;
  isDesignerPanning: boolean;
  designerViewX: number;
  designerViewY: number;
  designerViewW: number;
  designerViewH: number;
  userPanX: number;
  userPanY: number;
  userPanW: number;
  userPanH: number;
  isPanning: boolean;
  panStart: { x: number; y: number };

  // Tool modes
  penMode: boolean;
  textMode: boolean;
  rectMode: boolean;
  shapeMode: ShapeMode;
  bgImageVisible: boolean;

  // Success feedback
  showSuccessAnimation: boolean;
  successMessage: string;

  // Drawing state
  currentPenPath: PenPath | null;
  selectedPenPath: PenPath | null;
  finishedPenPaths: PenPath[];
  selectedRectPath: SVGPathElement | null;
  selectedCirclePath: SVGPathElement | null;
  penDragging: PenDragState | null;

  // Current layout
  currentSeats: Seat[];
  textElements: TextElement[];

  // Actions
  setSelectedSeats: (seats: Set<string>) => void;
  addSeat: (seat: Seat) => void;
  updateSeat: (id: string, updates: Partial<Seat>) => void;
  deleteSeat: (id: string) => void;
  toggleSeatSelection: (seatId: string) => void;
  confirmBooking: () => void;
  resetSelection: () => void;
  toggleMode: (mode: "addMode" | "penMode" | "textMode" | "rectMode") => void;
  setShapeMode: (mode: ShapeMode) => void;
  generateGrid: (rows: number, cols: number, seatSize: number) => void;
  setMaxSelectableSeats: (max: number | null) => void;
  showSuccess: (message: string) => void;
  hideSuccess: () => void;
  countAvailableSeats: () => number;
  promptForSeatCount: () => boolean;

  // Pan/Zoom actions
  setUserZoom: (zoom: number, centerX?: number, centerY?: number) => void;
  setDesignerZoom: (zoom: number, centerX?: number, centerY?: number) => void;
  startPanning: (isDesigner: boolean, clientX: number, clientY: number) => void;
  updatePan: (isDesigner: boolean, clientX: number, clientY: number) => void;
  stopPanning: () => void;

  // Background image
  setBgImageVisible: (visible: boolean) => void;
  clearAll: () => void;

  // Phase 4: Designer actions
  selectDesignerSeat: (seatId: string | null) => void;
  deselectDesignerSeat: () => void;
  deleteSelectedSeat: () => void;
  updateSeatId: (oldId: string, newId: string) => boolean;
  updateSeatRadius: (seatId: string, radius: number) => void;
  startSeatDrag: (seatId: string, startX: number, startY: number) => void;
  updateSeatDrag: (currentX: number, currentY: number) => void;
  stopSeatDrag: () => void;
  deselectAll: () => void;

  // Phase 4: Enhanced seat management
  generateSeatId: () => string;
  updateSeatPosition: (seatId: string, x: number, y: number) => void;
  clearGrid: () => void;
}

export const useSeatStore = create<SeatState>((set, get) => ({
  // Initial state
  svgNS: "http://www.w3.org/2000/svg",
  pricePerSeat: 200,
  selectedSeats: new Set(),
  occupiedSeats: new Set(),
  seatMapType: "grid",
  lastSVGString: "",
  maxSelectableSeats: null,

  selectedDesignerSeat: null,
  addMode: false,
  dragTarget: null,

  userZoomLevel: 1,
  justDragged: false,
  designerPanX: 0,
  designerPanY: 0,
  designerPanW: 1000,
  designerPanH: 500,
  designerZoomLevel: 1,
  isDesignerPanning: false,
  designerViewX: 0,
  designerViewY: 0,
  designerViewW: 1000,
  designerViewH: 500,
  userPanX: 0,
  userPanY: 0,
  userPanW: 1000,
  userPanH: 500,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  penMode: false,
  textMode: false,
  rectMode: false,
  shapeMode: "none",
  bgImageVisible: true,
  currentPenPath: null,
  selectedPenPath: null,
  finishedPenPaths: [],
  selectedRectPath: null,
  selectedCirclePath: null,
  penDragging: null,
  showSuccessAnimation: false,
  successMessage: "",
  currentSeats: [],
  textElements: [],
  isDragging: false,
  dragStart: null,

  setSelectedSeats: (seats) => set({ selectedSeats: seats }),

  addSeat: (seat) =>
    set((state) => ({
      currentSeats: [...state.currentSeats, seat],
    })),

  updateSeat: (id, updates) =>
    set((state) => ({
      currentSeats: state.currentSeats.map((seat) =>
        seat.id === id ? { ...seat, ...updates } : seat
      ),
    })),

  deleteSeat: (id) =>
    set((state) => ({
      currentSeats: state.currentSeats.filter((seat) => seat.id !== id),
    })),

  clearGrid: () => {
    set({
      currentSeats: [],
      selectedSeats: new Set(),
      selectedDesignerSeat: null,
      maxSelectableSeats: null,
      // Also clear any other drawing elements if needed
      finishedPenPaths: [],
      textElements: [],
      currentPenPath: null,
      selectedPenPath: null,
      selectedRectPath: null,
      selectedCirclePath: null,
    });
  },

  toggleSeatSelection: (seatId) =>
    set((state) => {
      const seat = state.currentSeats.find((s) => s.id === seatId);
      if (!seat || seat.occupied) {
        console.log("Cannot select occupied seat:", seatId);
        return state;
      }

      if (state.maxSelectableSeats === null) {
        const prompted = get().promptForSeatCount();
        if (!prompted) return state;
      }

      const newSelected = new Set(state.selectedSeats);
      if (newSelected.has(seatId)) {
        newSelected.delete(seatId);
      } else {
        if (
          state.maxSelectableSeats &&
          newSelected.size >= state.maxSelectableSeats
        ) {
          alert(`You can only select up to ${state.maxSelectableSeats} seats.`);
          return state;
        }
        newSelected.add(seatId);
      }

      return { selectedSeats: newSelected };
    }),

  confirmBooking: () =>
    set((state) => {
      const newOccupied = new Set(state.occupiedSeats);
      state.selectedSeats.forEach((id) => newOccupied.add(id));

      const updatedSeats = state.currentSeats.map((seat) => {
        if (state.selectedSeats.has(seat.id)) {
          return { ...seat, occupied: true };
        }
        return seat;
      });

      const seatsList = Array.from(state.selectedSeats).sort().join(", ");
      const total = state.selectedSeats.size * state.pricePerSeat;

      setTimeout(() => {
        get().showSuccess(
          `🎉 Booking confirmed!\nSeats: ${seatsList}\nTotal: ₹${total}`
        );
      }, 100);

      return {
        occupiedSeats: newOccupied,
        selectedSeats: new Set(),
        maxSelectableSeats: null,
        currentSeats: updatedSeats,
      };
    }),

  showSuccess: (message: string) =>
    set({
      showSuccessAnimation: true,
      successMessage: message,
    }),

  hideSuccess: () =>
    set({
      showSuccessAnimation: false,
      successMessage: "",
    }),

  resetSelection: () =>
    set({
      selectedSeats: new Set(),
      maxSelectableSeats: null,
    }),

  toggleMode: (mode) =>
    set((state) => ({
      [mode]: !state[mode],
    })),

  setShapeMode: (mode) => set({ shapeMode: mode }),
  setMaxSelectableSeats: (max) => set({ maxSelectableSeats: max }),

  generateGrid: (rows, cols, seatSize) =>
    set(() => {
      const seats: Seat[] = [];
      const gap = 10;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const seatId = String.fromCharCode(65 + r) + (c + 1);
          const x = c * (seatSize + gap);
          const y = r * (seatSize + gap);
          seats.push({
            id: seatId,
            cx: x + seatSize / 2,
            cy: y + seatSize / 2,
            r: seatSize / 2,
            fill: "#e0e0e0",
            stroke: "#444",
            occupied: false,
            selected: false,
          });
        }
      }
      return { currentSeats: seats, seatMapType: "grid" };
    }),

  countAvailableSeats: () => {
    const state = get();
    return state.currentSeats.filter((seat) => !seat.occupied).length;
  },

  promptForSeatCount: () => {
    const state = get();
    const availableSeats = state.countAvailableSeats();
    const input = prompt(
      `How many seats do you want to select? (Available: ${availableSeats})`
    );

    if (!input) {
      set({ maxSelectableSeats: null });
      alert("Please enter a number to proceed.");
      return false;
    }

    const num = parseInt(input);
    if (isNaN(num) || num <= 0) {
      set({ maxSelectableSeats: null });
      alert("Please enter a valid positive number.");
      return false;
    }

    if (num > availableSeats) {
      set({ maxSelectableSeats: null });
      alert(
        `Only ${availableSeats} seats are available. Please enter a lower number.`
      );
      return false;
    }

    set({ maxSelectableSeats: num, selectedSeats: new Set() });
    alert(`You can now select up to ${num} seats.`);
    return true;
  },

  // Phase 4: Designer actions (fixed)
  selectDesignerSeat: (seatId: string | null) => {
    set({ selectedDesignerSeat: seatId });
  },

  deselectDesignerSeat: () => {
    set({ selectedDesignerSeat: null });
  },

  deleteSelectedSeat: () => {
    const { selectedDesignerSeat, currentSeats } = get();
    if (selectedDesignerSeat) {
      set({
        currentSeats: currentSeats.filter(
          (seat) => seat.id !== selectedDesignerSeat
        ),
        selectedDesignerSeat: null,
      });
    }
  },

  updateSeatId: (oldId: string, newId: string) => {
    const { currentSeats } = get();
    const existingSeat = currentSeats.find((s) => s.id === newId);
    if (existingSeat) return false;

    set({
      currentSeats: currentSeats.map((seat) =>
        seat.id === oldId ? { ...seat, id: newId } : seat
      ),
      selectedDesignerSeat: newId,
    });
    return true;
  },

  updateSeatRadius: (seatId: string, radius: number) => {
    const { currentSeats } = get();
    set({
      currentSeats: currentSeats.map((seat) =>
        seat.id === seatId ? { ...seat, r: radius } : seat
      ),
    });
  },

  startSeatDrag: (seatId: string, clientX: number, clientY: number) => {
    const { currentSeats } = get();
    const seat = currentSeats.find((s) => s.id === seatId);

    if (seat) {
      // Auto-select the seat being dragged
      set({
        selectedDesignerSeat: seatId,
        dragTarget: seatId,
        isDragging: true,
        dragStart: {
          x: clientX,
          y: clientY,
          seatX: seat.cx,
          seatY: seat.cy,
        },
      });
    }
  },

  updateSeatDrag: (clientX: number, clientY: number) => {
    const { dragTarget, dragStart, currentSeats } = get();

    if (!dragTarget || !dragStart) return;

    // Get the SVG element from the DOM (we need this for coordinate conversion)
    const svgElement = document.querySelector(".seat-canvas") as SVGSVGElement;
    if (!svgElement) return;

    // Convert current mouse position to SVG coordinates
    const currentSVGCoords = getSVGCoordsFromClient(
      svgElement,
      clientX,
      clientY
    );

    // Convert drag start position to SVG coordinates
    const startSVGCoords = getSVGCoordsFromClient(
      svgElement,
      dragStart.x,
      dragStart.y
    );

    // Calculate delta in SVG space
    const dx = currentSVGCoords.x - startSVGCoords.x;
    const dy = currentSVGCoords.y - startSVGCoords.y;

    // Update seat position using original seat position + delta
    const newX = dragStart.seatX + dx;
    const newY = dragStart.seatY + dy;

    set({
      currentSeats: currentSeats.map((seat) =>
        seat.id === dragTarget ? { ...seat, cx: newX, cy: newY } : seat
      ),
    });
  },

  stopSeatDrag: () => {
    set({
      dragTarget: null,
      isDragging: false,
      dragStart: null,
    });
  },

  deselectAll: () => {
    set({ selectedDesignerSeat: null });
  },

  // Phase 4: Enhanced seat management
  generateSeatId: () => {
    const { currentSeats } = get();
    const usedNumbers = new Set<number>();

    currentSeats.forEach((seat) => {
      const id = seat.id;
      if (id && /^Seat\d+$/.test(id)) {
        const num = parseInt(id.replace("Seat", ""), 10);
        if (!isNaN(num)) usedNumbers.add(num);
      }
    });

    let next = 1;
    while (usedNumbers.has(next)) next++;
    return `Seat${next}`;
  },

  updateSeatPosition: (seatId: string, x: number, y: number) => {
    set((state) => ({
      currentSeats: state.currentSeats.map((seat) =>
        seat.id === seatId ? { ...seat, cx: x, cy: y } : seat
      ),
    }));
  },

  duplicateSeat: (seatId: string) => {
    const { currentSeats, generateSeatId } = get();
    const originalSeat = currentSeats.find((s) => s.id === seatId);

    if (originalSeat) {
      const newSeat = {
        ...originalSeat,
        id: generateSeatId(),
        cx: originalSeat.cx + 30, // Offset slightly
        cy: originalSeat.cy + 30,
      };

      set((state) => ({
        currentSeats: [...state.currentSeats, newSeat],
        selectedDesignerSeat: newSeat.id,
      }));
    }
  },

  // All your existing zoom/pan actions... (keep them as they are)
  setUserZoom: (zoom, centerX, centerY) =>
    set((state) => {
      const newZoom = Math.max(1, Math.min(3, zoom));
      const newW = 1000 / newZoom;
      const newH = 500 / newZoom;

      let newPanX = state.userPanX;
      let newPanY = state.userPanY;

      if (newZoom === 1) {
        newPanX = 0;
        newPanY = 0;
      } else if (centerX !== undefined && centerY !== undefined) {
        const relX = (centerX - state.userPanX) / state.userPanW;
        const relY = (centerY - state.userPanY) / state.userPanH;
        newPanX = centerX - relX * newW;
        newPanY = centerY - relY * newH;
      }

      const viewX = 0,
        viewY = 0,
        viewW = 1000,
        viewH = 500;
      if (newW > viewW) {
        newPanX = viewX;
      } else {
        newPanX = Math.max(viewX, Math.min(newPanX, viewX + viewW - newW));
      }
      if (newH > viewH) {
        newPanY = viewY;
      } else {
        newPanY = Math.max(viewY, Math.min(newPanY, viewY + viewH - newH));
      }

      return {
        userZoomLevel: newZoom,
        userPanX: newPanX,
        userPanY: newPanY,
        userPanW: newW,
        userPanH: newH,
      };
    }),

  setDesignerZoom: (zoom, centerX, centerY) =>
    set((state) => {
      const newZoom = Math.max(1, Math.min(3, zoom));
      const newW = state.designerViewW / newZoom;
      const newH = state.designerViewH / newZoom;

      let newPanX = state.designerPanX;
      let newPanY = state.designerPanY;

      if (newZoom === 1) {
        newPanX = state.designerViewX;
        newPanY = state.designerViewY;
      } else if (centerX !== undefined && centerY !== undefined) {
        const relX = (centerX - state.designerPanX) / state.designerPanW;
        const relY = (centerY - state.designerPanY) / state.designerPanH;
        newPanX = centerX - relX * newW;
        newPanY = centerY - relY * newH;
      }

      if (newW > state.designerViewW) {
        newPanX = state.designerViewX;
      } else {
        newPanX = Math.max(
          state.designerViewX,
          Math.min(newPanX, state.designerViewX + state.designerViewW - newW)
        );
      }
      if (newH > state.designerViewH) {
        newPanY = state.designerViewY;
      } else {
        newPanY = Math.max(
          state.designerViewY,
          Math.min(newPanY, state.designerViewY + state.designerViewH - newH)
        );
      }

      return {
        designerZoomLevel: newZoom,
        designerPanX: newPanX,
        designerPanY: newPanY,
        designerPanW: newW,
        designerPanH: newH,
      };
    }),

  startPanning: (isDesigner, clientX, clientY) =>
    set({
      [isDesigner ? "isDesignerPanning" : "isPanning"]: true,
      panStart: { x: clientX, y: clientY },
    }),

  updatePan: (isDesigner, clientX, clientY) =>
    set((state) => {
      if (isDesigner && state.isDesignerPanning) {
        const dx = (clientX - state.panStart.x) * (state.designerPanW / 1000);
        const dy = (clientY - state.panStart.y) * (state.designerPanH / 500);

        let newPanX = state.designerPanX - dx;
        let newPanY = state.designerPanY - dy;

        if (state.designerPanW > state.designerViewW) {
          newPanX = state.designerViewX;
        } else {
          newPanX = Math.max(
            state.designerViewX,
            Math.min(
              newPanX,
              state.designerViewX + state.designerViewW - state.designerPanW
            )
          );
        }
        if (state.designerPanH > state.designerViewH) {
          newPanY = state.designerViewY;
        } else {
          newPanY = Math.max(
            state.designerViewY,
            Math.min(
              newPanY,
              state.designerViewY + state.designerViewH - state.designerPanH
            )
          );
        }

        return {
          designerPanX: newPanX,
          designerPanY: newPanY,
          panStart: { x: clientX, y: clientY },
        };
      } else if (!isDesigner && state.isPanning) {
        const dx = (clientX - state.panStart.x) * (state.userPanW / 1000);
        const dy = (clientY - state.panStart.y) * (state.userPanH / 500);

        let newPanX = state.userPanX - dx;
        let newPanY = state.userPanY - dy;

        const viewX = 0,
          viewY = 0,
          viewW = 1000,
          viewH = 500;
        if (state.userPanW > viewW) {
          newPanX = viewX;
        } else {
          newPanX = Math.max(
            viewX,
            Math.min(newPanX, viewX + viewW - state.userPanW)
          );
        }
        if (state.userPanH > viewH) {
          newPanY = viewY;
        } else {
          newPanY = Math.max(
            viewY,
            Math.min(newPanY, viewY + viewH - state.userPanH)
          );
        }

        return {
          userPanX: newPanX,
          userPanY: newPanY,
          panStart: { x: clientX, y: clientY },
        };
      }
      return state;
    }),

  stopPanning: () =>
    set({
      isDesignerPanning: false,
      isPanning: false,
    }),

  setBgImageVisible: (visible) => set({ bgImageVisible: visible }),

  clearAll: () =>
    set({
      currentSeats: [],
      selectedSeats: new Set(),
      maxSelectableSeats: null,
      finishedPenPaths: [],
      textElements: [],
      currentPenPath: null,
      selectedPenPath: null,
      selectedRectPath: null,
      selectedCirclePath: null,
    }),
}));
