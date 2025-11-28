import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EmailGenerationWorkflow } from '../server/services/emailGenerationWorkflow.js';
import { ConfigService } from '../server/services/configService.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { websiteUrl, leadInfo } = req.query;

    console.log("[API] /api/workflow-config called with:", { websiteUrl, leadInfo });

    // Load configuration from Supabase if available
    let workflowConfig;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const configService = new ConfigService(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      workflowConfig = await configService.loadConfig();
      console.log("[API] Loaded config from Supabase:", Object.keys(workflowConfig.nodePrompts || {}).length, "prompts");
    } else {
      workflowConfig = { nodePrompts: {}, autogenAgents: {} };
      console.log("[API] Using default config (no Supabase)");
    }

    // Initialize workflow with config
    const emailWorkflow = new EmailGenerationWorkflow(
      process.env.FIRECRAWL_API_KEY || "",
      process.env.OPENAI_API_KEY || "",
      process.env.USE_AUTOGEN !== "false",
      workflowConfig
    );

    // Get prompts for nodes
    const prompts = emailWorkflow.getNodePrompts(
      (websiteUrl as string) || "https://example.com",
      leadInfo ? JSON.parse(leadInfo as string) : undefined
    );

    // Get AutoGen configurations
    const autogenConfigs = emailWorkflow.getAutoGenConfigs();

    console.log("[API] Returning prompts for nodes:", Object.keys(prompts));
    console.log("[API] Returning autogen configs for nodes:", Object.keys(autogenConfigs));

    res.json({
      success: true,
      data: {
        prompts,
        autogenConfigs,
      },
    });
  } catch (error: any) {
    console.error("Error getting workflow config:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred while fetching workflow configuration",
    });
  }
}

