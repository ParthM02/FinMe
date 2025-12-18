import React, { useMemo, useState } from 'react';
import { formatDate, getPopularSentiment } from '../../utils/helpers';

const SentimentView = ({ headlines = [], institutionalSummary }) => {
  const [expanded, setExpanded] = useState(false);
  const { sentiment, count } = useMemo(() => getPopularSentiment(headlines), [headlines]);

  const sentimentMeta = useMemo(() => {
    let label = 'Neutral';
    let color = '#fde047';
    if (sentiment === 'positive') {
      label = 'Bullish';
      color = '#22c55e';
    } else if (sentiment === 'negative') {
      label = 'Bearish';
      color = '#ef4444';
    }
    return { label, color };
  }, [sentiment]);

  const parseNumeric = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseInt(value.replace(/,/g, '') || 0, 10);
    return 0;
  };

  const renderInstitutionalCard = ({
    title,
    increasedLabel,
    increasedKey,
    decreasedLabel,
    decreasedKey
  }) => (
    <div className="institutional-activity-widget">
      <div className="institutional-activity-title">{title}</div>
      {institutionalSummary ? (() => {
        const increasedValue = parseNumeric(institutionalSummary[increasedKey]);
        const decreasedValue = parseNumeric(institutionalSummary[decreasedKey]);
        const signalBullish = increasedValue > decreasedValue;
        const signal = signalBullish ? 'Bullish' : 'Bearish';
        const signalClass = signalBullish ? 'bullish' : 'bearish';
        return (
          <div className="institutional-activity-content">
            <div className="institutional-activity-counts">
              <div>
                <div className="institutional-label">{increasedLabel}</div>
                <div className="institutional-value">{institutionalSummary[increasedKey] ?? 'N/A'}</div>
              </div>
              <div>
                <div className="institutional-label">{decreasedLabel}</div>
                <div className="institutional-value">{institutionalSummary[decreasedKey] ?? 'N/A'}</div>
              </div>
            </div>
            <div className={`institutional-activity-signal ${signalClass}`}>{signal}</div>
          </div>
        );
      })() : (
        <div style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '1rem' }}>
          Loading institutional data...
        </div>
      )}
    </div>
  );

  return (
    <div className="sentiment-widget">
      <div
        className="sentiment-summary-widget"
        style={{
          background: '#111',
          borderRadius: '1.5rem',
          padding: '2rem 1rem',
          boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
          maxWidth: 340,
          margin: '0 auto 1rem auto',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
          border: expanded ? '2px solid #a855f7' : 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {headlines.length === 0 ? (
          <span>Loading sentiment...</span>
        ) : (
          <>
            <div style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>
              News Sentiment
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: sentimentMeta.color }}>
              {sentimentMeta.label}
            </div>
            <div style={{ color: '#9ca3af', marginTop: '0.25rem' }}>
              Headlines: {count} out of 10
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: '#a855f7' }}>
              {expanded ? '▼ Hide Headlines' : '▲ Show Headlines'}
            </div>
          </>
        )}
      </div>

      {expanded && (
        <table className="sentiment-table" style={{ marginTop: '1.5rem' }}>
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

      <div className="widget-row">
        {renderInstitutionalCard({
          title: '# Institutional Position',
          increasedLabel: 'Increased',
          increasedKey: 'increasedInstitutions',
          decreasedLabel: 'Decreased',
          decreasedKey: 'decreasedInstitutions'
        })}
        {renderInstitutionalCard({
          title: 'Institutional Share Volume',
          increasedLabel: 'Increased',
          increasedKey: 'increasedShares',
          decreasedLabel: 'Decreased',
          decreasedKey: 'decreasedShares'
        })}
        {renderInstitutionalCard({
          title: 'New vs Sold Out Institutions',
          increasedLabel: 'New Positions',
          increasedKey: 'newInstitutions',
          decreasedLabel: 'Sold Out',
          decreasedKey: 'soldOutInstitutions'
        })}
      </div>
    </div>
  );
};

export default SentimentView;