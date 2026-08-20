import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";

// Suppress benign third-party widget errors (e.g. TradingView Script error / ResizeObserver)
window.addEventListener('error', (e) => {
  const msg = typeof e.message === 'string' ? e.message : (e.error?.message || '');
  if (
    msg === 'Script error.' ||
    msg.includes('ResizeObserver loop completed with undelivered notifications') ||
    msg.includes('ResizeObserver loop limit exceeded')
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
