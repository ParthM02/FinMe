import React, { useState, useMemo } from 'react';
import Header from './components/layout/Header';
import SearchBar from './components/layout/SearchBar';
import TradingViewWidget from './components/widgets/TradingViewWidget';
import ScoreCard from './components/widgets/ScoreCard';
import ReportSection from './components/reports/ReportSection';
import { useStockData } from './hooks/useStockData';
import { useCooldown } from './hooks/useCooldown';
import { calculateAllScores } from './utils/scoring';
import './App.css';

const App = () => {
  const [ticker, setTicker] = useState('');
  const [searchTicker, setSearchTicker] = useState('');
  const [activeTab, setActiveTab] = useState('Fundamental');
  
  const { cooldown, cooldownActive, startCooldown } = useCooldown(60);
  const stockData = useStockData(searchTicker, false);

  const sectionScores = useMemo(() => 
    calculateAllScores(stockData), 
    [stockData]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (!ticker || cooldownActive) return;
    const next = ticker.trim().toUpperCase();
    if (!next) return;
    // Allow refreshing the same symbol after cooldown.
    if (next === searchTicker) {
      setSearchTicker('');
      setTimeout(() => setSearchTicker(next), 0);
    } else {
      setSearchTicker(next);
    }
    startCooldown();
  };

  return (
    <div className="app-container">
      <Header />
      <SearchBar 
        ticker={ticker} 
        setTicker={setTicker} 
        handleSearch={handleSearch} 
        cooldown={cooldown} 
        cooldownActive={cooldownActive} 
      />

      <main className="main-content">
        <div className="grid-container">
          <div className="left-column">
            <div className="card">
              <div className="card-content">
                <TradingViewWidget type="info" symbol={searchTicker} />
              </div>
            </div>

            <ScoreCard 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              scores={sectionScores} 
            />
          </div>

          <div className="right-column">
            <div className="card chart-card">
              <div className="card-content">
                <TradingViewWidget type="chart" symbol={searchTicker} />
              </div>
            </div>
          </div>
        </div>

        <ReportSection activeTab={activeTab} stockData={stockData} />
      </main>
    </div>
  );
};

export default App;