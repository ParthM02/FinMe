import React, { useState } from 'react';
import { calculatePutCallRatio } from './optionAnalysis';
import logo from './logo.svg';
import './App.css';

const useTestData = false;

function App() {
  // Remove watchlist state
  // const [watchlist, setWatchlist] = useState([]);
  const [input, setInput] = useState('');
  const [searchedSymbol, setSearchedSymbol] = useState(''); // NEW
  const [optionsData, setOptionsData] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Update handler to only allow one asset
  const handleSearch = async (e) => {
    e.preventDefault();
    const symbol = input.trim().toUpperCase();
    console.log(`Searching for symbol: ${symbol}`);
    if (symbol) {
      setSearchedSymbol(symbol);
      setInput('');

      try {
        let data;
        if (useTestData) {
          console.log('Using test data');
          const response = await fetch('/testdata.json');
          data = await response.json();
        } else {
          console.log('Fetching live data');
          const response = await fetch(`/api/optiondata?symbol=${symbol}`);
          data = await response.json();
        }
        setOptionsData(data);
        console.log(`Options data for ${symbol}:`, data);
      } catch (err) {
        console.error('Error fetching options data:', err);
      }
    }
  };

  // Helper to filter out group header rows and rows with missing strike
  const getOptionRows = (rows) => rows.filter(
    row => row.strike && row.expiryDate
  );

  const getCallColumns = (headers) => [
    "expiryDate", "c_Last", "c_Change", "c_Bid", "c_Ask", "c_Volume", "c_Openinterest", "strike"
  ];
  const getPutColumns = (headers) => [
    "expiryDate", "strike", "p_Last", "p_Change", "p_Bid", "p_Ask", "p_Volume", "p_Openinterest"
  ];

  return (
    <div className="App">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-title">FinMe</div>
      </nav>
      <header className="App-header">
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Enter stock symbol (e.g. AAPL)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
          {/* Show the searched symbol if present */}
        </div>
        {/* NEW: Render options table */}
        {optionsData && optionsData.data && optionsData.data.table && (() => {
          const rows = getOptionRows(optionsData.data.table.rows);
          const headers = optionsData.data.table.headers;
          const callCols = getCallColumns(headers);
          const putCols = getPutColumns(headers);
          const totalCols = callCols.length - 1 + 1 + putCols.length - 2; // calls (except strike) + strike + puts (except expiryDate, strike)

          // Calculate Put/Call Ratio
          const putCallRatio = calculatePutCallRatio(rows);

          return (
            <div>
              <div style={{marginBottom: 16}}>
                <strong>Put/Call Volume Ratio:</strong>{' '}
                <span style={{
                  color: putCallRatio > 1 ? 'red' : 'green',
                  fontWeight: 'bold'
                }}>
                  {putCallRatio !== null ? putCallRatio.toFixed(2) : 'N/A'}
                </span>
              </div>
              <div className="options-table-container" style={{display: 'flex', justifyContent: 'center'}}>
                <table className="options-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th colSpan={callCols.length - 2} style={{textAlign: 'center'}}>Calls</th>
                      <th></th>
                      <th colSpan={putCols.length - 2} style={{textAlign: 'center'}}>Puts</th>
                    </tr>
                    <tr>
                      {/* Calls columns except the last one (strike) */}
                      {callCols.slice(0, -1).map((col, idx) => (
                        <th key={`call-${idx}`}>{headers[col]}</th>
                      ))}
                      {/* Single Strike column */}
                      <th key="strike">{headers["strike"]}</th>
                      {/* Puts columns except the first one (expiryDate) and second one (strike) */}
                      {putCols.slice(2).map((col, idx) => (
                        <th key={`put-${idx}`}>{headers[col]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <React.Fragment key={idx}>
                        <tr
                          onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Calls columns except the last one (strike) */}
                          {callCols.slice(0, -1).map((col, i) => (
                            <td key={`call-${i}`}>{row[col]}</td>
                          ))}
                          {/* Single Strike column */}
                          <td key="strike">{row["strike"]}</td>
                          {/* Puts columns except the first one (expiryDate) and second one (strike) */}
                          {putCols.slice(2).map((col, i) => (
                            <td key={`put-${i}`}>{row[col]}</td>
                          ))}
                        </tr>
                        {expandedRow === idx && (
                          <tr>
                            <td colSpan={totalCols}>
                              <div style={{ height: 200 }} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
        {/* END NEW */}
      </header>
    </div>
  );
}

export default App;
