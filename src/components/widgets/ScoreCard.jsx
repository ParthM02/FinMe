import React from 'react';

const ScoreCard = ({ activeTab, setActiveTab, score }) => {
  const getScoreColor = (s) => {
    if (s === null) return '#fff';
    if (s >= 70) return '#22c55e';
    if (s >= 40) return '#fde047';
    return '#ef4444';
  };

  return (
    <div className="card">
      <div className="card-content">
        <h3 className="card-subtitle">Score</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
          <h2 className="card-rating" style={{ color: getScoreColor(score) }}>
            {score !== null ? score : '--'}
          </h2>
          <span style={{ fontSize: '1.5rem', color: '#9ca3af' }}>/100</span>
        </div>
        <div className="tabs-container">
          <div className="tabs">
            {['Fundamental', 'Technical', 'Options', 'Sentiment'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? 'tab-button active' : 'tab-button'}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;