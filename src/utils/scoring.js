import { isUptrendByRSI, rsiCrossoverSignal, rsiOverboughtOversoldSignal } from '../technicalAnalysis';
import { getPopularSentiment } from './helpers';

export const calculateAllScores = ({ shortInterest, vwap, close, rsiValues, putCallRatio, headlines, institutionalSummary }) => {
  const scores = { Fundamental: null, Technical: null, Options: null, Sentiment: null };

  // Fundamental Score
  if (shortInterest?.length >= 5) {
    const lastFive = shortInterest.slice(0, 5).reverse();
    const latest = lastFive[lastFive.length - 1]?.days_to_cover;
    const previous = lastFive[lastFive.length - 2]?.days_to_cover;
    let daysScore = latest < previous ? 100 : 0;
    const dtc = shortInterest[0]?.days_to_cover;
    let squeezeScore = dtc >= 8 ? 100 : (dtc >= 3 ? 50 : 0);
    scores.Fundamental = Math.round((daysScore + squeezeScore) / 2);
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