import React from 'react';
import { isUptrendByRSI, rsiCrossoverSignal, rsiOverboughtOversoldSignal } from '../../technicalAnalysis';

const TechnicalView = ({ vwap, close, rsiValues = [] }) => {
  if (vwap === null || close === null) return <span>Loading Technicals...</span>;

  const renderRsiTrend = () => {
    if (rsiValues.length !== 10) return <div className="rsi-loading">Loading...</div>;
    const uptrend = isUptrendByRSI(rsiValues);
    return <div className={`rsi-value ${uptrend ? 'bullish' : 'bearish'}`}>{uptrend ? 'Bullish' : 'Bearish'}</div>;
  };

  const renderRsiCrossover = () => {
    if (rsiValues.length < 2) return <div className="rsi-loading">Loading...</div>;
    const signal = rsiCrossoverSignal(rsiValues);
    let label = 'Neutral';
    let signalClass = 'neutral';
    if (signal === 1) {
      label = 'Bullish';
      signalClass = 'bullish';
    } else if (signal === -1) {
      label = 'Bearish';
      signalClass = 'bearish';
    }
    return <div className={`rsi-value ${signalClass}`}>{label}</div>;
  };

  const renderRsiLevel = () => {
    if (rsiValues.length < 1) return <div className="rsi-loading">Loading...</div>;
    const signal = rsiOverboughtOversoldSignal(rsiValues);
    let label = 'Neutral';
    let signalClass = 'neutral';
    if (signal === 1) {
      label = 'Bullish';
      signalClass = 'bullish';
    } else if (signal === -1) {
      label = 'Bearish';
      signalClass = 'bearish';
    }
    const latestRsi = rsiValues[rsiValues.length - 1];
    const formattedRsi = typeof latestRsi === 'number' ? latestRsi.toFixed(2) : 'N/A';
    return (
      <div className={`rsi-value ${signalClass}`}>
        {label}
        <span style={{ fontSize: '0.9em', color: '#9ca3af', marginLeft: '0.35rem' }}>
          ({formattedRsi})
        </span>
      </div>
    );
  };

  return (
    <div className="widget-row">
      <div className="vwap-widget">
        <div className="vwap-title">VWAP</div>
        <div className={`vwap-value ${close > vwap ? 'bullish' : 'bearish'}`}>{vwap}</div>
        <div className="put-call-signal">{close > vwap ? 'Bullish' : 'Bearish'}</div>
        <div style={{ fontSize: '1rem', color: '#9ca3af', marginTop: '0.25rem', textAlign: 'center' }}>
          Close: {close}
        </div>
      </div>
      <div
        className="rsi-widgets"
        style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <div className="rsi-widget">
          <div className="rsi-title">RSI Trend</div>
          {renderRsiTrend()}
        </div>
        <div className="rsi-widget">
          <div className="rsi-title">RSI Crossover</div>
          {renderRsiCrossover()}
        </div>
        <div className="rsi-widget">
          <div className="rsi-title">Recent RSI Level</div>
          {renderRsiLevel()}
        </div>
      </div>
    </div>
  );
};

export default TechnicalView;