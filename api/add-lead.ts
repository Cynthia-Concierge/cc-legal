import type { VercelRequest, VercelResponse } from '@vercel/node';
import { InstantlyService } from '../server/services/instantlyService.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, campaignId, leadData } = req.body;

    if (!email || !campaignId) {
      return res.status(400).json({
        error: "email and campaignId are required",
      });
    }

    if (!process.env.INSTANTLY_AI_API_KEY) {
      return res.status(500).json({
        error: "Configuration error",
        message: "Instantly.ai API key is not configured.",
      });
    }

    const instantlyService = new InstantlyService(
      process.env.INSTANTLY_AI_API_KEY || ""
    );

    const result = await instantlyService.addLeadToCampaign(
      email,
      campaignId,
      leadData
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error adding lead:", error);
    
    let statusCode = 500;
    let errorMessage = error.message || "Failed to add lead to Instantly.ai";
    
    if (error.message?.includes("401")) {
      statusCode = 401;
      errorMessage = "Instantly.ai API authentication failed.";
    } else if (error.message?.includes("400")) {
      statusCode = 400;
      errorMessage = "Invalid request to Instantly.ai.";
    }
    
    res.status(statusCode).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

