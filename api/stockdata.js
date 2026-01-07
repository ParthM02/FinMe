export default async function handler(req, res) {
  const { ticker } = req.query;
  const symbol = ticker?.toUpperCase?.();
  const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
  const NASDAQ_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    Accept: "application/json"
  };

  const fetchOptionChain = async (sym) => {
    const optionChainUrl = `https://api.nasdaq.com/api/quote/${sym}/option-chain?assetclass=stocks&limit=600&fromdate=all&todate=undefined&excode=oprac&callput=callput&money=at&type=all`;
    const response = await fetch(optionChainUrl, {
      headers: {
        ...NASDAQ_HEADERS,
        Referer: `https://www.nasdaq.com/market-activity/stocks/${sym}/option-chain`,
        Origin: "https://www.nasdaq.com"
      }
    });

    if (!response.ok) throw new Error("Failed to fetch options data");
    return await response.json();
  };

  if (!symbol) {
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
    const prevCloseUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    const previousClose = await getJSON(prevCloseUrl);
    const vwap = previousClose?.results?.[0]?.vw ?? null;
    const close = previousClose?.results?.[0]?.c ?? null;

    // Fetch RSI data (last 10 days)
    const rsiUrl = `https://api.polygon.io/v1/indicators/rsi/${symbol}?timespan=day&adjusted=true&window=14&series_type=close&order=desc&limit=10&apiKey=${POLYGON_API_KEY}`;
    const rsiData = await getJSON(rsiUrl);
    const rsiValues = rsiData?.results?.values?.map(val => val.value) ?? [];

    // Fetch recent news headlines with sentiment
    const newsUrl = `https://api.polygon.io/v2/reference/news?ticker=${symbol}&order=desc&limit=10&sort=published_utc&apiKey=${POLYGON_API_KEY}`;
    const newsData = await getJSON(newsUrl);

    const headlines = (newsData.results || []).map(item => ({
      title: item.title,
      url: item.article_url,
      published_utc: item.published_utc,
      sentiment: item.insights[0].sentiment
    }));

    // Fetch short interest data (last 5 settlement dates)
    const shortInterestUrl = `https://api.polygon.io/stocks/v1/short-interest?ticker=${symbol}&limit=5&sort=settlement_date.desc&apiKey=${POLYGON_API_KEY}`;
    const shortInterestData = await getJSON(shortInterestUrl);

    const shortInterest = (shortInterestData.results || []).map(item => ({
      settlement_date: item.settlement_date,
      short_interest: item.short_interest,
      avg_daily_volume: item.avg_daily_volume,
      days_to_cover: item.days_to_cover
    }));

    // Fetch option chain alongside the other market data
    let optionData = null;
    try {
      optionData = await fetchOptionChain(symbol);
    } catch (optionError) {
      console.error('Unable to load option chain', optionError);
    }

    //  Institutional holdings API
    const holdingsUrl = `https://api.nasdaq.com/api/company/${symbol}/institutional-holdings?limit=10&type=TOTAL&sortColumn=marketValue`;
    const holdingsResponse = await fetch(holdingsUrl, { headers: NASDAQ_HEADERS });
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
      const financialsUrl = `https://api.nasdaq.com/api/company/${symbol}/financials?frequency=2`;
      const financialsResponse = await fetch(financialsUrl, { headers: NASDAQ_HEADERS });

      if (!financialsResponse.ok) {
        throw new Error('Failed to fetch financials');
      }

      financials = await financialsResponse.json();
    } catch (financialError) {
      console.error('Unable to load financials', financialError);
    }

    // Insider trading activity (keep raw payload)
    let insiderActivity = null;
    try {
      const insiderUrl = `https://api.nasdaq.com/api/company/${symbol}/insider-trades?limit=10&type=all&sortColumn=lastDate&sortOrder=DESC`;
      const insiderResponse = await fetch(insiderUrl, { headers: NASDAQ_HEADERS });
      if (!insiderResponse.ok) {
        throw new Error('Failed to fetch insider trades');
      }
      insiderActivity = await insiderResponse.json();
    } catch (insiderError) {
      console.error('Unable to load insider trades', insiderError);
    }

    res.status(200).json({
      previousClose,
      vwap,
      close,
      rsiValues,
      headlines,
      shortInterest,
      institutionalSummary,
      financials,
      insiderActivity,
      optionData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};