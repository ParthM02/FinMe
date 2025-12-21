import { isUptrendByRSI, rsiCrossoverSignal, rsiOverboughtOversoldSignal } from '../technicalAnalysis';
import { getPopularSentiment, extractFinancialRatios, buildInsiderActivityCards } from './helpers';

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

const parseInstitutionalNumber = (value) => {
  if (value == null) return null;
  const parsed = parseInt(String(value).replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const calculateAllScores = ({
  shortInterest,
  vwap,
  close,
  rsiValues,
  putCallRatio,
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
  if (putCallRatio !== null) scores.Options = putCallRatio > 1 ? 0 : 100;

  // Sentiment Score
  const sentimentComponents = [];

  if (headlines?.length > 0) {
    const { sentiment } = getPopularSentiment(headlines);
    if (sentiment === 'positive') sentimentComponents.push(SCORE.bullish);
    else if (sentiment === 'negative') sentimentComponents.push(SCORE.bearish);
    else sentimentComponents.push(SCORE.neutral);
  }

  if (institutionalSummary) {
    const incInst = parseInstitutionalNumber(institutionalSummary.increasedInstitutions);
    const decInst = parseInstitutionalNumber(institutionalSummary.decreasedInstitutions);
    if (incInst !== null && decInst !== null) {
      let instScore = SCORE.neutral;
      if (incInst > decInst) instScore = SCORE.bullish;
      else if (incInst < decInst) instScore = SCORE.bearish;
      sentimentComponents.push(instScore);
    }
  }

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