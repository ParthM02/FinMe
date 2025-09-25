import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  isUptrendByRSI,
  rsiCrossoverSignal,
  rsiOverboughtOversoldSignal
} from './technicalAnalysis';

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
  const [institutionalSummary, setInstitutionalSummary] = useState(null);
  const [rsiValues, setRsiValues] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
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

  // Cooldown timer effect
  useEffect(() => {
    if (!cooldownActive) return;
    if (cooldown === 0) {
      setCooldownActive(false);
      return;
    }
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown, cooldownActive]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticker || cooldownActive) return;
    setSearchTicker(ticker);
    setCooldown(60);
    setCooldownActive(true);
    try {
      const response = await fetch(`/api/stockdata?ticker=${ticker}`);
      const data = await response.json();
      console.log('Polygon.io data:', data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Consolidated fetch: only fetches when a new ticker is submitted
  useEffect(() => {
    const fetchStockData = async () => {
      if (!searchTicker) return;
      try {
        const response = await fetch(`/api/stockdata?ticker=${searchTicker}`);
        const data = await response.json();
        setVwap(data.vwap ?? null);
        setClose(data.close ?? null);
        setHeadlines(data.headlines || []);
        setInstitutionalSummary(data.institutionalSummary || null);
        setShortInterest(data.shortInterest || []);
        setRsiValues(data.rsiValues || []); // <-- Add this line
      } catch (error) {
        setVwap(null);
        setClose(null);
        setHeadlines([]);
        setInstitutionalSummary(null);
        setShortInterest([]);
        setRsiValues([]); // <-- Add this line
      }
    };
    fetchStockData();
  }, [searchTicker]);

  // Options fetch remains separate, but only triggers on ticker submit
  useEffect(() => {
    const fetchOptionData = async () => {
      if (!searchTicker) return;
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
    };
    fetchOptionData();
  }, [searchTicker, useTestData]);

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
            <div style={{
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
            }}>
              API Cooldown: {cooldown}s
            </div>
          )}
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
                  <div>
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
                    {/* --- RSI Widgets --- */}
                    <div className="rsi-widgets" style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {/* 1. RSI Uptrend/Downtrend Widget */}
                      <div className="rsi-widget">
                        <div className="rsi-title">RSI Trend</div>
                        {rsiValues.length === 10 ? (
                          (() => {
                            const uptrend = isUptrendByRSI(rsiValues);
                            return (
                              <div className={`rsi-value ${uptrend ? 'bullish' : 'bearish'}`}>
                                {uptrend ? 'Bullish' : 'Bearish'}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="rsi-loading">Loading...</div>
                        )}
                      </div>
                      {/* 2. RSI Crossover Widget */}
                      <div className="rsi-widget">
                        <div className="rsi-title">RSI Crossover</div>
                        {rsiValues.length >= 2 ? (
                          (() => {
                            const signal = rsiCrossoverSignal(rsiValues);
                            let label = 'Neutral', signalClass = 'neutral';
                            if (signal === 1) { label = 'Bullish'; signalClass = 'bullish'; }
                            else if (signal === -1) { label = 'Bearish'; signalClass = 'bearish'; }
                            return (
                              <div className={`rsi-value ${signalClass}`}>{label}</div>
                            );
                          })()
                        ) : (
                          <div className="rsi-loading">Loading...</div>
                        )}
                      </div>
                      {/* 3. RSI Overbought/Oversold Widget */}
                      <div className="rsi-widget">
                        <div className="rsi-title">Recent RSI Level</div>
                        {rsiValues.length >= 1 ? (
                          (() => {
                            const signal = rsiOverboughtOversoldSignal(rsiValues);
                            let label = 'Neutral', signalClass = 'neutral';
                            if (signal === 1) { label = 'Bullish'; signalClass = 'bullish'; }
                            else if (signal === -1) { label = 'Bearish'; signalClass = 'bearish'; }
                            return (
                              <div className={`rsi-value ${signalClass}`}>{label} <span style={{fontSize: '0.9em', color: '#9ca3af'}}>({rsiValues[rsiValues.length-1]?.toFixed(2)})</span></div>
                            );
                          })()
                        ) : (
                          <div className="rsi-loading">Loading...</div>
                        )}
                      </div>
                    </div>
                    {/* --- End RSI Widgets --- */}
                  </div>
                ) : (
                  <span>Loading VWAP...</span>
                )
              ) : activeTab === 'Sentiment' ? (
                <div className="sentiment-widget">
                  {/* Institutional Activity Widget */}
                  <div className="institutional-activity-widget">
                    <div className="institutional-activity-title"># Institutional Position</div>
                    {institutionalSummary ? (() => {
                      const increased = parseInt(institutionalSummary.increasedInstitutions?.replace(/,/g, '') || 0, 10);
                      const decreased = parseInt(institutionalSummary.decreasedInstitutions?.replace(/,/g, '') || 0, 10);
                      const signal = increased > decreased ? 'Bullish' : 'Bearish';
                      const signalClass = increased > decreased ? 'bullish' : 'bearish';
                      return (
                        <div className="institutional-activity-content">
                          <div className="institutional-activity-counts">
                            <div>
                              <div className="institutional-label">Increased</div>
                              <div className="institutional-value">{institutionalSummary.increasedInstitutions ?? 'N/A'}</div>
                            </div>
                            <div>
                              <div className="institutional-label">Decreased</div>
                              <div className="institutional-value">{institutionalSummary.decreasedInstitutions ?? 'N/A'}</div>
                            </div>
                          </div>
                          <div className={`institutional-activity-signal ${signalClass}`}>{signal}</div>
                        </div>
                      );
                    })() : (
                      <div style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '1rem' }}>Loading institutional activity...</div>
                    )}
                  </div>
                  <div className="institutional-activity-widget">
                    <div className="institutional-activity-title">Institutional Share Volume</div>
                    {institutionalSummary ? (() => {
                      const increasedShares = parseInt(institutionalSummary.increasedShares?.replace(/,/g, '') || 0, 10);
                      const decreasedShares = parseInt(institutionalSummary.decreasedShares?.replace(/,/g, '') || 0, 10);
                      const signal = increasedShares > decreasedShares ? 'Bullish' : 'Bearish';
                      const signalClass = increasedShares > decreasedShares ? 'bullish' : 'bearish';
                      return (
                        <div className="institutional-activity-content">
                          <div className="institutional-activity-counts">
                            <div>
                              <div className="institutional-label">Increased</div>
                              <div className="institutional-value">{institutionalSummary.increasedShares ?? 'N/A'}</div>
                            </div>
                            <div>
                              <div className="institutional-label">Decreased</div>
                              <div className="institutional-value">{institutionalSummary.decreasedShares ?? 'N/A'}</div>
                            </div>
                          </div>
                          <div className={`institutional-activity-signal ${signalClass}`}>{signal}</div>
                        </div>
                      );
                    })() : (
                      <div style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '1rem' }}>Loading institutional share changes...</div>
                    )}
                  </div>
                  <div className="institutional-activity-widget">
                    <div className="institutional-activity-title">New vs Sold Out Institutions</div>
                    {institutionalSummary ? (() => {
                      const newInstitutions = parseInt(institutionalSummary.newInstitutions?.replace(/,/g, '') || 0, 10);
                      const soldOutInstitutions = parseInt(institutionalSummary.soldOutInstitutions?.replace(/,/g, '') || 0, 10);
                      const signal = newInstitutions > soldOutInstitutions ? 'Bullish' : 'Bearish';
                      const signalClass = newInstitutions > soldOutInstitutions ? 'bullish' : 'bearish';
                      return (
                        <div className="institutional-activity-content">
                          <div className="institutional-activity-counts">
                            <div>
                              <div className="institutional-label">New Positions</div>
                              <div className="institutional-value">{institutionalSummary.newInstitutions ?? 'N/A'}</div>
                            </div>
                            <div>
                              <div className="institutional-label">Sold Out</div>
                              <div className="institutional-value">{institutionalSummary.soldOutInstitutions ?? 'N/A'}</div>
                            </div>
                          </div>
                          <div className={`institutional-activity-signal ${signalClass}`}>{signal}</div>
                        </div>
                      );
                    })() : (
                      <div style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '1rem' }}>Loading new/sold out institution data...</div>
                    )}
                  </div>
                  {/* Existing Sentiment Table */}
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
                <>
                  <div className="widget-row">
                    <div className="volume-bar-widget">
                      <div className="volume-bar-title">Days to Cover</div>
                      {shortInterest.length < 5 ? (
                        <span>Loading data...</span>
                      ) : (
                        (() => {
                          const lastFive = shortInterest.slice(0, 5).reverse();
                          const bars = lastFive.slice(1).map((item, idx) => ({
                            date: item.settlement_date,
                            value: item.days_to_cover,
                            prevValue: lastFive[idx].days_to_cover
                          }));

                          const maxValue = Math.max(...bars.map(b => b.value || 0)) || 1;

                          const latest = bars[bars.length - 1]?.value;
                          const previous = bars[bars.length - 1]?.prevValue;
                          let signal = 'Neutral';
                          let signalClass = 'neutral';
                          if (latest > previous) {
                            signal = 'Bearish';
                            signalClass = 'bearish';
                          } else if (latest < previous) {
                            signal = 'Bullish';
                            signalClass = 'bullish';
                          }

                          const barClasses = bars.map((bar) => {
                            if (bar.value > bar.prevValue) return 'bearish';
                            if (bar.value < bar.prevValue) return 'bullish';
                            return 'neutral';
                          });

                          return (
                            <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
                              <svg width="100%" height="80" viewBox="0 0 320 80">
                                {bars.map((bar, idx) => {
                                  const height = Math.max(10, (bar.value / maxValue) * 60);
                                  return (
                                    <g key={idx}>
                                      <rect
                                        x={20 + idx * 70}
                                        y={80 - height}
                                        width={40}
                                        height={height}
                                        rx={8}
                                        className={`volume-bar-rect ${barClasses[idx]}`}
                                      />
                                      <text
                                        x={40 + idx * 70}
                                        y={80 - height - 8}
                                        textAnchor="middle"
                                        className="volume-bar-value"
                                      >
                                        {bar.value?.toFixed(2) ?? 'N/A'}
                                      </text>
                                      <text
                                        x={40 + idx * 70}
                                        y={78}
                                        textAnchor="middle"
                                        className="volume-bar-label"
                                      >
                                        {bar.date?.slice(5)}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                              <div className={`volume-bar-signal ${signalClass}`}>
                                {signal}
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                    {/* Short Squeeze Potential Widget */}
                    <div className="short-squeeze-widget">
                      <div className="short-squeeze-title">Short Squeeze Potential</div>
                      {shortInterest.length < 1 ? (
                        <span>Loading...</span>
                      ) : (
                        (() => {
                          // Most recent DTC (days to cover)
                          const dtc = shortInterest[0]?.days_to_cover;
                          let squeeze = 'Low';
                          let squeezeClass = 'short-squeeze-low';
                          if (dtc >= 8) {
                            squeeze = 'High';
                            squeezeClass = 'short-squeeze-high';
                          } else if (dtc >= 3) {
                            squeeze = 'Moderate';
                            squeezeClass = 'short-squeeze-moderate';
                          }
                          return (
                            <>
                              <div className={`short-squeeze-value ${squeezeClass}`}>
                                {dtc?.toFixed(2) ?? 'N/A'}
                              </div>
                              <div className={`short-squeeze-title ${squeezeClass}`}>
                                {squeeze}
                              </div>
                            </>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </>
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