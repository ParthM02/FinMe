import React, { useMemo } from 'react';
import { extractFinancialRatios } from '../../utils/helpers';

const quarterColumns = 4;
const ratioMetricLimit = 6;

const formatPeriodLabel = (period) => {
  if (!period) return '';
  const parts = period.split('/');
  if (parts.length === 3) {
    return `${parts[0]}/${parts[2].slice(-2)}`;
  }
  return period;
};

const formatMetricValue = (value, unit) => {
  if (typeof value !== 'number') return 'N/A';
  if (unit === '%') return `${value.toFixed(2)}%`;
  return value.toFixed(2);
};

const formatSettlementDate = (date) => {
  if (!date) return 'N/A';
  const [year, month, day] = date.split('-');
  if (year && month && day) {
    return `${month}/${day}/${year.slice(-2)}`;
  }
  return date;
};

const FundamentalView = ({ shortInterest = [], financials = null }) => {
  const barData = useMemo(() => {
    if (!Array.isArray(shortInterest) || shortInterest.length < 5) {
      return {
        ready: false,
        bars: [],
        maxValue: 1,
        signal: 'Neutral',
        signalClass: 'neutral',
        barClasses: []
      };
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

  const ratioWidgets = useMemo(() => {
    const ratios = extractFinancialRatios(financials);
    return ratios
      .filter((ratio) => Array.isArray(ratio.values) && ratio.values.length >= 2)
      .slice(0, ratioMetricLimit)
      .map((ratio) => {
        const latestValues = ratio.values.slice(0, quarterColumns);
        const chronological = [...latestValues].reverse();
        const maxValue = Math.max(
          ...chronological.map((entry) => Math.abs(entry.value)),
          1
        );

        const bars = chronological.map((entry, idx) => {
          const prev = chronological[idx - 1];
          let barClass = 'neutral';
          if (prev) {
            if (entry.value > prev.value) barClass = 'bullish';
            else if (entry.value < prev.value) barClass = 'bearish';
          }

          return {
            label: formatPeriodLabel(entry.period),
            value: entry.value,
            barClass,
            height: Math.max(10, (Math.abs(entry.value) / maxValue) * 70)
          };
        });

        const latest = latestValues[0]?.value;
        const previous = latestValues[1]?.value;
        let trend = 'Neutral';
        let trendClass = 'neutral';
        if (typeof latest === 'number' && typeof previous === 'number') {
          if (latest > previous) {
            trend = 'Bullish';
            trendClass = 'bullish';
          } else if (latest < previous) {
            trend = 'Bearish';
            trendClass = 'bearish';
          }
        }

        return {
          key: `${ratio.category}-${ratio.metric}`,
          metric: ratio.metric,
          category: ratio.category,
          unit: ratio.unit,
          bars,
          maxValue,
          trend,
          trendClass,
          latestValue: latest
        };
      });
  }, [financials]);

  const hasShortInterest = Array.isArray(shortInterest) && shortInterest.length > 0;
  const dtc = hasShortInterest ? shortInterest[0]?.days_to_cover : null;
  const dtcValue = typeof dtc === 'number' ? dtc : null;
  let squeeze = 'Low';
  let squeezeClass = 'short-squeeze-low';
  if (dtc >= 8) {
    squeeze = 'High';
    squeezeClass = 'short-squeeze-high';
  } else if (dtc >= 3) {
    squeeze = 'Moderate';
    squeezeClass = 'short-squeeze-moderate';
  }
  const squeezeTrendClass = squeezeClass === 'short-squeeze-high'
    ? 'bullish'
    : squeezeClass === 'short-squeeze-moderate'
      ? 'neutral'
      : 'bearish';
  const shortInterestSectionVisible = hasShortInterest || barData.ready;

  return (
    <div className="widget-row fundamental-sections">
      {shortInterestSectionVisible && (
        <div className="financial-ratios-section short-interest-section">
          <div className="financial-ratios-header">
            <div>
              <div className="financial-ratios-title">Short Interest</div>
              <div className="financial-ratios-subtitle">Exchange-reported positioning</div>
            </div>
          </div>
          <div className="financial-ratios-grid short-interest-grid">
            <div className="ratio-widget short-trend-widget">
              <div className="ratio-widget-header">
                <div>
                  <div className="ratio-widget-metric">Days to Cover</div>
                  <div className="ratio-widget-category">Short interest trend</div>
                </div>
                <div className={`ratio-trend ${barData.signalClass}`}>
                  {barData.signal}
                </div>
              </div>
              {barData.ready ? (
                <svg className="ratio-chart" width="100%" height="120" viewBox="0 0 260 120">
                  {barData.bars.map((bar, idx) => {
                    const height = Math.max(10, (bar.value / barData.maxValue) * 70);
                    const x = 20 + idx * 60;
                    const y = 100 - height;
                    return (
                      <g key={`short-bar-${idx}`}>
                        <rect
                          x={x}
                          y={y}
                          width={36}
                          height={height}
                          rx={6}
                          className={`volume-bar-rect ${barData.barClasses[idx]}`}
                        />
                        <text
                          x={x + 18}
                          y={y - 6}
                          textAnchor="middle"
                          className="ratio-bar-value"
                        >
                          {bar.value?.toFixed(2) ?? 'N/A'}
                        </text>
                        <text
                          x={x + 18}
                          y={110}
                          textAnchor="middle"
                          className="ratio-bar-label"
                        >
                          {bar.date ? formatSettlementDate(bar.date) : '—'}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="ratio-loading">Need five recent settlements to plot the trend.</div>
              )}
            </div>
            <div className="ratio-widget short-squeeze-card">
              <div className="ratio-widget-header">
                <div>
                  <div className="ratio-widget-metric">Short Squeeze Potential</div>
                  <div className="ratio-widget-category">Based on latest days-to-cover</div>
                </div>
                <div className={`ratio-trend ${squeezeTrendClass}`}>
                  {squeeze}
                </div>
              </div>
              <div className="ratio-widget-value">
                {dtcValue !== null ? dtcValue.toFixed(2) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
      {ratioWidgets.length > 0 && (
        <div className="financial-ratios-section">
          <div className="financial-ratios-header">
            <div>
              <div className="financial-ratios-title">Financial Ratio Trends</div>
              <div className="financial-ratios-subtitle">Quarter-over-quarter momentum</div>
            </div>
          </div>
          <div className="financial-ratios-grid">
            {ratioWidgets.map((ratio) => (
              <div className="ratio-widget" key={ratio.key}>
                <div className="ratio-widget-header">
                  <div>
                    <div className="ratio-widget-metric">{ratio.metric}</div>
                    <div className="ratio-widget-category">{ratio.category}</div>
                  </div>
                  <div className={`ratio-trend ${ratio.trendClass}`}>
                    {ratio.trend}
                  </div>
                </div>
                <div className="ratio-widget-value">
                  {formatMetricValue(ratio.latestValue, ratio.unit)}
                </div>
                <svg className="ratio-chart" width="100%" height="120" viewBox="0 0 260 120">
                  {ratio.bars.map((bar, idx) => {
                    const x = 20 + idx * 60;
                    const y = 100 - bar.height;
                    return (
                      <g key={`${ratio.key}-bar-${idx}`}>
                        <rect
                          x={x}
                          y={y}
                          width={36}
                          height={bar.height}
                          rx={6}
                          className={`volume-bar-rect ${bar.barClass}`}
                        />
                        <text
                          x={x + 18}
                          y={y - 6}
                          textAnchor="middle"
                          className="ratio-bar-value"
                        >
                          {formatMetricValue(bar.value, ratio.unit)}
                        </text>
                        <text
                          x={x + 18}
                          y={110}
                          textAnchor="middle"
                          className="ratio-bar-label"
                        >
                          {bar.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FundamentalView;