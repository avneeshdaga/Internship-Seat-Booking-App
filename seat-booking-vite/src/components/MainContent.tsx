import React, { useRef, useCallback, useState } from 'react';
import { useSeatStore } from '../hooks/useSeatStore';
import { useSVGUtils } from '../hooks/useSVGUtils';
import SVGSeat from './shared/SVGSeat';
import ZoomControls from './shared/ZoomControls';

interface MainContentProps {
  mode: 'admin' | 'user';
}

const MainContent: React.FC<MainContentProps> = ({ mode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  
  const {
    currentSeats,
    selectedSeats,
    occupiedSeats,
    toggleSeatSelection,
    addMode,
    maxSelectableSeats,
    countAvailableSeats,
    isPanning,
    isDesignerPanning,
    startPanning,
    updatePan,
    stopPanning,
    userZoomLevel,
    designerZoomLevel,
    setUserZoom,
    setDesignerZoom,
    pricePerSeat
  } = useSeatStore();

  const { 
    getUserViewBox, 
    getDesignerViewBox,
    handleWheelZoom
  } = useSVGUtils();

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    setTouchStartTime(Date.now());
    
    if (e.touches.length === 1) {
      // Single touch - start panning
      const touch = e.touches[0];
      startPanning(mode === 'admin', touch.clientX, touch.clientY);
    } else if (e.touches.length === 2) {
      // Two finger pinch - start zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      setLastTouchDistance(distance);
      stopPanning(); // Stop panning when zooming
    }
  }, [mode, startPanning, stopPanning]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && (isPanning || isDesignerPanning)) {
      // Single touch panning
      const touch = e.touches[0];
      updatePan(mode === 'admin', touch.clientX, touch.clientY);
    } else if (e.touches.length === 2 && lastTouchDistance) {
      // Two finger pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const zoomChange = distance / lastTouchDistance;
      const currentZoom = mode === 'admin' ? designerZoomLevel : userZoomLevel;
      const newZoom = Math.max(1, Math.min(3, currentZoom * zoomChange));
      
      // Get center point of pinch
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
      designerZoomLevel, userZoomLevel, setDesignerZoom, setUserZoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const touchDuration = Date.now() - touchStartTime;
    
    // Quick tap detection for seat selection
    if (e.changedTouches.length === 1 && touchDuration < 200 && !isPanning && !isDesignerPanning) {
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Check if tapped on a seat
      if (target && target.closest('.seat-group')) {
        const seatGroup = target.closest('.seat-group');
        const seatCircle = seatGroup?.querySelector('circle');
        const seatId = seatCircle?.getAttribute('data-seat-id');
        
        if (seatId && mode === 'user') {
          handleSeatClick(seatId);
        }
      }
    }
    
    stopPanning();
    setLastTouchDistance(null);
  }, [touchStartTime, isPanning, isDesignerPanning, mode, stopPanning]);

  const handleSeatClick = (seatId: string) => {
    if (mode === 'user') {
      const seat = currentSeats.find(s => s.id === seatId);
      if (!seat || seat.occupied) {
        // Add haptic feedback for mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
        return;
      }
      
      // Add haptic feedback for successful selection
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      toggleSeatSelection(seatId);
    }
  };

  // Rest of your existing handlers...
  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'admin' && addMode) {
      console.log('Add seat mode - click detected');
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current) {
      startPanning(mode === 'admin', e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning || isDesignerPanning) {
      updatePan(mode === 'admin', e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    stopPanning();
  };

  const getViewBox = () => {
    return mode === 'admin' ? getDesignerViewBox() : getUserViewBox();
  };

  const getCursor = () => {
    if (isPanning || isDesignerPanning) return 'grabbing';
    if (mode === 'admin' && addMode) return 'crosshair';
    return 'grab';
  };

  return (
    <main className="main-content">
      <div className="canvas-container">
        <div className="canvas-header">
          <h2>{mode === 'admin' ? 'Layout Designer' : 'Seat Selection'}</h2>
          <ZoomControls mode={mode} />
        </div>
        
        <div className="canvas-wrapper">
          <svg
            ref={svgRef}
            className="seat-canvas"
            width="100%"
            height="600"
            viewBox={getViewBox()}
            style={{ cursor: getCursor() }}
            // Mouse events
            onWheel={(e) => handleWheelZoom(e, mode === 'admin')}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleSVGClick}
            // Touch events for mobile
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            
            {/* Render seats with tooltips */}
            {currentSeats.map((seat) => (
              <SVGSeat
                key={seat.id}
                seat={seat}
                mode={mode}
                isSelected={selectedSeats.has(seat.id)}
                isOccupied={seat.occupied || occupiedSeats.has(seat.id)}
                onClick={() => handleSeatClick(seat.id)}
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
              <p>💡 <strong>Designer Mode:</strong> Use the sidebar tools to create and modify your seat layout</p>
              <p>📱 <strong>Mobile:</strong> Touch optimized for tablet/phone design work</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainContent;