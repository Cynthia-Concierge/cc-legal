import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SupabaseService } from '../server/services/supabaseService.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, website } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: "email and name are required",
      });
    }

    // Normalize website URL
    let normalizedWebsite = website?.trim() || "";
    if (normalizedWebsite && !normalizedWebsite.startsWith("http")) {
      normalizedWebsite = `https://${normalizedWebsite}`;
    }

    const supabaseService = new SupabaseService(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_ANON_KEY || ""
    );

    const contactData = {
      name,
      email,
      phone: phone || "",
      website: normalizedWebsite,
    };

    const result = await supabaseService.saveContact(contactData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error saving contact to Supabase:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to save contact to Supabase",
    });
  }
}

