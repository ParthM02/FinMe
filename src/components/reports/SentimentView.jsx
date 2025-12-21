import React, { useMemo, useState } from 'react';
import { formatDate, getPopularSentiment, buildInsiderActivityCards } from '../../utils/helpers';

const SentimentView = ({ headlines = [], institutionalSummary, insiderActivity }) => {
  const [expanded, setExpanded] = useState(false);
  const { sentiment, count } = useMemo(() => getPopularSentiment(headlines), [headlines]);

  const sentimentMeta = useMemo(() => {
    let label = 'Neutral';
    let cls = 'neutral';
    if (sentiment === 'positive') {
      label = 'Bullish';
      cls = 'bullish';
    } else if (sentiment === 'negative') {
      label = 'Bearish';
      cls = 'bearish';
    }
    return { label, cls };
  }, [sentiment]);

  const sentimentCounts = useMemo(() => {
    return headlines.reduce(
      (acc, item) => {
        if (item.sentiment === 'positive') acc.positive += 1;
        else if (item.sentiment === 'negative') acc.negative += 1;
        else acc.neutral += 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );
  }, [headlines]);

  const parseNumeric = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const sanitized = value.replace(/[,$]/g, '').replace(/%/g, '').trim();
      if (!sanitized) return 0;
      const isNegative = sanitized.startsWith('(') && sanitized.endsWith(')');
      const normalized = sanitized.replace(/[()]/g, '');
      const parsed = parseFloat(normalized);
      if (Number.isNaN(parsed)) return 0;
      return isNegative ? -parsed : parsed;
    }
    return 0;
  };

  const insiderCards = useMemo(() => buildInsiderActivityCards(insiderActivity), [insiderActivity]);

  const institutionalCards = [
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

  return (
    <div className="widget-row fundamental-sections sentiment-sections">
      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">News Sentiment</div>
            <div className="financial-ratios-subtitle">Top 10 recent headlines</div>
          </div>
          <button className="sentiment-toggle" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? 'Hide Headlines' : 'Show Headlines'}
          </button>
        </div>
        <div className="financial-ratios-grid sentiment-grid">
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Headline Momentum</div>
                <div className="ratio-widget-category">News-derived tone</div>
              </div>
              <div className={`ratio-trend ${sentimentMeta.cls}`}>
                {sentimentMeta.label}
              </div>
            </div>
            <div className="ratio-widget-value">
              {sentimentMeta.label}
            </div>
            <div className="ratio-widget-footnote">{count} of 10 headlines analyzed</div>
          </div>
          <div className="ratio-widget">
            <div className="ratio-widget-header">
              <div>
                <div className="ratio-widget-metric">Sentiment Breakdown</div>
                <div className="ratio-widget-category">By polarity</div>
              </div>
              <div className="ratio-trend neutral">Mixed</div>
            </div>
            <div className="sentiment-counts">
              <div className="sentiment-count bullish">
                <span>Positive</span>
                <strong>{sentimentCounts.positive}</strong>
              </div>
              <div className="sentiment-count neutral">
                <span>Neutral</span>
                <strong>{sentimentCounts.neutral}</strong>
              </div>
              <div className="sentiment-count bearish">
                <span>Negative</span>
                <strong>{sentimentCounts.negative}</strong>
              </div>
            </div>
          </div>
        </div>
        {expanded && (
          <table className="sentiment-table sentiment-table-expanded">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Published</th>
                <th>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {headlines.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ color: '#9ca3af', textAlign: 'center' }}>
                    Loading headlines...
                  </td>
                </tr>
              ) : (
                headlines.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="sentiment-link">
                        {item.title}
                      </a>
                    </td>
                    <td style={{ color: '#9ca3af' }}>{formatDate(item.published_utc)}</td>
                    <td
                      style={{
                        color:
                          item.sentiment === 'positive'
                            ? '#22c55e'
                            : item.sentiment === 'negative'
                            ? '#ef4444'
                            : '#d1d5db'
                      }}
                    >
                      {item.sentiment ?? 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Institutional Activity</div>
            <div className="financial-ratios-subtitle">Quarterly positioning snapshot</div>
          </div>
        </div>
        <div className="financial-ratios-grid sentiment-grid">
          {institutionalCards.map((card) => {
            const increasedValue = parseNumeric(institutionalSummary?.[card.increasedKey]);
            const decreasedValue = parseNumeric(institutionalSummary?.[card.decreasedKey]);
            const hasData = !!institutionalSummary;
            const signalBullish = increasedValue > decreasedValue;
            const signalClass = signalBullish ? 'bullish' : 'bearish';
            const signalLabel = signalBullish ? 'Bullish' : 'Bearish';
            return (
              <div className="ratio-widget" key={card.key}>
                <div className="ratio-widget-header">
                  <div>
                    <div className="ratio-widget-metric">{card.metric}</div>
                    <div className="ratio-widget-category">{card.category}</div>
                  </div>
                  <div className={`ratio-trend ${hasData ? signalClass : 'neutral'}`}>
                    {hasData ? signalLabel : 'Loading'}
                  </div>
                </div>
                {hasData ? (
                  <div className="institutional-metrics">
                    <div className="institutional-metric">
                      <span>{card.increasedLabel}</span>
                      <strong>{institutionalSummary?.[card.increasedKey] ?? 'N/A'}</strong>
                    </div>
                    <div className="institutional-metric">
                      <span>{card.decreasedLabel}</span>
                      <strong>{institutionalSummary?.[card.decreasedKey] ?? 'N/A'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="ratio-loading">Loading institutional data...</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="financial-ratios-section">
        <div className="financial-ratios-header">
          <div>
            <div className="financial-ratios-title">Insider Activity</div>
            <div className="financial-ratios-subtitle">Buys vs sells overview</div>
          </div>
        </div>
        <div className="financial-ratios-grid sentiment-grid">
          {insiderCards.length === 0 ? (
            <div className="ratio-widget">
              <div className="ratio-loading">Loading insider trades...</div>
            </div>
          ) : (
            insiderCards.map((card) => (
              <div className="ratio-widget" key={card.key}>
                <div className="ratio-widget-header">
                  <div>
                    <div className="ratio-widget-metric">{card.metric}</div>
                    <div className="ratio-widget-category">{card.category}</div>
                  </div>
                  <div className={`ratio-trend ${card.signalClass}`}>
                    {card.signalLabel}
                  </div>
                </div>
                {card.hasData ? (
                  <div className="institutional-metrics">
                    <div className="institutional-metric">
                      <span>{card.buyDisplay}</span>
                      <strong>{card.buyValue}</strong>
                    </div>
                    <div className="institutional-metric">
                      <span>{card.sellDisplay}</span>
                      <strong>{card.sellValue}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="ratio-loading">Loading insider trades...</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentView;