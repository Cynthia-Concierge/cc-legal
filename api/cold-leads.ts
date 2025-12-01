import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ColdLeadsService } from '../server/services/coldLeadsService.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method === 'GET') {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      // Use service role key if available for better access (bypasses RLS)
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      const serviceUrl = process.env.SUPABASE_URL || "";

      if (!serviceUrl || !serviceKey) {
        return res.status(500).json({
          error: "Configuration error",
          message: "Supabase credentials not configured",
        });
      }

      // Create service instance with the appropriate key
      const leadsService = new ColdLeadsService(serviceUrl, serviceKey);

      let leads;
      if (search) {
        leads = await leadsService.searchColdLeads(search);
      } else {
        leads = await leadsService.getAllColdLeads(limit, offset);
      }

      res.json({
        success: true,
        data: leads,
      });
    } catch (error: any) {
      console.error("Error fetching cold leads:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message || "Failed to fetch cold leads",
        details: error.details || null,
        hint: error.hint || null,
      });
    }
  } else if (req.method === 'POST') {
    // Import endpoint
    try {
      const { leads } = req.body;

      if (!leads || !Array.isArray(leads)) {
        return res.status(400).json({
          error: "leads array is required",
        });
      }

      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      const serviceUrl = process.env.SUPABASE_URL || "";

      if (!serviceUrl || !serviceKey) {
        return res.status(500).json({
          error: "Configuration error",
          message: "Supabase credentials not configured",
        });
      }

      const leadsService = new ColdLeadsService(serviceUrl, serviceKey);
      const result = await leadsService.importColdLeads(leads);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error importing cold leads:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message || "Failed to import cold leads",
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

