import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLIC_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const popularTable = process.env.SUPABASE_POPULAR_TABLE || 'Popular Tickers';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: 'Supabase configuration is missing. Ensure SUPABASE_URL and SUPABASE_PUBLIC_KEY are set.'
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const limit = parseInt(req.query?.limit, 10) || 12;

    const { data, error } = await supabase
      .from(popularTable)
      .select('params, count')
      .order('count', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const popularTickers = (data || []).map((row) => {
      let ticker = '';
      if (typeof row.params === 'object' && row.params !== null) {
        ticker = row.params.ticker || '';
      } else if (typeof row.params === 'string') {
        try {
          const parsed = JSON.parse(row.params);
          ticker = parsed.ticker || row.params;
        } catch {
          ticker = row.params;
        }
      }
      return {
        ticker: String(ticker).toUpperCase(),
        count: Number(row.count) || 0
      };
    }).filter((item) => Boolean(item.ticker));

    return res.status(200).json({ popularTickers });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
