import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { ticker } = req.query;
  const symbol = ticker?.toUpperCase?.();

  if (!symbol) {
    return res.status(400).json({ error: 'Ticker is required.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const queueTable = process.env.SUPABASE_QUEUE_TABLE;
  const cacheTable = process.env.SUPABASE_CACHE_TABLE;

  if (!supabaseUrl || !supabaseKey || !queueTable || !cacheTable) {
    return res.status(500).json({
      error: 'Supabase configuration is missing. Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_QUEUE_TABLE, and SUPABASE_CACHE_TABLE are set.'
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const { data: cachedRows, error: cacheError } = await supabase
      .from(cacheTable)
      .select('response, updated_at')
      .eq('params', symbol)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (cacheError) {
      throw cacheError;
    }

    const cachedResponse = cachedRows?.[0]?.response ?? null;
    if (cachedResponse) {
      console.log(`Cache hit for ticker: ${symbol}`);
      return res.status(200).json(cachedResponse);
    }
    console.log(`Cache miss for ticker: ${symbol}. Enqueuing request.`);

    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from(queueTable)
      .insert({
        id: requestId,
        request_param: { ticker: symbol },
        status: 'pending',
        created_at: now
      });

    if (error) {
      throw error;
    }

    return res.status(202).json({
      id: requestId,
      status: 'pending',
      created_at: now
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};