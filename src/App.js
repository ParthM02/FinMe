import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [watchlist, setWatchlist] = useState([]);
  const [input, setInput] = useState('');

  const handleAddStock = (e) => {
    e.preventDefault();
    if (input.trim() && !watchlist.includes(input.trim().toUpperCase())) {
      setWatchlist([...watchlist, input.trim().toUpperCase()]);
      setInput('');
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
