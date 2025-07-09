import React, { useState } from "react";

interface Seat {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  r: number;
  occupied: boolean;
  selected: boolean;
}

interface SeatGridProps {
  rows: number;
  cols: number;
  seatSize: number;
}

export const SeatGrid: React.FC<SeatGridProps> = ({ rows, cols, seatSize }) => {
  const [seats, setSeats] = useState<Seat[]>(() =>
    Array.from({ length: rows * cols }, (_, i) => ({
      id: `S${i + 1}`,
      row: Math.floor(i / cols),
      col: i % cols,
      x: (i % cols) * (seatSize + 10) + seatSize / 2,
      y: Math.floor(i / cols) * (seatSize + 10) + seatSize / 2,
      r: seatSize / 2,
      occupied: false,
      selected: false,
    }))
  );

  const handleSeatClick = (id: string) => {
    setSeats(seats =>
      seats.map(seat =>
        seat.id === id && !seat.occupied
          ? { ...seat, selected: !seat.selected }
          : seat
      )
    );
  };

  return (
    <svg width={cols * (seatSize + 10)} height={rows * (seatSize + 10)}>
      {seats.map(seat => (
        <circle
          key={seat.id}
          cx={seat.x}
          cy={seat.y}
          r={seat.r}
          fill={seat.occupied ? "#d32f2f" : seat.selected ? "#4caf50" : "#e0e0e0"}
          stroke="#444"
          data-seat-id={seat.id}
          onClick={() => handleSeatClick(seat.id)}
          style={{ cursor: seat.occupied ? "not-allowed" : "pointer" }}
        />
      ))}
    </svg>
  );
};