const sanitizeNumeric = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '--') return null;
  const numeric = Number(trimmed.replace(/[,$%]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
};

const sortValueKeys = (keys) =>
  keys
    .filter((key) => key.startsWith('value'))
    .sort((a, b) => {
      const aIdx = parseInt(a.replace('value', ''), 10);
      const bIdx = parseInt(b.replace('value', ''), 10);
      return aIdx - bIdx;
    });

export const extractFinancialRatios = (financials, { maxPeriods = 4 } = {}) => {
  const table = financials?.data?.financialRatiosTable;
  if (!table) return [];

  const headers = table.headers || {};
  const rows = table.rows || [];
  const ratioColumns = sortValueKeys(Object.keys(headers)).slice(0, maxPeriods);

  if (!ratioColumns.length) return [];

  let currentCategory = 'Financial Ratios';
  return rows.reduce((acc, row) => {
    if (!row) return acc;
    const label = row.value1?.trim();
    if (!label) return acc;

    const isCategoryRow = ratioColumns.every((key) => {
      const val = row[key];
      return !val || val === '' || val === '--';
    });

    if (isCategoryRow) {
      currentCategory = label;
      return acc;
    }

    const values = ratioColumns
      .map((key) => {
        const value = sanitizeNumeric(row[key]);
        if (value === null) return null;
        return {
          period: headers?.[key] || key,
          value
        };
      })
      .filter(Boolean);

    if (!values.length) return acc;

    const usesPercent = ratioColumns.some((key) => typeof row[key] === 'string' && row[key].includes('%'));

    acc.push({
      category: currentCategory,
      metric: label,
      unit: usesPercent ? '%' : null,
      values
    });

    return acc;
  }, []);
};

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