import { isUptrendByRSI, rsiCrossoverSignal, rsiOverboughtOversoldSignal } from '../technicalAnalysis';
import { getPopularSentiment, extractFinancialRatios, buildInsiderActivityCards, buildInstitutionalActivityCards } from './helpers';
import {
  buildDeltaAsymmetry,
  buildPremiumForecast,
  calculatePutCallRatio,
  getExpiryGroupNearestToTarget,
  getFurthestExpiryGroup,
  getNearestExpiryGroup
} from '../optionAnalysis';

const MAX_RATIO_METRICS = 6;
const SCORE = { bullish: 100, neutral: 50, bearish: 0 };

const scoreFromDifference = (latest, previous, { bullishWhenDecreasing = false } = {}) => {
  if (typeof latest !== 'number' || typeof previous !== 'number') return null;
  if (latest === previous) return SCORE.neutral;
  const isBullish = bullishWhenDecreasing ? latest < previous : latest > previous;
  return isBullish ? SCORE.bullish : SCORE.bearish;
};

const scoreFromDtcValue = (dtc) => {
  if (typeof dtc !== 'number') return null;
  if (dtc >= 8) return SCORE.bullish;
  if (dtc >= 3) return SCORE.neutral;
  return SCORE.bearish;
};

const scoreFromRatio = (ratio) => {
  if (ratio === null || ratio === undefined) return null;
  if (ratio > 1) return SCORE.bearish;
  if (ratio < 0.8) return SCORE.bullish;
  return SCORE.neutral;
};

const scoreFromSignal = (signalClass) => {
  if (!signalClass) return null;
  if (signalClass === 'bullish') return SCORE.bullish;
  if (signalClass === 'bearish') return SCORE.bearish;
  return SCORE.neutral;
};

export const calculateAllScores = ({
  shortInterest,
  vwap,
  close,
  rsiValues,
  putCallRatio,
  putCallRatioFar,
  putCallRatioNear,
  optionData,
  headlines,
  institutionalSummary,
  financials,
  insiderActivity
}) => {
  const scores = { Fundamental: null, Technical: null, Options: null, Sentiment: null };
  const fundamentalComponents = [];

  // Fundamental Score
  if (shortInterest?.length >= 2) {
    const latest = shortInterest[0]?.days_to_cover;
    const previous = shortInterest[1]?.days_to_cover;
    const daysScore = scoreFromDifference(latest, previous, { bullishWhenDecreasing: true });
    if (daysScore !== null) fundamentalComponents.push(daysScore);
  }

  const latestDtc = shortInterest?.[0]?.days_to_cover;
  const squeezeScore = scoreFromDtcValue(latestDtc);
  if (squeezeScore !== null) fundamentalComponents.push(squeezeScore);

  extractFinancialRatios(financials)
    .slice(0, MAX_RATIO_METRICS)
    .forEach((ratio) => {
      const latest = ratio.values[0]?.value;
      const previous = ratio.values[1]?.value;
      const ratioScore = scoreFromDifference(latest, previous);
      if (ratioScore !== null) fundamentalComponents.push(ratioScore);
    });

  if (fundamentalComponents.length) {
    const total = fundamentalComponents.reduce((sum, score) => sum + score, 0);
    scores.Fundamental = Math.round(total / fundamentalComponents.length);
  }

  // Technical Score
  if (vwap !== null && close !== null && rsiValues?.length >= 10) {
    let vwapScore = close > vwap ? 100 : 0;
    let trendScore = isUptrendByRSI(rsiValues) ? 100 : 0;
    let crossoverScore = rsiCrossoverSignal(rsiValues) === 1 ? 100 : (rsiCrossoverSignal(rsiValues) === -1 ? 0 : 50);
    let levelScore = rsiOverboughtOversoldSignal(rsiValues) === 1 ? 100 : (rsiOverboughtOversoldSignal(rsiValues) === -1 ? 0 : 50);
    scores.Technical = Math.round((vwapScore + trendScore + crossoverScore + levelScore) / 4);
  }

  // Options Score
  const optionComponents = [];
  const optionRows = optionData?.data?.table?.rows || [];

  const target3MDate = new Date();
  target3MDate.setMonth(target3MDate.getMonth() + 3);

  const nearestGroup = getNearestExpiryGroup(optionRows);
  const nearestRows = nearestGroup?.rows || [];

  const midTermGroup = optionRows.length
    ? (getExpiryGroupNearestToTarget(optionRows, target3MDate) || getFurthestExpiryGroup(optionRows))
    : null;
  const midTermRows = midTermGroup?.rows || [];

  const spotPrice = (() => {
    const lastTradeText = optionData?.data?.lastTrade;
    if (typeof lastTradeText === 'string') {
      const match = lastTradeText.match(/\$([0-9]+(?:\.[0-9]+)?)/);
      const parsed = match ? Number(match[1]) : null;
      if (Number.isFinite(parsed)) return parsed;
    }

    return Number.isFinite(close) ? close : null;
  })();

  const ratioValueNear = (() => {
    if (putCallRatioNear !== null && putCallRatioNear !== undefined && Number.isFinite(Number(putCallRatioNear))) {
      return Number(putCallRatioNear);
    }

    const computed = calculatePutCallRatio(nearestRows);
    if (computed !== null && Number.isFinite(computed)) return computed;

    if (putCallRatio !== null && putCallRatio !== undefined && Number.isFinite(Number(putCallRatio))) {
      return Number(putCallRatio);
    }

    return null;
  })();

  const ratioValueMid = (() => {
    const computed = calculatePutCallRatio(midTermRows);
    if (computed !== null && Number.isFinite(computed)) return computed;

    if (putCallRatioFar !== null && putCallRatioFar !== undefined && Number.isFinite(Number(putCallRatioFar))) {
      return Number(putCallRatioFar);
    }

    if (putCallRatio !== null && putCallRatio !== undefined && Number.isFinite(Number(putCallRatio))) {
      return Number(putCallRatio);
    }

    return null;
  })();

  const nearRatioScore = scoreFromRatio(ratioValueNear);
  if (nearRatioScore !== null) optionComponents.push(nearRatioScore);

  const midRatioScore = scoreFromRatio(ratioValueMid);
  if (midRatioScore !== null) optionComponents.push(midRatioScore);

  const deltaNear = buildDeltaAsymmetry(nearestRows, spotPrice, 10);
  if (deltaNear?.status === 'ready') {
    const s = scoreFromSignal(deltaNear.signalClass);
    if (s !== null) optionComponents.push(s);
  }

  const deltaMid = buildDeltaAsymmetry(midTermRows, spotPrice, 10);
  if (deltaMid?.status === 'ready') {
    const s = scoreFromSignal(deltaMid.signalClass);
    if (s !== null) optionComponents.push(s);
  }

  const premiumNear = buildPremiumForecast(nearestRows, spotPrice, 10);
  if (premiumNear?.status === 'ready') {
    const s = scoreFromSignal(premiumNear.biasClass);
    if (s !== null) optionComponents.push(s);
  }

  const premiumMid = buildPremiumForecast(midTermRows, spotPrice, 10);
  if (premiumMid?.status === 'ready') {
    const s = scoreFromSignal(premiumMid.biasClass);
    if (s !== null) optionComponents.push(s);
  }

  if (optionComponents.length) {
    const total = optionComponents.reduce((sum, score) => sum + score, 0);
    scores.Options = Math.round(total / optionComponents.length);
  }

  // Sentiment Score
  const sentimentComponents = [];

  if (headlines?.length > 0) {
    const { sentiment } = getPopularSentiment(headlines);
    if (sentiment === 'positive') sentimentComponents.push(SCORE.bullish);
    else if (sentiment === 'negative') sentimentComponents.push(SCORE.bearish);
    else sentimentComponents.push(SCORE.neutral);
  }

  buildInstitutionalActivityCards(institutionalSummary).forEach((card) => {
    if (!card.signalState) return;
    const score = SCORE[card.signalState];
    if (typeof score === 'number') sentimentComponents.push(score);
  });

  buildInsiderActivityCards(insiderActivity).forEach((card) => {
    if (!card.hasData || !card.signalState) return;
    const score = SCORE[card.signalState];
    if (typeof score === 'number') sentimentComponents.push(score);
  });

  if (sentimentComponents.length) {
    const total = sentimentComponents.reduce((sum, score) => sum + score, 0);
    scores.Sentiment = Math.round(total / sentimentComponents.length);
  }

  return scores;
};