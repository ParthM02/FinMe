import React, { useMemo } from 'react';

const FundamentalView = ({ shortInterest = [] }) => {
  const barData = useMemo(() => {
    if (!Array.isArray(shortInterest) || shortInterest.length < 5) {
      return { ready: false };
    }

    const lastFive = shortInterest.slice(0, 5).reverse();
    const bars = lastFive.slice(1).map((item, idx) => ({
      date: item.settlement_date,
      value: item.days_to_cover,
      prevValue: lastFive[idx].days_to_cover
    }));

    const latestBar = bars[bars.length - 1] || {};
    let signal = 'Neutral';
    let signalClass = 'neutral';
    if (latestBar.value > latestBar.prevValue) {
      signal = 'Bearish';
      signalClass = 'bearish';
    } else if (latestBar.value < latestBar.prevValue) {
      signal = 'Bullish';
      signalClass = 'bullish';
    }

    const barClasses = bars.map((bar) => {
      if (bar.value > bar.prevValue) return 'bearish';
      if (bar.value < bar.prevValue) return 'bullish';
      return 'neutral';
    });

    const maxValue = Math.max(...bars.map((bar) => bar.value || 0), 1);

    return {
      ready: true,
      bars,
      maxValue,
      signal,
      signalClass,
      barClasses
    };
  }, [shortInterest]);

  const hasShortInterest = Array.isArray(shortInterest) && shortInterest.length > 0;
  const dtc = hasShortInterest ? shortInterest[0]?.days_to_cover : null;

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
    <div className="widget-row">
      <div className="volume-bar-widget">
        <div className="volume-bar-title">Days to Cover</div>
        {!barData.ready ? (
          <span>Loading data...</span>
        ) : (
          <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
            <svg width="100%" height="80" viewBox="0 0 320 80">
              {barData.bars.map((bar, idx) => {
                const height = Math.max(10, (bar.value / barData.maxValue) * 60);
                return (
                  <g key={idx}>
                    <rect
                      x={20 + idx * 70}
                      y={80 - height}
                      width={40}
                      height={height}
                      rx={8}
                      className={`volume-bar-rect ${barData.barClasses[idx]}`}
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
            <div className={`volume-bar-signal ${barData.signalClass}`}>
              {barData.signal}
            </div>
          </div>
        )}
      </div>
      <div className="short-squeeze-widget">
        <div className="short-squeeze-title">Short Squeeze Potential</div>
        {!hasShortInterest ? (
          <span>Loading...</span>
        ) : (
          <>
            <div className={`short-squeeze-value ${squeezeClass}`}>
              {dtc?.toFixed(2) ?? 'N/A'}
            </div>
            <div className={`short-squeeze-title ${squeezeClass}`}>
              {squeeze}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FundamentalView;