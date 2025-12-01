/**
 * Backend API Server
 * Handles scraping requests and coordinates Firecrawl and OpenAI services
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { FirecrawlService } from "./services/firecrawlService.js";
import { OpenAIService } from "./services/openaiService.js";
import { InstantlyService } from "./services/instantlyService.js";
import { SupabaseService } from "./services/supabaseService.js";
import { WorkflowResultsService } from "./services/workflowResultsService.js";
import { ColdLeadsService } from "./services/coldLeadsService.js";
import { createClient } from "@supabase/supabase-js";
import { EmailGenerationWorkflow } from "./services/emailGenerationWorkflow.js";
import { WebsiteRedesignWorkflow } from "./services/websiteRedesignWorkflow.js";
import { ConfigService } from "./services/configService.js";
import { BusinessService } from "./services/businessService.js";
import { BusinessConfigService } from "./services/businessConfigService.js";
import { OnboardingPipeline } from "./services/onboardingPipeline.js";
import { WidgetService } from "./services/widgetService.js";
import { BookingService } from "./services/bookingService.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

// Initialize services
const firecrawlService = new FirecrawlService(
  process.env.FIRECRAWL_API_KEY || ""
);
const openaiService = new OpenAIService(
  process.env.OPENAI_API_KEY || ""
);
const instantlyService = new InstantlyService(
  process.env.INSTANTLY_AI_API_KEY || ""
);
const supabaseService = new SupabaseService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);
const workflowResultsService = new WorkflowResultsService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);
const coldLeadsService = new ColdLeadsService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// Initialize configuration service
const configService = new ConfigService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// Load workflow configurations
let workflowConfig;
try {
  workflowConfig = await configService.loadConfig();
  console.log("[Server] Config loaded successfully");
} catch (error) {
  console.error("[Server] Error loading config, using defaults:", error);
  workflowConfig = { nodePrompts: {}, autogenAgents: {} };
}

// Initialize LangGraph workflow with AutoGen enabled
let emailWorkflow;
try {
  emailWorkflow = new EmailGenerationWorkflow(
    process.env.FIRECRAWL_API_KEY || "",
    process.env.OPENAI_API_KEY || "",
    process.env.USE_AUTOGEN !== "false", // Enable AutoGen by default, disable with USE_AUTOGEN=false
    workflowConfig // Pass custom configs
  );
  console.log("[Server] Email workflow initialized successfully");
} catch (error) {
  console.error("[Server] Error initializing email workflow:", error);
  throw error; // Can't continue without workflow
}

// Initialize Website Redesign workflow
let websiteRedesignWorkflow;
try {
  websiteRedesignWorkflow = new WebsiteRedesignWorkflow(
    process.env.FIRECRAWL_API_KEY || "",
    process.env.OPENAI_API_KEY || ""
  );
  console.log("[Server] Website redesign workflow initialized successfully");
} catch (error) {
  console.error("[Server] Error initializing website redesign workflow:", error);
  // Don't throw - this workflow is optional
}

// Initialize Business Widget services
const businessService = new BusinessService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);
const businessConfigService = new BusinessConfigService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);
const onboardingPipeline = new OnboardingPipeline(
  process.env.FIRECRAWL_API_KEY || "",
  process.env.OPENAI_API_KEY || ""
);
const widgetService = new WidgetService(
  process.env.GEMINI_API_KEY || "",
  businessConfigService
);
const bookingService = new BookingService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Scraping API is running" });
});

// Info endpoint for the scrape-and-analyze route
app.get("/api/scrape-and-analyze", (req, res) => {
  res.json({
    message: "This endpoint requires a POST request",
    method: "POST",
    url: "/api/scrape-and-analyze",
    requiredBody: {
      websiteUrl: "string (required)",
      leadInfo: {
        name: "string (optional)",
        company: "string (optional)",
        email: "string (optional)",
      },
    },
    example: {
      websiteUrl: "https://example.com",
      leadInfo: {
        name: "John Doe",
        email: "john@example.com",
      },
    },
    note: "Use a tool like Postman, curl, or fetch() to make POST requests",
  });
});

// Main scraping endpoint - now using LangGraph workflow
app.post("/api/scrape-and-analyze", async (req, res) => {
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

    // Execute LangGraph workflow
    console.log(`[Workflow] Starting email generation workflow for: ${websiteUrl}`);
    const result = await emailWorkflow.execute(websiteUrl, leadInfo);

    // Check for errors
    if (result.error) {
      // Save error result to database
      try {
        await workflowResultsService.saveWorkflowResult({
          websiteUrl,
          leadInfo,
          error: result.error,
          status: "error",
        });
      } catch (saveError) {
        console.error("[Workflow] Error saving failed workflow result:", saveError);
      }

      return res.status(500).json({
        error: "Workflow execution error",
        message: result.error,
      });
    }

    // Save successful workflow results to Supabase
    try {
      await workflowResultsService.saveWorkflowResult({
        websiteUrl: result.websiteUrl,
        leadInfo,
        legalDocuments: result.legalDocuments,
        analysis: result.analysis,
        email: result.email,
        executionDetails: result.executionDetails,
        status: "completed",
      });
      console.log("[Workflow] Successfully saved workflow results to Supabase");
    } catch (saveError: any) {
      console.error("[Workflow] Error saving workflow results to Supabase:", saveError);
      // Continue even if save fails - don't break the API response
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
});

// Streaming endpoint for real-time workflow updates
app.post("/api/scrape-and-analyze-stream", async (req, res) => {
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

    // Set up Server-Sent Events for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Execute workflow with streaming
    console.log(`[Workflow Stream] Starting streaming workflow for: ${websiteUrl}`);
    
    try {
      for await (const stateUpdate of emailWorkflow.stream(websiteUrl, leadInfo)) {
        // Send each state update as an SSE event
        res.write(`data: ${JSON.stringify(stateUpdate)}\n\n`);
      }

      // Send final completion event
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (streamError: any) {
      console.error("Error in workflow stream:", streamError);
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error("Error in scrape-and-analyze-stream:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred during streaming",
    });
  }
});

// Endpoint to just scrape (without analysis)
app.post("/api/scrape", async (req, res) => {
  try {
    const { websiteUrl } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({
        error: "websiteUrl is required",
      });
    }

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
});

// Add lead to Instantly.ai endpoint
app.post("/api/add-lead", async (req, res) => {
  try {
    const { email, campaignId, leadData } = req.body;

    if (!email || !campaignId) {
      return res.status(400).json({
        error: "email and campaignId are required",
      });
    }

    // Check if API key is configured
    if (!process.env.INSTANTLY_AI_API_KEY) {
      console.error("INSTANTLY_AI_API_KEY is not set in environment variables");
      return res.status(500).json({
        error: "Configuration error",
        message: "Instantly.ai API key is not configured. Please add INSTANTLY_AI_API_KEY to your .env file.",
      });
    }

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
    
    // Provide more specific error messages
    let statusCode = 500;
    let errorMessage = error.message || "Failed to add lead to Instantly.ai";
    
    if (error.message?.includes("401")) {
      statusCode = 401;
      errorMessage = "Instantly.ai API authentication failed. Please check your INSTANTLY_AI_API_KEY in .env file.";
    } else if (error.message?.includes("400")) {
      statusCode = 400;
      errorMessage = "Invalid request to Instantly.ai. Check campaign ID and lead data format.";
    }
    
    res.status(statusCode).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
});

// Get workflow prompts and autogen configs (before execution)
app.get("/api/workflow-config", async (req, res) => {
  try {
    const { websiteUrl, leadInfo } = req.query;

    console.log("[API] /api/workflow-config called with:", { websiteUrl, leadInfo });

    // Reload config to ensure we have the latest
    let latestConfig;
    try {
      latestConfig = await configService.loadConfig();
      console.log("[API] Config loaded successfully");
    } catch (configError: any) {
      console.error("[API] Error loading config:", configError);
      latestConfig = { nodePrompts: {}, autogenAgents: {} };
    }

    // Update or create workflow instance
    try {
      emailWorkflow.updateConfig(latestConfig);
      console.log("[API] Workflow config updated");
    } catch (updateError: any) {
      console.error("[API] Error updating workflow config:", updateError);
      // Try to reinitialize if update fails
      emailWorkflow = new EmailGenerationWorkflow(
        process.env.FIRECRAWL_API_KEY || "",
        process.env.OPENAI_API_KEY || "",
        process.env.USE_AUTOGEN !== "false",
        latestConfig
      );
      console.log("[API] Workflow reinitialized");
    }

    // Get prompts for nodes
    let prompts;
    try {
      prompts = emailWorkflow.getNodePrompts(
        (websiteUrl as string) || "https://example.com",
        leadInfo ? JSON.parse(leadInfo as string) : undefined
      );
      console.log("[API] Prompts retrieved:", Object.keys(prompts));
    } catch (promptError: any) {
      console.error("[API] Error getting prompts:", promptError);
      throw promptError;
    }

    // Get AutoGen configurations
    let autogenConfigs;
    try {
      autogenConfigs = emailWorkflow.getAutoGenConfigs();
      console.log("[API] AutoGen configs retrieved:", Object.keys(autogenConfigs));
    } catch (autogenError: any) {
      console.error("[API] Error getting autogen configs:", autogenError);
      throw autogenError;
    }

    res.json({
      success: true,
      data: {
        prompts,
        autogenConfigs,
      },
    });
  } catch (error: any) {
    console.error("[API] Error getting workflow config:", error);
    console.error("[API] Error stack:", error.stack);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred while fetching workflow configuration",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get website redesign workflow config (prompts and AutoGen configs)
app.get("/api/website-redesign-config", async (req, res) => {
  try {
    const { websiteUrl } = req.query;

    console.log("[API] /api/website-redesign-config called with:", { websiteUrl });

    if (!websiteRedesignWorkflow) {
      return res.status(500).json({
        error: "Website redesign workflow not initialized",
      });
    }

    // Get prompts for nodes
    let prompts;
    try {
      prompts = websiteRedesignWorkflow.getNodePrompts(
        (websiteUrl as string) || "https://example.com"
      );
      console.log("[API] Prompts retrieved:", Object.keys(prompts));
    } catch (promptError: any) {
      console.error("[API] Error getting prompts:", promptError);
      throw promptError;
    }

    // Get AutoGen configurations
    let autogenConfigs;
    try {
      autogenConfigs = websiteRedesignWorkflow.getAutoGenConfigs();
      console.log("[API] AutoGen configs retrieved:", Object.keys(autogenConfigs));
    } catch (autogenError: any) {
      console.error("[API] Error getting autogen configs:", autogenError);
      throw autogenError;
    }

    res.json({
      success: true,
      data: {
        prompts,
        autogenConfigs,
      },
    });
  } catch (error: any) {
    console.error("Error getting website redesign workflow config:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred while fetching workflow configuration",
    });
  }
});

// Website redesign endpoint
app.post("/api/website-redesign", async (req, res) => {
  try {
    const { websiteUrl } = req.body;

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

    if (!websiteRedesignWorkflow) {
      return res.status(500).json({
        error: "Website redesign workflow not initialized",
      });
    }

    // Execute LangGraph workflow
    console.log(`[Website Redesign] Starting workflow for: ${websiteUrl}`);
    const result = await websiteRedesignWorkflow.execute(websiteUrl);

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
        scrapedData: result.scrapedData,
        redesignedWebsite: result.redesignedWebsite,
        geminiPrompt: result.geminiPrompt,
        executionDetails: result.executionDetails || {},
      },
    });
  } catch (error: any) {
    console.error("Error in website-redesign:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred during website redesign",
    });
  }
});

// Step-by-step website redesign endpoint
app.post("/api/website-redesign-step", async (req, res) => {
  try {
    const { websiteUrl, stopAtStep } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({
        error: "websiteUrl is required",
      });
    }

    if (!stopAtStep || !["full_scrape", "normalize_data", "website_design", "final_prompt"].includes(stopAtStep)) {
      return res.status(400).json({
        error: "stopAtStep is required and must be one of: full_scrape, normalize_data, website_design, final_prompt",
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

    if (!websiteRedesignWorkflow) {
      return res.status(500).json({
        error: "Website redesign workflow not initialized",
      });
    }

    // Execute workflow up to specified step
    console.log(`[Website Redesign Step] Executing up to step: ${stopAtStep} for: ${websiteUrl}`);
    const result = await websiteRedesignWorkflow.executeUpToStep(websiteUrl, stopAtStep);

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
        stepExecuted: stopAtStep,
        scrapedData: result.scrapedData,
        normalizedData: result.normalizedData,
        redesignedWebsite: result.redesignedWebsite,
        geminiPrompt: result.geminiPrompt,
        executionDetails: result.executionDetails || {},
      },
    });
  } catch (error: any) {
    console.error("Error in website-redesign-step:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred during step execution",
    });
  }
});

// Streaming endpoint for real-time website redesign workflow updates
app.post("/api/website-redesign-stream", async (req, res) => {
  try {
    const { websiteUrl } = req.body;

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

    if (!websiteRedesignWorkflow) {
      return res.status(500).json({
        error: "Website redesign workflow not initialized",
      });
    }

    // Set up Server-Sent Events for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Track current agent for website_design node
    let currentAgent: string | null = null;

    // Helper to emit agent progress
    const emitAgentProgress = (agent: string, status: "starting" | "completed") => {
      currentAgent = status === "starting" ? agent : null;
      res.write(`data: ${JSON.stringify({ 
        agentProgress: { agent, status },
        node: "website_design",
        activeAgent: currentAgent
      })}\n\n`);
    };

    // Execute workflow with streaming
    console.log(`[Website Redesign Stream] Starting streaming workflow for: ${websiteUrl}`);
    
    try {
      for await (const stateUpdate of websiteRedesignWorkflow.stream(websiteUrl)) {
        // Send each state update as an SSE event
        const updateWithAgent = { ...stateUpdate };
        if (currentAgent) {
          updateWithAgent.activeAgent = currentAgent;
        }
        res.write(`data: ${JSON.stringify(updateWithAgent)}\n\n`);
      }

      // Send final completion event
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (streamError: any) {
      console.error("Error in website redesign workflow stream:", streamError);
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error("Error in website-redesign-stream:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred during streaming",
    });
  }
});

// Save contact to Supabase endpoint
app.post("/api/save-contact", async (req, res) => {
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
});

// Import cold leads endpoint
app.post("/api/import-cold-leads", async (req, res) => {
  try {
    const { leads } = req.body;

    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({
        error: "leads array is required",
      });
    }

    const result = await coldLeadsService.importColdLeads(leads);

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
});

// Get cold leads endpoint
app.get("/api/cold-leads", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;

    // Use service role key if available for better access (bypasses RLS)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceUrl = process.env.SUPABASE_URL || "";
    
    if (!serviceUrl || !serviceKey) {
      console.error("[Cold Leads API] Missing Supabase credentials");
      return res.status(500).json({
        error: "Configuration error",
        message: "Supabase credentials not configured",
      });
    }

    console.log("[Cold Leads API] Fetching leads with:", { limit, offset, search: !!search, hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY });

    // Create service instance with the appropriate key
    const leadsService = new ColdLeadsService(serviceUrl, serviceKey);
    
    let leads;
    if (search) {
      console.log("[Cold Leads API] Searching for:", search);
      leads = await leadsService.searchColdLeads(search);
    } else {
      console.log("[Cold Leads API] Getting all leads");
      leads = await leadsService.getAllColdLeads(limit, offset);
    }

    console.log("[Cold Leads API] Successfully fetched", leads?.length || 0, "leads");

    res.json({
      success: true,
      data: leads,
    });
  } catch (error: any) {
    console.error("[Cold Leads API] Error fetching cold leads:", error);
    console.error("[Cold Leads API] Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to fetch cold leads",
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null,
    });
  }
});

// Get contacts endpoint
app.get("/api/contacts", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Use service role key if available for better access
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      serviceKey || ""
    );

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
    });
  }
});

// Get workflow results endpoint
app.get("/api/workflow-results", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Use service role key if available for better access
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceUrl = process.env.SUPABASE_URL || "";
    
    if (serviceKey && serviceUrl) {
      const tempService = new WorkflowResultsService(serviceUrl, serviceKey);
      const results = await tempService.getAllWorkflowResults(limit, offset);
      res.json({
        success: true,
        data: results,
      });
    } else {
      const results = await workflowResultsService.getAllWorkflowResults(limit, offset);
      res.json({
        success: true,
        data: results,
      });
    }
  } catch (error: any) {
    console.error("Error fetching workflow results:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to fetch workflow results",
    });
  }
});

// ============================================
// Business Widget API Endpoints
// ============================================

// Get business config for widget
app.get("/api/business/:id/config", async (req, res) => {
  try {
    const { id } = req.params;
    const config = await businessConfigService.getWidgetConfig(id);

    if (!config) {
      return res.status(404).json({
        error: "Business config not found",
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error("Error getting business config:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to get business config",
    });
  }
});

// Create new business
app.post("/api/business", async (req, res) => {
  try {
    const { domain, name, status } = req.body;

    if (!domain || !name) {
      return res.status(400).json({
        error: "domain and name are required",
      });
    }

    const business = await businessService.createBusiness({
      domain,
      name,
      status,
    });

    res.json({
      success: true,
      data: business,
    });
  } catch (error: any) {
    console.error("Error creating business:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to create business",
    });
  }
});

// List all businesses
app.get("/api/business", async (req, res) => {
  try {
    const businesses = await businessService.listBusinesses();

    res.json({
      success: true,
      data: businesses,
    });
  } catch (error: any) {
    console.error("Error listing businesses:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to list businesses",
    });
  }
});

// Get business by ID
app.get("/api/business/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const business = await businessService.getBusinessById(id);

    if (!business) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    res.json({
      success: true,
      data: business,
    });
  } catch (error: any) {
    console.error("Error getting business:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to get business",
    });
  }
});

// Update business
app.put("/api/business/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const business = await businessService.updateBusiness(id, {
      name,
      status,
    });

    res.json({
      success: true,
      data: business,
    });
  } catch (error: any) {
    console.error("Error updating business:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to update business",
    });
  }
});

// Onboard new business (Firecrawl + Playwright pipeline)
app.post("/api/business/onboard", async (req, res) => {
  try {
    const { domain, name } = req.body;

    if (!domain) {
      return res.status(400).json({
        error: "domain is required",
      });
    }

    // Normalize domain
    let normalizedDomain = domain.trim().toLowerCase();
    if (normalizedDomain.startsWith("http://") || normalizedDomain.startsWith("https://")) {
      try {
        const url = new URL(normalizedDomain);
        normalizedDomain = url.hostname;
      } catch {
        // Invalid URL, use as is
      }
    }

    // Check if business already exists
    let business = await businessService.getBusinessByDomain(normalizedDomain);
    
    if (!business) {
      // Create business
      business = await businessService.createBusiness({
        domain: normalizedDomain,
        name: name || normalizedDomain,
        status: "pending",
      });
    }

    // Run onboarding pipeline
    console.log(`[Onboarding] Starting pipeline for business: ${business.id}`);
    const onboardingResult = await onboardingPipeline.onboardBusiness(
      normalizedDomain,
      business.name
    );

    // Save config
    await businessConfigService.upsertConfig({
      business_id: business.id,
      raw_scrape: onboardingResult.rawScrape,
      normalized_scrape: onboardingResult.normalizedScrape,
      structured_data: onboardingResult.structuredData,
      services: onboardingResult.structuredData.services,
      pricing: onboardingResult.structuredData.pricing,
      faq: onboardingResult.structuredData.faq,
      images: onboardingResult.structuredData.images,
      navigation: onboardingResult.structuredData.navigation,
      booking_rules: onboardingResult.structuredData.bookingRules,
    });

    // Update business status to active
    business = await businessService.updateBusiness(business.id, {
      status: "active",
    });

    res.json({
      success: true,
      data: {
        business,
        onboarding: {
          completed: true,
          structuredData: onboardingResult.structuredData,
        },
      },
    });
  } catch (error: any) {
    console.error("Error onboarding business:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to onboard business",
    });
  }
});

// Widget chat endpoint
app.post("/api/widget/chat", async (req, res) => {
  try {
    const { businessId, message, conversationId } = req.body;

    if (!businessId || !message) {
      return res.status(400).json({
        error: "businessId and message are required",
      });
    }

    const response = await widgetService.sendMessage(
      businessId,
      message,
      conversationId
    );

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("Error in widget chat:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to process chat message",
    });
  }
});

// Mock booking endpoint
app.post("/api/appointments/mock", async (req, res) => {
  try {
    const { businessId, customerName, customerEmail, customerPhone, service, date, time, notes } = req.body;

    if (!businessId || !customerName || !customerEmail || !service || !date || !time) {
      return res.status(400).json({
        error: "businessId, customerName, customerEmail, service, date, and time are required",
      });
    }

    const appointment = await bookingService.createMockAppointment({
      business_id: businessId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      service,
      date,
      time,
      notes,
    });

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error: any) {
    console.error("Error creating mock appointment:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to create appointment",
    });
  }
});

// Real booking endpoint (future integration)
app.post("/api/appointments/book", async (req, res) => {
  try {
    const { businessId, customerName, customerEmail, customerPhone, service, date, time, notes } = req.body;

    if (!businessId || !customerName || !customerEmail || !service || !date || !time) {
      return res.status(400).json({
        error: "businessId, customerName, customerEmail, service, date, and time are required",
      });
    }

    // Get business config to determine booking system type
    const config = await businessConfigService.getConfig(businessId);
    const bookingConfig = config?.booking_rules || { type: "mock" };

    const appointment = await bookingService.createRealAppointment(
      {
        business_id: businessId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        service,
        date,
        time,
        notes,
      },
      bookingConfig
    );

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to create appointment",
    });
  }
});

// Serve widget.js script
app.get("/api/widget.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.sendFile(path.join(__dirname, "../public/widget.js"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
}).on('error', (error: any) => {
  console.error(`❌ Server failed to start on port ${PORT}:`, error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using that port.`);
  }
  process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

