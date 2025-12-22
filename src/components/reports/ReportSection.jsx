import React from 'react';
import FundamentalView from './FundamentalView';
import TechnicalView from './TechnicalView';
import OptionsView from './OptionsView';
import SentimentView from './SentimentView';

const ReportSection = ({ activeTab, stockData }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'Fundamental': return (
        <FundamentalView
          shortInterest={stockData.shortInterest}
          financials={stockData.financials}
        />
      );
      case 'Technical': return <TechnicalView vwap={stockData.vwap} close={stockData.close} rsiValues={stockData.rsiValues} />;
      case 'Options': return (
        <OptionsView
          putCallRatio={stockData.putCallRatio}
          optionData={stockData.optionData}
          underlyingPrice={stockData.close}
        />
      );
      case 'Sentiment': return (
        <SentimentView
          headlines={stockData.headlines}
          institutionalSummary={stockData.institutionalSummary}
          insiderActivity={stockData.insiderActivity}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="card full-width-card">
      <div className="card-content">
        <h3 className="card-title">Report Section Breakdown</h3>
        <div className="card-placeholder-text">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportSection;