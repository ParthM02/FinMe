import React, { useMemo } from 'react';

const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const num = Number(value);
  if (Number.isNaN(num)) return 'N/A';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
};

const OptionsView = ({ putCallRatio, optionData }) => {
  const ratioValue = putCallRatio !== null ? Number(putCallRatio) : null;
  const ratioSignal = ratioValue === null
    ? { label: 'Loading', cls: 'neutral' }
    : ratioValue > 1
      ? { label: 'Bearish', cls: 'bearish' }
      : ratioValue < 0.8
        ? { label: 'Bullish', cls: 'bullish' }
        : { label: 'Neutral', cls: 'neutral' };

  const volumeSplit = useMemo(() => {
    const rows = optionData?.data?.table?.rows || [];
    return rows.reduce((acc, row) => {
      acc.call += Number(row?.c_Volume) || 0;
      acc.put += Number(row?.p_Volume) || 0;
      return acc;
    }, { call: 0, put: 0 });
  }, [optionData]);

  const totalVolume = volumeSplit.call + volumeSplit.put;
  const callShare = totalVolume ? (volumeSplit.call / totalVolume) * 100 : 0;
  const putShare = totalVolume ? (volumeSplit.put / totalVolume) * 100 : 0;

  return (
    <div className="widget-row fundamental-sections">
      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Options Positioning</div>
            <div className="financial-ratios-subtitle">Put/call momentum & volume mix</div>
          </div>
        </div>
        <div className="financial-ratios-grid options-grid">
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Put / Call Ratio</div>
                <div className="ratio-widget-category">Intraday sentiment</div>
              </div>
              <div className={`ratio-trend ${ratioSignal.cls}`}>
                {ratioSignal.label}
              </div>
            </div>
            <div className="ratio-widget-value">
              {ratioValue !== null ? ratioValue.toFixed(2) : '—'}
            </div>
            <div className="options-meter">
              <div className="options-meter-track">
                <div
                  className="options-meter-fill"
                  style={{ width: `${Math.max(0, Math.min(ratioValue ?? 0, 2)) / 2 * 100}%` }}
                />
              </div>
              <div className="options-meter-labels">
                <span>Bullish</span>
                <span>Bearish</span>
              </div>
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Volume Mix</div>
                <div className="ratio-widget-category">Across tracked chains</div>
              </div>
              <div className={`ratio-trend ${callShare >= putShare ? 'bullish' : 'bearish'}`}>
                {callShare >= putShare ? 'Calls Favored' : 'Puts Favored'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {totalVolume ? `${formatNumber(totalVolume)} contracts` : '—'}
            </div>
            <div className="options-volume-bars">
              <div className="options-volume-row">
                <span>Calls</span>
                <div className="options-volume-track">
                  <div
                    className="options-volume-fill bullish"
                    style={{ width: `${callShare}%` }}
                  />
                </div>
                <span>{formatNumber(volumeSplit.call)}</span>
              </div>
              <div className="options-volume-row">
                <span>Puts</span>
                <div className="options-volume-track">
                  <div
                    className="options-volume-fill bearish"
                    style={{ width: `${putShare}%` }}
                  />
                </div>
                <span>{formatNumber(volumeSplit.put)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsView;