export default async function handler(req, res) {
  res.status(410).json({
    error: 'Deprecated endpoint. Use /api/stockdata?ticker=SYMBOL for option chain data.',
  });
}