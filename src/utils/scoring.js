import { isUptrendByRSI, rsiCrossoverSignal, rsiOverboughtOversoldSignal } from '../technicalAnalysis';
import { getPopularSentiment, extractFinancialRatios } from './helpers';

const MAX_RATIO_METRICS = 6;

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
  if (shortInterest?.length >= 5) {
    const lastFive = shortInterest.slice(0, 5).reverse();
    const latest = lastFive[lastFive.length - 1]?.days_to_cover;
    const previous = lastFive[lastFive.length - 2]?.days_to_cover;
    const daysScore = latest < previous ? 100 : 0;
    const dtc = shortInterest[0]?.days_to_cover;
    const squeezeScore = dtc >= 8 ? 100 : (dtc >= 3 ? 50 : 0);
    fundamentalComponents.push(daysScore, squeezeScore);
  }

  const ratioSeries = extractFinancialRatios(financials).slice(0, MAX_RATIO_METRICS);
  if (ratioSeries.length) {
    const ratioScores = ratioSeries
      .map((ratio) => {
        const latest = ratio.values[0]?.value;
        const previous = ratio.values[1]?.value;
        if (typeof latest !== 'number' || typeof previous !== 'number') return null;
        if (latest === previous) return 50;
        return latest > previous ? 100 : 0;
      })
      .filter((score) => score !== null);

    if (ratioScores.length) {
      const ratioScore = ratioScores.reduce((sum, score) => sum + score, 0) / ratioScores.length;
      fundamentalComponents.push(ratioScore);
    }
  }

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