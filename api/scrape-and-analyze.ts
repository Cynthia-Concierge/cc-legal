import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EmailGenerationWorkflow } from '../server/services/emailGenerationWorkflow.js';
import { ConfigService } from '../server/services/configService.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { websiteUrl, leadInfo } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({
        error: "websiteUrl is required",
      });
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return res.status(400).json({
        error: "Invalid URL format",
      });
    }

    // Load configuration from Supabase if available
    let workflowConfig;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const configService = new ConfigService(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      workflowConfig = await configService.loadConfig();
    } else {
      workflowConfig = { nodePrompts: {}, autogenAgents: {} };
    }

    // Initialize workflow with config
    const emailWorkflow = new EmailGenerationWorkflow(
      process.env.FIRECRAWL_API_KEY || "",
      process.env.OPENAI_API_KEY || "",
      process.env.USE_AUTOGEN !== "false",
      workflowConfig
    );

    // Execute LangGraph workflow
    console.log(`[Workflow] Starting email generation workflow for: ${websiteUrl}`);
    const result = await emailWorkflow.execute(websiteUrl, leadInfo);

    // Check for errors
    if (result.error) {
      return res.status(500).json({
        error: "Workflow execution error",
        message: result.error,
      });
    }

    // Return results
    res.json({
      success: true,
      data: {
        websiteUrl: result.websiteUrl,
        legalDocuments: result.legalDocuments
          ? Object.keys(result.legalDocuments).filter(
              (key) => result.legalDocuments![key as keyof typeof result.legalDocuments]
            )
          : [],
        analysis: result.analysis,
        email: result.email,
        executionDetails: result.executionDetails || {},
      },
    });
  } catch (error: any) {
    console.error("Error in scrape-and-analyze:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred during scraping and analysis",
    });
  }
}

