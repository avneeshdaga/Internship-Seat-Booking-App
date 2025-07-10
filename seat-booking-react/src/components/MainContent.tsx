import React, { useRef, useCallback } from 'react';
import { useSeatStore } from '../hooks/useSeatStore';

interface MainContentProps {
  mode: 'admin' | 'user';
}

const MainContent: React.FC<MainContentProps> = ({ mode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const {
    currentSeats,
    selectedSeats,
    occupiedSeats,
    toggleSeatSelection,
    addMode,
    penMode,
    textMode,
    rectMode,
    shapeMode,
    maxSelectableSeats,
    countAvailableSeats,
    userZoomLevel,
    designerZoomLevel,
    userPanX,
    userPanY,
    userPanW,
    userPanH,
    designerPanX,
    designerPanY,
    designerPanW,
    designerPanH,
    startPanning,
    updatePan,
    stopPanning,
    isPanning,
    isDesignerPanning,
    setUserZoom,
    setDesignerZoom
  } = useSeatStore();

  // SVG coordinate conversion (exact replica from your script.ts)
  const getSVGCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = (mode === 'admin' ? designerPanW : userPanW) / rect.width;
    const scaleY = (mode === 'admin' ? designerPanH : userPanH) / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX + (mode === 'admin' ? designerPanX : userPanX),
      y: (clientY - rect.top) * scaleY + (mode === 'admin' ? designerPanY : userPanY)
    };
  }, [mode, designerPanW, designerPanH, designerPanX, designerPanY, userPanW, userPanH, userPanX, userPanY]);

  const handleSeatClick = (seatId: string, event: React.MouseEvent) => {
    if (mode === 'user') {
      const seat = currentSeats.find(s => s.id === seatId);
      // Check if seat exists and is not occupied
      if (!seat || seat.occupied) {
        console.log('Seat is occupied or not found:', seatId);
        return;
      }
      
      toggleSeatSelection(seatId);
    }
  };

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'admin') {
      if (addMode) {
        // Add seat logic - will be implemented in Phase 4
        const coords = getSVGCoords(e.clientX, e.clientY);
        console.log('Add seat at:', coords);
      }
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

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    const coords = getSVGCoords(e.clientX, e.clientY);
    
    if (mode === 'admin') {
      setDesignerZoom(designerZoomLevel + direction * 0.1, coords.x, coords.y);
    } else {
      setUserZoom(userZoomLevel + direction * 0.1, coords.x, coords.y);
    }
  };

  const getSeatFill = (seat: any) => {
    if (seat.occupied) return '#d32f2f'; // Red for occupied
    if (selectedSeats.has(seat.id)) return '#4caf50'; // Green for selected
    return '#e0e0e0'; // Gray for available
  };

  const getSeatStroke = (seat: any) => {
    if (mode === 'admin') return '#222';
    if (selectedSeats.has(seat.id)) return '#2e7d32'; // Darker green border for selected
    if (seat.occupied) return '#b71c1c'; // Dark red for occupied
    return '#999';
  };

  const getSeatCursor = (seat: any) => {
    if (seat.occupied) return 'not-allowed';
    if (mode === 'admin') return addMode ? 'crosshair' : 'pointer';
    return 'pointer';
  };

  const getSeatStrokeWidth = (seat: any) => {
    if (mode === 'user' && selectedSeats.has(seat.id)) return "3";
    return mode === 'admin' ? "2" : "1";
  };

  const getActiveToolInfo = () => {
    if (mode !== 'admin') return '';
    if (addMode) return ' - Add Seat Mode';
    if (penMode) return ' - Pen Tool Active';
    if (textMode) return ' - Text Mode';
    if (rectMode) return ' - Rectangle Mode';
    if (shapeMode === 'circle') return ' - Circle Mode';
    return '';
  };

  const viewBox = mode === 'admin' 
    ? `${designerPanX} ${designerPanY} ${designerPanW} ${designerPanH}`
    : `${userPanX} ${userPanY} ${userPanW} ${userPanH}`;

  return (
    <main className="main-content">
      <div className="canvas-container">
        <div className="canvas-header">
          <h3>
            {mode === 'admin' ? 'Designer Canvas' : 'Seat Selection'}
            <span className="mode-indicator">{getActiveToolInfo()}</span>
            {mode === 'user' && maxSelectableSeats && (
              <span className="mode-indicator"> - Select {maxSelectableSeats} seats</span>
            )}
          </h3>
          <div className="canvas-info">
            <span>Total Seats: {currentSeats.length}</span>
            {mode === 'user' && (
              <>
                <span>Available: {countAvailableSeats()}</span>
                <span>Selected: {selectedSeats.size}{maxSelectableSeats ? `/${maxSelectableSeats}` : ''}</span>
                <span>Zoom: {Math.round(userZoomLevel * 100)}%</span>
              </>
            )}
            {mode === 'admin' && (
              <span>Zoom: {Math.round(designerZoomLevel * 100)}%</span>
            )}
          </div>
        </div>
        
        <div className="canvas-wrapper">
          <svg 
            ref={svgRef}
            width="100%" 
            height="500" 
            viewBox={viewBox}
            className="seat-canvas"
            onClick={handleSVGClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              background: mode === 'admin' ? '#fafafa' : '#f8fafc',
              cursor: mode === 'admin' && addMode ? 'crosshair' : 
                      (isPanning || isDesignerPanning) ? 'grabbing' : 'grab'
            }}
          >
            {/* Background grid for admin mode */}
            {mode === 'admin' && (
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
            )}
            {mode === 'admin' && (
              <rect width="100%" height="100%" fill="url(#grid)" />
            )}

            {/* Render all seats */}
            {currentSeats.map((seat) => (
              <g key={seat.id} className="seat-group">
                <circle
                  cx={seat.cx}
                  cy={seat.cy}
                  r={seat.r}
                  fill={getSeatFill(seat)}
                  stroke={getSeatStroke(seat)}
                  strokeWidth={getSeatStrokeWidth(seat)}
                  style={{ 
                    cursor: getSeatCursor(seat),
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => handleSeatClick(seat.id, e)}
                  className="seat-element"
                />
                
                {/* Seat labels */}
                <text
                  x={seat.cx}
                  y={seat.cy + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill={seat.occupied || selectedSeats.has(seat.id) ? "white" : "#666"}
                  pointerEvents="none"
                  className="seat-label"
                >
                  {seat.id}
                </text>
              </g>
            ))}

            {/* Empty state messages */}
            {mode === 'admin' && currentSeats.length === 0 && (
              <text
                x={designerPanX + designerPanW / 2}
                y={designerPanY + designerPanH / 2}
                textAnchor="middle"
                fontSize="18"
                fill="#9ca3af"
                className="empty-state"
              >
                Generate a grid or add seats to get started
              </text>
            )}

            {mode === 'user' && countAvailableSeats() === 0 && currentSeats.length > 0 && (
              <text
                x={userPanX + userPanW / 2}
                y={userPanY + userPanH / 2}
                textAnchor="middle"
                fontSize="18"
                fill="#ef4444"
                className="empty-state"
              >
                No seats available for booking
              </text>
            )}

            {mode === 'user' && currentSeats.length === 0 && (
              <text
                x={userPanX + userPanW / 2}
                y={userPanY + userPanH / 2}
                textAnchor="middle"
                fontSize="18"
                fill="#6b7280"
                className="empty-state"
              >
                No seat layout available. Please contact admin.
              </text>
            )}
          </svg>
        </div>

        {/* Canvas footer with helpful info */}
        <div className="canvas-footer">
          {mode === 'user' ? (
            <div className="user-help">
              <p>💡 <strong>How to book:</strong> Click "Set Seat Count" → Select seats → Confirm booking</p>
              <p>🎯 <strong>Legend:</strong> 
                <span className="legend-item gray">⚪ Available</span>
                <span className="legend-item green">🟢 Selected</span>
                <span className="legend-item red">🔴 Occupied</span>
              </p>
              {maxSelectableSeats && (
                <p>📊 <strong>Progress:</strong> {selectedSeats.size}/{maxSelectableSeats} seats selected</p>
              )}
              <p>🔍 <strong>Navigation:</strong> Mouse wheel to zoom, drag to pan</p>
            </div>
          ) : (
            <div className="admin-help">
              <p>💡 <strong>Designer Mode:</strong> Use the sidebar tools to create and modify your seat layout</p>
              <p>🎯 <strong>Quick Start:</strong> Generate a grid layout or use "Add Seat" to place individual seats</p>
              <p>🔍 <strong>Navigation:</strong> Mouse wheel to zoom, drag to pan</p>
              {getActiveToolInfo() && (
                <p>🛠️ <strong>Active Tool:</strong> {getActiveToolInfo().slice(3)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainContent;