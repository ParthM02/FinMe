import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { buildDeltaAsymmetry } from '../../optionAnalysis';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const num = Number(value);
  if (Number.isNaN(num)) return 'N/A';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
};

const OptionsView = ({ putCallRatio, optionData, underlyingPrice }) => {
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

  const spot = useMemo(() => {
    if (typeof underlyingPrice === 'number' && Number.isFinite(underlyingPrice)) {
      return underlyingPrice;
    }
    const lastTradeText = optionData?.data?.lastTrade;
    if (typeof lastTradeText === 'string') {
      const match = lastTradeText.match(/\$([0-9]+(?:\.[0-9]+)?)/);
      const parsed = match ? Number(match[1]) : null;
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }, [optionData, underlyingPrice]);

  const deltaAsymmetry = useMemo(() => {
    const rows = optionData?.data?.table?.rows || [];
    return buildDeltaAsymmetry(rows, spot, 10);
  }, [optionData, spot]);

  const deltaChart = useMemo(() => {
    if (!spot || !deltaAsymmetry || deltaAsymmetry.status === 'unavailable') return null;
    const distance = deltaAsymmetry.otmDistance ?? 10;
    const labels = [
      `-${distance} OTM`,
      'Spot',
      `+${distance} OTM`
    ];

    const callDelta = deltaAsymmetry.callDelta ?? 0;
    const putDelta = deltaAsymmetry.putDelta ?? 0;

    return {
      labels,
      datasets: [
        {
          label: 'Downside probability',
          data: [putDelta, 0, 0],
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.25)',
          tension: 0.3,
          fill: true,
          pointRadius: 3
        },
        {
          label: 'Upside probability',
          data: [0, 0, callDelta],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.25)',
          tension: 0.3,
          fill: true,
          pointRadius: 3
        }
      ]
    };
  }, [deltaAsymmetry, spot]);

  const deltaChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        min: 0,
        max: 1,
        ticks: {
          callback: (val) => Number(val).toFixed(1)
        },
        grid: {
          color: 'rgba(255,255,255,0.08)'
        }
      }
    }
  };

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
      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Options Implied Probabilities</div>
            <div className="financial-ratios-subtitle">Delta-based probability cone</div>
          </div>
        </div>
        <div className="financial-ratios-grid options-grid">
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Delta Method</div>
                <div className="ratio-widget-category">Equidistant call vs put</div>
              </div>
              <div className={`ratio-trend ${deltaAsymmetry.signalClass || 'neutral'}`}>
                {deltaAsymmetry.signal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {deltaAsymmetry.callDelta !== null && deltaAsymmetry.putDelta !== null
                ? `${(deltaAsymmetry.callDelta ?? 0).toFixed(2)} / ${(deltaAsymmetry.putDelta ?? 0).toFixed(2)}`
                : '—'}
            </div>
            <div className="ratio-widget-footnote">
              {spot
                ? `±${deltaAsymmetry.otmDistance || 10} OTM around $${spot.toFixed(2)}`
                : 'Waiting for price'}
            </div>
            <div className="options-delta-chart">
              {deltaChart ? (
                <Line data={deltaChart} options={deltaChartOptions} height={120} />
              ) : (
                <div className="ratio-loading">Waiting for option chain...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsView;