import React, { useState, useCallback } from 'react';
import { Seat } from '../../types';

interface SVGSeatProps {
  seat: Seat;
  mode: 'admin' | 'user';
  isSelected: boolean;
  isOccupied: boolean;
  onClick: (e: React.MouseEvent) => void;
  onAdminSelect?: () => void;
  onDragStart?: (clientX: number, clientY: number) => void;
  onDragUpdate?: (clientX: number, clientY: number) => void;
  onDragEnd?: () => void;
  pricePerSeat?: number;
}

const SVGSeat: React.FC<SVGSeatProps> = ({
  seat,
  mode,
  isSelected,
  isOccupied,
  onClick,
  onAdminSelect,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  pricePerSeat = 200
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (mode === 'admin' && !isOccupied) {
      // Select seat first
      if (onAdminSelect) {
        onAdminSelect();
      }
      
      // Start drag
      if (onDragStart) {
        setIsDragging(true);
        onDragStart(e.clientX, e.clientY);
      }
    } else {
      // User mode: regular click
      onClick(e);
    }
  }, [mode, isOccupied, onAdminSelect, onDragStart, onClick]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (onDragEnd) {
        onDragEnd();
      }
    }
  }, [isDragging, onDragEnd]);

  // Get seat fill color (exact vanilla script logic)
  const getFill = () => {
    if (isOccupied) return '#d32f2f'; // Red for occupied
    if (mode === 'admin') return '#49D44B'; // Green for admin seats (exact vanilla)
    if (isSelected) return '#4caf50'; // Green for user selection
    return '#e0e0e0'; // Gray for available
  };

  // Get seat stroke color (exact vanilla script logic)
  const getStroke = () => {
    if (mode === 'admin' && isSelected) return '#f00'; // Red stroke for admin selection (exact vanilla)
    if (isSelected) return '#2e7d32';
    if (isOccupied) return '#b71c1c';
    return '#222'; // Default stroke (exact vanilla)
  };

  // Get stroke width (exact vanilla script logic)
  const getStrokeWidth = () => {
    if (mode === 'admin' && isSelected) return '3'; // Thicker stroke for admin selection
    return '1.5';
  };

  // Get cursor style
  const getCursor = () => {
    if (mode === 'admin' && !isOccupied) return isDragging ? 'grabbing' : 'grab';
    if (mode === 'user' && !isOccupied) return 'pointer';
    if (isOccupied) return 'not-allowed';
    return 'default';
  };

  return (
    <g
      className={`seat-group ${isDragging ? 'dragging' : ''}`}
      data-seat-id={seat.id}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{ cursor: getCursor() }}
    >
      {/* Main seat circle */}
      <circle
        cx={seat.cx}
        cy={seat.cy}
        r={seat.r}
        fill={getFill()}
        stroke={getStroke()}
        strokeWidth={getStrokeWidth()}
        className="seat-circle"
      />

      {/* Tooltip */}
      {showTooltip && (
        <g className="seat-tooltip-group">
          <rect
            x={seat.cx - 50}
            y={seat.cy - seat.r - 25}
            width="100"
            height="18"
            rx="4"
            fill="#374151"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={seat.cx}
            y={seat.cy - seat.r - 16}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="white"
            style={{ pointerEvents: 'none' }}
          >
            {mode === 'admin'
              ? `${seat.id}`
              : `${seat.id} - ₹${pricePerSeat}`}
          </text>
        </g>
      )}
    </g>
  );
};

export default SVGSeat;