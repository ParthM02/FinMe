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

  if (!supabaseUrl || !supabaseKey || !queueTable) {
    return res.status(500).json({
      error: 'Supabase configuration is missing. Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_QUEUE_TABLE are set.'
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

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