import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import '../styles/globals.css';

const AppLayout: React.FC = () => {
  const [mode, setMode] = useState<'admin' | 'user'>('user');

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Seat Booking System</h1>
        <div className="mode-selector">
          <button 
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => setMode('admin')}
          >
            Admin
          </button>
          <button 
            className={mode === 'user' ? 'active' : ''}
            onClick={() => setMode('user')}
          >
            User
          </button>
        </div>
      </header>
      
      <div className="app-body">
        <Sidebar mode={mode} />
        <MainContent mode={mode} />
      </div>
    </div>
  );
};

export default AppLayout;