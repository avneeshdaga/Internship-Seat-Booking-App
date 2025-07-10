import React from 'react';
import { useSeatStore } from '../../hooks/useSeatStore';
import { Seat } from '../../types';

interface SVGSeatProps {
  seat: Seat;
  mode: 'admin' | 'user';
  onClick?: (seatId: string) => void;
}

const SVGSeat: React.FC<SVGSeatProps> = ({ seat, mode, onClick }) => {
  const { selectedSeats, occupiedSeats } = useSeatStore();

  const isSelected = selectedSeats.has(seat.id);
  const isOccupied = occupiedSeats;

  const getFill = () => {
    if (isOccupied) return '#d32f2f'; // Red
    if (isSelected) return '#4caf50'; // Green
    if (mode === 'admin') return '#49D44B'; // Designer green
    return '#e0e0e0'; // Available gray
  };

  const getStroke = () => {
    if (mode === 'admin') return '#222';
    if (isSelected) return '#2e7d32';
    return '#999';
  };

  const getStrokeWidth = () => {
    if (mode === 'user' && isSelected) return "3";
    return mode === 'admin' ? "2" : "1";
  };

  const getCursor = () => {
    if (isOccupied) return 'not-allowed';
    if (mode === 'admin') return 'pointer';
    return 'pointer';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOccupied && onClick) {
      onClick(seat.id);
    }
  };

  return (
    <g className="seat-group">
      <circle
        cx={seat.cx}
        cy={seat.cy}
        r={seat.r}
        fill={getFill()}
        stroke={getStroke()}
        strokeWidth={getStrokeWidth()}
        style={{
          cursor: getCursor(),
          transition: 'all 0.2s ease'
        }}
        onClick={handleClick}
        className={`seat-element ${isSelected ? 'selected' : ''}`}
        data-seat-id={seat.id}
      />
      
      {/* Seat label */}
      <text
        x={seat.cx}
        y={seat.cy + 4}
        textAnchor="middle"
        fontSize="10"
        fill={isOccupied || isSelected ? "white" : "#666"}
        pointerEvents="none"
        className="seat-label"
      >
        {seat.id}
      </text>
    </g>
  );
};

export default SVGSeat;