import React from 'react';

const formatUpdatedAt = (value) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
};

const CachePromptModal = ({ isOpen, updatedAt, onUseCached, onRefresh }) => {
  if (!isOpen) return null;

  return (
    <div className="cache-modal-overlay" role="dialog" aria-modal="true">
      <div className="cache-modal">
        <div className="cache-modal-header">
          <h2>Cached Data Available</h2>
          <p>Last updated: {formatUpdatedAt(updatedAt)}</p>
        </div>
        <div className="cache-modal-body">
          <p>Would you like to use the cached data or retrieve a newer version?</p>
        </div>
        <div className="cache-modal-actions">
          <button className="cache-btn cache-btn-secondary" type="button" onClick={onUseCached}>
            Use Cached
          </button>
          <button className="cache-btn cache-btn-primary" type="button" onClick={onRefresh}>
            Retrieve New Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default CachePromptModal;
