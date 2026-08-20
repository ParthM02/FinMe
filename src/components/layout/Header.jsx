import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile dropdown menu whenever route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <NavLink to="/home" className="logo-link">
            <span className="logo">FinMe</span>
          </NavLink>
        </div>

        {/* Desktop Navigation & Actions */}
        <div className="header-actions desktop-header-actions">
          <button className="upgrade-button" type="button">
            <span>✨</span>
            <span className="upgrade-text">100% Free!</span>
            <span>✨</span>
          </button>
          <nav className="navigation">
            <NavLink className="nav-button" to="/" end>
              Analysis
            </NavLink>
            <NavLink className="nav-button" to="/home">
              Home
            </NavLink>
            <button className="nav-button nav-button-edge" type="button" disabled>
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
          <div className="user-icon" aria-label="User profile">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Mobile Header Right Controls */}
        <div className="mobile-header-controls">
          <button className="upgrade-button upgrade-button-mobile" type="button">
            <span>✨</span>
            <span>100% Free!</span>
          </button>
          <div className="user-icon user-icon-mobile" aria-label="User profile">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <button
            type="button"
            className={`mobile-menu-btn ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="mobile-nav-dropdown">
          <nav className="mobile-nav-links">
            <NavLink
              className="mobile-nav-link"
              to="/"
              end
              onClick={() => setMenuOpen(false)}
            >
              <span className="mobile-nav-icon">📊</span>
              <span>Analysis</span>
            </NavLink>
            <NavLink
              className="mobile-nav-link"
              to="/home"
              onClick={() => setMenuOpen(false)}
            >
              <span className="mobile-nav-icon">🏠</span>
              <span>Home</span>
            </NavLink>
            <div className="mobile-nav-link disabled">
              <span className="mobile-nav-icon">⚡</span>
              <span>Edge</span>
              <span className="mobile-edge-badge">Soon</span>
            </div>
            <a
              className="mobile-nav-link mobile-x-link"
              href="https://x.com/cookeddeveloper"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              <svg className="mobile-x-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Follow us on X</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;