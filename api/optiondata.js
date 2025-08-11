export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol parameter" });
  }

  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/options/${symbol}`);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch options data" });
    }

    const data = await response.json();

    const allowedOrigins = [
      "https://fin-me.vercel.app",
      "http://localhost:3000"
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