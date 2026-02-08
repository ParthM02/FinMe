import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => (
  <header className="app-header">
    <div className="header-content">
      <div className="logo">FinMe</div>
      <div className="header-actions">
        <button className="upgrade-button">
          <span>✨</span><span>100% Free!</span><span>✨</span>
        </button>
        <nav className="navigation">
          <NavLink className="nav-button" to="/" end>
            Home
          </NavLink>
          <NavLink className="nav-button" to="/analysis">
            Analysis
          </NavLink>
          <button className="nav-button" type="button" disabled>
            Edge (Soon)
          </button>
        </nav>
        <a
          className="nav-button x-button"
          href="https://x.com/cookeddeveloper"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit cookeddeveloper on X"
        >
          Follow us on X
        </a>
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