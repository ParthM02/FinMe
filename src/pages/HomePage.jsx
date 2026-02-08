import React, { useEffect } from 'react';

const HomePage = () => {
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js"]'
    );

    if (existingScript) return;

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <main className="main-content" aria-label="Home page">
      <tv-ticker-tape
        symbols="FOREXCOM:SPXUSD,FOREXCOM:NSXUSD,FOREXCOM:DJI,FX:EURUSD,BITSTAMP:BTCUSD,BITSTAMP:ETHUSD,CMCMARKETS:GOLD,TVC:SILVER"
        line-chart-type="Baseline"
        item-size="compact"
        color-theme="dark"
      />
    </main>
  );
};

export default HomePage;
