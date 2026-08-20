import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TickerTapeWidget from '../components/widgets/TickerTapeWidget';

const HomePage = () => {
  const [popularTickers, setPopularTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchPopular = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/populartickers');
        if (!res.ok) {
          throw new Error('Failed to load popular tickers');
        }
        const data = await res.json();
        if (isMounted) {
          setPopularTickers(data.popularTickers || []);
        }
      } catch (err) {
        if (isMounted) {
          // Fallback if API is unreachable
          setPopularTickers([
            { ticker: 'AAPL', count: 20 },
            { ticker: 'TSLA', count: 5 },
            { ticker: 'NVDA', count: 1 },
            { ticker: 'AMZN', count: 1 },
            { ticker: 'META', count: 1 },
            { ticker: 'PYPL', count: 1 }
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPopular();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectTicker = (ticker) => {
    navigate(`/analysis?ticker=${encodeURIComponent(ticker)}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (clean) {
      navigate(`/analysis?ticker=${encodeURIComponent(clean)}`);
    }
  };

  return (
    <main className="main-content home-page-content" aria-label="Home page">
      <div className="ticker-tape-container">
        <TickerTapeWidget />
      </div>

      <section className="home-hero-section">
        <div className="home-hero-badge">
          <span>🔥</span> Real-time Market Intelligence
        </div>
        <h1 className="home-hero-title">
          Institutional-Grade Stock Analysis, <span className="gradient-text">Simplified</span>
        </h1>
        <p className="home-hero-subtitle">
          Search any ticker for deep fundamentals, technical indicators, institutional activity, and options sentiment.
        </p>

        <form className="home-search-form" onSubmit={handleSearchSubmit}>
          <div className="home-search-input-wrapper">
            <svg className="home-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="home-search-input"
              placeholder="Search ticker symbol (e.g. AAPL, NVDA, TSLA)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="home-search-btn">
              Analyze Stock
            </button>
          </div>
        </form>
      </section>

      <section className="popular-tickers-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Popular & Trending Tickers</h2>
            <p className="section-subtitle">Most frequently analyzed tickers on FinMe</p>
          </div>
        </div>

        {loading ? (
          <div className="popular-tickers-grid">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="ticker-card skeleton-card">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line badge"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="popular-tickers-grid">
            {popularTickers.map((item, index) => (
              <div
                key={item.ticker}
                className="ticker-card"
                onClick={() => handleSelectTicker(item.ticker)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTicker(item.ticker)}
              >
                <div className="ticker-card-top">
                  <div className="ticker-symbol-box">
                    <span className="ticker-symbol">{item.ticker}</span>
                    <span className="ticker-rank">#{index + 1}</span>
                  </div>
                  <div className="ticker-count-badge">
                    <span>🔥</span> {item.count} {item.count === 1 ? 'search' : 'searches'}
                  </div>
                </div>

                <div className="ticker-card-bottom">
                  <span className="analyze-action">
                    View Full Analysis <span className="arrow-icon">→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default HomePage;

