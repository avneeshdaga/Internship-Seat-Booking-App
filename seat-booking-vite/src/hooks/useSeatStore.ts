import { create } from "zustand";
import {
  Seat,
  PenPath,
  PenPoint,
  TextElement,
  ShapeMode,
  SeatMapType,
  PenDragState,
} from "../types";

// Helper function for SVG coordinate conversion
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
  isRectPathDragging: boolean;

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
  isPathDragging: boolean;
  penPreviewLine: SVGLineElement | null;
  penPreviewHandle: SVGLineElement | null;

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

  // Pen Tool
  togglePenMode: () => void;
  startPenPath: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
    shiftKey: boolean
  ) => void;
  addPenPoint: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
    shiftKey: boolean
  ) => void;
  finishPenPath: (close?: boolean) => void;
  selectPenPath: (path: PenPath | null) => void;
  deselectPenPath: () => void;
  startPenDrag: (
    point: PenPoint,
    type: "anchor" | "handleIn" | "handleOut",
    offsetX: number,
    offsetY: number
  ) => void;
  updatePenDrag: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
    shiftKey: boolean,
    altKey: boolean
  ) => void;
  stopPenDrag: () => void;
  startPathDrag: (clientX: number, clientY: number) => void;
  updatePathDrag: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number
  ) => void;
  stopPathDrag: () => void;
  deletePenPath: (path: PenPath) => void;
  rotatePenPath: (path: PenPath, angleDeg: number) => void;
  updatePenPathStroke: (path: PenPath, color: string) => void;
  updatePenPathStrokeWidth: (path: PenPath, width: number) => void;
  removePenPoint: () => void;
  checkPenPathSnap: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number
  ) => void;
  clearPenPreview: () => void;
  updatePenPath: (pathObj: PenPath, hideHandles?: boolean) => void;
  createRectangle: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number
  ) => void;
  selectRectPath: (rectPath: SVGPathElement | null) => void;
  addRectResizeHandle: (rectPath: SVGPathElement) => void;
  updateRectPath: (rectPath: SVGPathElement) => void;
  makeRectPathInteractive: (rectPath: SVGPathElement) => void;
  deleteRectPath: (rectPath: SVGPathElement) => void;
  rotateRectPath: (rectPath: SVGPathElement, angleDeg: number) => void;
  rectPathDragStart: {
    x: number;
    y: number;
    points: { x: number; y: number }[];
  } | null;
  updateRectPathStroke: (rectPath: SVGPathElement, color: string) => void;
  updateRectPathStrokeWidth: (rectPath: SVGPathElement, width: number) => void;
  deselectRectPath: () => void;
  startRectPathDrag: (
    rectPath: SVGPathElement,
    clientX: number,
    clientY: number
  ) => void;
  stopRectPathDrag: () => void;
  createCircle: (svg: SVGSVGElement, clientX: number, clientY: number) => void;
  selectCirclePath: (circlePath: SVGPathElement | null) => void;
  addCircleResizeHandle: (circlePath: SVGPathElement) => void;
  updateCirclePath: (circlePath: SVGPathElement) => void;
  makeCirclePathInteractive: (circlePath: SVGPathElement) => void;
  startCircleDrag: (
    circlePath: SVGPathElement,
    clientX: number,
    clientY: number
  ) => void;
  updateCircleDrag: (clientX: number, clientY: number) => void;
  stopCircleDrag: () => void;
  deleteCirclePath: (circlePath: SVGPathElement) => void;
  deselectCirclePath: () => void;
  updateCirclePathStroke: (circlePath: SVGPathElement, color: string) => void;
  updateCirclePathStrokeWidth: (
    circlePath: SVGPathElement,
    width: number
  ) => void;
  selectedTextElement: string | null;
  toggleTextMode: () => void;
  addTextElement: (svg: SVGSVGElement, x: number, y: number) => void;
  selectTextElement: (id: string | null) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  deleteTextElement: (id: string) => void;
  updateTextElementFontSize: (id: string, fontSize: number) => void;
  updateTextElementColor: (id: string, color: string) => void;
  updateTextElementContent: (id: string, content: string) => void;
  moveTextElement: (id: string, x: number, y: number) => void;
  startTextDrag: (id: string, clientX: number, clientY: number) => void;
  updateTextDrag: (clientX: number, clientY: number) => void;
  stopTextDrag: () => void;
  updateTextFontSizeForZoom: (zoom: number) => void;
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
  isPathDragging: false,
  penPreviewLine: null,
  penPreviewHandle: null,
  isRectPathDragging: false,
  rectPathDragStart: null,

  selectedTextElement: null,

  toggleTextMode: () => set((state) => ({ textMode: !state.textMode })),

  addTextElement: (svg: SVGSVGElement, x: number, y: number) => {
    const id = `Text${Date.now()}`;
    const textEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    textEl.setAttribute("x", x.toString());
    textEl.setAttribute("y", y.toString());
    textEl.setAttribute("font-size", "16");
    textEl.setAttribute("data-base-font-size", "16");
    textEl.setAttribute("fill", "#000");
    textEl.setAttribute("text-anchor", "middle");
    textEl.setAttribute("dominant-baseline", "middle");
    textEl.textContent = "Edit text...";
    textEl.style.cursor = "move";
    svg.appendChild(textEl);

    set((state) => ({
      textElements: [
        ...state.textElements,
        {
          id,
          x,
          y,
          content: "Edit text...",
          fontSize: 16,
          color: "#000",
          element: textEl,
        },
      ],
      selectedTextElement: id,
    }));
    textEl.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      get().startTextDrag(id, e.clientX, e.clientY);
    });
    textEl.addEventListener("click", (e) => {
      e.stopPropagation();
      get().selectTextElement(id);
    });
  },

  selectTextElement: (id: string | null) => {
    set((state) => {
      // Remove highlight from previous
      if (state.selectedTextElement) {
        const prev = state.textElements.find(
          (t) => t.id === state.selectedTextElement
        );
        if (prev && prev.element) prev.element.setAttribute("stroke", "none");
      }
      // Add highlight to new
      if (id) {
        const next = state.textElements.find((t) => t.id === id);
        if (next && next.element)
          next.element.setAttribute("stroke", "#f32121ff");
      }
      return { selectedTextElement: id };
    });
  },

  updateTextElement: (id: string, updates: Partial<TextElement>) => {
    set((state) => ({
      textElements: state.textElements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  deleteTextElement: (id: string) => {
    set((state) => {
      const el = state.textElements.find((t) => t.id === id);
      if (el && el.element) el.element.remove();
      return {
        textElements: state.textElements.filter((t) => t.id !== id),
        selectedTextElement:
          state.selectedTextElement === id ? null : state.selectedTextElement,
      };
    });
  },

  updateTextElementFontSize: (id: string, fontSize: number) => {
    set((state) => {
      const el = state.textElements.find((t) => t.id === id);
      if (el && el.element) {
        el.element.setAttribute("font-size", fontSize.toString());
        el.element.setAttribute("data-base-font-size", fontSize.toString());
      }
      return {
        textElements: state.textElements.map((t) =>
          t.id === id ? { ...t, fontSize } : t
        ),
      };
    });
  },

  updateTextElementColor: (id: string, color: string) => {
    set((state) => {
      const el = state.textElements.find((t) => t.id === id);
      if (el && el.element) {
        el.element.setAttribute("fill", color);
      }
      return {
        textElements: state.textElements.map((t) =>
          t.id === id ? { ...t, color } : t
        ),
      };
    });
  },

  updateTextFontSizeForZoom: (zoom: number) => {
    set((state) => {
      state.textElements.forEach((el) => {
        const baseSize = Number(
          el.element?.getAttribute("data-base-font-size") || el.fontSize
        );
        const newSize = baseSize / zoom;
        el.element?.setAttribute("font-size", newSize.toString());
      });
      return {};
    });
  },

  updateTextElementContent: (id: string, content: string) => {
    set((state) => {
      const el = state.textElements.find((t) => t.id === id);
      if (el && el.element) {
        el.element.textContent = content;
      }
      return {
        textElements: state.textElements.map((t) =>
          t.id === id ? { ...t, content } : t
        ),
      };
    });
  },

  moveTextElement: (id: string, x: number, y: number) => {
    set((state) => {
      const el = state.textElements.find((t) => t.id === id);
      if (el && el.element) {
        el.element.setAttribute("x", x.toString());
        el.element.setAttribute("y", y.toString());
      }
      return {
        textElements: state.textElements.map((t) =>
          t.id === id ? { ...t, x, y } : t
        ),
      };
    });
  },

  startTextDrag: (id: string, clientX: number, clientY: number) => {
    const el = get().textElements.find((t) => t.id === id);
    if (!el) return;
    set({
      isDragging: true,
      dragStart: { x: clientX, y: clientY, seatX: el.x, seatY: el.y },
      dragTarget: id,
      selectedTextElement: id,
    });
  },

  updateTextDrag: (clientX: number, clientY: number) => {
    const { dragStart, dragTarget, textElements } = get();
    if (!dragStart || !dragTarget) return;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    const el = textElements.find((t) => t.id === dragTarget);
    if (!el) return;
    get().moveTextElement(
      dragTarget,
      dragStart.seatX + dx,
      dragStart.seatY + dy
    );
  },

  stopTextDrag: () => {
    set({
      isDragging: false,
      dragStart: null,
      dragTarget: null,
    });
  },

  createCircle: (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const svgCoords = getSVGCoordsFromClient(svg, clientX, clientY);
    const cx = svgCoords.x,
      cy = svgCoords.y;
    const r = 40;

    // SVG path for circle
    const d = `
      M ${cx - r},${cy}
      a ${r},${r} 0 1,0 ${2 * r},0
      a ${r},${r} 0 1,0 ${-2 * r},0
    `;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "#000");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("data-prev-stroke", "#000");
    path.style.cursor = "pointer";
    svg.appendChild(path);

    (path as any)._circleData = { cx, cy, r };

    // --- ADD THIS BLOCK: create center point ---
    const center = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    center.setAttribute("cx", cx.toString());
    center.setAttribute("cy", cy.toString());
    center.setAttribute("r", "4");
    center.setAttribute("fill", "#35383bff");
    center.setAttribute("stroke", "#fff");
    center.setAttribute("stroke-width", "2");
    svg.appendChild(center);

    // Optionally, store reference for future updates
    (path as any)._centerHandle = center;

    get().addCircleResizeHandle(path);
    get().makeCirclePathInteractive(path);
    get().selectCirclePath(path);

    set({ shapeMode: "none" });
  },

  selectCirclePath: (circlePath: SVGPathElement | null) => {
    const { selectedCirclePath } = get();
    if (selectedCirclePath && selectedCirclePath !== circlePath) {
      const prev =
        selectedCirclePath.getAttribute("data-prev-stroke") || "#000";
      selectedCirclePath.setAttribute("stroke", prev);
      const handle = (selectedCirclePath as any)._resizeHandle;
      if (handle) {
        handle.remove();
        (selectedCirclePath as any)._resizeHandle = undefined;
      }
    }
    if (circlePath) {
      circlePath.setAttribute(
        "data-prev-stroke",
        circlePath.getAttribute("stroke") || "#000"
      );
      circlePath.setAttribute("stroke", "#f44336");
      get().addCircleResizeHandle(circlePath);
    }
    set({ selectedCirclePath: circlePath });
  },

  addCircleResizeHandle: (circlePath: SVGPathElement) => {
    const oldHandle = (circlePath as any)._resizeHandle;
    if (oldHandle) oldHandle.remove();

    const data = (circlePath as any)._circleData;
    if (!data) return;

    const handle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    handle.setAttribute("r", "3");
    handle.setAttribute("fill", "#000");
    handle.style.cursor = "ew-resize";
    const svg = circlePath.ownerSVGElement;
    if (svg) svg.appendChild(handle);

    function updateHandle() {
      handle.setAttribute("cx", (data.cx + data.r).toString());
      handle.setAttribute("cy", data.cy.toString());
    }
    updateHandle();
    (circlePath as any)._resizeHandle = handle;
    (handle as any)._updateHandle = updateHandle;

    // --- Resize logic ---
    let isResizing = false;
    let origR = data.r;
    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      isResizing = true;
      const resizeStart = e.clientX;
      origR = data.r;

      function onMove(ev: MouseEvent) {
        if (!isResizing) return;
        const dx = ev.clientX - resizeStart;
        const newR = Math.max(10, origR + dx);
        data.r = newR;
        get().updateCirclePath(circlePath);
        updateHandle();
      }
      function onUp() {
        isResizing = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  },

  updateCirclePath: (circlePath: SVGPathElement) => {
    const data = (circlePath as any)._circleData;
    if (!data) return;
    const { cx, cy, r } = data;
    const d = `
      M ${cx - r},${cy}
      a ${r},${r} 0 1,0 ${2 * r},0
      a ${r},${r} 0 1,0 ${-2 * r},0
    `;
    circlePath.setAttribute("d", d);

    // Update center handle position
    const center = (circlePath as any)._centerHandle;
    if (center) {
      center.setAttribute("cx", cx.toString());
      center.setAttribute("cy", cy.toString());
    }

    // Update resize handle if present
    const handle = (circlePath as any)._resizeHandle;
    if (handle && handle._updateHandle) handle._updateHandle();
  },

  makeCirclePathInteractive: (circlePath: SVGPathElement) => {
    circlePath.addEventListener("click", (e) => {
      e.stopPropagation();
      get().selectCirclePath(circlePath);
    });

    circlePath.addEventListener("mousedown", (e) => {
      const { selectedCirclePath } = get();
      if (selectedCirclePath !== circlePath) return;
      get().startCircleDrag(circlePath, e.clientX, e.clientY);
      e.stopPropagation();
    });
  },

  startCircleDrag: (
    circlePath: SVGPathElement,
    clientX: number,
    clientY: number
  ) => {
    const data = (circlePath as any)._circleData;
    if (!data) return;
    set({
      isDragging: true,
      dragStart: { x: clientX, y: clientY, seatX: data.cx, seatY: data.cy },
      dragTarget: "circle",
      selectedCirclePath: circlePath,
    });
  },

  updateCircleDrag: (clientX: number, clientY: number) => {
    const { dragStart, selectedCirclePath } = get();
    if (!dragStart || !selectedCirclePath) return;
    const svg = selectedCirclePath.ownerSVGElement;
    if (!svg) return;
    const curr = getSVGCoordsFromClient(svg, clientX, clientY);
    const start = getSVGCoordsFromClient(svg, dragStart.x, dragStart.y);
    const dx = curr.x - start.x;
    const dy = curr.y - start.y;
    const data = (selectedCirclePath as any)._circleData;
    if (!data) return;
    data.cx = dragStart.seatX + dx;
    data.cy = dragStart.seatY + dy;
    get().updateCirclePath(selectedCirclePath);
  },

  stopCircleDrag: () => {
    set({
      isDragging: false,
      dragStart: null,
      dragTarget: null,
    });
    get().deselectCirclePath();
  },

  deleteCirclePath: (circlePath: SVGPathElement) => {
    circlePath.remove();
    const handle = (circlePath as any)._resizeHandle;
    if (handle) handle.remove();
    const { selectedCirclePath } = get();
    if (selectedCirclePath === circlePath) {
      set({ selectedCirclePath: null });
    }
  },

  deselectCirclePath: () => {
    const { selectedCirclePath } = get();
    if (selectedCirclePath) {
      const prev =
        selectedCirclePath.getAttribute("data-prev-stroke") || "#000";
      selectedCirclePath.setAttribute("stroke", prev);
      const handle = (selectedCirclePath as any)._resizeHandle;
      if (handle) {
        handle.remove();
        (selectedCirclePath as any)._resizeHandle = undefined;
      }
      set({ selectedCirclePath: null });
    }
  },

  updateCirclePathStroke: (circlePath: SVGPathElement, color: string) => {
    if (!circlePath) return;
    circlePath.setAttribute("data-prev-stroke", color);
    const { selectedCirclePath } = get();
    if (selectedCirclePath === circlePath) {
      circlePath.setAttribute("stroke", "#f44336");
    } else {
      circlePath.setAttribute("stroke", color);
    }
  },

  updateCirclePathStrokeWidth: (circlePath: SVGPathElement, width: number) => {
    if (!circlePath) return;
    circlePath.setAttribute("stroke-width", width.toString());
    // Update resize handle size if present
    const handle = (circlePath as any)._resizeHandle;
    if (handle) {
      const newR = Math.max(3, Math.round(width / 2));
      handle.setAttribute("r", newR.toString());
    }
  },

  startRectPathDrag: (
    rectPath: SVGPathElement,
    clientX: number,
    clientY: number
  ) => {
    const points = (rectPath as any)._rectPoints;
    if (!points) return;
    set({
      isRectPathDragging: true,
      rectPathDragStart: {
        x: clientX,
        y: clientY,
        points: points.map((pt: any) => ({ ...pt })),
      },
    });
  },

  stopRectPathDrag: () => {
    set({
      isRectPathDragging: false,
      rectPathDragStart: null,
    });
    get().deselectRectPath();
  },

  updateRectPathStroke: (rectPath: SVGPathElement, color: string) => {
    if (!rectPath) return;

    // Store the new color for when deselected
    rectPath.setAttribute("data-prev-stroke", color);

    // If currently selected, keep red but update stored color
    const { selectedRectPath } = get();
    if (selectedRectPath === rectPath) {
      rectPath.setAttribute("stroke", "#f44336");
    } else {
      rectPath.setAttribute("stroke", color);
    }
  },

  updateRectPathStrokeWidth: (rectPath: SVGPathElement, width: number) => {
    if (!rectPath) return;
    rectPath.setAttribute("stroke-width", width.toString());

    // Update resize handle size
    const handle = (rectPath as any)._resizeHandle;
    if (handle) {
      const newR = Math.max(3, Math.round(width / 2));
      handle.setAttribute("r", newR.toString());
    }
  },

  createRectangle: (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const svgCoords = getSVGCoordsFromClient(svg, clientX, clientY);
    const w = 80,
      h = 60;
    const cx = svgCoords.x,
      cy = svgCoords.y;

    // Rectangle corners (clockwise from top-left) - exactly like vanilla
    const points = [
      { x: cx - w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy + h / 2 },
      { x: cx - w / 2, y: cy + h / 2 },
    ];

    // Create path data - exactly like vanilla
    const d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "#000");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("data-prev-stroke", "#000"); // Store original color
    path.style.cursor = "pointer";

    svg.appendChild(path);

    // Store points for manipulation BEFORE adding any interaction - exactly like vanilla
    (path as any)._rectPoints = points;

    // Add resize handle and interaction
    get().addRectResizeHandle(path);
    get().makeRectPathInteractive(path);
    get().selectRectPath(path);

    set({ rectMode: false });
  },

  selectRectPath: (rectPath: SVGPathElement | null) => {
    const { selectedRectPath } = get();

    if (selectedRectPath && selectedRectPath !== rectPath) {
      // Restore previous color on deselect
      const prev = selectedRectPath.getAttribute("data-prev-stroke") || "#000";
      selectedRectPath.setAttribute("stroke", prev);
      // Remove resize handle
      const handle = (selectedRectPath as any)._resizeHandle;
      if (handle) {
        handle.remove();
        (selectedRectPath as any)._resizeHandle = undefined;
      }
    }

    if (rectPath) {
      // Store current color before highlighting
      rectPath.setAttribute(
        "data-prev-stroke",
        rectPath.getAttribute("stroke") || "#000"
      );
      rectPath.setAttribute("stroke", "#f44336");

      // Add resize handle
      get().addRectResizeHandle(rectPath);
    }

    set({ selectedRectPath: rectPath });
  },

  addRectResizeHandle: (rectPath: SVGPathElement) => {
    // Remove old handle if any
    const oldHandle = (rectPath as any)._resizeHandle;
    if (oldHandle) {
      oldHandle.remove();
    }

    const points = (rectPath as any)._rectPoints;
    if (!points) return;

    const handle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    handle.setAttribute("r", "3");
    handle.setAttribute("fill", "#000");
    handle.style.cursor = "nwse-resize";

    const svg = rectPath.ownerSVGElement;
    if (svg) svg.appendChild(handle);

    // Helper to update handle position (bottom-right corner)
    const updateHandle = () => {
      let idx = 0;
      let maxSum = -Infinity;
      for (let i = 0; i < points.length; i++) {
        const sum = points[i].x + points[i].y;
        if (sum > maxSum) {
          maxSum = sum;
          idx = i;
        }
      }
      handle.setAttribute("cx", points[idx].x.toString());
      handle.setAttribute("cy", points[idx].y.toString());
    };

    updateHandle();
    (rectPath as any)._resizeHandle = handle;

    // Add resize functionality
    let isResizing = false;
    let anchorIdx = 0,
      handleIdx = 0;

    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      isResizing = true;

      // Find anchor (top-left) and handle (bottom-right)
      let minSum = Infinity,
        maxSum = -Infinity;
      for (let i = 0; i < points.length; i++) {
        const sum = points[i].x + points[i].y;
        if (sum < minSum) {
          minSum = sum;
          anchorIdx = i;
        }
        if (sum > maxSum) {
          maxSum = sum;
          handleIdx = i;
        }
      }

      const onMove = (ev: MouseEvent) => {
        if (!isResizing) return;
        const curr = getSVGCoordsFromClient(svg!, ev.clientX, ev.clientY);

        const adj1 = (anchorIdx + 1) % 4;
        const adj2 = (anchorIdx + 3) % 4;

        // Move the handle point to cursor
        points[handleIdx].x = curr.x;
        points[handleIdx].y = curr.y;

        // Project adjacents to maintain rectangle
        points[adj1].x = curr.x;
        points[adj1].y = points[anchorIdx].y;
        points[adj2].x = points[anchorIdx].x;
        points[adj2].y = curr.y;

        get().updateRectPath(rectPath);
      };

      const onUp = () => {
        isResizing = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  },

  updateRectPath: (rectPath: SVGPathElement) => {
    const points = (rectPath as any)._rectPoints;
    if (!points) return;

    const d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
    rectPath.setAttribute("d", d);

    // Update handle if present
    const handle = (rectPath as any)._resizeHandle;
    if (handle) {
      let idx = 0;
      let maxSum = -Infinity;
      for (let i = 0; i < points.length; i++) {
        const sum = points[i].x + points[i].y;
        if (sum > maxSum) {
          maxSum = sum;
          idx = i;
        }
      }
      handle.setAttribute("cx", points[idx].x.toString());
      handle.setAttribute("cy", points[idx].y.toString());
    }
  },

  makeRectPathInteractive: (rectPath: SVGPathElement) => {
    // Select on click
    rectPath.addEventListener("click", (e) => {
      e.stopPropagation();
      get().selectRectPath(rectPath);
    });

    // Drag on mousedown
    rectPath.addEventListener("mousedown", (e) => {
      const { selectedRectPath } = get();
      if (selectedRectPath !== rectPath) return;

      get().startRectPathDrag(rectPath, e.clientX, e.clientY);
      e.stopPropagation();
    });
  },

  deleteRectPath: (rectPath: SVGPathElement) => {
    // Remove from DOM
    rectPath.remove();
    const handle = (rectPath as any)._resizeHandle;
    if (handle) {
      handle.remove();
    }

    // Clear selection if this was selected
    const { selectedRectPath } = get();
    if (selectedRectPath === rectPath) {
      set({ selectedRectPath: null });
    }
  },

  rotateRectPath: (rectPath: SVGPathElement, angleDeg: number) => {
    const points = (rectPath as any)._rectPoints;
    if (!points) return;

    // Find center
    const cx = points.reduce((sum: number, pt: any) => sum + pt.x, 0) / 4;
    const cy = points.reduce((sum: number, pt: any) => sum + pt.y, 0) / 4;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Update points IN PLACE
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const dx = pt.x - cx,
        dy = pt.y - cy;
      pt.x = cx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      pt.y = cy + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
    }

    get().updateRectPath(rectPath);
    // rectPath.setAttribute("stroke", "#f44336"); // keep red
  },

  deselectRectPath: () => {
    const { selectedRectPath } = get();
    if (selectedRectPath) {
      // Restore previous color
      const prev = selectedRectPath.getAttribute("data-prev-stroke") || "#000";
      selectedRectPath.setAttribute("stroke", prev);

      // Remove resize handle
      const handle = (selectedRectPath as any)._resizeHandle;
      if (handle) {
        handle.remove();
        (selectedRectPath as any)._resizeHandle = undefined;
      }

      // Clear selection
      set({ selectedRectPath: null });
    }
  },

  // 🖊️ PEN TOOL METHODS - WORK LIKE VANILLA
  togglePenMode: () => {
    const { penMode, currentPenPath } = get();
    if (penMode && currentPenPath) {
      get().finishPenPath();
    }
    set({ penMode: !penMode });
  },

  startPenPath: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
    shiftKey: boolean
  ) => {
    const svgCoords = getSVGCoordsFromClient(svg, clientX, clientY);
    let x = svgCoords.x;
    let y = svgCoords.y;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", "#000");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("data-prev-stroke", "#000");
    svg.appendChild(path);

    const newPath: PenPath = {
      points: [],
      path: path,
      closed: false,
    };

    const newPt: PenPoint = { x, y };

    // Create anchor elements
    newPt.anchorCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    newPt.anchorCircle.setAttribute("cx", x.toString());
    newPt.anchorCircle.setAttribute("cy", y.toString());
    newPt.anchorCircle.setAttribute("r", "7");
    newPt.anchorCircle.setAttribute("fill", "rgba(0,0,0,0)");
    newPt.anchorCircle.setAttribute("stroke", "none");
    newPt.anchorCircle.style.cursor = "pointer";
    svg.appendChild(newPt.anchorCircle);

    newPt.anchorDot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    newPt.anchorDot.setAttribute("cx", x.toString());
    newPt.anchorDot.setAttribute("cy", y.toString());
    newPt.anchorDot.setAttribute("r", "3");
    newPt.anchorDot.setAttribute("fill", "rgb(0,0,0)");
    newPt.anchorDot.style.pointerEvents = "none";
    svg.appendChild(newPt.anchorDot);

    newPath.points.push(newPt);

    set({ currentPenPath: newPath });
    get().updatePenPath(newPath, false);
  },

  addPenPoint: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
    shiftKey: boolean
  ) => {
    const { currentPenPath } = get();
    if (!currentPenPath) return;

    const svgCoords = getSVGCoordsFromClient(svg, clientX, clientY);
    let x = svgCoords.x;
    let y = svgCoords.y;

    // Shift key constraint
    if (shiftKey && currentPenPath.points.length > 0) {
      const prev = currentPenPath.points[currentPenPath.points.length - 1];
      const dx = x - prev.x;
      const dy = y - prev.y;
      const angle = Math.atan2(dy, dx);
      const length = Math.sqrt(dx * dx + dy * dy);
      const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      x = prev.x + Math.cos(snapAngle) * length;
      y = prev.y + Math.sin(snapAngle) * length;
    }

    const newPt: PenPoint = { x, y };

    // Create anchor elements
    newPt.anchorCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    newPt.anchorCircle.setAttribute("cx", x.toString());
    newPt.anchorCircle.setAttribute("cy", y.toString());
    newPt.anchorCircle.setAttribute("r", "7");
    newPt.anchorCircle.setAttribute("fill", "rgba(0,0,0,0)");
    newPt.anchorCircle.setAttribute("stroke", "none");
    newPt.anchorCircle.style.cursor = "pointer";
    svg.appendChild(newPt.anchorCircle);

    newPt.anchorDot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    newPt.anchorDot.setAttribute("cx", x.toString());
    newPt.anchorDot.setAttribute("cy", y.toString());
    newPt.anchorDot.setAttribute("r", "3");
    newPt.anchorDot.setAttribute("fill", "rgb(0,0,0)");
    newPt.anchorDot.style.pointerEvents = "none";
    svg.appendChild(newPt.anchorDot);

    currentPenPath.points.push(newPt);

    get().updatePenPath(currentPenPath, false);
  },

  finishPenPath: (close = false) => {
    const { currentPenPath, finishedPenPaths } = get();
    if (!currentPenPath) return;

    if (close && currentPenPath.points.length > 1) {
      currentPenPath.closed = true;
    }

    const firstPt = currentPenPath.points[0];
    if (firstPt && firstPt.anchorCircle) {
      firstPt.anchorCircle.setAttribute("fill", "rgba(0,0,0,0)");
    }

    const currentStroke = currentPenPath.path.getAttribute("stroke") || "#000";
    if (!currentPenPath.path.getAttribute("data-prev-stroke")) {
      currentPenPath.path.setAttribute("data-prev-stroke", currentStroke);
    }

    // Make path clickable
    currentPenPath.path.style.cursor = "pointer";
    currentPenPath.path.addEventListener("click", (e) => {
      e.stopPropagation();
      get().selectPenPath(currentPenPath);
    });

    set({
      finishedPenPaths: [...finishedPenPaths, currentPenPath],
      currentPenPath: null,
      penDragging: null,
    });

    get().updatePenPath(currentPenPath, true);
    get().clearPenPreview();
  },

  selectPenPath: (path: PenPath | null) => {
    const { selectedPenPath } = get();

    if (selectedPenPath && selectedPenPath !== path) {
      const prevStroke =
        selectedPenPath.path.getAttribute("data-prev-stroke") || "#000";
      selectedPenPath.path.setAttribute("stroke", prevStroke);
      get().updatePenPath(selectedPenPath, true);
    }

    set({ selectedPenPath: path });

    if (path) {
      const currentStroke = path.path.getAttribute("stroke") || "#000";
      if (!path.path.getAttribute("data-prev-stroke")) {
        path.path.setAttribute("data-prev-stroke", currentStroke);
      }
      // Set to red for selection
      path.path.setAttribute("stroke", "#f44336");
      get().updatePenPath(path, false);
    }
  },

  deselectPenPath: () => {
    const { selectedPenPath } = get();
    if (selectedPenPath) {
      const prevStroke =
        selectedPenPath.path.getAttribute("data-prev-stroke") || "#000";
      selectedPenPath.path.setAttribute("stroke", prevStroke);

      // Hide handles by calling updatePenPath after setting selectedPenPath to null
      set({ selectedPenPath: null });
      get().updatePenPath(selectedPenPath, true);
    } else {
      set({ selectedPenPath: null });
    }
  },

  startPenDrag: (
    point: PenPoint,
    type: "anchor" | "handleIn" | "handleOut",
    offsetX: number,
    offsetY: number
  ) => {
    // Mark the point as being created for handle generation
    if (!point._dragStart) {
      point._dragStart = { x: point.x, y: point.y };
    }

    set({
      penDragging: { point, type, offsetX, offsetY },
    });
  },

  updatePenDrag: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
    shiftKey: boolean,
    altKey: boolean
  ) => {
    const { penDragging, currentPenPath, selectedPenPath } = get();
    if (!penDragging) return;

    // Clear preview while dragging handles
    get().clearPenPreview();

    const pathObj = currentPenPath || selectedPenPath;
    if (!pathObj) return;

    const svgCoords = getSVGCoordsFromClient(svg, clientX, clientY);
    const pt = penDragging.point;

    // ... rest of your existing updatePenDrag code stays exactly the same
    if (penDragging.type === "anchor") {
      const oldX = pt.x;
      const oldY = pt.y;

      pt.x = svgCoords.x - penDragging.offsetX;
      pt.y = svgCoords.y - penDragging.offsetY;

      pt.anchorCircle?.setAttribute("cx", pt.x.toString());
      pt.anchorCircle?.setAttribute("cy", pt.y.toString());
      pt.anchorDot?.setAttribute("cx", pt.x.toString());
      pt.anchorDot?.setAttribute("cy", pt.y.toString());

      // Move handles with the anchor
      const dx = pt.x - oldX;
      const dy = pt.y - oldY;

      if (pt.handleIn) {
        pt.handleIn.x += dx;
        pt.handleIn.y += dy;
      }
      if (pt.handleOut) {
        pt.handleOut.x += dx;
        pt.handleOut.y += dy;
      }
    } else if (penDragging.type === "handleIn") {
      let x = svgCoords.x - penDragging.offsetX;
      let y = svgCoords.y - penDragging.offsetY;

      if (shiftKey) {
        const dx = x - pt.x;
        const dy = y - pt.y;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        x = pt.x + Math.cos(snapAngle) * length;
        y = pt.y + Math.sin(snapAngle) * length;
      }

      pt.handleIn = { x, y };

      if (!altKey) {
        const dx = pt.x - pt.handleIn.x;
        const dy = pt.y - pt.handleIn.y;
        pt.handleOut = { x: pt.x + dx, y: pt.y + dy };
      }
    } else if (penDragging.type === "handleOut") {
      let x = svgCoords.x - penDragging.offsetX;
      let y = svgCoords.y - penDragging.offsetY;

      if (shiftKey) {
        const dx = x - pt.x;
        const dy = y - pt.y;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        x = pt.x + Math.cos(snapAngle) * length;
        y = pt.y + Math.sin(snapAngle) * length;
      }

      pt.handleOut = { x, y };

      // Only create opposite handle if not holding Alt key
      if (!altKey) {
        const dx = pt.x - pt.handleOut.x;
        const dy = pt.y - pt.handleOut.y;
        pt.handleIn = { x: pt.x + dx, y: pt.y + dy };
      }
    }

    get().updatePenPath(pathObj, false);
  },

  stopPenDrag: () => {
    const { penDragging } = get();

    if (penDragging && penDragging.point._dragStart) {
      const pt = penDragging.point;
      const dx = pt.handleOut ? pt.handleOut.x - pt.x : 0;
      const dy = pt.handleOut ? pt.handleOut.y - pt.y : 0;

      // If we didn't drag much, remove the handles (straight line)
      const dragDistance = Math.sqrt(dx * dx + dy * dy);
      if (dragDistance < 2) {
        pt.handleOut = undefined;
        pt.handleIn = undefined;
      }

      // Clean up the drag start marker
      delete pt._dragStart;
    }

    set({ penDragging: null });
  },

  startPenHandleFromClick: (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number
  ) => {
    const { currentPenPath } = get();
    if (!currentPenPath || currentPenPath.points.length === 0) return false;

    const svgCoords = getSVGCoordsFromClient(svg, clientX, clientY);
    const lastPt = currentPenPath.points[currentPenPath.points.length - 1];

    // Check if clicking on the last added point
    const distance = Math.hypot(svgCoords.x - lastPt.x, svgCoords.y - lastPt.y);
    if (distance < 12) {
      // Use existing startPenDrag method
      get().startPenDrag(lastPt, "handleOut", 0, 0);
      return true; // Consumed the event
    }

    return false; // Did not consume
  },

  startPathDrag: (clientX: number, clientY: number) => {
    const { selectedPenPath } = get();
    if (!selectedPenPath) return;

    set({
      isPathDragging: true,
      dragStart: { x: clientX, y: clientY, seatX: 0, seatY: 0 },
    });
  },

  updatePathDrag: (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const { selectedPenPath, isPathDragging, dragStart } = get();
    if (!isPathDragging || !selectedPenPath || !dragStart) return;

    // Calculate movement delta
    const currentCoords = getSVGCoordsFromClient(svg, clientX, clientY);
    const startCoords = getSVGCoordsFromClient(svg, dragStart.x, dragStart.y);
    const dx = currentCoords.x - startCoords.x;
    const dy = currentCoords.y - startCoords.y;

    // Move all points and handles
    selectedPenPath.points.forEach((pt) => {
      pt.x += dx;
      pt.y += dy;

      // Update anchor visual elements
      pt.anchorCircle?.setAttribute("cx", pt.x.toString());
      pt.anchorCircle?.setAttribute("cy", pt.y.toString());
      pt.anchorDot?.setAttribute("cx", pt.x.toString());
      pt.anchorDot?.setAttribute("cy", pt.y.toString());

      // Move handles
      if (pt.handleIn) {
        pt.handleIn.x += dx;
        pt.handleIn.y += dy;
      }
      if (pt.handleOut) {
        pt.handleOut.x += dx;
        pt.handleOut.y += dy;
      }
    });

    // Update drag start position for next frame
    set({ dragStart: { x: clientX, y: clientY, seatX: 0, seatY: 0 } });

    // Redraw the path with updated coordinates
    get().updatePenPath(selectedPenPath, false);
  },

  stopPathDrag: () => {
    set({
      isPathDragging: false,
      dragStart: null,
    });
  },

  deletePenPath: (path: PenPath) => {
    const { finishedPenPaths } = get();

    // Remove DOM elements
    path.path.remove();
    path.points.forEach((pt) => {
      pt.anchorCircle?.remove();
      pt.anchorDot?.remove();
      pt.handleInCircle?.remove();
      pt.handleOutCircle?.remove();
      pt.handleLineIn?.remove();
      pt.handleLineOut?.remove();
    });

    set({
      finishedPenPaths: finishedPenPaths.filter((p) => p !== path),
      selectedPenPath: null,
    });
  },

  rotatePenPath: (path: PenPath, angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;

    // Calculate center point
    const centerX =
      path.points.reduce((sum, pt) => sum + pt.x, 0) / path.points.length;
    const centerY =
      path.points.reduce((sum, pt) => sum + pt.y, 0) / path.points.length;

    // Rotate each point
    path.points.forEach((pt) => {
      const dx = pt.x - centerX;
      const dy = pt.y - centerY;
      pt.x = centerX + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      pt.y = centerY + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

      // Update anchor position
      pt.anchorCircle?.setAttribute("cx", pt.x.toString());
      pt.anchorCircle?.setAttribute("cy", pt.y.toString());
      pt.anchorDot?.setAttribute("cx", pt.x.toString());
      pt.anchorDot?.setAttribute("cy", pt.y.toString());

      // Rotate handles
      if (pt.handleIn) {
        const hdx = pt.handleIn.x - centerX;
        const hdy = pt.handleIn.y - centerY;
        pt.handleIn.x =
          centerX + hdx * Math.cos(angleRad) - hdy * Math.sin(angleRad);
        pt.handleIn.y =
          centerY + hdx * Math.sin(angleRad) + hdy * Math.cos(angleRad);
      }
      if (pt.handleOut) {
        const hdx = pt.handleOut.x - centerX;
        const hdy = pt.handleOut.y - centerY;
        pt.handleOut.x =
          centerX + hdx * Math.cos(angleRad) - hdy * Math.sin(angleRad);
        pt.handleOut.y =
          centerY + hdx * Math.sin(angleRad) + hdy * Math.cos(angleRad);
      }
    });

    get().updatePenPath(path, false);
  },

  updatePenPathStroke: (path: PenPath, color: string) => {
    if (!path || !path.path) return;

    // Always store the new color as the "actual" color
    path.path.setAttribute("data-prev-stroke", color);

    // If this path is currently selected, keep it red visually
    const { selectedPenPath } = get();
    if (selectedPenPath === path) {
      // Keep selection color (red) but store the actual color
      path.path.setAttribute("stroke", "#f44336");
    } else {
      // Apply the new color immediately if not selected
      path.path.setAttribute("stroke", color);
    }
  },

  updatePenPathStrokeWidth: (path: PenPath, width: number) => {
    path.path.setAttribute("stroke-width", width.toString());
  },

  removePenPoint: () => {
    const { currentPenPath } = get();
    if (!currentPenPath || currentPenPath.points.length === 0) return;

    const pt = currentPenPath.points.pop();
    if (pt) {
      pt.anchorCircle?.remove();
      pt.anchorDot?.remove();
      pt.handleInCircle?.remove();
      pt.handleOutCircle?.remove();
      pt.handleLineIn?.remove();
      pt.handleLineOut?.remove();
    }

    if (currentPenPath.points.length === 0) {
      currentPenPath.path.remove();
      set({ currentPenPath: null });
    } else {
      get().updatePenPath(currentPenPath, false);
    }
  },

  checkPenPathSnap: (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const { currentPenPath, penPreviewLine, penPreviewHandle } = get();
    if (!currentPenPath || currentPenPath.points.length === 0) return;

    const svgCoords = getSVGCoordsFromClient(svg, clientX, clientY);
    const lastPt = currentPenPath.points[currentPenPath.points.length - 1];

    // Remove existing preview
    penPreviewLine?.remove();
    penPreviewHandle?.remove();

    // Create shift-constrained coordinates if needed
    let previewX = svgCoords.x;
    let previewY = svgCoords.y;

    // Check for shift key constraint
    const shiftKey = (window.event as any)?.shiftKey || false;
    if (shiftKey) {
      const dx = previewX - lastPt.x;
      const dy = previewY - lastPt.y;
      const angle = Math.atan2(dy, dx);
      const length = Math.sqrt(dx * dx + dy * dy);
      const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      previewX = lastPt.x + Math.cos(snapAngle) * length;
      previewY = lastPt.y + Math.sin(snapAngle) * length;
    }

    // Create handle preview line if last point has handleOut
    if (lastPt.handleOut) {
      const newPenPreviewHandle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      newPenPreviewHandle.setAttribute("x1", lastPt.x.toString());
      newPenPreviewHandle.setAttribute("y1", lastPt.y.toString());
      newPenPreviewHandle.setAttribute("x2", lastPt.handleOut.x.toString());
      newPenPreviewHandle.setAttribute("y2", lastPt.handleOut.y.toString());
      newPenPreviewHandle.setAttribute("stroke", "#bbb");
      newPenPreviewHandle.setAttribute("stroke-dasharray", "2,2");
      svg.appendChild(newPenPreviewHandle);
      set({ penPreviewHandle: newPenPreviewHandle });
    }

    // Create main preview line
    const newPenPreviewLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    newPenPreviewLine.setAttribute("x1", lastPt.x.toString());
    newPenPreviewLine.setAttribute("y1", lastPt.y.toString());
    newPenPreviewLine.setAttribute("x2", previewX.toString());
    newPenPreviewLine.setAttribute("y2", previewY.toString());
    newPenPreviewLine.setAttribute("stroke", "#2196f3"); // Blue like vanilla
    newPenPreviewLine.setAttribute("stroke-dasharray", "4,2");
    svg.appendChild(newPenPreviewLine);
    set({ penPreviewLine: newPenPreviewLine });

    // Snap highlight for first point (path closing)
    const firstPt = currentPenPath.points[0];
    if (firstPt && currentPenPath.points.length > 1) {
      const distance = Math.hypot(previewX - firstPt.x, previewY - firstPt.y);
      if (distance < 12) {
        firstPt.anchorCircle?.setAttribute("fill", "#f44336"); // Red when close
      } else {
        firstPt.anchorCircle?.setAttribute("fill", "rgba(0,0,0,0)"); // Transparent normal
      }
    }
  },

  clearPenPreview: () => {
    const { penPreviewLine, penPreviewHandle } = get();
    penPreviewLine?.remove();
    penPreviewHandle?.remove();
    set({ penPreviewLine: null, penPreviewHandle: null });
  },

  updatePenPath: (pathObj: PenPath, hideHandles = false) => {
    // Remove existing handles
    pathObj.points.forEach((pt) => {
      pt.handleLineIn?.remove();
      pt.handleLineOut?.remove();
      pt.handleInCircle?.remove();
      pt.handleOutCircle?.remove();
    });

    // Show handles if: 1) Not explicitly hiding AND 2) Path is selected OR currently being created
    const { selectedPenPath, currentPenPath } = get();
    const showHandles =
      !hideHandles &&
      (pathObj === selectedPenPath || pathObj === currentPenPath);

    if (showHandles) {
      pathObj.points.forEach((pt) => {
        // Create handle lines and circles with proper event handlers
        if (pt.handleIn) {
          // Handle line (grey dashed)
          pt.handleLineIn = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          pt.handleLineIn.setAttribute("x1", pt.x.toString());
          pt.handleLineIn.setAttribute("y1", pt.y.toString());
          pt.handleLineIn.setAttribute("x2", pt.handleIn.x.toString());
          pt.handleLineIn.setAttribute("y2", pt.handleIn.y.toString());
          pt.handleLineIn.setAttribute("stroke", "#bbb");
          pt.handleLineIn.setAttribute("stroke-width", "1");
          pt.handleLineIn.setAttribute("stroke-dasharray", "3,3");
          pt.handleLineIn.style.pointerEvents = "none";
          pathObj.path.parentNode?.appendChild(pt.handleLineIn);

          // Handle circle with drag events
          pt.handleInCircle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          pt.handleInCircle.setAttribute("cx", pt.handleIn.x.toString());
          pt.handleInCircle.setAttribute("cy", pt.handleIn.y.toString());
          pt.handleInCircle.setAttribute("r", "4");
          pt.handleInCircle.setAttribute("fill", "#ff9800");
          pt.handleInCircle.setAttribute("stroke", "#fff");
          pt.handleInCircle.setAttribute("stroke-width", "1");
          pt.handleInCircle.style.cursor = "pointer";

          // Add drag event handlers only for finished paths
          if (pathObj === selectedPenPath) {
            pt.handleInCircle.addEventListener("mousedown", (e) => {
              e.stopPropagation();
              const rect = pt.handleInCircle!.getBoundingClientRect();
              const offsetX = e.clientX - rect.left - rect.width / 2;
              const offsetY = e.clientY - rect.top - rect.height / 2;
              get().startPenDrag(pt, "handleIn", offsetX, offsetY);
            });
          }

          pathObj.path.parentNode?.appendChild(pt.handleInCircle);
        }

        if (pt.handleOut) {
          // Handle line (grey dashed)
          pt.handleLineOut = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          pt.handleLineOut.setAttribute("x1", pt.x.toString());
          pt.handleLineOut.setAttribute("y1", pt.y.toString());
          pt.handleLineOut.setAttribute("x2", pt.handleOut.x.toString());
          pt.handleLineOut.setAttribute("y2", pt.handleOut.y.toString());
          pt.handleLineOut.setAttribute("stroke", "#bbb");
          pt.handleLineOut.setAttribute("stroke-width", "1");
          pt.handleLineOut.setAttribute("stroke-dasharray", "3,3");
          pt.handleLineOut.style.pointerEvents = "none";
          pathObj.path.parentNode?.appendChild(pt.handleLineOut);

          // Handle circle with drag events
          pt.handleOutCircle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          pt.handleOutCircle.setAttribute("cx", pt.handleOut.x.toString());
          pt.handleOutCircle.setAttribute("cy", pt.handleOut.y.toString());
          pt.handleOutCircle.setAttribute("r", "4");
          pt.handleOutCircle.setAttribute("fill", "#ff9800");
          pt.handleOutCircle.setAttribute("stroke", "#fff");
          pt.handleOutCircle.setAttribute("stroke-width", "1");
          pt.handleOutCircle.style.cursor = "pointer";

          // Add drag event handlers only for finished paths
          if (pathObj === selectedPenPath) {
            pt.handleOutCircle.addEventListener("mousedown", (e) => {
              e.stopPropagation();
              const rect = pt.handleOutCircle!.getBoundingClientRect();
              const offsetX = e.clientX - rect.left - rect.width / 2;
              const offsetY = e.clientY - rect.top - rect.height / 2;
              get().startPenDrag(pt, "handleOut", offsetX, offsetY);
            });
          }

          pathObj.path.parentNode?.appendChild(pt.handleOutCircle);
        }

        // Make anchor points draggable (only for finished paths)
        if (pt.anchorCircle && pathObj === selectedPenPath) {
          pt.anchorCircle.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            const rect = pt.anchorCircle!.getBoundingClientRect();
            const offsetX = e.clientX - rect.left - rect.width / 2;
            const offsetY = e.clientY - rect.top - rect.height / 2;
            get().startPenDrag(pt, "anchor", offsetX, offsetY);
          });
        }
      });

      // Make the path itself draggable for moving the entire path (only for finished paths)
      if (pathObj === selectedPenPath) {
        pathObj.path.addEventListener("mousedown", (e) => {
          // Only start path drag if not clicking on handles or anchors
          if (e.target === pathObj.path) {
            e.stopPropagation();
            get().startPathDrag(e.clientX, e.clientY);
          }
        });
      }
    }

    // Build and update path string
    let d = "";
    for (let i = 0; i < pathObj.points.length; i++) {
      const pt = pathObj.points[i];
      if (i === 0) {
        d += `M ${pt.x} ${pt.y}`;
      } else {
        const prevPt = pathObj.points[i - 1];
        const c1 = prevPt.handleOut || prevPt;
        const c2 = pt.handleIn || pt;
        d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${pt.x} ${pt.y}`;
      }
    }

    // Close path if needed
    if (pathObj.closed && pathObj.points.length > 1) {
      const first = pathObj.points[0];
      const last = pathObj.points[pathObj.points.length - 1];
      const c1 = last.handleOut || last;
      const c2 = first.handleIn || first;
      d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${first.x} ${first.y} Z`;
    }

    pathObj.path.setAttribute("d", d);

    // Set path color based on selection
    if (selectedPenPath && pathObj === selectedPenPath) {
      pathObj.path.setAttribute("stroke", "#f44336"); // Red for selected
    } else {
      const prevStroke =
        pathObj.path.getAttribute("data-prev-stroke") || "#000";
      pathObj.path.setAttribute("stroke", prevStroke);
    }
  },

  // 💺 ALL OTHER SEAT METHODS REMAIN THE SAME
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

    const svgElement = document.querySelector(".seat-canvas") as SVGSVGElement;
    if (!svgElement) return;

    const currentSVGCoords = getSVGCoordsFromClient(
      svgElement,
      clientX,
      clientY
    );

    const startSVGCoords = getSVGCoordsFromClient(
      svgElement,
      dragStart.x,
      dragStart.y
    );

    const dx = currentSVGCoords.x - startSVGCoords.x;
    const dy = currentSVGCoords.y - startSVGCoords.y;

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

  // 🔍 ZOOM/PAN METHODS REMAIN THE SAME
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
