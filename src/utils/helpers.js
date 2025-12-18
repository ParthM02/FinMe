export const formatDate = (utcString) => {
  const date = new Date(utcString);
  return date.toLocaleString();
};

export const getPopularSentiment = (headlines) => {
  const counts = { positive: 0, negative: 0, neutral: 0 };
  headlines.forEach(h => {
    if (h.sentiment === 'positive') counts.positive++;
    else if (h.sentiment === 'negative') counts.negative++;
    else counts.neutral++;
  });
  const max = Math.max(counts.positive, counts.negative, counts.neutral);
  if (max === 0) return { sentiment: 'neutral', count: 0 };
  if (max === counts.positive) return { sentiment: 'positive', count: counts.positive };
  if (max === counts.negative) return { sentiment: 'negative', count: counts.negative };
  return { sentiment: 'neutral', count: counts.neutral };
};