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
import { MetaService } from "./services/metaService.js";

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
// Use service_role key if available (bypasses RLS), otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseService = new SupabaseService(
  process.env.SUPABASE_URL || "",
  supabaseKey
);
// Use service_role key for workflowResultsService to bypass RLS (same as supabaseService)
const workflowResultsKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const workflowResultsService = new WorkflowResultsService(
  process.env.SUPABASE_URL || "",
  workflowResultsKey
);
const coldLeadsService = new ColdLeadsService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// Initialize Meta service
const metaService = new MetaService(
  process.env.META_ACCESS_TOKEN || "",
  process.env.META_PIXEL_ID || ""
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

// Initialize Email Service
import { EmailService } from "./services/emailService.js";
const emailService = new EmailService(
  process.env.RESEND_API_KEY || "",
  process.env.EMAIL_FROM_ADDRESS
);

// Initialize Document Generation Service
import { DocumentGenerationService } from "./services/documentGenerationService.js";
const documentGenerationService = new DocumentGenerationService();

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
    let saveSuccess = false;
    let saveError: any = null;
    try {
      // Extract contact information from socialMedia if available
      const contactInfo = result.socialMedia ? {
        instagram: result.socialMedia.instagram,
        socialLinks: result.socialMedia.socialLinks,
        emails: result.socialMedia.emails || [],
      } : undefined;

      const savedResult = await workflowResultsService.saveWorkflowResult({
        websiteUrl: result.websiteUrl,
        leadInfo,
        legalDocuments: result.legalDocuments,
        analysis: result.analysis,
        email: result.email,
        contactInfo,
        executionDetails: result.executionDetails,
        status: "completed",
      });
      console.log("[Workflow] Successfully saved workflow results to Supabase");
      console.log("[Workflow] Saved record ID:", savedResult?.id);
      saveSuccess = true;
    } catch (saveErr: any) {
      saveError = saveErr;
      console.error("[Workflow] Error saving workflow results to Supabase:", saveErr);
      console.error("[Workflow] Error details:", JSON.stringify(saveErr, null, 2));
      console.error("[Workflow] Error message:", saveErr?.message);
      console.error("[Workflow] Error code:", saveErr?.code);
      console.error("[Workflow] Error hint:", saveErr?.hint);
      console.error("[Workflow] Error details:", saveErr?.details);
      // Continue even if save fails - don't break the API response
    }

    // Return results
    res.json({
      success: true,
      savedToDatabase: saveSuccess,
      saveError: saveError ? {
        message: saveError.message,
        code: saveError.code,
        hint: saveError.hint,
        details: saveError.details,
      } : null,
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
        socialMedia: result.socialMedia || undefined,
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

// Simple website compliance scan endpoint (no AutoGen, no complex workflow)
// Just scrapes footer, extracts legal links, and briefly analyzes each
app.post("/api/scan-website-compliance", async (req, res) => {
  try {
    const { websiteUrl } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({
        error: "websiteUrl is required",
      });
    }

    // Validate URL format
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return res.status(400).json({
        error: "Invalid URL format",
      });
    }

    console.log(`[Simple Scan] Starting compliance scan for: ${normalizedUrl}`);

    // Step 1: Scrape homepage footer to get legal links
    let html = "";
    let markdown = "";
    let finalUrl = normalizedUrl;

    try {
      const pageData = await (firecrawlService as any).scrapePageWithHtml(normalizedUrl);
      html = pageData.html || "";
      markdown = pageData.markdown || "";

      // Update normalizedUrl if we have a source URL from metadata (handles redirects)
      if (pageData.metadata?.sourceURL) {
        finalUrl = pageData.metadata.sourceURL;
        console.log(`[Simple Scan] Redirect detected: ${normalizedUrl} -> ${finalUrl}`);
      } else if (pageData.metadata?.url) {
        finalUrl = pageData.metadata.url;
      }
    } catch (error: any) {
      console.warn("[Simple Scan] Failed to scrape with HTML, trying markdown only:", error.message);
      markdown = await (firecrawlService as any).scrapePage(normalizedUrl);
      html = "";
    }

    // Step 2: Extract legal links from footer - use finalUrl for relative link resolution
    const legalLinks = html
      ? (firecrawlService as any).findLegalDocumentLinksFromHtml(html, finalUrl, markdown)
      : (firecrawlService as any).findLegalDocumentLinks(markdown, finalUrl);

    // Step 3: Determine which documents are missing
    const requiredDocuments = {
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      refundPolicy: "Refund Policy",
      cookiePolicy: "Cookie Policy",
      disclaimer: "Disclaimer",
    };

    const missingDocuments: string[] = [];
    const foundDocuments: Record<string, { url: string; content: string }> = {};

    // Step 4: Scrape each found document
    for (const [docType, docName] of Object.entries(requiredDocuments)) {
      const docUrl = legalLinks[docType];

      if (!docUrl) {
        missingDocuments.push(docName);
      } else {
        try {
          console.log(`[Simple Scan] Scraping document: ${docName} at ${docUrl}`);
          // Use onlyMainContent: false to ensure we get the full legal text (including headers/footers/nav if needed)
          // valid legal documents might be in iframes or have complex structures that onlyMainContent: true misses
          const content = await (firecrawlService as any).scrapePage(docUrl, { onlyMainContent: false });
          if (content && content.length > 100) {
            foundDocuments[docType] = { url: docUrl, content: content.substring(0, 5000) };
          } else {
            missingDocuments.push(docName);
          }
        } catch (error) {
          console.error(`[Simple Scan] Error scraping ${docName}:`, error);
          missingDocuments.push(docName);
        }
      }
    }

    // Step 5: Briefly analyze each found document
    const issues: Array<{
      document: string;
      issue: string;
      severity: "high" | "medium" | "low";
      whyItMatters: string;
    }> = [];

    for (const [docType, docData] of Object.entries(foundDocuments)) {
      try {
        const docName = requiredDocuments[docType as keyof typeof requiredDocuments];

        const analysisPrompt = `You are a legal compliance expert. Briefly analyze this ${docName} and identify 1-3 critical issues.

Document content:
${docData.content.substring(0, 5000)}

Website: ${normalizedUrl}

Return JSON only:
{
  "issues": [
    {
      "issue": "Brief description of the problem",
      "severity": "high|medium|low",
      "whyItMatters": "Simple explanation of why this matters"
    }
  ]
}

Keep it brief and practical. Focus on the most important problems.`;

        const analysisResponse = await openaiService.callChatGPT(analysisPrompt);

        try {
          const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            if (analysis.issues && Array.isArray(analysis.issues)) {
              for (const issue of analysis.issues) {
                issues.push({
                  document: docName,
                  issue: issue.issue || "Issue found in document",
                  severity: issue.severity || "medium",
                  whyItMatters: issue.whyItMatters || "This could create legal risk",
                });
              }
            }
          }
        } catch (parseError) {
          console.error(`[Simple Scan] Error parsing analysis for ${docName}:`, parseError);
        }
      } catch (error) {
        console.error(`[Simple Scan] Error analyzing ${docType}:`, error);
      }
    }

    // Step 6: Generate summary
    const summary = missingDocuments.length > 0 || issues.length > 0
      ? `Found ${missingDocuments.length} missing document${missingDocuments.length !== 1 ? 's' : ''} and ${issues.length} issue${issues.length !== 1 ? 's' : ''} in existing documents. Review the details below.`
      : "Great news! Your website appears to have all required legal documents and no major issues were found.";

    // Return simple analysis result
    res.json({
      success: true,
      analysis: {
        foundDocuments: Object.keys(foundDocuments).map(key => ({
          name: requiredDocuments[key as keyof typeof requiredDocuments],
          url: foundDocuments[key].url,
          content: foundDocuments[key].content
        })),
        missingDocuments,
        issues,
        summary,
      },
    });
  } catch (error: any) {
    console.error("[Simple Scan] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred during the compliance scan",
    });
  }
});

// Endpoint for AI Contract Review (Proxy to avoid CORS/Frontend issues)
app.post("/api/analyze-contract", async (req, res) => {
  try {
    const { content, prompt } = req.body;

    if (!content || !Array.isArray(content) || content.length === 0) {
      return res.status(400).json({
        error: "Content array is required",
      });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return res.status(500).json({
        error: "Configuration error",
        message: "OpenAI API key is not configured.",
      });
    }

    console.log("[Contract Analysis] Analyzing document...");

    // Construct messages for OpenAI
    // If prompt is provided, prepend it as a system or user message
    const messages = [
      {
        role: "user",
        content: content
      }
    ];

    // Use pure fetch to call OpenAI directly to support vision/multimodal structure easily
    // or use openaiService if it supports this specific format.
    // For safety and custom structure, let's use direct fetch here similar to frontend but secure.

    // Note: OpenAIService might not expose a direct "chat completion with complex content" method easily
    // so we'll do a direct call here using the server's key.

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Contract Analysis] OpenAI Error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";

    res.json({
      success: true,
      analysis: analysis,
    });

  } catch (error: any) {
    console.error("[Contract Analysis] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to analyze contract",
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

// Track Meta Lead event
app.post("/api/track-meta-lead", async (req, res) => {
  try {
    const { email, phone, firstName, lastName, website, eventSourceUrl, eventId } = req.body;

    // Check if Meta credentials are configured
    if (!process.env.META_ACCESS_TOKEN || !process.env.META_PIXEL_ID) {
      console.error("META_ACCESS_TOKEN or META_PIXEL_ID is not set in environment variables");
      return res.status(500).json({
        error: "Configuration error",
        message: "Meta API credentials are not configured. Please add META_ACCESS_TOKEN and META_PIXEL_ID to your .env file.",
      });
    }

    // Validate eventId is provided (required for deduplication)
    if (!eventId) {
      console.warn("Warning: eventId not provided in request. Deduplication may not work correctly.");
    }

    // Send lead event to Meta
    const result = await metaService.sendLeadEvent(
      {
        email,
        phone,
        firstName,
        lastName,
        website,
      },
      {
        eventName: "Lead",
        eventSourceUrl: eventSourceUrl || req.headers.referer || undefined,
        actionSource: "website",
        eventId: eventId, // Pass event_id for deduplication with Pixel events
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error tracking Meta lead:", error);

    // Provide more specific error messages
    let statusCode = 500;
    let errorMessage = error.message || "Failed to track lead in Meta";

    if (error.message?.includes("401") || error.message?.includes("Invalid OAuth")) {
      statusCode = 401;
      errorMessage = "Meta API authentication failed. Please check your META_ACCESS_TOKEN in .env file.";
    } else if (error.message?.includes("400")) {
      statusCode = 400;
      errorMessage = "Invalid request to Meta API. Check pixel ID and event data format.";
    }

    res.status(statusCode).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
});

// Send Welcome Email
app.post("/api/emails/welcome", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return res.status(500).json({
        error: "Configuration error",
        message: "Email service is not configured.",
      });
    }

    const result = await emailService.sendWelcomeEmail(email, name);

    // Also notify admin (fire and forget)
    emailService.sendAdminAlert(email, name).catch((err: any) =>
      console.error("Failed to send admin alert:", err)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to send welcome email",
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
    console.log("[Save Contact] Request received:", req.body);
    console.log("[Save Contact] Using Supabase key type:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon");

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

    console.log("[Save Contact] Attempting to save:", contactData);
    const supabaseResult = await supabaseService.saveContact(contactData);
    console.log("[Save Contact] Successfully saved to Supabase:", supabaseResult);

    // STEP 1: Supabase ✅ (Complete)
    // STEP 2: GoHighLevel (PRIORITY - Must complete before Instantly.ai)
    // IMPORTANT: GoHighLevel is MORE IMPORTANT than Instantly.ai
    console.log("[Save Contact] ===== STEP 2: GOHIGHLEVEL INTEGRATION (PRIORITY) =====");
    let ghlResult = null;
    let ghlError = null;

    // GoHighLevel MUST be attempted - no conditions
    try {
      // Split name into firstName and lastName (same logic as Supabase service)
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const ghlPayload = {
        firstName: firstName,
        lastName: lastName,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "",
        locationId: "7HUNbHEuRf1cXZD4hxxr",
        tags: ["ricki new funnel"],
        source: "Cynthia AI",
      };

      console.log("[Save Contact] Sending to GoHighLevel:", {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone: phone ? "[REDACTED]" : "",
        locationId: ghlPayload.locationId,
        tags: ghlPayload.tags,
        source: ghlPayload.source,
      });

      const ghlResponse = await fetch("https://services.leadconnectorhq.com/contacts/", {
        method: "POST",
        headers: {
          Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ghlPayload),
      });

      console.log("[Save Contact] GoHighLevel API response status:", ghlResponse.status);
      console.log("[Save Contact] GoHighLevel API response headers:", Object.fromEntries(ghlResponse.headers.entries()));

      if (!ghlResponse.ok) {
        const errorText = await ghlResponse.text();
        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        console.error("[Save Contact] GoHighLevel API error response:", {
          status: ghlResponse.status,
          statusText: ghlResponse.statusText,
          errorData,
          errorText,
        });
        const error: any = new Error(`GoHighLevel API error: ${errorData.message || errorText} (Status: ${ghlResponse.status})`);
        error.status = ghlResponse.status;
        error.responseData = errorData;
        throw error;
      }

      ghlResult = await ghlResponse.json();
      console.log("[Save Contact] ===== GOHIGHLEVEL SUCCESS =====");
      console.log("[Save Contact] Successfully sent to GoHighLevel:", JSON.stringify(ghlResult, null, 2));
      console.log("[Save Contact] GoHighLevel Contact ID:", ghlResult?.contact?.id || ghlResult?.id || "N/A");
    } catch (ghlErr: any) {
      console.error("[Save Contact] ===== GOHIGHLEVEL ERROR (CRITICAL) =====");
      ghlError = {
        message: ghlErr.message || "Unknown error",
        status: ghlErr.status || null,
        responseData: ghlErr.responseData || null,
      };
      console.error("[Save Contact] CRITICAL: GoHighLevel integration failed!");
      console.error("[Save Contact] Error sending to GoHighLevel:", ghlErr);
      console.error("[Save Contact] GoHighLevel error details:", {
        message: ghlErr.message,
        status: ghlErr.status,
        responseData: ghlErr.responseData,
        stack: ghlErr.stack,
      });
      // Log error but continue - Instantly.ai should still run
      console.error("[Save Contact] Continuing to Instantly.ai despite GoHighLevel error");
    }

    // STEP 3: Instantly.ai (After GoHighLevel completes)
    // This runs AFTER GoHighLevel to ensure GoHighLevel gets priority
    console.log("[Save Contact] ===== STEP 3: INSTANTLY.AI INTEGRATION =====");
    let instantlyResult = null;
    let instantlyError = null;

    // Instantly.ai is less critical than GoHighLevel, but should still run
    if (process.env.INSTANTLY_AI_API_KEY) {
      try {
        const campaignId = process.env.INSTANTLY_CAMPAIGN_ID || "7f93b98c-f8c6-4c2b-b707-3ea4d0df6934";

        // Split name into first and last name
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const instantlyLeadData = {
          first_name: firstName,
          last_name: lastName,
          phone: phone?.trim() || "",
          website: normalizedWebsite || "",
          custom_variables: {
            // Will be updated later if workflow completes
          },
        };

        console.log("[Save Contact] Adding lead to Instantly.ai immediately:", {
          email: email.trim().toLowerCase(),
          campaignId,
          firstName,
          lastName,
        });

        instantlyResult = await instantlyService.addLeadToCampaign(
          email.trim().toLowerCase(),
          campaignId,
          instantlyLeadData
        );

        console.log("[Save Contact] Successfully added lead to Instantly.ai:", instantlyResult);
      } catch (instantlyErr: any) {
        instantlyError = {
          message: instantlyErr.message || "Unknown error",
          status: instantlyErr.status || null,
        };
        console.error("[Save Contact] Error adding lead to Instantly.ai:", instantlyErr);
        // Don't throw - we don't want to block Supabase success
      }
    } else {
      console.warn("[Save Contact] INSTANTLY_AI_API_KEY not configured, skipping Instantly.ai integration");
    }

    // NOTE: If workflow completes successfully, we'll update the Instantly lead with email content
    // The campaign sequence in Instantly.ai should have a 24-hour delay and use {{email_subject}} and {{email_body_html}} variables

    // Automatically trigger legal analyzer workflow if website URL is provided
    // Run asynchronously - don't block the response
    if (normalizedWebsite) {
      // Validate URL format before triggering workflow
      let isValidUrl = false;
      try {
        new URL(normalizedWebsite);
        isValidUrl = true;
      } catch (urlError) {
        console.warn("[Save Contact] Invalid website URL, skipping workflow:", normalizedWebsite);
      }

      if (isValidUrl) {
        (async () => {
          try {
            console.log("[Save Contact] Auto-triggering legal analyzer for:", normalizedWebsite);

            const leadInfo = {
              name: name,
              company: "", // Could extract from name if needed
              email: email,
            };

            const workflowResult = await emailWorkflow.execute(normalizedWebsite, leadInfo);

            if (workflowResult.error) {
              console.error("[Save Contact] Workflow error:", workflowResult.error);
              // Save error result to database
              try {
                await workflowResultsService.saveWorkflowResult({
                  websiteUrl: normalizedWebsite,
                  leadInfo,
                  error: workflowResult.error,
                  status: "error",
                });
              } catch (saveError) {
                console.error("[Save Contact] Error saving failed workflow result:", saveError);
              }
            } else {
              // Save successful workflow results
              try {
                const contactInfo = workflowResult.socialMedia ? {
                  instagram: workflowResult.socialMedia.instagram,
                  socialLinks: workflowResult.socialMedia.socialLinks,
                  emails: workflowResult.socialMedia.emails || [],
                } : undefined;

                await workflowResultsService.saveWorkflowResult({
                  websiteUrl: workflowResult.websiteUrl,
                  leadInfo,
                  legalDocuments: workflowResult.legalDocuments,
                  analysis: workflowResult.analysis,
                  email: workflowResult.email,
                  contactInfo,
                  executionDetails: workflowResult.executionDetails,
                  status: "completed",
                });
                console.log("[Save Contact] Successfully saved workflow results for contact");

                // UPDATE Instantly.ai lead with the generated email content as custom variables
                // Since we already added the lead immediately, we'll update it with email content
                // Using skip_if_in_campaign: true will update the existing lead
                if (workflowResult.email && process.env.INSTANTLY_AI_API_KEY) {
                  try {
                    const campaignId = process.env.INSTANTLY_CAMPAIGN_ID || "7f93b98c-f8c6-4c2b-b707-3ea4d0df6934";

                    // Split name into first and last name
                    const nameParts = name.trim().split(/\s+/);
                    const firstName = nameParts[0] || "";
                    const lastName = nameParts.slice(1).join(" ") || "";

                    // Clean up the email body HTML for Instantly AI (remove excessive inline styles)
                    const cleanEmailBody = workflowResult.email.body
                      .replace(/style="[^"]*line-height:\s*[^;"]*[^"]*"/g, "")
                      .replace(/style="[^"]*margin[^"]*"/g, "")
                      .replace(/style="[^"]*"/g, "")
                      .replace(/\n{3,}/g, "\n\n")
                      .trim();

                    const instantlyLeadData = {
                      first_name: firstName,
                      last_name: lastName,
                      phone: phone?.trim() || "",
                      website: normalizedWebsite,
                      custom_variables: {
                        email_subject: workflowResult.email.subject,
                        email_body_html: workflowResult.email.body, // Full HTML version for Instantly AI template
                        email_body: cleanEmailBody, // Cleaned version as backup
                      },
                    };

                    console.log("[Save Contact] Updating Instantly.ai lead with email content:", {
                      email: email.trim().toLowerCase(),
                      campaignId,
                      hasEmailSubject: !!workflowResult.email.subject,
                      hasEmailBody: !!workflowResult.email.body,
                    });

                    // Update the lead by adding again with updateIfExists: true
                    // This will update the existing lead's custom variables
                    await instantlyService.addLeadToCampaign(
                      email.trim().toLowerCase(),
                      campaignId,
                      instantlyLeadData,
                      true // updateIfExists - will update existing lead in campaign
                    );

                    console.log("[Save Contact] Successfully updated Instantly.ai lead with personalized email content");
                  } catch (instantlyErr: any) {
                    console.error("[Save Contact] Error updating Instantly.ai lead with email:", instantlyErr);
                    // Don't throw - workflow already succeeded and lead was already added
                  }
                }
              } catch (saveError: any) {
                console.error("[Save Contact] Error saving workflow results:", saveError);
              }
            }
          } catch (workflowError: any) {
            console.error("[Save Contact] Error running workflow:", workflowError);
            // Don't throw - we don't want to break the contact save
          }
        })(); // Immediately invoke async function
      }
    }

    // Log final integration status (in priority order)
    console.log("[Save Contact] ===== FINAL INTEGRATION STATUS (PRIORITY ORDER) =====");
    console.log("[Save Contact] 1. Supabase:", supabaseResult ? "✅ Success" : "❌ Failed");
    console.log("[Save Contact] 2. GoHighLevel (PRIORITY):", ghlResult ? "✅ Success" : (ghlError ? `❌ Error: ${ghlError.message}` : "⚠️ Not attempted"));
    console.log("[Save Contact] 3. Instantly.ai:", instantlyResult ? "✅ Success" : (instantlyError ? `❌ Error: ${instantlyError.message}` : "⚠️ Not attempted"));

    // Alert if GoHighLevel failed
    if (!ghlResult && ghlError) {
      console.error("[Save Contact] ⚠️⚠️⚠️ WARNING: GoHighLevel FAILED - This is critical! ⚠️⚠️⚠️");
      console.error("[Save Contact] GoHighLevel error:", ghlError.message);
    }

    res.json({
      success: true,
      supabase: supabaseResult,
      ghl: ghlResult,
      ghlError: ghlError || null,
      instantly: instantlyResult,
      instantlyError: instantlyError || null,
      // Note: Instantly.ai lead is added immediately, then updated with email content if workflow completes
    });
  } catch (error: any) {
    console.error("[Save Contact] Error saving contact:", error);
    console.error("[Save Contact] Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to save contact to Supabase",
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
});

// ONE-TIME MIGRATION: Tag all existing business profile users in GoHighLevel
app.post("/api/migrate-business-profile-tags", async (req, res) => {
  try {
    console.log("[Migration] Starting migration to tag all existing business profile users...");

    // Get all business profiles with user emails from Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""
    );

    // Query all business profiles and join with auth.users to get emails
    const { data: profiles, error: queryError } = await supabase
      .from('business_profiles')
      .select(`
        user_id,
        business_name,
        website_url,
        instagram,
        business_type,
        team_size,
        monthly_clients,
        uses_photos,
        primary_concern,
        hosts_retreats,
        offers_online_courses,
        has_w2_employees,
        sells_products,
        services,
        has_physical_movement,
        collects_online,
        hires_staff,
        is_offsite_or_international,
        created_at
      `);

    if (queryError) {
      console.error("[Migration] Error querying business profiles:", queryError);
      return res.status(500).json({
        error: "Failed to query business profiles",
        message: queryError.message,
      });
    }

    if (!profiles || profiles.length === 0) {
      console.log("[Migration] No business profiles found");
      return res.json({
        success: true,
        message: "No business profiles found to migrate",
        results: [],
      });
    }

    console.log(`[Migration] Found ${profiles.length} business profiles to migrate`);

    // For each profile, get the user's email and tag them
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const profile of profiles) {
      try {
        // Get user email from auth.users
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
          profile.user_id
        );

        if (userError || !user) {
          console.error(`[Migration] Error getting user for profile ${profile.user_id}:`, userError);
          results.push({
            userId: profile.user_id,
            businessName: profile.business_name,
            success: false,
            error: "User not found",
          });
          errorCount++;
          continue;
        }

        const email = user.email;
        console.log(`[Migration] Processing user: ${email} (${profile.business_name || 'No name'})`);

        // Step 1: Look up the contact in GoHighLevel by email
        const lookupResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/lookup?email=${encodeURIComponent(email.trim().toLowerCase())}&locationId=7HUNbHEuRf1cXZD4hxxr`,
          {
            method: "GET",
            headers: {
              Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
              Version: "2021-07-28",
              "Content-Type": "application/json",
            },
          }
        );

        // If contact doesn't exist in GHL, create them first
        if (!lookupResponse.ok) {
          console.log(`[Migration] Contact not found in GHL for ${email}, creating new contact...`);

          // Split name from email or use business name
          const nameParts = (user.user_metadata?.name || profile.business_name || email.split('@')[0]).trim().split(/\s+/);
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          // Create new contact with both tags
          const createPayload = {
            firstName,
            lastName,
            email: email.trim().toLowerCase(),
            locationId: "7HUNbHEuRf1cXZD4hxxr",
            tags: ["ricki new funnel", "created business profile"],
            source: "Cynthia AI - Migration",
          };

          const createResponse = await fetch("https://services.leadconnectorhq.com/contacts/", {
            method: "POST",
            headers: {
              Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
              Version: "2021-07-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(createPayload),
          });

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            let errorData: any;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }

            // Check if it's a duplicate contact error - if so, we can extract the contactId and update it!
            if (errorData.statusCode === 400 && errorData.message?.includes("duplicated contacts") && errorData.meta?.contactId) {
              console.log(`[Migration] Contact already exists in GHL (${email}), updating tags using contactId from error...`);

              const existingContactId = errorData.meta.contactId;

              // First, get the existing contact to retrieve current tags
              const getContactResponse = await fetch(
                `https://services.leadconnectorhq.com/contacts/${existingContactId}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
                    Version: "2021-07-28",
                    "Content-Type": "application/json",
                  },
                }
              );

              if (!getContactResponse.ok) {
                console.error(`[Migration] Failed to get existing contact details for ${email}`);
                results.push({
                  email,
                  businessName: profile.business_name,
                  success: false,
                  error: `Contact exists but couldn't retrieve details`,
                });
                errorCount++;
                continue;
              }

              const contactData = await getContactResponse.json();
              const existingTags = contactData.contact?.tags || [];

              // Add the new tag if it doesn't already exist
              const newTag = "created business profile";
              if (existingTags.includes(newTag)) {
                console.log(`[Migration] User ${email} already has the tag, skipping`);
                results.push({
                  email,
                  businessName: profile.business_name,
                  success: true,
                  alreadyTagged: true,
                  message: "Already had the tag",
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
              }

              const updatedTags = [...existingTags, newTag];

              // Build custom fields from business profile data
              const customFields: any = {};
              if (profile.business_name) customFields.business_name = profile.business_name;
              if (profile.website_url) customFields.website = profile.website_url;
              if (profile.instagram) customFields.instagram_handle = profile.instagram;
              if (profile.business_type) customFields.business_type = profile.business_type;
              if (profile.team_size) customFields.team_size = profile.team_size;
              if (profile.monthly_clients) customFields.monthly_clients = profile.monthly_clients;
              if (profile.primary_concern) customFields.primary_concern = profile.primary_concern;

              // Yes/No boolean fields
              if (profile.uses_photos !== null && profile.uses_photos !== undefined) {
                customFields.uses_client_photos = profile.uses_photos ? 'Yes' : 'No';
              }
              if (profile.hosts_retreats !== null && profile.hosts_retreats !== undefined) {
                customFields.hosts_retreats = profile.hosts_retreats ? 'Yes' : 'No';
              }
              if (profile.offers_online_courses !== null && profile.offers_online_courses !== undefined) {
                customFields.offers_online_courses = profile.offers_online_courses ? 'Yes' : 'No';
              }
              if (profile.has_w2_employees !== null && profile.has_w2_employees !== undefined) {
                customFields.has_w2_employees = profile.has_w2_employees ? 'Yes' : 'No';
              }
              if (profile.sells_products !== null && profile.sells_products !== undefined) {
                customFields.sells_products = profile.sells_products ? 'Yes' : 'No';
              }
              if (profile.has_physical_movement !== null && profile.has_physical_movement !== undefined) {
                customFields.physical_movement = profile.has_physical_movement ? 'Yes' : 'No';
              }
              if (profile.collects_online !== null && profile.collects_online !== undefined) {
                customFields.online_payments = profile.collects_online ? 'Yes' : 'No';
              }
              if (profile.hires_staff !== null && profile.hires_staff !== undefined) {
                customFields.hires_staff = profile.hires_staff ? 'Yes' : 'No';
              }
              if (profile.is_offsite_or_international !== null && profile.is_offsite_or_international !== undefined) {
                customFields.offsite_international = profile.is_offsite_or_international ? 'Yes' : 'No';
              }

              // Services array
              if (profile.services && Array.isArray(profile.services) && profile.services.length > 0) {
                customFields.services_offered = profile.services.join(', ');
              }

              const updatePayload: any = { tags: updatedTags };
              if (Object.keys(customFields).length > 0) {
                updatePayload.customField = customFields;
              }

              // Update the contact with new tags AND custom fields
              const updateResponse = await fetch(
                `https://services.leadconnectorhq.com/contacts/${existingContactId}`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
                    Version: "2021-07-28",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(updatePayload),
                }
              );

              if (!updateResponse.ok) {
                const updateError = await updateResponse.text();
                console.error(`[Migration] Failed to update tags for existing contact ${email}:`, updateError);
                results.push({
                  email,
                  businessName: profile.business_name,
                  success: false,
                  error: `Failed to update existing contact tags`,
                });
                errorCount++;
                continue;
              }

              console.log(`[Migration] ✅ Successfully updated existing contact ${email} with business profile tag`);
              results.push({
                email,
                businessName: profile.business_name,
                success: true,
                updated: true,
                previousTags: existingTags,
                newTags: updatedTags,
              });
              successCount++;

              await new Promise(resolve => setTimeout(resolve, 100));
              continue;
            }

            // Not a duplicate error, log the failure
            console.error(`[Migration] Error creating contact in GHL for ${email}:`, errorText);
            results.push({
              email,
              businessName: profile.business_name,
              success: false,
              error: `Failed to create contact in GoHighLevel: ${errorData.message || errorText}`,
            });
            errorCount++;
            continue;
          }

          const createResult = await createResponse.json();
          console.log(`[Migration] ✅ Created new contact in GHL for ${email} with both tags`);
          results.push({
            email,
            businessName: profile.business_name,
            success: true,
            created: true,
            tags: ["ricki new funnel", "created business profile"],
          });
          successCount++;

          // Add delay
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const lookupData = await lookupResponse.json();
        const contactId = lookupData.contacts?.[0]?.id || lookupData.contact?.id;

        if (!contactId) {
          console.error(`[Migration] No contact ID found for ${email}`);
          results.push({
            email,
            businessName: profile.business_name,
            success: false,
            error: "No contact ID in GoHighLevel response",
          });
          errorCount++;
          continue;
        }

        // Step 2: Get existing tags
        const existingTags = lookupData.contacts?.[0]?.tags || lookupData.contact?.tags || [];

        // Step 3: Add the new tag if it doesn't already exist
        const newTag = "created business profile";
        if (existingTags.includes(newTag)) {
          console.log(`[Migration] User ${email} already has the tag, skipping`);
          results.push({
            email,
            businessName: profile.business_name,
            success: true,
            alreadyTagged: true,
            message: "Already had the tag",
          });
          successCount++;
          continue;
        }

        const updatedTags = [...existingTags, newTag];

        // Build custom fields from business profile data
        const customFields: any = {};
        if (profile.business_name) customFields.business_name = profile.business_name;
        if (profile.website_url) customFields.website = profile.website_url;
        if (profile.instagram) customFields.instagram_handle = profile.instagram;
        if (profile.business_type) customFields.business_type = profile.business_type;
        if (profile.team_size) customFields.team_size = profile.team_size;
        if (profile.monthly_clients) customFields.monthly_clients = profile.monthly_clients;
        if (profile.primary_concern) customFields.primary_concern = profile.primary_concern;

        // Yes/No boolean fields
        if (profile.uses_photos !== null && profile.uses_photos !== undefined) {
          customFields.uses_client_photos = profile.uses_photos ? 'Yes' : 'No';
        }
        if (profile.hosts_retreats !== null && profile.hosts_retreats !== undefined) {
          customFields.hosts_retreats = profile.hosts_retreats ? 'Yes' : 'No';
        }
        if (profile.offers_online_courses !== null && profile.offers_online_courses !== undefined) {
          customFields.offers_online_courses = profile.offers_online_courses ? 'Yes' : 'No';
        }
        if (profile.has_w2_employees !== null && profile.has_w2_employees !== undefined) {
          customFields.has_w2_employees = profile.has_w2_employees ? 'Yes' : 'No';
        }
        if (profile.sells_products !== null && profile.sells_products !== undefined) {
          customFields.sells_products = profile.sells_products ? 'Yes' : 'No';
        }
        if (profile.has_physical_movement !== null && profile.has_physical_movement !== undefined) {
          customFields.physical_movement = profile.has_physical_movement ? 'Yes' : 'No';
        }
        if (profile.collects_online !== null && profile.collects_online !== undefined) {
          customFields.online_payments = profile.collects_online ? 'Yes' : 'No';
        }
        if (profile.hires_staff !== null && profile.hires_staff !== undefined) {
          customFields.hires_staff = profile.hires_staff ? 'Yes' : 'No';
        }
        if (profile.is_offsite_or_international !== null && profile.is_offsite_or_international !== undefined) {
          customFields.offsite_international = profile.is_offsite_or_international ? 'Yes' : 'No';
        }

        // Services array
        if (profile.services && Array.isArray(profile.services) && profile.services.length > 0) {
          customFields.services_offered = profile.services.join(', ');
        }

        const updatePayload: any = { tags: updatedTags };
        if (Object.keys(customFields).length > 0) {
          updatePayload.customField = customFields;
        }

        // Step 4: Update the contact with the new tags AND custom fields
        const updateResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}`,
          {
            method: "PUT",
            headers: {
              Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
              Version: "2021-07-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
          }
        );

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error(`[Migration] Error updating contact for ${email}:`, errorText);
          results.push({
            email,
            businessName: profile.business_name,
            success: false,
            error: "Failed to update contact in GoHighLevel",
          });
          errorCount++;
          continue;
        }

        console.log(`[Migration] ✅ Successfully tagged ${email} and synced ${Object.keys(customFields).length} custom fields`);
        results.push({
          email,
          businessName: profile.business_name,
          success: true,
          previousTags: existingTags,
          newTags: updatedTags,
          customFieldsUpdated: Object.keys(customFields).length,
        });
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (profileError: any) {
        console.error(`[Migration] Error processing profile ${profile.user_id}:`, profileError);
        results.push({
          userId: profile.user_id,
          businessName: profile.business_name,
          success: false,
          error: profileError.message,
        });
        errorCount++;
      }
    }

    console.log(`[Migration] Migration complete! Success: ${successCount}, Errors: ${errorCount}`);

    res.json({
      success: true,
      message: `Migration complete. Tagged ${successCount} users, ${errorCount} errors.`,
      summary: {
        total: profiles.length,
        success: successCount,
        errors: errorCount,
      },
      results,
    });
  } catch (error: any) {
    console.error("[Migration] Error in migration:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to run migration",
    });
  }
});

// Add GoHighLevel tag for business profile creation + sync all profile data
app.post("/api/add-ghl-business-profile-tag", async (req, res) => {
  try {
    const { email, profileData } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "email is required",
      });
    }

    console.log("[GHL Tag] Adding 'created business profile' tag and syncing data for:", email);

    // Step 1: Look up the contact in GoHighLevel by email
    const lookupResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/lookup?email=${encodeURIComponent(email.trim().toLowerCase())}&locationId=7HUNbHEuRf1cXZD4hxxr`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
      }
    );

    if (!lookupResponse.ok) {
      const errorText = await lookupResponse.text();
      console.error("[GHL Tag] Error looking up contact:", errorText);
      return res.status(404).json({
        error: "Contact not found in GoHighLevel",
        message: errorText,
      });
    }

    const lookupData = await lookupResponse.json();
    const contactId = lookupData.contacts?.[0]?.id || lookupData.contact?.id;

    if (!contactId) {
      console.error("[GHL Tag] No contact ID found in lookup response:", lookupData);
      return res.status(404).json({
        error: "Contact not found in GoHighLevel",
        message: "No contact ID in response",
      });
    }

    console.log("[GHL Tag] Found contact ID:", contactId);

    // Step 2: Get the existing tags for this contact
    const existingTags = lookupData.contacts?.[0]?.tags || lookupData.contact?.tags || [];
    console.log("[GHL Tag] Existing tags:", existingTags);

    // Step 3: Add the new tag if it doesn't already exist
    const newTag = "created business profile";
    const updatedTags = existingTags.includes(newTag)
      ? existingTags
      : [...existingTags, newTag];

    // Step 4: Build custom fields from profile data
    const customFields: any = {};

    if (profileData) {
      // Basic business info
      if (profileData.businessName) customFields.business_name = profileData.businessName;
      if (profileData.website) customFields.website = profileData.website;
      if (profileData.instagram) customFields.instagram_handle = profileData.instagram;
      if (profileData.businessType) customFields.business_type = profileData.businessType;

      // Scale & operations
      if (profileData.staffCount) customFields.team_size = profileData.staffCount;
      if (profileData.clientCount) customFields.monthly_clients = profileData.clientCount;
      if (profileData.primaryConcern) customFields.primary_concern = profileData.primaryConcern;

      // Yes/No fields
      if (profileData.usesPhotos !== undefined) customFields.uses_client_photos = profileData.usesPhotos ? 'Yes' : 'No';
      if (profileData.hostsRetreats !== undefined) customFields.hosts_retreats = profileData.hostsRetreats ? 'Yes' : 'No';
      if (profileData.offersOnlineCourses !== undefined) customFields.offers_online_courses = profileData.offersOnlineCourses ? 'Yes' : 'No';
      if (profileData.hasEmployees !== undefined) customFields.has_w2_employees = profileData.hasEmployees ? 'Yes' : 'No';
      if (profileData.sellsProducts !== undefined) customFields.sells_products = profileData.sellsProducts ? 'Yes' : 'No';

      // Onboarding questions
      if (profileData.services && Array.isArray(profileData.services)) {
        customFields.services_offered = profileData.services.join(', ');
      }
      if (profileData.hasPhysicalMovement !== undefined) customFields.physical_movement = profileData.hasPhysicalMovement ? 'Yes' : 'No';
      if (profileData.collectsOnline !== undefined) customFields.online_payments = profileData.collectsOnline ? 'Yes' : 'No';
      if (profileData.hiresStaff !== undefined) customFields.hires_staff = profileData.hiresStaff ? 'Yes' : 'No';
      if (profileData.isOffsiteOrInternational !== undefined) customFields.offsite_international = profileData.isOffsiteOrInternational ? 'Yes' : 'No';
    }

    console.log("[GHL Tag] Custom fields to update:", Object.keys(customFields).length);

    // Step 5: Update the contact with tags AND custom fields
    const updatePayload: any = {
      tags: updatedTags,
    };

    // Only add customField if we have data
    if (Object.keys(customFields).length > 0) {
      updatePayload.customField = customFields;
    }

    const updateResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}`,
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("[GHL Tag] Error updating contact:", errorText);
      return res.status(500).json({
        error: "Failed to update contact in GoHighLevel",
        message: errorText,
      });
    }

    const updateResult = await updateResponse.json();
    console.log("[GHL Tag] Successfully added 'created business profile' tag and synced custom fields");
    console.log("[GHL Tag] Updated tags:", updatedTags);
    console.log("[GHL Tag] Updated custom fields:", Object.keys(customFields).join(', '));

    res.json({
      success: true,
      contactId,
      tags: updatedTags,
      customFieldsUpdated: Object.keys(customFields).length,
      message: "Successfully updated GoHighLevel contact with profile data",
    });
  } catch (error: any) {
    console.error("[GHL Tag] Error adding business profile tag:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to add GoHighLevel tag",
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
// Document Generation API Endpoints
// ============================================

// Generate personalized document from template
app.post("/api/documents/generate", async (req, res) => {
  try {
    const { templateName, userId } = req.body;

    if (!templateName) {
      return res.status(400).json({
        error: "templateName is required",
      });
    }

    console.log(`[API] Generating document: ${templateName} for user: ${userId || 'anonymous'}`);

    // Get user's business profile data
    let profileData: any = {};

    if (userId && process.env.SUPABASE_URL) {
      try {
        const { data: profile, error: profileError } = await createClient(
          process.env.SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""
        )
          .from('business_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!profileError && profile) {
          console.log('[API] Loaded business profile from database');
          profileData = {
            businessName: profile.business_name,
            legalEntityName: profile.legal_entity_name,
            entityType: profile.entity_type,
            state: profile.state,
            businessAddress: profile.business_address,
            ownerName: profile.owner_name,
            phone: profile.phone,
            website: profile.website_url,
            instagram: profile.instagram,
            businessType: profile.business_type,
            services: profile.services || [],
          };

          // Also get user's email
          const { data: { user } } = await createClient(
            process.env.SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""
          ).auth.admin.getUserById(userId);

          if (user) {
            profileData.email = user.email;
          }
        } else {
          console.log('[API] No business profile found for user, using empty data');
        }
      } catch (err) {
        console.error('[API] Error loading business profile:', err);
        // Continue with empty profile data
      }
    }

    // Generate the document
    const pdfBuffer = await documentGenerationService.generateDocument(
      templateName,
      profileData
    );

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${templateName}-${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("[API] Error generating document:", error);
    console.error("[API] Error stack:", error.stack);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to generate document",
      stack: error.stack,
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

