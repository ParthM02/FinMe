import React from 'react';
import { isUptrendByRSI, rsiCrossoverSignal, rsiOverboughtOversoldSignal } from '../../technicalAnalysis';

const TechnicalView = ({ vwap, close, rsiValues }) => {
  if (vwap === null) return <span>Loading Technicals...</span>;

  return (
    <div className="widget-row">
      <div className="vwap-widget">
        <div className="vwap-title">VWAP</div>
        <div className={`vwap-value ${close > vwap ? 'bullish' : 'bearish'}`}>{vwap}</div>
        <div className="put-call-signal">{close > vwap ? 'Bullish' : 'Bearish'}</div>
        <div style={{ fontSize: '1rem', color: '#9ca3af', marginTop: '0.25rem' }}>Close: {close}</div>
      </div>
      <div className="rsi-widgets" style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="rsi-widget">
          <div className="rsi-title">RSI Trend</div>
          <div className={`rsi-value ${isUptrendByRSI(rsiValues) ? 'bullish' : 'bearish'}`}>
            {isUptrendByRSI(rsiValues) ? 'Bullish' : 'Bearish'}
          </div>
        </div>
        {/* Add Crossover and Levels widgets similarly */}
      </div>
    </div>
  );
};

export default TechnicalView;