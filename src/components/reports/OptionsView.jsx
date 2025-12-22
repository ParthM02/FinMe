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
import { buildDeltaAsymmetry, buildPremiumSkew, getNearestExpiryGroup, getFurthestExpiryGroup, formatExpiryLabel } from '../../optionAnalysis';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const num = Number(value);
  if (Number.isNaN(num)) return 'N/A';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
};

const OptionsView = ({ putCallRatio, putCallRatioFar, putCallRatioNear, optionData, underlyingPrice }) => {
  const ratioValueFar = putCallRatioFar !== null ? Number(putCallRatioFar) : (putCallRatio !== null ? Number(putCallRatio) : null);
  const ratioValueNear = putCallRatioNear !== null ? Number(putCallRatioNear) : null;

  const ratioSignalFar = ratioValueFar === null
    ? { label: 'Loading', cls: 'neutral' }
    : ratioValueFar > 1
      ? { label: 'Bearish', cls: 'bearish' }
      : ratioValueFar < 0.8
        ? { label: 'Bullish', cls: 'bullish' }
        : { label: 'Neutral', cls: 'neutral' };

  const ratioSignalNear = ratioValueNear === null
    ? { label: 'Loading', cls: 'neutral' }
    : ratioValueNear > 1
      ? { label: 'Bearish', cls: 'bearish' }
      : ratioValueNear < 0.8
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

  const nearestGroup = useMemo(() => getNearestExpiryGroup(optionData?.data?.table?.rows || []), [optionData]);
  const furthestGroup = useMemo(() => getFurthestExpiryGroup(optionData?.data?.table?.rows || []), [optionData]);

  const volumeSplitNear = useMemo(() => {
    const rows = nearestGroup?.rows || [];
    return rows.reduce((acc, row) => {
      acc.call += Number(row?.c_Volume) || 0;
      acc.put += Number(row?.p_Volume) || 0;
      return acc;
    }, { call: 0, put: 0 });
  }, [nearestGroup]);

  const volumeSplitFar = useMemo(() => {
    const rows = furthestGroup?.rows || [];
    return rows.reduce((acc, row) => {
      acc.call += Number(row?.c_Volume) || 0;
      acc.put += Number(row?.p_Volume) || 0;
      return acc;
    }, { call: 0, put: 0 });
  }, [furthestGroup]);

  const totalVolume = volumeSplit.call + volumeSplit.put;
  const callShare = totalVolume ? (volumeSplit.call / totalVolume) * 100 : 0;
  const putShare = totalVolume ? (volumeSplit.put / totalVolume) * 100 : 0;

  const totalVolumeFar = volumeSplitFar.call + volumeSplitFar.put;
  const callShareFar = totalVolumeFar ? (volumeSplitFar.call / totalVolumeFar) * 100 : 0;
  const putShareFar = totalVolumeFar ? (volumeSplitFar.put / totalVolumeFar) * 100 : 0;

  const totalVolumeNear = volumeSplitNear.call + volumeSplitNear.put;
  const callShareNear = totalVolumeNear ? (volumeSplitNear.call / totalVolumeNear) * 100 : 0;
  const putShareNear = totalVolumeNear ? (volumeSplitNear.put / totalVolumeNear) * 100 : 0;

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

  const nearestRows = nearestGroup?.rows || [];
  const furthestRows = furthestGroup?.rows || [];

  const nearestLabel = formatExpiryLabel(nearestGroup?.date);
  const furthestLabel = formatExpiryLabel(furthestGroup?.date);

  const deltaAsymmetry = useMemo(() => {
    return buildDeltaAsymmetry(furthestRows, spot, 10);
  }, [furthestRows, spot]);

  const deltaAsymmetryNear = useMemo(() => {
    return buildDeltaAsymmetry(nearestRows, spot, 10);
  }, [nearestRows, spot]);

  const premiumSkewNear = useMemo(() => buildPremiumSkew(nearestRows, spot, 10), [nearestRows, spot]);
  const premiumSkewFar = useMemo(() => buildPremiumSkew(furthestRows, spot, 10), [furthestRows, spot]);

  const buildConeChart = (asymmetry) => {
    if (!spot || !asymmetry || asymmetry.status === 'unavailable') return null;
    const distance = asymmetry.otmDistance ?? 10;
    const labels = [
      `-${distance} OTM`,
      'Spot',
      `+${distance} OTM`
    ];

    const callDelta = asymmetry.callDelta ?? 0;
    const putDelta = asymmetry.putDelta ?? 0;

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
  };

  const deltaChart = useMemo(() => buildConeChart(deltaAsymmetry), [deltaAsymmetry, spot]);
  const deltaChartNear = useMemo(() => buildConeChart(deltaAsymmetryNear), [deltaAsymmetryNear, spot]);

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
            <div className="financial-ratios-subtitle">Nearest vs furthest expiration</div>
          </div>
        </div>
        <div className="financial-ratios-grid options-grid">
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Put / Call Ratio (Nearest)</div>
                <div className="ratio-widget-category">Nearest expiration {nearestLabel}</div>
              </div>
              <div className={`ratio-trend ${ratioSignalNear.cls}`}>
                {ratioSignalNear.label}
              </div>
            </div>
            <div className="ratio-widget-value">
              {ratioValueNear !== null ? ratioValueNear.toFixed(2) : '—'}
            </div>
            <div className="options-meter">
              <div className="options-meter-track">
                <div
                  className="options-meter-fill"
                  style={{ width: `${Math.max(0, Math.min(ratioValueNear ?? 0, 2)) / 2 * 100}%` }}
                />
              </div>
              <div className="options-meter-labels">
                <span>Bullish</span>
                <span>Bearish</span>
              </div>
            </div>
            <div className="options-volume-bars mini">
              <div className="options-volume-row">
                <span>Calls</span>
                <div className="options-volume-track">
                  <div className="options-volume-fill bullish" style={{ width: `${callShareNear}%` }} />
                </div>
                <span>{formatNumber(volumeSplitNear.call)}</span>
              </div>
              <div className="options-volume-row">
                <span>Puts</span>
                <div className="options-volume-track">
                  <div className="options-volume-fill bearish" style={{ width: `${putShareNear}%` }} />
                </div>
                <span>{formatNumber(volumeSplitNear.put)}</span>
              </div>
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Put / Call Ratio (Furthest)</div>
                <div className="ratio-widget-category">Furthest expiration {furthestLabel}</div>
              </div>
              <div className={`ratio-trend ${ratioSignalFar.cls}`}>
                {ratioSignalFar.label}
              </div>
            </div>
            <div className="ratio-widget-value">
              {ratioValueFar !== null ? ratioValueFar.toFixed(2) : '—'}
            </div>
            <div className="options-meter">
              <div className="options-meter-track">
                <div
                  className="options-meter-fill"
                  style={{ width: `${Math.max(0, Math.min(ratioValueFar ?? 0, 2)) / 2 * 100}%` }}
                />
              </div>
              <div className="options-meter-labels">
                <span>Bullish</span>
                <span>Bearish</span>
              </div>
            </div>
            <div className="options-volume-bars mini">
              <div className="options-volume-row">
                <span>Calls</span>
                <div className="options-volume-track">
                  <div className="options-volume-fill bullish" style={{ width: `${callShareFar}%` }} />
                </div>
                <span>{formatNumber(volumeSplitFar.call)}</span>
              </div>
              <div className="options-volume-row">
                <span>Puts</span>
                <div className="options-volume-track">
                  <div className="options-volume-fill bearish" style={{ width: `${putShareFar}%` }} />
                </div>
                <span>{formatNumber(volumeSplitFar.put)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Options Implied Probabilities</div>
            <div className="financial-ratios-subtitle">Nearest vs furthest expiration</div>
          </div>
        </div>
        <div className="financial-ratios-grid options-grid">
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Delta Method (Nearest)</div>
                <div className="ratio-widget-category">Nearest expiration {nearestLabel}</div>
              </div>
              <div className={`ratio-trend ${deltaAsymmetryNear.signalClass || 'neutral'}`}>
                {deltaAsymmetryNear.signal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {deltaAsymmetryNear.callDelta !== null && deltaAsymmetryNear.putDelta !== null
                ? `${(deltaAsymmetryNear.callDelta ?? 0).toFixed(2)} / ${(deltaAsymmetryNear.putDelta ?? 0).toFixed(2)}`
                : '—'}
            </div>
            <div className="ratio-widget-footnote">
              {spot
                ? `Nearest expiry ±${deltaAsymmetryNear.otmDistance || 10} around $${spot.toFixed(2)}`
                : 'Waiting for price'}
            </div>
            <div className="options-delta-chart">
              {deltaChartNear ? (
                <Line data={deltaChartNear} options={deltaChartOptions} height={120} />
              ) : (
                <div className="ratio-loading">Waiting for option chain...</div>
              )}
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Delta Method (Furthest)</div>
                <div className="ratio-widget-category">Furthest expiration {furthestLabel}</div>
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
      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Options Premium Skew</div>
            <div className="financial-ratios-subtitle">Midpoint/Premium method (risk reversal)</div>
          </div>
        </div>
        <div className="financial-ratios-grid options-grid">
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Midpoint/Premium (Nearest)</div>
                <div className="ratio-widget-category">Nearest expiration {nearestLabel}</div>
              </div>
              <div className={`ratio-trend ${premiumSkewNear.signalClass || 'neutral'}`}>
                {premiumSkewNear.signal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {premiumSkewNear.callPremium !== null && premiumSkewNear.putPremium !== null
                ? `${(premiumSkewNear.callPremium ?? 0).toFixed(2)} / ${(premiumSkewNear.putPremium ?? 0).toFixed(2)}`
                : '—'}
            </div>
            <div className="options-meter">
              <div className="options-meter-track">
                <div
                  className="options-meter-fill"
                  style={{ width: `${Math.max(0, Math.min(premiumSkewNear.callPremium && premiumSkewNear.putPremium ? (premiumSkewNear.callPremium / Math.max(1e-6, premiumSkewNear.callPremium + premiumSkewNear.putPremium)) * 100 : 50, 100))}%` }}
                />
              </div>
              <div className="options-meter-labels">
                <span>Call Premium</span>
                <span>Put Premium</span>
              </div>
            </div>
            <div className="ratio-widget-footnote">
              {spot
                ? `Nearest expiry ±${premiumSkewNear.otmDistance || 10} around $${spot.toFixed(2)} | Strikes ${premiumSkewNear.strikes?.put ?? '—'} / ${premiumSkewNear.strikes?.call ?? '—'}`
                : 'Waiting for price'}
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Midpoint/Premium (Furthest)</div>
                <div className="ratio-widget-category">Furthest expiration {furthestLabel}</div>
              </div>
              <div className={`ratio-trend ${premiumSkewFar.signalClass || 'neutral'}`}>
                {premiumSkewFar.signal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {premiumSkewFar.callPremium !== null && premiumSkewFar.putPremium !== null
                ? `${(premiumSkewFar.callPremium ?? 0).toFixed(2)} / ${(premiumSkewFar.putPremium ?? 0).toFixed(2)}`
                : '—'}
            </div>
            <div className="options-meter">
              <div className="options-meter-track">
                <div
                  className="options-meter-fill"
                  style={{ width: `${Math.max(0, Math.min(premiumSkewFar.callPremium && premiumSkewFar.putPremium ? (premiumSkewFar.callPremium / Math.max(1e-6, premiumSkewFar.callPremium + premiumSkewFar.putPremium)) * 100 : 50, 100))}%` }}
                />
              </div>
              <div className="options-meter-labels">
                <span>Call Premium</span>
                <span>Put Premium</span>
              </div>
            </div>
            <div className="ratio-widget-footnote">
              {spot
                ? `Furthest expiry ±${premiumSkewFar.otmDistance || 10} around $${spot.toFixed(2)} | Strikes ${premiumSkewFar.strikes?.put ?? '—'} / ${premiumSkewFar.strikes?.call ?? '—'}`
                : 'Waiting for price'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsView;