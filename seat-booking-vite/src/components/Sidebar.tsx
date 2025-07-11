import React, { useState } from 'react';
import { useSeatStore } from '../hooks/useSeatStore';

interface SidebarProps {
  mode: 'admin' | 'user';
}

const Sidebar: React.FC<SidebarProps> = ({ mode }) => {
  const {
    // User state
    selectedSeats,
    maxSelectableSeats,
    pricePerSeat,
    confirmBooking,
    resetSelection,
    promptForSeatCount,
    countAvailableSeats,
    
    // Admin state
    addMode,
    penMode,
    textMode,
    rectMode,
    shapeMode,
    toggleMode,
    setShapeMode,
    generateGrid,
    clearAll,
    bgImageVisible,
    setBgImageVisible,
    
    // Current data
    currentSeats,
    setUserZoom,
    setDesignerZoom
  } = useSeatStore();

  // Local state for grid inputs (EXACT from React)
  const [gridRows, setGridRows] = useState(5);
  const [gridCols, setGridCols] = useState(8);
  const [seatSize, setSeatSize] = useState(15);

  const handleGenerateGrid = () => {
    generateGrid(gridRows, gridCols, seatSize);
  };

  // Handle seat count prompting (using your exact logic)
  const handlePromptSeatCount = () => {
    promptForSeatCount();
  };

  const handleZoomReset = () => {
    if (mode === 'admin') {
      setDesignerZoom(1);
    } else {
      setUserZoom(1);
    }
  };

  if (mode === 'admin') {
    return (
      <aside className="sidebar">
        <div className="sidebar-content">
          {/* Grid Generation - EXACT from React */}
          <div className="tool-section">
            <h3>Grid Layout</h3>
            <div className="input-group">
              <label>
                Rows: 
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={gridRows}
                  onChange={(e) => setGridRows(parseInt(e.target.value) || 1)}
                />
              </label>
              <label>
                Columns: 
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={gridCols}
                  onChange={(e) => setGridCols(parseInt(e.target.value) || 1)}
                />
              </label>
              <label>
                Seat Size: 
                <input 
                  type="number" 
                  min="5" 
                  max="50"
                  value={seatSize}
                  onChange={(e) => setSeatSize(parseInt(e.target.value) || 15)}
                />
              </label>
            </div>
            <button className="primary-btn" onClick={handleGenerateGrid}>
              🏗️ Create Grid ({gridRows}×{gridCols})
            </button>
          </div>

          {/* Designer Tools - EXACT from React */}
          <div className="tool-section">
            <h3>Designer Tools</h3>
            <div className="tool-grid">
              <button 
                className={`tool-btn ${addMode ? 'active' : ''}`}
                onClick={() => toggleMode('addMode')}
                title="Add Seat - Click on canvas to place"
              >
                <span className="tool-icon">⚪</span>
                <span className="tool-label">Add Seat</span>
              </button>
              
              <button 
                className={`tool-btn ${penMode ? 'active' : ''}`}
                onClick={() => toggleMode('penMode')}
                title="Pen Tool - Draw Bezier Curves"
              >
                <span className="tool-icon">✏️</span>
                <span className="tool-label">Pen Tool</span>
              </button>
              
              <button 
                className={`tool-btn ${textMode ? 'active' : ''}`}
                onClick={() => toggleMode('textMode')}
                title="Add Text"
              >
                <span className="tool-icon">T</span>
                <span className="tool-label">Add Text</span>
              </button>
              
              <button 
                className={`tool-btn ${rectMode ? 'active' : ''}`}
                onClick={() => toggleMode('rectMode')}
                title="Add Rectangle"
              >
                <span className="tool-icon">⬜</span>
                <span className="tool-label">Rectangle</span>
              </button>
              
              <button 
                className={`tool-btn ${shapeMode === 'circle' ? 'active' : ''}`}
                onClick={() => setShapeMode(shapeMode === 'circle' ? 'none' : 'circle')}
                title="Add Circle"
              >
                <span className="tool-icon">⭕</span>
                <span className="tool-label">Circle</span>
              </button>
            </div>
          </div>

          {/* Active Tool Info - EXACT from React */}
          {(addMode || penMode || textMode || rectMode || shapeMode === 'circle') && (
            <div className="tool-section">
              <h3>Active Tool</h3>
              <div className="active-tool-info">
                {addMode && <p>🎯 Click on canvas to add a seat</p>}
                {penMode && <p>✏️ Click to add points, drag to create bezier curves</p>}
                {textMode && <p>📝 Click on canvas to add text</p>}
                {rectMode && <p>⬜ Click on canvas to add rectangle</p>}
                {shapeMode === 'circle' && <p>⭕ Click on canvas to add circle</p>}
              </div>
            </div>
          )}

          {/* Drawing Controls - EXACT from React */}
          <div className="tool-section">
            <h3>Drawing Controls</h3>
            <div className="control-group">
              <label>
                Stroke Width:
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  defaultValue="2"
                  className="slider"
                />
              </label>
              <label>
                Stroke Color:
                <input 
                  type="color" 
                  defaultValue="#000000"
                  className="color-input"
                />
              </label>
              <label>
                Fill Color:
                <input 
                  type="color" 
                  defaultValue="#ffffff"
                  className="color-input"
                />
              </label>
            </div>
          </div>

          {/* Transform Tools - EXACT from React */}
          <div className="tool-section">
            <h3>Transform</h3>
            <div className="button-group">
              <button className="secondary-btn">↻ Rotate Left</button>
              <button className="secondary-btn">↺ Rotate Right</button>
              <button className="secondary-btn">🔄 Flip Horizontal</button>
              <button className="secondary-btn">🔄 Flip Vertical</button>
            </div>
          </div>

          {/* Background - EXACT from React */}
          <div className="tool-section">
            <h3>Background</h3>
            <div className="button-group">
              <button className="secondary-btn">🖼️ Add Background Image</button>
              <button 
                className="secondary-btn"
                onClick={() => setBgImageVisible(!bgImageVisible)}
              >
                {bgImageVisible ? '👁️ Hide Background' : '👁️‍🗨️ Show Background'}
              </button>
            </div>
          </div>

          {/* Layout Management - EXACT from React */}
          <div className="tool-section">
            <h3>Layout Management</h3>
            <div className="button-group">
              <button className="secondary-btn">📁 Upload SVG</button>
              <button className="secondary-btn">💾 Save Layout</button>
              <button className="secondary-btn">📂 Load Layout</button>
              <button 
                className="danger-btn"
                onClick={clearAll}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* Statistics - EXACT from React */}
          <div className="tool-section">
            <h3>Statistics</h3>
            <div className="stats-info">
              <div className="stat-item">
                <span>Total Seats:</span>
                <span className="stat-value">{currentSeats.length}</span>
              </div>
              <div className="stat-item">
                <span>Available:</span>
                <span className="stat-value">{countAvailableSeats()}</span>
              </div>
              <div className="stat-item">
                <span>Occupied:</span>
                <span className="stat-value">{currentSeats.filter(s => s.occupied).length}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // User sidebar - EXACT from React
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {/* Seat Selection with Count Logic - EXACT from React */}
        <div className="tool-section">
          <h3>Seat Selection</h3>
          <div className="selection-info">
            <div className="info-row">
              <span>Selected:</span>
              <span className="value">{selectedSeats.size}</span>
            </div>
            <div className="info-row">
              <span>Max:</span>
              <span className="value">{maxSelectableSeats || 'Not set'}</span>
            </div>
            <div className="info-row">
              <span>Available:</span>
              <span className="value">{countAvailableSeats()}</span>
            </div>
            <div className="info-row total">
              <span>Total Cost:</span>
              <span className="value">₹{selectedSeats.size * pricePerSeat}</span>
            </div>
          </div>
          
          {/* Show prompt button if no max seats set */}
          {!maxSelectableSeats && countAvailableSeats() > 0 && (
            <button 
              className="primary-btn"
              onClick={handlePromptSeatCount}
            >
              🎯 Set Seat Count
            </button>
          )}
          
          {/* Show booking button if seats selected */}
          <button 
            className="primary-btn"
            onClick={confirmBooking}
            disabled={selectedSeats.size === 0}
          >
            🎫 Confirm Booking
          </button>
          
          <button 
            className="secondary-btn"
            onClick={resetSelection}
          >
            🔄 Reset Selection
          </button>
        </div>

        {/* Progress Bar - EXACT from React */}
        {maxSelectableSeats && (
          <div className="tool-section">
            <h3>Selection Progress</h3>
            <div className="progress-container">
              <div className="progress-info">
                <span>{selectedSeats.size}/{maxSelectableSeats} seats</span>
                <span>{Math.round((selectedSeats.size / maxSelectableSeats) * 100)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${(selectedSeats.size / maxSelectableSeats) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Booking Info - EXACT from React */}
        <div className="tool-section">
          <h3>Booking Information</h3>
          <div className="booking-details">
            <div className="detail-row">
              <span>Price per seat:</span>
              <span>₹{pricePerSeat}</span>
            </div>
            <div className="detail-row">
              <span>Total seats:</span>
              <span>{currentSeats.length}</span>
            </div>
            <div className="detail-row">
              <span>Available seats:</span>
              <span>{countAvailableSeats()}</span>
            </div>
            <div className="detail-row">
              <span>Occupied seats:</span>
              <span>{currentSeats.filter(s => s.occupied).length}</span>
            </div>
          </div>
        </div>

        {/* Selected Seats List - EXACT from React */}
        {selectedSeats.size > 0 && (
          <div className="tool-section">
            <h3>Selected Seats</h3>
            <div className="selected-seats-list">
              {Array.from(selectedSeats).sort().map(seatId => (
                <span key={seatId} className="seat-chip">
                  {seatId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions - EXACT from React */}
        <div className="tool-section">
          <h3>How to Book</h3>
          <div className="instructions">
            <div className="step">
              <span className="step-number">1</span>
              <span>Click "Set Seat Selection Count"</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span>Select your preferred seats</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span>Confirm your booking</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;