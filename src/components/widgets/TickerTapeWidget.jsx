import React, { useEffect } from 'react';

const TickerTapeWidget = () => {
  useEffect(() => {
    // Check if script already exists to avoid duplicates
    if (document.querySelector('script[src="https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js"]')) {
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Optional: cleanup script if component unmounts, 
      // but usually these scripts are meant to stay once loaded or are managed by the library.
      // Removing it might break other instances if used elsewhere.
      // document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="ticker-tape-wrapper" style={{ width: '100%' }}>
      <tv-ticker-tape
        symbols="FOREXCOM:SPXUSD,FOREXCOM:NSXUSD,FOREXCOM:DJI,FX:EURUSD,BITSTAMP:BTCUSD,BITSTAMP:ETHUSD,CMCMARKETS:GOLD,TVC:SILVER"
        line-chart-type="Baseline"
        item-size="compact"
        theme="dark"
        style={{ width: '100%', height: '100%' }}
      ></tv-ticker-tape>
    </div>
  );
};

export default TickerTapeWidget;
