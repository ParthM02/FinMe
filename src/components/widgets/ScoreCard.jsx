import React, { useMemo } from 'react';

const categories = ['Fundamental', 'Technical', 'Options', 'Sentiment'];

const ScoreCard = ({ activeTab, setActiveTab, scores = {} }) => {

  const getScoreColor = (s) => {
    if (s === null || s === undefined) return '#fff';
    if (s >= 70) return '#22c55e';
    if (s >= 40) return '#fde047';
    return '#ef4444';
  };

  const mainScore = useMemo(() => {
    const available = categories
      .map((category) => (typeof scores[category] === 'number' ? scores[category] : null))
      .filter((val) => val !== null);
    if (available.length === 0) return null;
    const average = available.reduce((sum, val) => sum + val, 0) / available.length;
    return Math.round(average);
  }, [scores]);

  return (
    <div className="card">
      <div className="card-content">
        <h3 className="card-subtitle">Overall Score</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <h2 className="card-rating" style={{ color: getScoreColor(mainScore) }}>
            {mainScore !== null ? mainScore : '--'}
          </h2>
          <span style={{ fontSize: '1.5rem', color: '#9ca3af' }}>/100</span>
        </div>
        <div className="tabs-container">
          <div className="tabs">
            {categories.map((tab) => {
              const tabScore = scores[tab] ?? null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={activeTab === tab ? 'tab-button active' : 'tab-button'}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}
                >
                  <span>{tab}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: getScoreColor(tabScore) }}>
                    {tabScore !== null ? `${tabScore}/100` : '--'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;