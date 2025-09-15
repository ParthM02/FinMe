import React, { useState, useEffect } from 'react';
import { calculatePutCallRatio, bsPrice, bsGreeks, getImpliedVolatility } from './optionAnalysis';
import { fetchRiskFreeRateFromFRED } from './fredapi';
import logo from './logo.svg';
import './App.css';

// Change when deploying to Vercel
const useTestData = false;

function App() {
  const [input, setInput] = useState('');
  const [searchedSymbol, setSearchedSymbol] = useState(''); // NEW
  const [optionsData, setOptionsData] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [riskFreeRate, setRiskFreeRate] = useState(null);
  const [stockPrice, setStockPrice] = useState(null);

  useEffect(() => {
    const getRiskFreeRate = async () => {
      try {
        const rate = await fetchRiskFreeRateFromFRED();
        setRiskFreeRate(rate);
      } catch (err) {
        console.error('Error fetching risk-free rate:', err);
        setRiskFreeRate(0.05); // Default to 5% if fetch fails
      }
    };
    getRiskFreeRate();
  }, []);

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
        const lastTrade = data.data.lastTrade;
        const price = parseFloat(lastTrade.match(/\$[\d.]+/)[0].substring(1));
        setStockPrice(price);
        console.log(`Options data for ${symbol}:`, data);
      } catch (err) {
        console.error('Error fetching options data:', err);
      }
    }
  };

  const getOptionRows = (rows) => rows.filter(
    row => row.strike && row.expiryDate
  );

  const getCallColumns = (headers) => [
    "expiryDate", "c_Last", "c_Change", "c_Bid", "c_Ask", "c_Volume", "c_Openinterest", "strike"
  ];
  const getPutColumns = (headers) => [
    "expiryDate", "strike", "p_Last", "p_Change", "p_Bid", "p_Ask", "p_Volume", "p_Openinterest"
  ];

  const calculateBSMetrics = (option) => {
    const S = stockPrice;
    const K = parseFloat(option.strike);
    const today = new Date();
    const expiry = new Date(option.expiryDate.split(' (')[0]);
    console.log('expiry:', expiry);
    const T = Math.abs(expiry - today) / (1000 * 60 * 60 * 24 * 365); // Time to expiration in years
    const r = riskFreeRate || 0.05; // Use default if not fetched
    const q = 0; // Assuming no dividends for simplicity

    const cMarketPrice = parseFloat(option.c_Last);
    const pMarketPrice = parseFloat(option.p_Last);

    const cImpliedVolatility = getImpliedVolatility({
      S, K, T, r, q, marketPrice: cMarketPrice, optionType: 'call'
    });
    const pImpliedVolatility = getImpliedVolatility({
      S, K, T, r, q, marketPrice: pMarketPrice, optionType: 'put'
    });
    console.log('variables:', { S, K, T, r, q, cMarketPrice, pMarketPrice });
    const cPrice = cImpliedVolatility ? bsPrice(S, K, T, r, q, cImpliedVolatility, 'call') : null;
    const pPrice = pImpliedVolatility ? bsPrice(S, K, T, r, q, pImpliedVolatility, 'put') : null;

    console.log('variables for BS price:', { S, K, T, r, q, cImpliedVolatility, pImpliedVolatility });
    const cGreeks = cImpliedVolatility ? bsGreeks(S, K, T, r, q, cImpliedVolatility, 'call') : null;
    const pGreeks = pImpliedVolatility ? bsGreeks(S, K, T, r, q, pImpliedVolatility, 'put') : null;

    console.log(`Calculated BS metrics for ${option.strike} ${option.expirygroup}:`, {
      cImpliedVolatility, pImpliedVolatility,
      cPrice, pPrice,
      cGreeks, pGreeks
    });

    return {
      cImpliedVolatility, pImpliedVolatility,
      cPrice, pPrice,
      cGreeks, pGreeks
    };
  };

  return (
    <div className="App">
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
        </div>
        {optionsData && optionsData.data && optionsData.data.table && (() => {
          const rows = getOptionRows(optionsData.data.table.rows);
          const headers = optionsData.data.table.headers;
          const callCols = getCallColumns(headers);
          const putCols = getPutColumns(headers);
          const totalCols = callCols.length - 1 + 1 + putCols.length - 2;

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
                      {callCols.slice(0, -1).map((col, idx) => (
                        <th key={`call-${idx}`}>{headers[col]}</th>
                      ))}
                      <th key="strike">{headers["strike"]}</th>
                      {putCols.slice(2).map((col, idx) => (
                        <th key={`put-${idx}`}>{headers[col]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const bsMetrics = calculateBSMetrics(row);
                      return (
                        <React.Fragment key={idx}>
                          <tr
                            onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                            style={{ cursor: 'pointer' }}
                          >
                            {callCols.slice(0, -1).map((col, i) => (
                              <td key={`call-${i}`}>{row[col]}</td>
                            ))}
                            <td key="strike">{row["strike"]}</td>
                            {putCols.slice(2).map((col, i) => (
                              <td key={`put-${i}`}>{row[col]}</td>
                            ))}
                          </tr>
                          {expandedRow === idx && (
                            <tr>
                              <td colSpan={totalCols}>
                                <div>
                                  <h4>Black-Scholes Analysis</h4>
                                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                    <div>
                                      <strong>Calls</strong>
                                      <p>Implied Volatility: {bsMetrics.cImpliedVolatility ? (bsMetrics.cImpliedVolatility * 100).toFixed(2) + '%' : 'N/A'}</p>
                                      {bsMetrics.cGreeks && (
                                        <>
                                          <p>Delta: {bsMetrics.cGreeks.delta.toFixed(4)}</p>
                                          <p>Gamma: {bsMetrics.cGreeks.gamma.toFixed(4)}</p>
                                          <p>Theta: {bsMetrics.cGreeks.theta.toFixed(4)}</p>
                                          <p>Vega: {bsMetrics.cGreeks.vega.toFixed(4)}</p>
                                          <p>Rho: {bsMetrics.cGreeks.rho.toFixed(4)}</p>
                                        </>
                                      )}
                                    </div>
                                    <div>
                                      <strong>Puts</strong>
                                      <p>Implied Volatility: {bsMetrics.pImpliedVolatility ? (bsMetrics.pImpliedVolatility * 100).toFixed(2) + '%' : 'N/A'}</p>
                                      {bsMetrics.pGreeks && (
                                        <>
                                          <p>Delta: {bsMetrics.pGreeks.delta.toFixed(4)}</p>
                                          <p>Gamma: {bsMetrics.pGreeks.gamma.toFixed(4)}</p>
                                          <p>Theta: {bsMetrics.pGreeks.theta.toFixed(4)}</p>
                                          <p>Vega: {bsMetrics.pGreeks.vega.toFixed(4)}</p>
                                          <p>Rho: {bsMetrics.pGreeks.rho.toFixed(4)}</p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </header>
    </div>
  );
}

export default App;