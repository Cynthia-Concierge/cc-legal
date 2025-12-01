import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WorkflowResultsService } from '../server/services/workflowResultsService.js';

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

    // Create service instance with the appropriate key
    const workflowResultsService = new WorkflowResultsService(serviceUrl, serviceKey);
    const results = await workflowResultsService.getAllWorkflowResults(limit, offset);

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("Error fetching workflow results:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to fetch workflow results",
      details: error.details || null,
      hint: error.hint || null,
    });
  }
}

