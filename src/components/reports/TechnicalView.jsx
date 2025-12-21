import React, { useMemo } from 'react';
import { isUptrendByRSI, rsiCrossoverSignal, rsiOverboughtOversoldSignal } from '../../technicalAnalysis';

const trendClassMap = {
  bullish: 'bullish',
  bearish: 'bearish',
  neutral: 'neutral'
};

const TechnicalView = ({ vwap, close, rsiValues = [] }) => {
  const hasPriceData = vwap !== null && close !== null;

  const rsiTrendCard = useMemo(() => {
    if (rsiValues.length !== 10) {
      return {
        trend: 'Loading',
        trendClass: trendClassMap.neutral,
        value: '—',
        footnote: 'Need 10 RSI values'
      };
    }
    const uptrend = isUptrendByRSI(rsiValues);
    return {
      trend: uptrend ? 'Bullish' : 'Bearish',
      trendClass: uptrend ? trendClassMap.bullish : trendClassMap.bearish,
      value: uptrend ? 'Uptrend' : 'Downtrend',
      footnote: 'Slope of 14-day RSI'
    };
  }, [rsiValues]);

  const rsiCrossoverCard = useMemo(() => {
    if (rsiValues.length < 2) {
      return {
        trend: 'Loading',
        trendClass: trendClassMap.neutral,
        value: '—',
        footnote: 'Need last two closes'
      };
    }
    const signal = rsiCrossoverSignal(rsiValues);
    let trend = 'Neutral';
    let trendClass = trendClassMap.neutral;
    if (signal === 1) {
      trend = 'Bullish';
      trendClass = trendClassMap.bullish;
    } else if (signal === -1) {
      trend = 'Bearish';
      trendClass = trendClassMap.bearish;
    }
    return {
      trend,
      trendClass,
      value: trend,
      footnote: 'Fast RSI crossing slow'
    };
  }, [rsiValues]);

  const rsiLevelCard = useMemo(() => {
    if (!rsiValues.length) {
      return {
        trend: 'Loading',
        trendClass: trendClassMap.neutral,
        value: '—',
        footnote: 'Awaiting RSI'
      };
    }
    const signal = rsiOverboughtOversoldSignal(rsiValues);
    let trend = 'Neutral';
    let trendClass = trendClassMap.neutral;
    if (signal === 1) {
      trend = 'Bullish';
      trendClass = trendClassMap.bullish;
    } else if (signal === -1) {
      trend = 'Bearish';
      trendClass = trendClassMap.bearish;
    }
    const latestRsi = rsiValues[rsiValues.length - 1];
    return {
      trend,
      trendClass,
      value: typeof latestRsi === 'number' ? latestRsi.toFixed(2) : 'N/A',
      footnote: 'Latest RSI reading'
    };
  }, [rsiValues]);

  const cards = [];

  if (hasPriceData) {
    const bullish = close > vwap;
    cards.push({
      key: 'vwap',
      metric: 'VWAP Alignment',
      category: 'Price action',
      trend: bullish ? 'Bullish' : 'Bearish',
      trendClass: bullish ? trendClassMap.bullish : trendClassMap.bearish,
      value: close.toFixed(2),
      footnote: `VWAP ${vwap?.toFixed(2) ?? 'N/A'}`
    });
  }

  cards.push(
    {
      key: 'rsi-trend',
      metric: 'RSI Trend',
      category: 'Momentum',
      ...rsiTrendCard
    },
    {
      key: 'rsi-cross',
      metric: 'RSI Crossover',
      category: 'Momentum Signals',
      ...rsiCrossoverCard
    },
    {
      key: 'rsi-level',
      metric: 'RSI Level',
      category: 'Momentum Level',
      ...rsiLevelCard
    }
  );

  const readyCards = cards.filter(Boolean);
  if (!readyCards.length) return <span>Loading technicals...</span>;

  return (
    <div className="widget-row fundamental-sections">
      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Technical Snapshot</div>
            <div className="financial-ratios-subtitle">VWAP alignment & RSI signals</div>
          </div>
        </div>
        <div className="financial-ratios-grid technical-grid">
          {readyCards.map((card) => (
            <div className="ratio-widget" key={card.key}>
              <div className="ratio-widget-header">
                <div>
                  <div className="ratio-widget-metric">{card.metric}</div>
                  <div className="ratio-widget-category">{card.category}</div>
                </div>
                <div className={`ratio-trend ${card.trendClass}`}>
                  {card.trend}
                </div>
              </div>
              <div className="ratio-widget-value">{card.value}</div>
              <div className="ratio-widget-footnote">{card.footnote}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechnicalView;