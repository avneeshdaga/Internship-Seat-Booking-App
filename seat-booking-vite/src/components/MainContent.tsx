import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useSeatStore } from '../hooks/useSeatStore';
import { useSVGUtils } from '../hooks/useSVGUtils';
import SVGSeat from './shared/SVGSeat';
import ZoomControls from './shared/ZoomControls';
import { Seat } from '../types';

interface MainContentProps {
  mode: 'admin' | 'user';
}

const MainContent: React.FC<MainContentProps> = ({ mode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);

  const {
    // Core state
    currentSeats,
    selectedSeats,
    occupiedSeats,
    pricePerSeat,

    // User actions
    toggleSeatSelection,
    maxSelectableSeats,

    // Admin state
    addMode,

    // Pan/Zoom state
    isPanning,
    isDesignerPanning,
    startPanning,
    updatePan,
    stopPanning,
    userZoomLevel,
    designerZoomLevel,
    setUserZoom,
    setDesignerZoom,

    // Phase 4: Designer state
    selectedDesignerSeat,
    selectDesignerSeat,
    deleteSelectedSeat,
    addSeat,
    updateSeatPosition,

    // Phase 4: Enhanced drag state
    isDragging,
    dragTarget,
    startSeatDrag,
    updateSeatDrag,
    stopSeatDrag,
  } = useSeatStore();

  const {
    getUserViewBox,
    getDesignerViewBox,
    handleWheelZoom
  } = useSVGUtils();

  // Fix the escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'admin' && e.key === 'Delete' && selectedDesignerSeat) {
        deleteSelectedSeat();
      }
      if (mode === 'admin' && e.key === 'Escape') {
        selectDesignerSeat(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedDesignerSeat, deleteSelectedSeat, selectDesignerSeat]);

  // Global drag handlers 
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && dragTarget) {
        updateSeatDrag(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        stopSeatDrag();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragTarget, updateSeatDrag, stopSeatDrag]);

  // Generate next available seat ID (Phase 4)
  const getNextAvailableSeatId = useCallback((): string => {
    const usedNumbers = new Set<number>();
    currentSeats.forEach(seat => {
      const id = seat.id;
      if (id && /^Seat\d+$/.test(id)) {
        const num = parseInt(id.replace('Seat', ''), 10);
        if (!isNaN(num)) usedNumbers.add(num);
      }
    });

    let next = 1;
    while (usedNumbers.has(next)) next++;
    return `Seat${next}`;
  }, [currentSeats]);

  // Get SVG coordinates from mouse/touch position
  const getSVGCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgRef.current.getScreenCTM();

    if (ctm) {
      const coords = pt.matrixTransform(ctm.inverse());
      return { x: coords.x, y: coords.y };
    }

    return { x: clientX, y: clientY };
  }, []);

  // Main seat click handler
  const handleSeatClick = useCallback((seatId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (mode === 'admin') {
      // Admin mode: select seat for editing
      selectDesignerSeat(seatId);
      console.log('Admin selected seat:', seatId);
    } else {
      // User mode: toggle seat selection
      const seat = currentSeats.find(s => s.id === seatId);
      if (!seat || seat.occupied) return;

      // Check max selection limit
      if (!selectedSeats.has(seatId) && maxSelectableSeats && selectedSeats.size >= maxSelectableSeats) {
        alert(`You can only select ${maxSelectableSeats} seats.`);
        return;
      }

      toggleSeatSelection(seatId);
    }
  }, [mode, selectDesignerSeat, currentSeats, selectedSeats, maxSelectableSeats, toggleSeatSelection]);

  // SVG canvas click handler (Phase 4: Add Seat)
  const handleSVGClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // Only handle clicks on the SVG background itself
    if (e.target !== svgRef.current) return;

    if (mode === 'admin' && addMode) {
      // Add seat functionality
      const svgCoords = getSVGCoords(e.clientX, e.clientY);
      const seatId = getNextAvailableSeatId();

      // Create new seat with default properties
      const newSeat: Seat = {
        id: seatId,
        cx: svgCoords.x,
        cy: svgCoords.y,
        r: 12, // Default radius
        fill: '#4caf50', // Green for new seats
        stroke: '#2e7d32',
        occupied: false,
        selected: false
      };

      // Add seat to store
      addSeat(newSeat);

      // Auto-select the new seat for editing
      selectDesignerSeat(seatId);

      console.log('Added new seat:', seatId, 'at', svgCoords.x, svgCoords.y);
    } else if (mode === 'admin') {
      // Click on empty space deselects current seat
      selectDesignerSeat(null);
    }
  }, [mode, addMode, getSVGCoords, getNextAvailableSeatId, addSeat, selectDesignerSeat]);

  // Mouse down handler for panning (but not when dragging seats)
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current && !isDragging) {
      startPanning(mode === 'admin', e.clientX, e.clientY);
    }
  }, [mode, startPanning, isDragging]);

  // Mouse move handler for panning (but not when dragging seats)
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging && (isPanning || isDesignerPanning)) {
      updatePan(mode === 'admin', e.clientX, e.clientY);
    }
  }, [mode, isPanning, isDesignerPanning, updatePan, isDragging]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    if (!isDragging) {
      stopPanning();
    }
  }, [stopPanning, isDragging]);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    setTouchStartTime(Date.now());

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (!isDragging) {
        startPanning(mode === 'admin', touch.clientX, touch.clientY);
      }
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      setLastTouchDistance(distance);
      stopPanning();
    }
  }, [mode, startPanning, stopPanning, isDragging]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();

    if (e.touches.length === 1 && (isPanning || isDesignerPanning) && !isDragging) {
      const touch = e.touches[0];
      updatePan(mode === 'admin', touch.clientX, touch.clientY);
    } else if (e.touches.length === 2 && lastTouchDistance) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      const zoomChange = distance / lastTouchDistance;
      const currentZoom = mode === 'admin' ? designerZoomLevel : userZoomLevel;
      const newZoom = Math.max(1, Math.min(3, currentZoom * zoomChange));

      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      if (mode === 'admin') {
        setDesignerZoom(newZoom, centerX, centerY);
      } else {
        setUserZoom(newZoom, centerX, centerY);
      }

      setLastTouchDistance(distance);
    }
  }, [mode, isPanning, isDesignerPanning, updatePan, lastTouchDistance,
    designerZoomLevel, userZoomLevel, setDesignerZoom, setUserZoom, isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const touchDuration = Date.now() - touchStartTime;

    if (e.changedTouches.length === 1 && touchDuration < 200 && !isPanning && !isDesignerPanning && !isDragging) {
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);

      if (target && target.closest('.seat-group')) {
        const seatGroup = target.closest('.seat-group');
        const seatId = seatGroup?.getAttribute('data-seat-id');

        if (seatId) {
          const mockEvent = {
            stopPropagation: () => { },
            clientX: touch.clientX,
            clientY: touch.clientY
          } as React.MouseEvent;

          handleSeatClick(seatId, mockEvent);
        }
      } else if (mode === 'admin' && addMode) {
        // Touch to add seat
        const svgCoords = getSVGCoords(touch.clientX, touch.clientY);
        const seatId = getNextAvailableSeatId();

        const newSeat: Seat = {
          id: seatId,
          cx: svgCoords.x,
          cy: svgCoords.y,
          r: 12,
          fill: '#4caf50',
          stroke: '#2e7d32',
          occupied: false,
          selected: false
        };

        addSeat(newSeat);
        selectDesignerSeat(seatId);
      }
    }

    stopPanning();
    setLastTouchDistance(null);
  }, [touchStartTime, isPanning, isDesignerPanning, mode, addMode,
    stopPanning, handleSeatClick, getSVGCoords, getNextAvailableSeatId,
    addSeat, selectDesignerSeat, isDragging]);

  // Get viewBox based on mode
  const getViewBox = () => {
    return mode === 'admin' ? getDesignerViewBox() : getUserViewBox();
  };

  // Get cursor style based on current state
  const getCursor = () => {
    if (isDragging) return 'grabbing';
    if (isPanning || isDesignerPanning) return 'grabbing';
    if (mode === 'admin' && addMode) return 'crosshair';
    return 'grab';
  };

  return (
    <main className="main-content">
      <div className="canvas-container">
        <div className="canvas-header">
          <h2>
            {mode === 'admin' ? 'Layout Designer' : 'Seat Selection'}
            {mode === 'admin' && addMode && <span className="tool-indicator"> - Add Seat Mode</span>}
            {mode === 'admin' && isDragging && <span className="tool-indicator"> - Dragging Seat</span>}
          </h2>
          <ZoomControls mode={mode} />
        </div>

        <div className="canvas-wrapper">
          <svg
            ref={svgRef}
            className="seat-canvas"
            width="100%"
            height="600"
            viewBox={getViewBox()}
            style={{
              cursor: getCursor(), 
              background: 'white',
              minWidth: '600px',
              minHeight: '400px'
            }}
            preserveAspectRatio="xMidYMid meet"
            onWheel={(e) => handleWheelZoom(e, mode === 'admin')}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleSVGClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {currentSeats.map((seat) => (
              <SVGSeat
                key={seat.id}
                seat={seat}
                mode={mode}
                isSelected={mode === 'admin' ? selectedDesignerSeat === seat.id : selectedSeats.has(seat.id)}
                isOccupied={seat.occupied || occupiedSeats.has(seat.id)}
                onClick={(e) => handleSeatClick(seat.id, e)}
                onAdminSelect={() => selectDesignerSeat(seat.id)}
                onDragStart={(clientX, clientY) => startSeatDrag(seat.id, clientX, clientY)}
                onDragUpdate={updateSeatDrag}
                onDragEnd={stopSeatDrag}
                pricePerSeat={pricePerSeat}
              />
            ))}
          </svg>
        </div>

        <div className="canvas-footer">
          {mode === 'user' ? (
            <div className="user-info">
              <p>💡 <strong>Mobile:</strong> Tap seats to select, pinch to zoom, drag to pan</p>
              <p>🔍 <strong>Desktop:</strong> Mouse wheel to zoom, drag to pan</p>
              {selectedSeats.size > 0 && (
                <p>✅ <strong>Selected:</strong> {Array.from(selectedSeats).sort().join(', ')}</p>
              )}
            </div>
          ) : (
            <div className="admin-help">
              <p>🛠️ <strong>Admin Mode:</strong> Click seats to select, drag to move, use controls to zoom</p>
              <p>⌨️ <strong>Shortcuts:</strong> Delete key to remove selected seat, Escape to deselect</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainContent;