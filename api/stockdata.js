import axios from 'axios';

export default async function handler(req, res) {
  const { ticker } = req.query;
  const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required.' });
  }

  try {
    // Aggregates (daily OHLCV for last year)
    const aggUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/1/day/2024-01-01/2024-12-31?adjusted=true&sort=desc&limit=120&apiKey=${POLYGON_API_KEY}`;
    const aggRes = await axios.get(aggUrl);

    // Previous close
    const prevCloseUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    const prevCloseRes = await axios.get(prevCloseUrl);

    // Snapshot (current price, day’s high/low, volume, etc.)
    const snapshotUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.toUpperCase()}?apiKey=${POLYGON_API_KEY}`;
    const snapshotRes = await axios.get(snapshotUrl);

    // Financials (EPS, market cap, etc.)
    const financialsUrl = `https://api.polygon.io/vX/reference/financials?ticker=${ticker.toUpperCase()}&apiKey=${POLYGON_API_KEY}`;
    const financialsRes = await axios.get(financialsUrl);

    res.status(200).json({
      aggregates: aggRes.data,
      previousClose: prevCloseRes.data,
      snapshot: snapshotRes.data,
      financials: financialsRes.data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}