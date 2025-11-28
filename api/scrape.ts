import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FirecrawlService } from '../server/services/firecrawlService.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { websiteUrl } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({
        error: "websiteUrl is required",
      });
    }

    const firecrawlService = new FirecrawlService(
      process.env.FIRECRAWL_API_KEY || ""
    );

    const legalDocuments = await firecrawlService.scrapeWebsite(websiteUrl);

    res.json({
      success: true,
      data: {
        websiteUrl,
        legalDocuments,
      },
    });
  } catch (error: any) {
    console.error("Error in scrape:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred during scraping",
    });
  }
}

