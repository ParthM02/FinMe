import React, { useEffect, useRef, memo } from 'react';

const NYSE_TICKERS = new Set([
  'V', 'MA', 'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'DIS', 'KO',
  'WMT', 'PG', 'HD', 'UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO',
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'GE', 'CAT', 'BA', 'HON', 'UPS',
  'LMT', 'RTX', 'DE', 'IBM', 'ORCL', 'CRM', 'NOW', 'UBER', 'PLTR', 'SNOW',
  'NKE', 'MCD', 'T', 'VZ', 'NEE', 'SO', 'DUK', 'BABA', 'TSM', 'NVO',
  'SAP', 'AZN', 'BTI', 'RIO', 'BHP', 'VALE', 'SONY', 'SPOT', 'SHOP', 'SQ',
  'RBLX', 'SNAP', 'PINS', 'NET', 'DDOG', 'FDX', 'LOW', 'TGT', 'CL', 'BMY'
]);

const formatTradingViewSymbol = (rawSymbol) => {
  if (!rawSymbol) return '';
  const clean = rawSymbol.trim().toUpperCase();
  if (clean.includes(':')) return clean;
  if (NYSE_TICKERS.has(clean)) {
    return `NYSE:${clean}`;
  }
  return `NASDAQ:${clean}`;
};

const TradingViewWidget = ({ type, symbol }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    currentContainer.innerHTML = '';
    if (!symbol) return;

    const tvSymbol = formatTradingViewSymbol(symbol);

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    currentContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = type === 'info'
      ? 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js'
      : 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.async = true;

    if (type === 'info') {
      script.innerHTML = JSON.stringify({
        symbol: tvSymbol,
        width: '100%',
        locale: 'en',
        colorTheme: 'dark',
        isTransparent: true,
      });
    } else {
      script.innerHTML = JSON.stringify({
        symbols: [[symbol.toUpperCase(), `${tvSymbol}|1D`]],
        width: '100%',
        height: '100%',
        colorTheme: 'dark',
        isTransparent: true,
        autosize: true,
      });
    }

    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [symbol, type]);

  return <div ref={containerRef} className="tradingview-widget-container" />;
};

export default memo(TradingViewWidget);