import React, { useEffect, useRef } from 'react';

const TradingViewWidget = ({ type, symbol }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.innerHTML = '';
    if (!symbol) return;

    const script = document.createElement('script');
    script.type = "text/javascript";
    script.async = true;

    if (type === 'info') {
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
      script.innerHTML = JSON.stringify({
        "symbol": symbol.toUpperCase(),
        "width": "100%", "locale": "en", "colorTheme": "dark", "isTransparent": true,
      });
    } else {
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
      script.innerHTML = JSON.stringify({
        "symbols": [[symbol.toUpperCase(), symbol.toUpperCase()]],
        "width": "100%", "height": "384", "colorTheme": "dark", "isTransparent": true, "autosize": true,
      });
    }
    containerRef.current.appendChild(script);
  }, [symbol, type]);

  return <div ref={containerRef} className="tradingview-widget-container" />;
};

export default TradingViewWidget;