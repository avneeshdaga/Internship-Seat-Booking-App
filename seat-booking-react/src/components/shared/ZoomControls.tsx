import React from 'react';
import { useSVGUtils } from '../../hooks/useSVGUtils';

interface ZoomControlsProps {
  mode: 'user' | 'admin';
  className?: string;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ mode, className = '' }) => {
  const { 
    handleUserZoom, 
    handleDesignerZoom, 
    userZoom, 
    designerZoom 
  } = useSVGUtils();

  const currentZoom = mode === 'user' ? userZoom : designerZoom;
  const handleZoom = mode === 'user' ? handleUserZoom : handleDesignerZoom;

  return (
    <div className={`zoom-controls ${className}`}>
      <button
        className="zoom-btn"
        onClick={() => handleZoom('out')}
        disabled={currentZoom <= 1}
        title="Zoom Out"
      >
        −
      </button>
      
      <div className="zoom-level">
        {Math.round(currentZoom * 100)}%
      </div>
      
      <button
        className="zoom-btn"
        onClick={() => handleZoom('in')}
        disabled={currentZoom >= 3}
        title="Zoom In"
      >
        +
      </button>
      
      <button
        className="zoom-btn"
        onClick={() => handleZoom('reset')}
        disabled={currentZoom === 1}
        title="Reset Zoom"
      >
        ⌂
      </button>
    </div>
  );
};

export default ZoomControls;