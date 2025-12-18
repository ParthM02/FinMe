import React from 'react';

const OptionsView = ({ putCallRatio }) => (
  <div className="put-call-widget">
    <div className="put-call-title">Put/Call Ratio</div>
    {putCallRatio !== null ? (
      <>
        <div className={`put-call-value ${putCallRatio > 1 ? 'bearish' : 'bullish'}`}>{putCallRatio}</div>
        <div className="put-call-signal">{putCallRatio > 1 ? 'Bearish' : 'Bullish'}</div>
      </>
    ) : <span>Loading put/call ratio...</span>}
  </div>
);

export default OptionsView;