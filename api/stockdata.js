export default async function handler(req, res) {
  const { ticker } = req.query;
  const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required.' });
  }

  try {
    // Helper to fetch and parse JSON
    const getJSON = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
      return await response.json();
    };

    // Aggregates (daily OHLCV for last year)
    const aggUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/1/day/2024-01-01/2024-12-31?adjusted=true&sort=desc&limit=120&apiKey=${POLYGON_API_KEY}`;
    const aggregates = await getJSON(aggUrl);

    // Previous close
    const prevCloseUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    const previousClose = await getJSON(prevCloseUrl);

    // Snapshot (current price, day’s high/low, volume, etc.)
    const snapshotUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.toUpperCase()}?apiKey=${POLYGON_API_KEY}`;
    const snapshot = await getJSON(snapshotUrl);

    // Financials (EPS, market cap, etc.)
    const financialsUrl = `https://api.polygon.io/vX/reference/financials?ticker=${ticker.toUpperCase()}&apiKey=${POLYGON_API_KEY}`;
    const financials = await getJSON(financialsUrl);

    res.status(200).json({
      aggregates,
      previousClose,
      snapshot,
      financials,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};