import { SeatMapType } from './seat.types';

export interface BookingState {
  selectedSeats: Set<string>;
  occupiedSeats: Set<string>;
  maxSelectableSeats: number | null;
  pricePerSeat: number;
  userRole: 'user' | 'admin';
  seatMapType: SeatMapType;
  lastSVGString: string;
}

export interface Booking {
  id: string;
  seats: string[];
  timestamp: Date;
  customerName: string;
  totalPrice: number;
}

export type UserRole = 'user' | 'admin';