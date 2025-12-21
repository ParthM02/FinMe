import React from 'react';

const Header = () => (
  <header className="app-header">
    <div className="header-content">
      <div className="logo">FinMe</div>
      <div className="header-actions">
        <button className="upgrade-button">
          <span>✨</span><span>100% Free!</span><span>✨</span>
        </button>
        <nav className="navigation">
          <button className="nav-button">Home (Soon)</button>
          <button className="nav-button">Analysis</button>
          <button className="nav-button">Edge (Soon)</button>
        </nav>
        <div className="user-icon">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  </header>
);

export default Header;