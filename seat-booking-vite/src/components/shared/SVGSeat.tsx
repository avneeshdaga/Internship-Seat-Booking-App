import React, { useState } from 'react';
import { Seat } from '../../types';

interface SVGSeatProps {
  seat: Seat;
  mode: 'admin' | 'user';
  isSelected: boolean;
  isOccupied: boolean;
  onClick: () => void;
  pricePerSeat?: number;
}

const SVGSeat: React.FC<SVGSeatProps> = ({ 
  seat, 
  mode, 
  isSelected, 
  isOccupied, 
  onClick, 
  pricePerSeat = 200 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getFill = () => {
    if (isOccupied) return '#d32f2f'; // Red for occupied
    if (isSelected) return '#4caf50'; // Green for selected
    if (mode === 'admin') return '#2196f3'; // Blue for designer
    return '#e0e0e0'; // Gray for available
  };

  const getStroke = () => {
    if (isSelected) return '#2e7d32';
    if (isOccupied) return '#b71c1c';
    return '#666';
  };

  const getTooltipText = () => {
    if (mode === 'admin') {
      return `Seat ${seat.id} `;
    }
    if (isOccupied) {
      return `Seat ${seat.id} - Occupied`;
    }
    return `Seat ${seat.id} - ₹${pricePerSeat}`;
  };

  const getTooltipClass = () => {
    if (isOccupied) return 'seat-tooltip occupied';
    if (isSelected) return 'seat-tooltip selected';
    return 'seat-tooltip available';
  };

  return (
    <g 
      className="seat-group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
      style={{ 
      cursor: (isOccupied) ? 'not-allowed' : (mode === 'user' ? 'pointer' : 'default') 
      }}
    >
      <circle
      cx={seat.cx}
      cy={seat.cy}
      r={seat.r}
      fill={getFill()}
      stroke={getStroke()}
      strokeWidth="1.5"
      className="seat-circle"
      />
      <text
      x={seat.cx}
      y={seat.cy}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="8"
      fill="white"
      fontWeight="bold"
      className="seat-label"
      style={{ pointerEvents: 'none' }}
      >
      {seat.id}
      </text>
      
      {/* Tooltip */}
      {showTooltip && (
      <g className="seat-tooltip-group">
        <rect
        x={seat.cx - 50}
        y={seat.cy - seat.r - 25}
        width="100"
        height="20"
        rx="4"
        className={getTooltipClass()}
        style={{ pointerEvents: 'none' }}
        />
        <text
        x={seat.cx}
        y={seat.cy - seat.r - 15}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        className="seat-tooltip-text"
        style={{ pointerEvents: 'none' }}
        >
        {getTooltipText()}
        </text>
      </g>
      )}
    </g>
  );
};

export default SVGSeat;