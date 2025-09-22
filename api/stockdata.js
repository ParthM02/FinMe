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

    // Previous close (OHLCV for previous day)
    const prevCloseUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    const previousClose = await getJSON(prevCloseUrl);
    const vwap = previousClose?.results?.[0]?.vw ?? null;
    const close = previousClose?.results?.[0]?.c ?? null;

    // Fetch recent news headlines with sentiment
    const newsUrl = `https://api.polygon.io/v2/reference/news?ticker=${ticker.toUpperCase()}&order=desc&limit=10&sort=published_utc&apiKey=${POLYGON_API_KEY}`;
    const newsData = await getJSON(newsUrl);

    const headlines = (newsData.results || []).map(item => ({
      title: item.title,
      url: item.article_url,
      published_utc: item.published_utc,
      sentiment: item.insights[0].sentiment
    }));

    // Fetch short interest data (last 5 settlement dates)
    const shortInterestUrl = `https://api.polygon.io/stocks/v1/short-interest?ticker=${ticker.toUpperCase()}&limit=5&sort=settlement_date.desc&apiKey=${POLYGON_API_KEY}`;
    const shortInterestData = await getJSON(shortInterestUrl);

    const shortInterest = (shortInterestData.results || []).map(item => ({
      settlement_date: item.settlement_date,
      short_interest: item.short_interest,
      avg_daily_volume: item.avg_daily_volume,
      days_to_cover: item.days_to_cover
    }));

    res.status(200).json({
      previousClose,
      vwap,
      close,
      headlines,
      shortInterest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};