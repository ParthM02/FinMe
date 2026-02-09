import React, { useEffect, useRef } from 'react';

const TickerTapeWidget = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const scriptSrc = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';

    // Ensure script is loaded
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = scriptSrc;
      script.async = true;
      document.body.appendChild(script);
    }

    // Manually inject the widget HTML to ensure attributes are correctly processed on every mount
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const widgetHtml = `
        <tv-ticker-tape 
          symbols="FOREXCOM:SPXUSD,FOREXCOM:NSXUSD,FOREXCOM:DJI,FX:EURUSD,BITSTAMP:BTCUSD,BITSTAMP:ETHUSD,CMCMARKETS:GOLD,TVC:SILVER" 
          line-chart-type="Baseline" 
          item-size="compact" 
          theme="dark" 
          style="width: 100%; height: 100%">
        </tv-ticker-tape>
      `;
      containerRef.current.innerHTML = widgetHtml;
    }
  }, []);

  return (
    <div className="ticker-tape-wrapper" ref={containerRef} style={{ width: '100%' }} />
  );
};

export default TickerTapeWidget;
