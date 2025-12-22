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
import { buildDeltaAsymmetry, buildPremiumForecast, getNearestExpiryGroup, getFurthestExpiryGroup, getExpiryGroupNearestToTarget, formatExpiryLabel } from '../../optionAnalysis';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const num = Number(value);
  if (Number.isNaN(num)) return 'N/A';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
};

const buildBellCurveChart = (spot, asymmetry) => {
  if (!spot || !asymmetry || asymmetry.status === 'unavailable') return null;

  const distance = asymmetry.otmDistance ?? 10;
  const stdDev = Math.max(distance / 1.65, 0.25); // map ~90% interval to the otm distance
  const mean = spot;
  const start = mean - distance * 3;
  const end = mean + distance * 3;
  const step = (end - start) / 80;

  const points = [];
  let maxY = 0;
  for (let x = start; x <= end; x += step) {
    const z = (x - mean) / stdDev;
    const y = Math.exp(-0.5 * z * z);
    maxY = Math.max(maxY, y);
    points.push({ x, y });
  }

  const normalized = maxY > 0 ? points.map((p) => ({ x: p.x, y: p.y / maxY })) : [];
  if (!normalized.length) return null;

  return {
    datasets: [
      {
        label: 'Probability density (proxy)',
        data: normalized,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      },
      {
        label: 'Anchor',
        data: [
          { x: spot, y: 0 },
          { x: spot, y: 1 }
        ],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0
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

  const target3MDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  }, []);

  const nearestGroup = useMemo(() => getNearestExpiryGroup(optionData?.data?.table?.rows || []), [optionData]);
  const midTermGroup = useMemo(() => {
    const rows = optionData?.data?.table?.rows || [];
    if (!rows.length) return null;
    const threeMonth = getExpiryGroupNearestToTarget(rows, target3MDate);
    if (threeMonth) return threeMonth;
    return getFurthestExpiryGroup(rows);
  }, [optionData, target3MDate]);

  const volumeSplitNear = useMemo(() => {
    const rows = nearestGroup?.rows || [];
    return rows.reduce((acc, row) => {
      acc.call += Number(row?.c_Volume) || 0;
      acc.put += Number(row?.p_Volume) || 0;
      return acc;
    }, { call: 0, put: 0 });
  }, [nearestGroup]);

  const volumeSplitMid = useMemo(() => {
    const rows = midTermGroup?.rows || [];
    return rows.reduce((acc, row) => {
      acc.call += Number(row?.c_Volume) || 0;
      acc.put += Number(row?.p_Volume) || 0;
      return acc;
    }, { call: 0, put: 0 });
  }, [midTermGroup]);

  const totalVolumeMid = volumeSplitMid.call + volumeSplitMid.put;
  const callShareMid = totalVolumeMid ? (volumeSplitMid.call / totalVolumeMid) * 100 : 0;
  const putShareMid = totalVolumeMid ? (volumeSplitMid.put / totalVolumeMid) * 100 : 0;

  const totalVolumeNear = volumeSplitNear.call + volumeSplitNear.put;
  const callShareNear = totalVolumeNear ? (volumeSplitNear.call / totalVolumeNear) * 100 : 0;
  const putShareNear = totalVolumeNear ? (volumeSplitNear.put / totalVolumeNear) * 100 : 0;

  const ratioValueNear = useMemo(() => {
    if (putCallRatioNear !== null && putCallRatioNear !== undefined) return Number(putCallRatioNear);
    if (volumeSplitNear.call > 0) return volumeSplitNear.put / volumeSplitNear.call;
    if (putCallRatio !== null && putCallRatio !== undefined) return Number(putCallRatio);
    return null;
  }, [putCallRatioNear, volumeSplitNear.call, volumeSplitNear.put, putCallRatio]);

  const ratioSignalNear = ratioValueNear === null
    ? { label: 'Loading', cls: 'neutral' }
    : ratioValueNear > 1
      ? { label: 'Bearish', cls: 'bearish' }
      : ratioValueNear < 0.8
        ? { label: 'Bullish', cls: 'bullish' }
        : { label: 'Neutral', cls: 'neutral' };

  const ratioValueMid = useMemo(() => {
    if (volumeSplitMid.call > 0) return volumeSplitMid.put / volumeSplitMid.call;
    if (putCallRatioFar !== null && putCallRatioFar !== undefined) return Number(putCallRatioFar);
    if (putCallRatio !== null && putCallRatio !== undefined) return Number(putCallRatio);
    return null;
  }, [volumeSplitMid.call, volumeSplitMid.put, putCallRatioFar, putCallRatio]);

  const ratioSignalMid = ratioValueMid === null
    ? { label: 'Loading', cls: 'neutral' }
    : ratioValueMid > 1
      ? { label: 'Bearish', cls: 'bearish' }
      : ratioValueMid < 0.8
        ? { label: 'Bullish', cls: 'bullish' }
        : { label: 'Neutral', cls: 'neutral' };

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
  const midTermRows = useMemo(() => midTermGroup?.rows || [], [midTermGroup]);

  const nearestLabel = formatExpiryLabel(nearestGroup?.date);
  const midTermLabel = formatExpiryLabel(midTermGroup?.date);

  const deltaAsymmetryMid = useMemo(() => {
    return buildDeltaAsymmetry(midTermRows, spot, 10);
  }, [midTermRows, spot]);

  const deltaAsymmetryNear = useMemo(() => {
    return buildDeltaAsymmetry(nearestRows, spot, 10);
  }, [nearestRows, spot]);

  const premiumForecastNear = useMemo(() => buildPremiumForecast(nearestRows, spot, 10), [nearestRows, spot]);
  const premiumForecastMid = useMemo(() => buildPremiumForecast(midTermRows, spot, 10), [midTermRows, spot]);

  const rangeChartMid = useMemo(() => buildBellCurveChart(spot, deltaAsymmetryMid), [deltaAsymmetryMid, spot]);
  const rangeChartNear = useMemo(() => buildBellCurveChart(spot, deltaAsymmetryNear), [deltaAsymmetryNear, spot]);


  const rangeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (items) => items?.length ? `$${items[0].parsed.x.toFixed(2)}` : '',
          label: (ctx) => `Probability proxy: ${(ctx.parsed.y * 100).toFixed(1)}%`
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      x: {
        type: 'linear',
        grid: {
          display: false
        },
        ticks: {
          callback: (val) => `$${Number(val).toFixed(0)}`
        }
      },
      y: {
        min: 0,
        max: 1,
        ticks: {
          callback: (val) => `${(Number(val) * 100).toFixed(0)}%`
        },
        grid: {
          color: 'rgba(255,255,255,0.08)'
        }
      }
    }
  };

  const computeImpliedMovePct = (forecast) => {
    if (!spot || !forecast || forecast.straddleMid === null || forecast.straddleMid === undefined) return null;
    if (!spot || spot <= 0) return null;
    return (forecast.straddleMid / spot) * 100;
  };

  const impliedMoveNear = useMemo(() => computeImpliedMovePct(premiumForecastNear), [premiumForecastNear, spot]);
  const impliedMoveMid = useMemo(() => computeImpliedMovePct(premiumForecastMid), [premiumForecastMid, spot]);

  const expiryNearText = formatTimeToExpiry(deltaAsymmetryNear?.timeToExpiry) || formatTimeToExpiry(premiumForecastNear?.timeToExpiry) || null;
  const expiryMidText = formatTimeToExpiry(deltaAsymmetryMid?.timeToExpiry) || formatTimeToExpiry(premiumForecastMid?.timeToExpiry) || null;

  return (
    <div className="widget-row fundamental-sections">
      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Options Positioning</div>
            <div className="financial-ratios-subtitle">Nearest vs ~3M expiration</div>
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
            <div className="ratio-widget-footnote">
              {expiryNearText ? `Expires in ~${expiryNearText}` : 'Expires: —'}
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Put / Call Ratio (~3M)</div>
                <div className="ratio-widget-category">Nearest to ~3M expiration {midTermLabel}</div>
              </div>
              <div className={`ratio-trend ${ratioSignalMid.cls}`}>
                {ratioSignalMid.label}
              </div>
            </div>
            <div className="ratio-widget-value">
              {ratioValueMid !== null ? ratioValueMid.toFixed(2) : '—'}
            </div>
            <div className="options-meter">
              <div className="options-meter-track">
                <div
                  className="options-meter-fill"
                  style={{ width: `${Math.max(0, Math.min(ratioValueMid ?? 0, 2)) / 2 * 100}%` }}
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
                  <div className="options-volume-fill bullish" style={{ width: `${callShareMid}%` }} />
                </div>
                <span>{formatNumber(volumeSplitMid.call)}</span>
              </div>
              <div className="options-volume-row">
                <span>Puts</span>
                <div className="options-volume-track">
                  <div className="options-volume-fill bearish" style={{ width: `${putShareMid}%` }} />
                </div>
                <span>{formatNumber(volumeSplitMid.put)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Options Implied Probabilities</div>
            <div className="financial-ratios-subtitle">Nearest vs ~3M expiration</div>
          </div>
        </div>
        <div className="financial-ratios-grid options-grid">
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Market Expected Range (Nearest)</div>
                <div className="ratio-widget-category">Nearest expiration {nearestLabel}</div>
              </div>
              <div className={`ratio-trend ${deltaAsymmetryNear.signalClass || 'neutral'}`}>
                {deltaAsymmetryNear.signal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {deltaAsymmetryNear.callDelta !== null && deltaAsymmetryNear.putDelta !== null ? (
                <div className="ratio-widget-value-lines">
                  <div>{`${(deltaAsymmetryNear.callDelta * 100).toFixed(0)}% theoretical probability of finishing above $${(spot + (deltaAsymmetryNear.otmDistance || 10)).toFixed(2)}`}</div>
                  <div>{`${(deltaAsymmetryNear.putDelta * 100).toFixed(0)}% theoretical probability of finishing below $${(spot - (deltaAsymmetryNear.otmDistance || 10)).toFixed(2)}`}</div>
                </div>
              ) : '—'}
            </div>
            <div className="ratio-widget-footnote">
              {spot
                ? `Anchored at ±${deltaAsymmetryNear.otmDistance || 10} around $${spot.toFixed(2)}`
                : 'Waiting for price'}
            </div>
            <div className="ratio-widget-footnote">
              {expiryNearText ? `Expires in ~${expiryNearText}` : 'Expires: —'}
            </div>
            <div className="options-delta-chart">
              {rangeChartNear ? (
                <Line data={rangeChartNear} options={rangeChartOptions} height={120} />
              ) : (
                <div className="ratio-loading">Waiting for option chain...</div>
              )}
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Expected Swing (Nearest)</div>
                <div className="ratio-widget-category">Nearest expiration {nearestLabel}</div>
              </div>
              <div className={`ratio-trend ${premiumForecastNear.biasClass || 'neutral'}`}>
                {premiumForecastNear.biasSignal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {impliedMoveNear !== null
                ? `${impliedMoveNear.toFixed(1)}% swing expected`
                : '—'}
            </div>
            <div className="ratio-widget-footnote">
              {premiumForecastNear.straddleMid !== undefined && premiumForecastNear.straddleMid !== null
                ? `Cost: $${premiumForecastNear.straddleMid.toFixed(2)}`
                : 'Cost: —'}
            </div>
            <div className="ratio-widget-footnote">
              {premiumForecastNear.weightedTarget !== undefined && premiumForecastNear.weightedTarget !== null
                ? `Target: $${premiumForecastNear.weightedTarget.toFixed(2)}`
                : 'Target: —'}
            </div>
            <div className="options-bias">
              <div className="options-bias-track">
                <div
                  className="options-bias-segment bullish"
                  style={{ width: `${Math.max(0, Math.min((premiumForecastNear.biasRatio ?? 0.5) * 100, 100))}%` }}
                />
                <div
                  className="options-bias-segment bearish"
                  style={{ width: `${Math.max(0, Math.min((1 - (premiumForecastNear.biasRatio ?? 0.5)) * 100, 100))}%` }}
                />
              </div>
              <div className="options-bias-labels">
                <span>Calls</span>
                <span>Puts</span>
              </div>
              <div className="options-bias-value">
                {premiumForecastNear.biasRatio !== undefined && premiumForecastNear.biasRatio !== null
                  ? `${(premiumForecastNear.biasRatio * 100).toFixed(0)}% premium to Calls`
                  : 'Bias loading...'}
              </div>
            </div>
            <div className="ratio-widget-footnote">
              {expiryNearText ? `Expires in ~${expiryNearText}` : 'Expires: —'}
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Market Expected Range (~3M)</div>
                <div className="ratio-widget-category">Nearest to ~3M expiration {midTermLabel}</div>
              </div>
              <div className={`ratio-trend ${deltaAsymmetryMid.signalClass || 'neutral'}`}>
                {deltaAsymmetryMid.signal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {deltaAsymmetryMid.callDelta !== null && deltaAsymmetryMid.putDelta !== null ? (
                <div className="ratio-widget-value-lines">
                  <div>{`${(deltaAsymmetryMid.callDelta * 100).toFixed(0)}% theoretical probability of finishing above $${(spot + (deltaAsymmetryMid.otmDistance || 10)).toFixed(2)}`}</div>
                  <div>{`${(deltaAsymmetryMid.putDelta * 100).toFixed(0)}% theoretical probability of finishing below $${(spot - (deltaAsymmetryMid.otmDistance || 10)).toFixed(2)}`}</div>
                </div>
              ) : '—'}
            </div>
            <div className="ratio-widget-footnote">
              {spot
                ? `Anchored at ±${deltaAsymmetryMid.otmDistance || 10} around $${spot.toFixed(2)}`
                : 'Waiting for price'}
            </div>
            <div className="ratio-widget-footnote">
              {expiryMidText ? `Expires in ~${expiryMidText}` : 'Expires: —'}
            </div>
            <div className="options-delta-chart">
              {rangeChartMid ? (
                <Line data={rangeChartMid} options={rangeChartOptions} height={120} />
              ) : (
                <div className="ratio-loading">Waiting for option chain...</div>
              )}
            </div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Expected Swing (~3M)</div>
                <div className="ratio-widget-category">Nearest to ~3M expiration {midTermLabel}</div>
              </div>
              <div className={`ratio-trend ${premiumForecastMid.biasClass || 'neutral'}`}>
                {premiumForecastMid.biasSignal || 'Pending'}
              </div>
            </div>
            <div className="ratio-widget-value">
              {impliedMoveMid !== null
                ? `${impliedMoveMid.toFixed(1)}% swing expected`
                : '—'}
            </div>
            <div className="ratio-widget-footnote">
              {premiumForecastMid.straddleMid !== undefined && premiumForecastMid.straddleMid !== null
                ? `Cost: $${premiumForecastMid.straddleMid.toFixed(2)}`
                : 'Cost: —'}
            </div>
            <div className="ratio-widget-footnote">
              {premiumForecastMid.weightedTarget !== undefined && premiumForecastMid.weightedTarget !== null
                ? `Target: $${premiumForecastMid.weightedTarget.toFixed(2)}`
                : 'Target: —'}
            </div>
            <div className="ratio-widget-footnote">
              {expiryMidText ? `Expires in ~${expiryMidText}` : 'Expires: —'}
            </div>
            <div className="options-bias">
              <div className="options-bias-track">
                <div
                  className="options-bias-segment bullish"
                  style={{ width: `${Math.max(0, Math.min((premiumForecastMid.biasRatio ?? 0.5) * 100, 100))}%` }}
                />
                <div
                  className="options-bias-segment bearish"
                  style={{ width: `${Math.max(0, Math.min((1 - (premiumForecastMid.biasRatio ?? 0.5)) * 100, 100))}%` }}
                />
              </div>
              <div className="options-bias-labels">
                <span>Calls</span>
                <span>Puts</span>
              </div>
              <div className="options-bias-value">
                {premiumForecastMid.biasRatio !== undefined && premiumForecastMid.biasRatio !== null
                  ? `${(premiumForecastMid.biasRatio * 100).toFixed(0)}% premium to Calls`
                  : 'Bias loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsView;