import { isUptrendByRSI, rsiCrossoverSignal, rsiOverboughtOversoldSignal } from '../technicalAnalysis';
import { getPopularSentiment, extractFinancialRatios } from './helpers';

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

export const calculateAllScores = ({
  shortInterest,
  vwap,
  close,
  rsiValues,
  putCallRatio,
  headlines,
  institutionalSummary,
  financials
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
  if (putCallRatio !== null) scores.Options = putCallRatio > 1 ? 0 : 100;

  // Sentiment Score
  if (headlines?.length > 0 && institutionalSummary) {
    const { sentiment } = getPopularSentiment(headlines);
    let newsScore = sentiment === 'positive' ? 100 : (sentiment === 'negative' ? 0 : 50);
    const incInst = parseInt(institutionalSummary.increasedInstitutions?.replace(/,/g, '') || 0);
    const decInst = parseInt(institutionalSummary.decreasedInstitutions?.replace(/,/g, '') || 0);
    scores.Sentiment = Math.round((newsScore + (incInst > decInst ? 100 : 0)) / 2); // Simplified for brevity
  }

  return scores;
};