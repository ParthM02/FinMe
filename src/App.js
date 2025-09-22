import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const [ticker, setTicker] = useState('');
  const [searchTicker, setSearchTicker] = useState('');
  const [activeTab, setActiveTab] = useState('Fundamental');
  const [optionData, setOptionData] = useState(null);
  const [putCallRatio, setPutCallRatio] = useState(null);
  const [useTestData, setUseTestData] = useState(false);
  const [vwap, setVwap] = useState(null);
  const [close, setClose] = useState(null);
  const [headlines, setHeadlines] = useState([]);
  const [shortInterest, setShortInterest] = useState([]);
  const widgetRef = useRef(null);
  const chartRef = useRef(null); // Add this line

  useEffect(() => {
    // Symbol Info Widget
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
    }
    if (searchTicker) {
      const script = document.createElement('script');
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbol": searchTicker.toUpperCase() || "AAPL",
        "width": "100%",
        "locale": "en",
        "colorTheme": "dark",
        "isTransparent": true,
      });
      widgetRef.current.appendChild(script);
    }
  }, [searchTicker]);

  useEffect(() => {
    // Symbol Overview Chart Widget
    if (chartRef.current) {
      chartRef.current.innerHTML = '';
    }
    if (searchTicker) {
      const script = document.createElement('script');
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          [searchTicker.toUpperCase() || "AAPL", searchTicker.toUpperCase() || "AAPL"]
        ],
        "chartOnly": false,
        "width": "100%",
        "height": "384", // 24rem = 384px
        "locale": "en",
        "colorTheme": "dark",
        "isTransparent": true,
        "autosize": true,
        "showVolume": true,
        "showMA": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "Trebuchet MS, Arial, sans-serif",
        "fontSize": "14",
        "noTimeScale": false,
        "valuesTracking": "1",
        "chartType": "area",
        "backgroundColor": "rgba(0, 0, 0, 0)",
        "lineWidth": 2
      });
      chartRef.current.appendChild(script);
    }
  }, [searchTicker]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticker) return;
    setSearchTicker(ticker); // Only update searchTicker on submit
    try {
      const response = await fetch(`/api/stockdata?ticker=${ticker}`);
      const data = await response.json();
      console.log('Polygon.io data:', data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const fetchOptionData = async () => {
      if (activeTab === 'Options' && searchTicker) {
        try {
          let data;
          if (useTestData) {
            const response = await fetch('/testdata.json');
            data = await response.json();
          } else {
            const response = await fetch(`/api/optiondata?symbol=${searchTicker}`);
            data = await response.json();
          }
          setOptionData(data);

          // Correct parsing for put/call ratio
          const rows = data?.data?.table?.rows || [];
          let putVolume = 0;
          let callVolume = 0;
          rows.forEach(row => {
            // Only count rows with numeric volumes
            if (row.c_Volume && !isNaN(row.c_Volume) && row.c_Volume !== '--') {
              callVolume += Number(row.c_Volume);
            }
            if (row.p_Volume && !isNaN(row.p_Volume) && row.p_Volume !== '--') {
              putVolume += Number(row.p_Volume);
            }
          });
          if (callVolume > 0) {
            setPutCallRatio((putVolume / callVolume).toFixed(2));
          } else {
            setPutCallRatio(null);
          }
        } catch (error) {
          setOptionData(null);
          setPutCallRatio(null);
        }
      }
    };
    fetchOptionData();
  }, [activeTab, searchTicker, useTestData]);

  useEffect(() => {
    const fetchTechnicalData = async () => {
      if (activeTab === 'Technical' && searchTicker) {
        try {
          const response = await fetch(`/api/stockdata?ticker=${searchTicker}`);
          const data = await response.json();
          setVwap(data.vwap);
          setClose(data.close);
        } catch (error) {
          setVwap(null);
          setClose(null);
        }
      }
    };
    fetchTechnicalData();
  }, [activeTab, searchTicker]);

  useEffect(() => {
    const fetchSentimentData = async () => {
      if (activeTab === 'Sentiment' && searchTicker) {
        try {
          const response = await fetch(`/api/stockdata?ticker=${searchTicker}`);
          const data = await response.json();
          setHeadlines(data.headlines || []);
        } catch (error) {
          setHeadlines([]);
        }
      }
    };
    fetchSentimentData();
  }, [activeTab, searchTicker]);

  useEffect(() => {
    const fetchFundamentalData = async () => {
      if (activeTab === 'Fundamental' && searchTicker) {
        try {
          const response = await fetch(`/api/stockdata?ticker=${searchTicker}`);
          const data = await response.json();
          setShortInterest(data.shortInterest || []);
        } catch (error) {
          setShortInterest([]);
        }
      }
    };
    fetchFundamentalData();
  }, [activeTab, searchTicker]);

  // Add this helper for formatting date
  const formatDate = (utcString) => {
    const date = new Date(utcString);
    return date.toLocaleString();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">FinMe</div>
          
          <div className="header-actions">
            <button className="upgrade-button">
              <span>✨</span>
              <span>Upgrade</span>
              <span>✨</span>
            </button>
            
            <nav className="navigation">
              <button className="nav-button">Home</button>
              <button className="nav-button">Analysis</button>
              <button className="nav-button">Guide</button>
            </nav>
            
            <div className="user-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Ticker (Ex: AAPL)"
            className="search-input"
          />
          <button type="submit" className="search-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-6zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="grid-container">
          {/* Left Column */}
          <div className="left-column">
            {/* Ticker Info Card */}
            <div className="card">
              <div className="card-content">
                <h3 className="card-title">Ticker Info</h3>
                <div ref={widgetRef} className="tradingview-widget-container" />
              </div>
            </div>

            {/* Score Rating Card */}
            <div className="card">
              <div className="card-content">
                <h3 className="card-subtitle">Score</h3>
                <h2 className="card-rating">Rating</h2>
                
                <div className="tabs-container">
                  <div className="tabs">
                    {['Fundamental', 'Technical', 'Options', 'Sentiment'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={activeTab === tab ? 'tab-button active' : 'tab-button'}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Chart Card */}
            <div className="card chart-card">
              <div className="card-content">
                <h3 className="card-title">Chart</h3>
                <div ref={chartRef} className="tradingview-widget-container" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Section Breakdown */}
        <div className="card full-width-card">
          <div className="card-content">
            <h3 className="card-title">Report Section Breakdown</h3>
            <p className="card-placeholder-text">
              {activeTab === 'Options' ? (
                putCallRatio !== null ? (
                  <div className="put-call-widget">
                    <div className="put-call-title">Put/Call Ratio</div>
                    <div
                      className={`put-call-value ${
                        putCallRatio > 1 ? 'bearish' : 'bullish'
                      }`}
                    >
                      {putCallRatio}
                    </div>
                    <div className="put-call-signal">
                      {putCallRatio > 1 ? 'Bearish' : 'Bullish'}
                    </div>
                  </div>
                ) : (
                  <span>Loading put/call ratio...</span>
                )
              ) : activeTab === 'Technical' ? (
                vwap !== null && close !== null ? (
                  <div className="vwap-widget">
                    <div className="vwap-title">VWAP</div>
                    <div
                      className={`vwap-value ${
                        close > vwap ? 'bullish' : 'bearish'
                      }`}
                    >
                      {vwap}
                    </div>
                    <div className="put-call-signal">
                      {close > vwap ? 'Bullish' : 'Bearish'}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#9ca3af', marginTop: '0.25rem', textAlign: 'center' }}>
                      Close: {close}
                    </div>
                  </div>
                ) : (
                  <span>Loading VWAP...</span>
                )
              ) : activeTab === 'Sentiment' ? (
                <div className="sentiment-widget">
                  <table className="sentiment-table">
                    <thead>
                      <tr>
                        <th>Headline</th>
                        <th>Published</th>
                        <th>Sentiment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headlines.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ color: '#9ca3af', textAlign: 'center' }}>Loading headlines...</td>
                        </tr>
                      ) : (
                        headlines.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sentiment-link"
                              >
                                {item.title}
                              </a>
                            </td>
                            <td style={{ color: '#9ca3af' }}>{formatDate(item.published_utc)}</td>
                            <td style={{
                              color:
                                item.sentiment === 'positive'
                                  ? '#22c55e'
                                  : item.sentiment === 'negative'
                                  ? '#ef4444'
                                  : '#d1d5db'
                            }}>
                              {item.sentiment ?? 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === 'Fundamental' ? (
                <div className="volume-bar-widget">
                  <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Avg Daily Volume (last 4 settlements)</div>
                  {shortInterest.length < 4 ? (
                    <span>Loading volume data...</span>
                  ) : (
                    (() => {
                      // Get last 4 settlement dates (descending)
                      const bars = shortInterest.slice(0, 4).map(item => ({
                        date: item.settlement_date,
                        volume: item.avg_daily_volume
                      }));

                      // Calculate colors and bullish/bearish
                      let lastDirection = null;
                      const barColors = bars.map((bar, idx, arr) => {
                        if (idx === 0) return '#38bdf8'; // first bar, neutral color
                        const prev = arr[idx - 1].volume;
                        if (bar.volume > prev) {
                          lastDirection = 'bullish';
                          return '#22c55e'; // green
                        } else if (bar.volume < prev) {
                          lastDirection = 'bearish';
                          return '#ef4444'; // red
                        } else {
                          return '#d1d5db'; // gray
                        }
                      });

                      // Find max for scaling
                      const maxVolume = Math.max(...bars.map(b => b.volume || 0)) || 1;

                      return (
                        <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
                          <svg width="100%" height="80" viewBox="0 0 320 80">
                            {bars.map((bar, idx) => {
                              const height = Math.max(10, (bar.volume / maxVolume) * 60);
                              return (
                                <g key={idx}>
                                  <rect
                                    x={20 + idx * 70}
                                    y={80 - height}
                                    width={40}
                                    height={height}
                                    rx={8}
                                    fill={barColors[idx]}
                                  />
                                  <text
                                    x={40 + idx * 70}
                                    y={80 - height - 8}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#d1d5db"
                                  >
                                    {bar.volume?.toLocaleString() ?? 'N/A'}
                                  </text>
                                  <text
                                    x={40 + idx * 70}
                                    y={78}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#9ca3af"
                                  >
                                    {bar.date?.slice(5)}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                          <div style={{
                            textAlign: 'center',
                            marginTop: '0.5rem',
                            fontWeight: 500,
                            color: lastDirection === 'bullish' ? '#22c55e' : lastDirection === 'bearish' ? '#ef4444' : '#d1d5db'
                          }}>
                            {lastDirection ? (lastDirection === 'bullish' ? 'Bullish' : 'Bearish') : 'Neutral'}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                `${activeTab} report breakdown will appear here.`
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;