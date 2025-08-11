import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [watchlist, setWatchlist] = useState([]);
  const [input, setInput] = useState('');

  const handleAddStock = async (e) => {
    e.preventDefault();
    const symbol = input.trim().toUpperCase();
    if (symbol && !watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
      setInput('');

      // Call your Vercel API and print options data
      try {
        const response = await fetch(`/api/optiondata?symbol=${symbol}`);
        const data = await response.json();
        console.log(`Options data for ${symbol}:`, data);
      } catch (err) {
        console.error('Error fetching options data:', err);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="watchlist-container">
          <h2>Stock Watchlist</h2>
          <form onSubmit={handleAddStock} className="watchlist-form">
            <input
              type="text"
              placeholder="Enter stock symbol (e.g. AAPL)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="watchlist-input"
            />
            <button type="submit" className="watchlist-btn">Add</button>
          </form>
          <ul className="watchlist-list">
            {watchlist.map((stock, idx) => (
              <li key={idx} className="watchlist-item">{stock}</li>
            ))}
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;
