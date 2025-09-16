import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const [ticker, setTicker] = useState('');
  const [searchTicker, setSearchTicker] = useState('');
  const [activeTab, setActiveTab] = useState('Fundamental');
  const [optionData, setOptionData] = useState(null);
  const [putCallRatio, setPutCallRatio] = useState(null);
  const [useTestData, setUseTestData] = useState(false);
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

          // Log the fetched API data
          console.log('API option data:', data);

          // Calculate put/call ratio from unified format
          const options = data?.data?.optionChain?.result?.options || [];
          let putVolume = 0;
          let callVolume = 0;
          options.forEach(opt => {
            if (opt.puts) {
              putVolume += opt.puts.reduce((sum, p) => sum + (p.volume || 0), 0);
            }
            if (opt.calls) {
              callVolume += opt.calls.reduce((sum, c) => sum + (c.volume || 0), 0);
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
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
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