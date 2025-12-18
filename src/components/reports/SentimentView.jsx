import React, { useState } from 'react';
import { formatDate, getPopularSentiment } from '../../utils/helpers';

const SentimentView = ({ headlines, institutionalSummary }) => {
  const [expanded, setExpanded] = useState(false);
  const { sentiment, count } = getPopularSentiment(headlines);

  return (
    <div className="sentiment-widget">
      <div className="sentiment-summary-widget" onClick={() => setExpanded(!expanded)}>
        <div style={{ fontSize: '1.1rem', color: '#fff' }}>News Sentiment</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: sentiment === 'positive' ? '#22c55e' : '#ef4444' }}>
          {sentiment.toUpperCase()}
        </div>
        <div>{expanded ? '▼ Hide Headlines' : '▲ Show Headlines'}</div>
      </div>
      
      {expanded && (
        <table className="sentiment-table">
          {/* Headlines mapping logic here */}
        </table>
      )}

      {/* Institutional Activity Widgets Logic */}
    </div>
  );
};

export default SentimentView;