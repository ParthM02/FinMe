import React from 'react';

const formatEta = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatLastUpdated = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
};

const SearchBar = ({ ticker, setTicker, handleSearch, queueInfo, lastUpdatedAt }) => (
  <div className="search-container search-container-row">
    <form onSubmit={handleSearch} className="search-form" style={{ position: 'relative' }}>
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        placeholder="Ticker (Ex: AAPL)"
        className="search-input"
      />
      <button
        type="submit"
        className="search-button"
        disabled={!ticker}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-6zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </button>
      {queueInfo?.isPending && (
        <div
          style={{
            position: 'absolute',
            right: '3.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#93c5fd',
            fontWeight: 500,
            fontSize: '1rem',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '9999px',
            padding: '0.25rem 0.75rem',
            pointerEvents: 'none'
          }}
        >
          {`Retrieving Data: ETA - ${formatEta(queueInfo.etaRemainingSeconds ?? queueInfo.etaSeconds)}`}
        </div>
      )}
    </form>
    {!queueInfo?.isPending && formatLastUpdated(lastUpdatedAt) && (
      <div className="last-updated-pill">
        Last Updated: {formatLastUpdated(lastUpdatedAt)}
      </div>
    )}
  </div>
);

export default SearchBar;