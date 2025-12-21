const sanitizeNumeric = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '--') return null;
  const numeric = Number(trimmed.replace(/[,$%]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
};

const sortValueKeys = (keys) =>
  keys
    .filter((key) => key.startsWith('value') && key !== 'value1')
    .sort((a, b) => {
      const aIdx = parseInt(a.replace('value', ''), 10);
      const bIdx = parseInt(b.replace('value', ''), 10);
      return aIdx - bIdx;
    });

export const extractFinancialRatios = (financials, { maxPeriods = null } = {}) => {
  const table = financials?.data?.financialRatiosTable;
  if (!table) return [];

  const headers = table.headers || {};
  const rows = table.rows || [];
  const allColumns = sortValueKeys(Object.keys(headers));
  const ratioColumns = maxPeriods ? allColumns.slice(0, maxPeriods) : allColumns;

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

const parseDisplayNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '--') return null;
  const isNegative = trimmed.startsWith('(') && trimmed.endsWith(')');
  const cleaned = trimmed.replace(/[(),]/g, '').replace(/[$%]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return isNegative ? -parsed : parsed;
};

export const buildInsiderActivityCards = (insiderActivity) => {
  const data = insiderActivity?.data;
  if (!data) return [];

  const tradeRows = data.numberOfTrades?.rows || [];
  const shareRows = data.numberOfSharesTraded?.rows || [];

  const findValue = (rows, label, period) => {
    const row = rows.find((item) => item.insiderTrade === label);
    return row ? row[period] ?? null : null;
  };

  const configs = [
    {
      key: 'trades-3m',
      metric: 'Trade Mix · 3M',
      category: 'Open market flow',
      rows: tradeRows,
      period: 'months3',
      buyLabel: 'Number of Open Market Buys',
      sellLabel: 'Number of Sells',
      buyDisplay: 'Buys',
      sellDisplay: 'Sells'
    },
    {
      key: 'trades-12m',
      metric: 'Trade Mix · 12M',
      category: 'Open market flow',
      rows: tradeRows,
      period: 'months12',
      buyLabel: 'Number of Open Market Buys',
      sellLabel: 'Number of Sells',
      buyDisplay: 'Buys',
      sellDisplay: 'Sells'
    },
    {
      key: 'shares-3m',
      metric: 'Shares Mix · 3M',
      category: 'Shares bought vs sold',
      rows: shareRows,
      period: 'months3',
      buyLabel: 'Number of Shares Bought',
      sellLabel: 'Number of Shares Sold',
      buyDisplay: 'Bought',
      sellDisplay: 'Sold'
    },
    {
      key: 'shares-12m',
      metric: 'Shares Mix · 12M',
      category: 'Shares bought vs sold',
      rows: shareRows,
      period: 'months12',
      buyLabel: 'Number of Shares Bought',
      sellLabel: 'Number of Shares Sold',
      buyDisplay: 'Bought',
      sellDisplay: 'Sold'
    }
  ];

  return configs.map((cfg) => {
    const buyRaw = findValue(cfg.rows, cfg.buyLabel, cfg.period);
    const sellRaw = findValue(cfg.rows, cfg.sellLabel, cfg.period);
    const hasData = buyRaw !== null && sellRaw !== null && buyRaw !== '' && sellRaw !== '';
    const buyNumeric = hasData ? parseDisplayNumber(buyRaw) : null;
    const sellNumeric = hasData ? parseDisplayNumber(sellRaw) : null;

    let signalState = 'neutral';
    let signalLabel = 'Balanced';

    if (!hasData) {
      signalLabel = 'Loading';
      signalState = 'neutral';
    } else if (buyNumeric > sellNumeric) {
      signalState = 'bullish';
      signalLabel = 'Bullish';
    } else if (buyNumeric < sellNumeric) {
      signalState = 'bearish';
      signalLabel = 'Bearish';
    }

    return {
      key: cfg.key,
      metric: cfg.metric,
      category: cfg.category,
      buyDisplay: cfg.buyDisplay,
      sellDisplay: cfg.sellDisplay,
      buyValue: buyRaw ?? 'N/A',
      sellValue: sellRaw ?? 'N/A',
      hasData,
      signalState: hasData ? signalState : null,
      signalClass: hasData ? signalState : 'neutral',
      signalLabel
    };
  });
};

export const buildInstitutionalActivityCards = (institutionalSummary) => {
  if (!institutionalSummary) return [];

  const configs = [
    {
      key: 'inst-counts',
      metric: '# Institutional Position',
      category: 'Participation',
      increasedLabel: 'Increased',
      increasedKey: 'increasedInstitutions',
      decreasedLabel: 'Decreased',
      decreasedKey: 'decreasedInstitutions'
    },
    {
      key: 'inst-shares',
      metric: 'Institutional Share Volume',
      category: 'Shares traded',
      increasedLabel: 'Increased',
      increasedKey: 'increasedShares',
      decreasedLabel: 'Decreased',
      decreasedKey: 'decreasedShares'
    },
    {
      key: 'inst-new',
      metric: 'New vs Sold Out',
      category: 'Position changes',
      increasedLabel: 'New Positions',
      increasedKey: 'newInstitutions',
      decreasedLabel: 'Sold Out',
      decreasedKey: 'soldOutInstitutions'
    }
  ];

  return configs.map((cfg) => {
    const increasedRaw = institutionalSummary?.[cfg.increasedKey];
    const decreasedRaw = institutionalSummary?.[cfg.decreasedKey];
    const increasedValue = increasedRaw ?? 'N/A';
    const decreasedValue = decreasedRaw ?? 'N/A';
    const increasedNumeric = parseDisplayNumber(increasedRaw);
    const decreasedNumeric = parseDisplayNumber(decreasedRaw);
    const hasData = increasedNumeric !== null && decreasedNumeric !== null;

    let signalState = null;
    let signalLabel = 'Loading';
    let signalClass = 'neutral';

    if (hasData) {
      signalState = 'neutral';
      signalLabel = 'Balanced';
      signalClass = 'neutral';
      if (increasedNumeric > decreasedNumeric) {
        signalState = 'bullish';
        signalLabel = 'Bullish';
        signalClass = 'bullish';
      } else if (increasedNumeric < decreasedNumeric) {
        signalState = 'bearish';
        signalLabel = 'Bearish';
        signalClass = 'bearish';
      }
    }

    return {
      key: cfg.key,
      metric: cfg.metric,
      category: cfg.category,
      increasedLabel: cfg.increasedLabel,
      decreasedLabel: cfg.decreasedLabel,
      increasedValue,
      decreasedValue,
      hasData,
      signalState,
      signalLabel,
      signalClass
    };
  });
};