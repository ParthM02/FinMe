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

    // Fetch RSI data (last 10 days)
    const rsiUrl = `https://api.polygon.io/v1/indicators/rsi/${ticker.toUpperCase()}?timespan=day&adjusted=true&window=14&series_type=close&order=desc&limit=10&apiKey=${POLYGON_API_KEY}`;
    const rsiData = await getJSON(rsiUrl);
    const rsiValues = rsiData?.results?.values?.map(val => val.value) ?? [];

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

    //  Institutional holdings API
    const holdingsUrl = `https://api.nasdaq.com/api/company/${ticker.toUpperCase()}/institutional-holdings?limit=10&type=TOTAL&sortColumn=marketValue`;
    const holdingsResponse = await fetch(holdingsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 ",
        "Accept": "application/json"
      }
    });
    if (!holdingsResponse.ok) {
      throw new Error("Failed to fetch institutional holdings");
    }

    const holdingsData = await holdingsResponse.json();

    // Parse only the data I care about
    const activeRows = holdingsData?.data?.activePositions?.rows || [];
    const newSoldRows = holdingsData?.data?.newSoldOutPositions?.rows || [];

    const institutionalSummary = {
      increasedInstitutions: activeRows[0]?.holders ?? null,
      increasedShares: activeRows[0]?.shares ?? null,
      decreasedInstitutions: activeRows[1]?.holders ?? null,
      decreasedShares: activeRows[1]?.shares ?? null,
      newInstitutions: newSoldRows[0]?.holders ?? null,
      newShares: newSoldRows[0]?.shares ?? null,
      soldOutInstitutions: newSoldRows[1]?.holders ?? null,
      soldOutShares: newSoldRows[1]?.shares ?? null,
    };

    // Financial statements payload (keep raw for client-side parsing)
    let financials = null;
    try {
      const financialsUrl = `https://api.nasdaq.com/api/company/${ticker.toUpperCase()}/financials?frequency=2`;
      const financialsResponse = await fetch(financialsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 ",
          "Accept": "application/json"
        }
      });

      if (!financialsResponse.ok) {
        throw new Error('Failed to fetch financials');
      }

      financials = await financialsResponse.json();
    } catch (financialError) {
      console.error('Unable to load financials', financialError);
    }

    res.status(200).json({
      previousClose,
      vwap,
      close,
      rsiValues,
      headlines,
      shortInterest,
      institutionalSummary,
      financials
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};