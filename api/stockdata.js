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
      sentiment: item.insights
    }));

    res.status(200).json({
      previousClose,
      vwap,
      close,
      headlines
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};