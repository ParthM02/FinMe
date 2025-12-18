import React from 'react';

const SearchBar = ({ ticker, setTicker, handleSearch, cooldown, cooldownActive }) => (
  <div className="search-container">
    <form onSubmit={handleSearch} className="search-form" style={{ position: 'relative' }}>
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        placeholder="Ticker (Ex: AAPL)"
        className="search-input"
        disabled={cooldownActive}
      />
      <button
        type="submit"
        className="search-button"
        disabled={cooldownActive || !ticker}
        style={cooldownActive ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-6zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </button>
      {cooldownActive && (
        <div
          style={{
            position: 'absolute',
            right: '3.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#fde047',
            fontWeight: 500,
            fontSize: '1rem',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '9999px',
            padding: '0.25rem 0.75rem',
            pointerEvents: 'none'
          }}
        >
          API Cooldown: {cooldown}s
        </div>
      )}
    </form>
  </div>
);

export default SearchBar;