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
      .eq('params', JSON.stringify(symbol))
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

    const getQueuePosition = async (createdAt) => {
      const { count, error: countError } = await supabase
        .from(queueTable)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lte('created_at', createdAt);

      if (countError) {
        throw countError;
      }

      return count ?? null;
    };

    const { data: queuedRows, error: queueLookupError } = await supabase
      .from(queueTable)
      .select('id, created_at, status')
      .eq('status', 'pending')
      .eq('request_param->>ticker', symbol)
      .order('created_at', { ascending: true })
      .limit(1);

    if (queueLookupError) {
      throw queueLookupError;
    }

    if (queuedRows?.length) {
      const existing = queuedRows[0];
      const position = await getQueuePosition(existing.created_at);
      const etaSeconds = position ? position * 120 : null;

      return res.status(202).json({
        id: existing.id,
        status: 'pending',
        created_at: existing.created_at,
        queue_position: position,
        eta_seconds: etaSeconds,
        already_queued: true
      });
    }

    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: insertedRow, error } = await supabase
      .from(queueTable)
      .insert({
        id: requestId,
        request_param: { ticker: symbol },
        status: 'pending',
        created_at: now
      })
      .select('id, created_at')
      .single();

    if (error) {
      throw error;
    }

    const position = await getQueuePosition(insertedRow?.created_at ?? now);
    const etaSeconds = position ? position * 120 : null;

    return res.status(202).json({
      id: insertedRow?.id ?? requestId,
      status: 'pending',
      created_at: insertedRow?.created_at ?? now,
      queue_position: position,
      eta_seconds: etaSeconds,
      already_queued: false
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};