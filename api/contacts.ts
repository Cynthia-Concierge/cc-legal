import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Use service role key if available for better access (bypasses RLS)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceUrl = process.env.SUPABASE_URL || "";

    if (!serviceUrl || !serviceKey) {
      return res.status(500).json({
        error: "Configuration error",
        message: "Supabase credentials not configured",
      });
    }

    // Create Supabase client to fetch contacts
    const supabase = createClient(serviceUrl, serviceKey);

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to fetch contacts",
      details: error.details || null,
      hint: error.hint || null,
    });
  }
}

