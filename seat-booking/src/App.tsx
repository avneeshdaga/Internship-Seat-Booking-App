import React from "react";
import { SeatGrid } from "./components/seat-grid/SeatGrid";

function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Seat Booking Demo</h1>
      <SeatGrid rows={5} cols={8} seatSize={30} />
    </div>
  );
}

export default App;