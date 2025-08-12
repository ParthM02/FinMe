export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol parameter" });
  }

  try {
    const response = await fetch(
      `https://api.nasdaq.com/api/quote/${symbol}/option-chain?assetclass=stocks`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Referer": `https://www.nasdaq.com/market-activity/stocks/${symbol}/option-chain`,
          "Origin": "https://www.nasdaq.com",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch options data" });
    }

    const data = await response.json();

    const allowedOrigins = [
      "https://fin-me.vercel.app"
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}