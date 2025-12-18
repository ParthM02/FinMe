import React from 'react';

const FundamentalView = ({ shortInterest }) => {
  if (shortInterest.length < 5) return <span>Loading data...</span>;

  const lastFive = shortInterest.slice(0, 5).reverse();
  const bars = lastFive.slice(1).map((item, idx) => ({
    date: item.settlement_date,
    value: item.days_to_cover,
    prevValue: lastFive[idx].days_to_cover
  }));

  const latest = bars[bars.length - 1]?.value;
  const previous = bars[bars.length - 1]?.prevValue;
  const signal = latest > previous ? 'Bearish' : latest < previous ? 'Bullish' : 'Neutral';
  const signalClass = signal.toLowerCase();

  const dtc = shortInterest[0]?.days_to_cover;
  const squeeze = dtc >= 8 ? 'High' : dtc >= 3 ? 'Moderate' : 'Low';
  const squeezeClass = `short-squeeze-${squeeze.toLowerCase()}`;

  return (
    <div className="widget-row">
      <div className="volume-bar-widget">
        <div className="volume-bar-title">Days to Cover</div>
        <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
          {/* SVG Logic remains the same as your original code */}
          <div className={`volume-bar-signal ${signalClass}`}>{signal}</div>
        </div>
      </div>
      <div className="short-squeeze-widget">
        <div className="short-squeeze-title">Short Squeeze Potential</div>
        <div className={`short-squeeze-value ${squeezeClass}`}>{dtc?.toFixed(2) ?? 'N/A'}</div>
        <div className={`short-squeeze-title ${squeezeClass}`}>{squeeze}</div>
      </div>
    </div>
  );
};

export default FundamentalView;