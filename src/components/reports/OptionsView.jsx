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
import { buildDeltaAsymmetry, buildPremiumForecast, getNearestExpiryGroup, getFurthestExpiryGroup, formatExpiryLabel } from '../../optionAnalysis';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const num = Number(value);
  if (Number.isNaN(num)) return 'N/A';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
};

const buildConeChart = (spot, asymmetry) => {
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

const formatTimeToExpiry = (years) => {
  if (years === null || years === undefined) return null;
  const num = Number(years);
  if (!Number.isFinite(num) || num <= 0) return null;
  const days = Math.round(num * 365);
  if (days === 1) return '1 day';
  return `${days} days`;
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

  const totalVolumeFar = volumeSplitFar.call + volumeSplitFar.put;
  const callShareFar = totalVolumeFar ? (volumeSplitFar.call / totalVolumeFar) * 100 : 0;
  const putShareFar = totalVolumeFar ? (volumeSplitFar.put / totalVolumeFar) * 100 : 0;

  const totalVolumeNear = volumeSplitNear.call + volumeSplitNear.put;
  const callShareNear = totalVolumeNear ? (volumeSplitNear.call / totalVolumeNear) * 100 : 0;
  const putShareNear = totalVolumeNear ? (volumeSplitNear.put / totalVolumeNear) * 100 : 0;

  const spot = useMemo(() => {
    // Prefer live lastTrade price from the API response; fall back to any provided underlyingPrice
    const lastTradeText = optionData?.data?.lastTrade;
    if (typeof lastTradeText === 'string') {
      const match = lastTradeText.match(/\$([0-9]+(?:\.[0-9]+)?)/);
      const parsed = match ? Number(match[1]) : null;
      if (Number.isFinite(parsed)) return parsed;
    }

    if (typeof underlyingPrice === 'number' && Number.isFinite(underlyingPrice)) {
      return underlyingPrice;
    }

    return null;
  }, [optionData, underlyingPrice]);

  const nearestRows = useMemo(() => nearestGroup?.rows || [], [nearestGroup]);
  const furthestRows = useMemo(() => furthestGroup?.rows || [], [furthestGroup]);

  const nearestLabel = formatExpiryLabel(nearestGroup?.date);
  const furthestLabel = formatExpiryLabel(furthestGroup?.date);

  const deltaAsymmetry = useMemo(() => {
    return buildDeltaAsymmetry(furthestRows, spot, 10);
  }, [furthestRows, spot]);

  const deltaAsymmetryNear = useMemo(() => {
    return buildDeltaAsymmetry(nearestRows, spot, 10);
  }, [nearestRows, spot]);

  const premiumForecastNear = useMemo(() => buildPremiumForecast(nearestRows, spot, 10), [nearestRows, spot]);
  const premiumForecastFar = useMemo(() => buildPremiumForecast(furthestRows, spot, 10), [furthestRows, spot]);

  const deltaChart = useMemo(() => buildConeChart(spot, deltaAsymmetry), [deltaAsymmetry, spot]);
  const deltaChartNear = useMemo(() => buildConeChart(spot, deltaAsymmetryNear), [deltaAsymmetryNear, spot]);

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
            <div className="ratio-supplement">
              Delta Method uses option delta (from implied volatility) as a probability proxy. Midpoint/Premium Method explains what the market is charging for a symmetric upside+downside bet. These are market-implied signals, not guarantees.
            </div>
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
            <div className="ratio-supplement">
              Meaning: this shows |Δ| for the +{deltaAsymmetryNear.otmDistance || 10} call / -{deltaAsymmetryNear.otmDistance || 10} put.
              Example: 0.33 / 0.28 means the +OTM call has ~0.33 delta magnitude while the -OTM put has ~0.28; higher first number suggests relatively more upside sensitivity priced than downside.
              Note: delta is a sensitivity-based proxy, not a literal probability. Expires in ~{formatTimeToExpiry(deltaAsymmetryNear.timeToExpiry) || '—'}.
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
                <div className="ratio-widget-metric">Midpoint/Premium Method (Nearest)</div>
                <div className="ratio-widget-category">Nearest expiration {nearestLabel}</div>
              </div>
              <div className={`ratio-trend ${premiumForecastNear.biasClass || 'neutral'}`}>
                {premiumForecastNear.biasSignal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {premiumForecastNear.straddleMid !== undefined && premiumForecastNear.straddleMid !== null
                ? `Cost $${premiumForecastNear.straddleMid.toFixed(2)}`
                : '—'}
            </div>
            <div className="ratio-widget-footnote">
              {premiumForecastNear.biasRatio !== undefined && premiumForecastNear.biasRatio !== null
                ? `Bias: ${(premiumForecastNear.biasRatio * 100).toFixed(0)}% to Calls`
                : 'Bias: —'}
            </div>
            <div className="ratio-widget-footnote">
              {premiumForecastNear.weightedTarget !== undefined && premiumForecastNear.weightedTarget !== null
                ? `Target: $${premiumForecastNear.weightedTarget.toFixed(2)}`
                : 'Target: —'}
            </div>
            <div className="ratio-supplement">
              Cost: call mid + put mid at symmetric strikes (a strangle). It’s quoted per share (roughly ×100 per contract).
              Bias: callPremium / (callPremium + putPremium). Example: 60% means ~60% of the total premium is in calls (calls are richer vs puts at these strikes).
              Target: premium-weighted “tilt” level = (callPremium·upStrike + putPremium·downStrike) / (callPremium + putPremium) — a center-of-mass, not a price forecast. Expires in ~{formatTimeToExpiry(premiumForecastNear.timeToExpiry) || '—'}.
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
            <div className="ratio-supplement">
              Meaning: this shows |Δ| for the +{deltaAsymmetry.otmDistance || 10} call / -{deltaAsymmetry.otmDistance || 10} put.
              Higher first number suggests relatively more upside sensitivity priced than downside; higher second number suggests the opposite.
              Note: delta is a sensitivity-based proxy, not a literal probability. Expires in ~{formatTimeToExpiry(deltaAsymmetry.timeToExpiry) || '—'}.
            </div>
            <div className="options-delta-chart">
              {deltaChart ? (
                <Line data={deltaChart} options={deltaChartOptions} height={120} />
              ) : (
                <div className="ratio-loading">Waiting for option chain...</div>
              )}
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Midpoint/Premium Method (Furthest)</div>
                <div className="ratio-widget-category">Furthest expiration {furthestLabel}</div>
              </div>
              <div className={`ratio-trend ${premiumForecastFar.biasClass || 'neutral'}`}>
                {premiumForecastFar.biasSignal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {premiumForecastFar.straddleMid !== undefined && premiumForecastFar.straddleMid !== null
                ? `Cost $${premiumForecastFar.straddleMid.toFixed(2)}`
                : '—'}
            </div>
            <div className="ratio-widget-footnote">
              {premiumForecastFar.biasRatio !== undefined && premiumForecastFar.biasRatio !== null
                ? `Bias: ${(premiumForecastFar.biasRatio * 100).toFixed(0)}% to Calls`
                : 'Bias: —'}
            </div>
            <div className="ratio-widget-footnote">
              {premiumForecastFar.weightedTarget !== undefined && premiumForecastFar.weightedTarget !== null
                ? `Target: $${premiumForecastFar.weightedTarget.toFixed(2)}`
                : 'Target: —'}
            </div>
            <div className="ratio-supplement">
              Cost: call mid + put mid at symmetric strikes (a strangle). It’s quoted per share (roughly ×100 per contract).
              Bias: callPremium / (callPremium + putPremium). Higher % = calls richer; lower % = puts richer.
              Target: premium-weighted “tilt” level = (callPremium·upStrike + putPremium·downStrike) / (callPremium + putPremium) — a center-of-mass, not a price forecast. Expires in ~{formatTimeToExpiry(premiumForecastFar.timeToExpiry) || '—'}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsView;