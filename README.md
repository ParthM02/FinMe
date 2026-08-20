# FinMe 📈

> **Institutional-Grade Stock Analysis & Market Intelligence Platform**

FinMe is a modern, full-stack financial analytics application designed to make institutional-level equity and derivatives analysis accessible, intuitive, and actionable. It aggregates market data across fundamentals, technical indicators, options flow, and sentiment to deliver clear, actionable scoring alongside interactive visualizations.

---

## ✨ Features

### 1. Multi-Dimensional Scoring Engine
FinMe automatically scores any analyzed equity on a scale from **0 (Bearish)** to **100 (Bullish)** across four key pillars:
- **📊 Fundamental Score**: Evaluates short interest dynamics, Days to Cover (DTC) squeeze potential, and balance sheet / income statement financial ratios (P/E, ROE, margins, debt ratios).
- **📉 Technical Score**: Combines Volume-Weighted Average Price (VWAP) relationships, 10-day RSI trend direction, RSI momentum crossovers (30/70 thresholds), and overbought/oversold levels.
- **⚡ Options Score**: Analyzes near-term and mid-term Put/Call volume ratios, delta exposure asymmetry, and net options premium directional bias.
- **📰 Sentiment Score**: Processes financial news headline sentiment via NLP, institutional accumulation/distribution patterns, and insider transaction filings.

### 2. Advanced Options Flow & Greeks Analytics
- **Put/Call Ratio Tracking**: Compares near-term vs. mid-term vs. far-term expiration volume.
- **Black-Scholes Greek Engine**: Custom mathematical model computing real-time Delta, Gamma, Theta, and Vega across full option chains.
- **Delta Asymmetry & Net Exposure**: Identifies whether market participants are heavily skewed toward call or put delta around the current spot price.
- **Premium Flow Forecasting**: Estimates net bullish vs. bearish dollar premium deployed across option strikes.
- **Interactive Open Interest & Volume Charts**: Visualize strike concentration and expiration groupings with interactive filtering.

### 3. Real-Time Charts & Live Widgets
- Embedded **TradingView Interactive Candlestick Charts** and financial company overview widgets.
- Real-time **Ticker Tape Widget** tracking major indices and market movers.

### 4. Smart Queueing & Caching System
- **Supabase-Backed Job Queue**: Handles asynchronous API rate limits with live queue position tracking and dynamic countdown ETA estimates.
- **Intelligent Response Cache**: Instant loads on previously analyzed tickers with an interactive prompt allowing users to choose between cached data or an on-demand fresh pull.
- **Trending & Popular Tickers**: Real-time aggregation of the most analyzed tickers on the platform.

---

## 🛠️ Tech Stack

- **Frontend**:
  - [React 19](https://react.dev/)
  - [React Router v6](https://reactrouter.com/) (Client-side routing)
  - [Chart.js](https://www.chartjs.org/) & [React-ChartJS-2](https://react-chartjs-2.js.org/) (Interactive data visualizations)
  - [TradingView Technical Widgets](https://www.tradingview.com/widget/)
  - Vanilla CSS (Custom design system with dark-mode aesthetic)
- **Backend & Serverless API**:
  - [Vercel Serverless Functions](https://vercel.com/docs/functions) (`/api/stockdata`, `/api/populartickers`)
  - [Supabase](https://supabase.com/) (PostgreSQL for queue management, data caching, and search telemetry)
- **NLP & Quantitative Math**:
  - [@xenova/transformers](https://huggingface.co/docs/transformers.js) (DistilBERT SST-2 sentiment pipeline)
  - Custom Black-Scholes implementation for options Greeks and probability density modeling

---

## 📁 Project Structure

```text
FinMe/
├── api/                     # Vercel Serverless API endpoints
│   ├── optiondata.js        # Option chain fetching endpoint
│   ├── populartickers.js    # Popular & trending search telemetry endpoint
│   └── stockdata.js         # Core stock data fetching, caching & queue handler
├── public/                  # Static assets & HTML template
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Footer, SearchBar, CachePromptModal
│   │   ├── reports/         # FundamentalView, TechnicalView, OptionsView, SentimentView
│   │   └── widgets/         # ScoreCard, TradingViewWidget, TickerTapeWidget
│   ├── hooks/               # Custom React hooks (useStockData, useCooldown)
│   ├── pages/               # Application pages (HomePage, AnalysisPage)
│   ├── utils/               # Scoring models and helper utilities
│   ├── App.jsx              # Main router & layout container
│   ├── index.js             # Application entry point
│   ├── optionAnalysis.js    # Options mathematics & Black-Scholes engine
│   ├── sentimentAnalysis.js # NLP headline sentiment analysis
│   └── technicalAnalysis.js # RSI, VWAP & technical indicator logic
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, recommended for testing serverless API routes locally)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ParthM02/FinMe.git
cd FinMe
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLIC_KEY=your_supabase_public_key
SUPABASE_QUEUE_TABLE=API Queue
SUPABASE_CACHE_TABLE=API Cache
SUPABASE_POPULAR_TABLE=Popular Tickers

# Optional API Keys
FRED_KEY=your_fred_api_key
```

### 3. Run Locally

To run the full stack with Vercel Serverless API routes locally:

```bash
npx vercel dev
```

Or to run only the React development server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🧪 Available Scripts

- `npm start` – Starts the development server.
- `npm test` – Runs unit and integration test suites in watch mode.
- `npm run build` – Builds an optimized production bundle in the `build/` directory.
- `npx vercel dev` – Runs the local development server with full serverless `/api` route emulation.

---

## ⚠️ Disclaimer

*FinMe is built for informational and educational purposes only. Nothing contained within this platform constitutes financial, investment, or trading advice. Always do your own research or consult with a licensed financial professional before making investment decisions.*
