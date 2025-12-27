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
import { CalendlyService } from "./services/calendlyService.js";
import { getCountryFromIP, getRealIP } from "./utils/geoUtils.js";
import { normalizePhone } from "./utils/phoneNormalization.js";

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
// Use service_role key if available (bypasses RLS), otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!process.env.SUPABASE_URL || !supabaseKey) {
  console.error("[Server] CRITICAL STARTUP ERROR: Missing Supabase configuration.");
  console.error("[Server] Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.");
  console.error("[Server] Current values - URL:", !!process.env.SUPABASE_URL, "Key:", !!supabaseKey);
  // Don't crash immediately to allow health check to pass, but services will differ
}

const supabaseService = new SupabaseService(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co", // Prevent createClient throw
  supabaseKey || "placeholder-key"
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

// Initialize Calendly service for webhook handling
const calendlyService = new CalendlyService(
  process.env.CALENDLY_WEBHOOK_SIGNING_KEY
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
import { usptoService } from "./services/usptoService.js";
const documentGenerationService = new DocumentGenerationService();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Scraping API is running" });
});

// Country detection endpoint (for phone input country detection)
app.get("/api/detect-country", (req, res) => {
  try {
    const ip = getRealIP(req);
    const country = getCountryFromIP(ip);
    res.json({ country, ip }); // Return both for debugging
  } catch (error) {
    console.error("[API] Error detecting country:", error);
    res.json({ country: "US", error: "Detection failed, using default" });
  }
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

    // Step 3: Determine which documents are missing
    const requiredDocuments = {
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      refundPolicy: "Refund Policy",
      cookiePolicy: "Cookie Policy",
      disclaimer: "Disclaimer",
    };

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
      try {
        markdown = await (firecrawlService as any).scrapePage(normalizedUrl);
        html = "";
      } catch (fallbackError: any) {
        console.error("[Simple Scan] Both HTML and markdown scraping failed:", fallbackError.message);
        // Return a partial result - we can still try to find links from the URL structure
        return res.status(200).json({
          success: true,
          url: normalizedUrl,
          foundDocuments: [],
          missingDocuments: Object.values(requiredDocuments),
          message: "Unable to scrape website content. This may be due to Firecrawl API issues or website restrictions. Please try again later.",
          error: fallbackError.message,
        });
      }
    }

    // Step 2: Extract legal links from footer - use finalUrl for relative link resolution
    const legalLinks = html
      ? (firecrawlService as any).findLegalDocumentLinksFromHtml(html, finalUrl, markdown)
      : (firecrawlService as any).findLegalDocumentLinks(markdown, finalUrl);

    // requiredDocuments moved up


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

    // Normalize phone to E.164 format (phone is already in E.164 from frontend PhoneInput)
    const normalizedPhone = phone ? normalizePhone(phone, 'US') : undefined;

    // Send lead event to Meta
    const result = await metaService.sendLeadEvent(
      {
        email,
        phone: normalizedPhone,
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

// Track Onboarding Event (for sendBeacon and direct API calls)
app.post("/api/track-onboarding-event", async (req, res) => {
  try {
    const eventData = req.body;

    // Validate required fields
    if (!eventData.session_id || !eventData.step_number || !eventData.event_type) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["session_id", "step_number", "event_type"]
      });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""
    );

    // Insert event using service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('onboarding_events')
      .insert([{
        session_id: eventData.session_id,
        email: eventData.email || null,
        user_id: eventData.user_id || null,
        contact_id: eventData.contact_id || null,
        step_number: eventData.step_number,
        step_name: eventData.step_name || `Step ${eventData.step_number}`,
        event_type: eventData.event_type,
        entry_point: eventData.entry_point || 'onboarding_direct',
        source: eventData.source || 'onboarding_direct',
        time_spent_seconds: eventData.time_spent_seconds || null,
      }])
      .select();

    if (error) {
      console.error('[Track Onboarding Event] Error:', error);
      return res.status(500).json({
        error: "Failed to track event",
        message: error.message
      });
    }

    console.log(`[Track Onboarding Event] ✅ Tracked: Step ${eventData.step_number} - ${eventData.event_type}`);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('[Track Onboarding Event] Exception:', error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
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

// Send Contact Created Email
app.post("/api/emails/contact-created", async (req, res) => {
  try {
    const { email, firstName } = req.body;

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

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Configuration error",
        message: "Supabase is not configured.",
      });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Generate magic link using Supabase admin API
    const redirectUrl = `${process.env.DASHBOARD_URL || 'https://free.consciouscounsel.ca'}/wellness/dashboard`;
    
    console.log('[Contact Created Email] Generating magic link for:', email);
    console.log('[Contact Created Email] Redirect URL:', redirectUrl);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim(),
      options: {
        redirectTo: redirectUrl,
      },
    });

    let magicLinkUrl = '';
    if (linkError || !linkData) {
      console.error('[Contact Created Email] Error generating link:', linkError);
      // Continue without magic link - use dashboard URL as fallback
      magicLinkUrl = redirectUrl;
    } else {
      // Extract the action link (the actual clickable URL)
      magicLinkUrl = linkData.properties?.action_link || redirectUrl;
      console.log('[Contact Created Email] Magic link generated successfully:', magicLinkUrl.substring(0, 50) + '...');
    }

    // Send email via Resend with the magic link
    const result = await emailService.sendContactCreatedEmail(
      email.trim(),
      firstName || email.split('@')[0],
      magicLinkUrl
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error sending contact created email:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to send contact created email",
    });
  }
});

// Send Magic Link Email via Resend
app.post("/api/auth/send-magic-link", async (req, res) => {
  try {
    const { email, name, redirectTo } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Configuration error",
        message: "Supabase is not configured.",
      });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        error: "Configuration error",
        message: "Email service is not configured.",
      });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Generate magic link using Supabase admin API
    const redirectUrl = redirectTo || `${process.env.DASHBOARD_URL || 'https://free.consciouscounsel.ca'}/wellness/dashboard`;
    
    console.log('[Send Magic Link] Generating magic link for:', email);
    console.log('[Send Magic Link] Redirect URL:', redirectUrl);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim(),
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError || !linkData) {
      console.error('[Send Magic Link] Error generating link:', linkError);
      return res.status(500).json({
        error: "Failed to generate magic link",
        message: linkError?.message || "Unknown error",
      });
    }

    // Extract the action link (the actual clickable URL)
    const actionLink = linkData.properties?.action_link;
    
    if (!actionLink) {
      console.error('[Send Magic Link] No action_link in response:', linkData);
      return res.status(500).json({
        error: "Failed to extract magic link",
        message: "Magic link generated but no URL found",
      });
    }

    console.log('[Send Magic Link] Magic link generated successfully:', actionLink.substring(0, 50) + '...');

    // Send email via Resend with the actual magic link
    const emailResult = await emailService.sendMagicLinkEmail(
      email.trim(),
      actionLink,
      name || email.split('@')[0]
    );

    res.json({
      success: true,
      data: {
        emailSent: true,
        message: "Magic link email sent successfully",
      },
    });
  } catch (error: any) {
    console.error("Error sending magic link email:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to send magic link email",
    });
  }
});

// Send Onboarding Package (All Recommended Documents)
// Automatically generates and saves all recommended legal documents based on user's business profile
// Document ID to template name mapping
const DOCUMENT_TEMPLATE_MAP = {
  'template-6': { templateName: 'social_media_disclaimer', title: 'Social Media Disclaimer', category: 'marketing' },
  'template-4': { templateName: 'media_release_form', title: 'Photo / Video Release', category: 'marketing' },
  'template-intake': { templateName: 'client_intake_form', title: 'Client Intake Form', category: 'core' },
  'template-1': { templateName: 'waiver_release_of_liability', title: 'Basic Waiver of Liability', category: 'core' },
  'template-2': { templateName: 'service_agreement_membership_contract', title: 'Service Agreement & Membership Contract', category: 'core' },
  'template-5': { templateName: 'testimonial_consent_agreement', title: 'Testimonial Consent & Use Agreement', category: 'marketing' },
  'template-7': { templateName: 'independent_contractor_agreement', title: 'Independent Contractor Agreement', category: 'hr' },
  'template-8': { templateName: 'employment_agreement', title: 'Employment Agreement', category: 'hr' },
  'template-membership': { templateName: 'membership_agreement', title: 'Membership Agreement', category: 'operations' },
  'template-studio': { templateName: 'studio_policies', title: 'Studio Policies', category: 'operations' },
  'template-class': { templateName: 'class_terms_conditions', title: 'Class Terms & Conditions', category: 'operations' },
  'template-privacy': { templateName: 'privacy_policy', title: 'Privacy Policy', category: 'website' },
  'template-website': { templateName: 'website_terms_conditions', title: 'Website Terms & Conditions', category: 'website' },
  'template-refund': { templateName: 'refund_cancellation_policy', title: 'Refund & Cancellation Policy', category: 'website' },
  'template-disclaimer': { templateName: 'website_disclaimer', title: 'Website Disclaimer', category: 'website' },
  'template-cookie': { templateName: 'cookie_policy', title: 'Cookie Policy', category: 'website' },
  'template-retreat-waiver': { templateName: 'retreat_liability_waiver', title: 'Retreat Liability Waiver', category: 'core' },
  'template-travel': { templateName: 'travel_excursion_agreement', title: 'Travel & Excursion Agreement', category: 'operations' }
};

// Get recommended documents based on business profile (server-side version of documentEngine)
function getRecommendedDocumentsForProfile(profile) {
  const recommendedIds = new Set();

  // Core documents for everyone
  const coreIds = [
    'template-6', 'template-4', 'template-intake', 'template-1',
    'template-website', 'template-privacy', 'template-disclaimer',
    'template-cookie', 'template-refund'
  ];
  coreIds.forEach(id => recommendedIds.add(id));

  // Dynamic recommendations based on profile
  if (profile.has_w2_employees) {
    recommendedIds.add('template-8'); // Employment Agreement
  } else if (profile.hires_staff) {
    recommendedIds.add('template-7'); // Contractor Agreement
  }

  // Studio-specific documents
  const isStudio = profile.business_type &&
    (profile.business_type.includes('Studio') || profile.business_type.includes('Gym'));
  if (isStudio) {
    recommendedIds.add('template-studio');
    recommendedIds.add('template-class');
    recommendedIds.add('template-membership');
    recommendedIds.add('template-2');
  }

  // Retreat-specific documents
  if (profile.hosts_retreats || profile.is_offsite_or_international) {
    recommendedIds.add('template-retreat-waiver');
    recommendedIds.add('template-travel');
  }

  // Online course/coaching documents
  if (profile.offers_online_courses) {
    recommendedIds.add('template-refund');
  }

  // Product sales
  if (profile.sells_products) {
    recommendedIds.add('template-refund');
  }

  // Testimonial agreement
  if (profile.offers_online_courses || profile.hosts_retreats) {
    recommendedIds.add('template-5');
  }

  return Array.from(recommendedIds);
}

app.post("/api/documents/onboarding-package", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    console.log(`[Onboarding Package] Processing for user ${userId}`);
    console.log(`[Onboarding Package] Request received at: ${new Date().toISOString()}`);

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""
    );

    const { data: profile, error } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      console.error('[Onboarding Package] ❌ PROFILE NOT FOUND - Email will NOT be sent');
      console.error('[Onboarding Package] Error details:', error);
      console.error('[Onboarding Package] User ID searched:', userId);
      console.error('[Onboarding Package] ⚠️ This means Resend will show NO attempt because emailService.sendOnboardingPackageEmail() is never called');
      return res.status(404).json({
        error: "Profile not found",
        message: "Business profile does not exist. Email cannot be sent without profile data.",
        userId: userId
      });
    }

    console.log(`[Onboarding Package] ✅ Profile found, proceeding with document generation...`);

    // Get User Email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    const name = profile.business_name || authUser?.user?.user_metadata?.name || 'there';

    if (!email) {
      return res.status(404).json({ error: "User email not found" });
    }

    // Prepare Profile Data
    const profileData = {
      businessName: profile.business_name,
      legalEntityName: profile.legal_entity_name,
      entityType: profile.entity_type,
      state: profile.state,
      businessAddress: profile.business_address,
      ownerName: profile.owner_name,
      phone: profile.phone,
      email: email,
      website: profile.website_url,
      instagram: profile.instagram,
      businessType: profile.business_type,
      services: profile.services
    };

    // Get ALL recommended documents based on user's profile
    const recommendedDocIds = getRecommendedDocumentsForProfile(profile);
    console.log(`[Onboarding Package] Generating ${recommendedDocIds.length} recommended documents...`);

    // Build templates array from recommended IDs
    const templates = recommendedDocIds
      .map(docId => {
        const mapping = DOCUMENT_TEMPLATE_MAP[docId];
        if (!mapping) {
          console.warn(`[Onboarding Package] No mapping found for document ID: ${docId}`);
          return null;
        }
        return {
          id: mapping.templateName,
          name: `${mapping.title}.pdf`,
          docType: docId,
          category: mapping.category,
          title: mapping.title
        };
      })
      .filter(t => t !== null);

    const attachments = [];

    for (const tmpl of templates) {
      try {
        console.log(`[Onboarding Package] Generating ${tmpl.id}...`);
        const pdfBuffer = await documentGenerationService.generateDocument(tmpl.id, profileData);

        // Add to email attachments
        attachments.push({
          filename: tmpl.name,
          content: pdfBuffer
        });

        // Save to Supabase Storage & DB (Vault)
        try {
          const fileExt = 'pdf';
          const fileName = `${userId}/${Date.now()}-${tmpl.docType}.${fileExt}`;

          // Upload to Storage
          const { error: uploadError } = await supabaseAdmin.storage
            .from('wellness-documents')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.error(`[Onboarding Package] Storage upload failed for ${tmpl.id}:`, uploadError);
          } else {
            // Create DB Record
            const docData = {
              user_id: userId,
              title: tmpl.title,
              description: 'Auto-generated during onboarding',
              analysis: '✅ This document was automatically generated based on your profile and is ready to use.',
              file_path: fileName,
              file_type: fileExt,
              category: tmpl.category,
              document_type: tmpl.docType,
              created_at: new Date().toISOString()
            };

            const { error: dbError } = await supabaseAdmin
              .from('user_documents')
              .insert(docData);

            if (dbError) {
              console.error(`[Onboarding Package] DB insert failed for ${tmpl.id}:`, dbError);
            } else {
              console.log(`[Onboarding Package] Saved ${tmpl.id} to Vault successfully.`);
            }
          }
        } catch (saveErr) {
          console.error(`[Onboarding Package] Error saving to vault for ${tmpl.id}:`, saveErr);
        }
      } catch (err) {
        console.error(`[Onboarding Package] Failed to generate ${tmpl.id}:`, err);
      }
    }

    if (attachments.length === 0) {
      return res.status(500).json({ error: "Failed to generate any documents" });
    }

    console.log(`[Onboarding Package] Total documents generated: ${templates.length}`);
    console.log(`[Onboarding Package] Documents successfully generated: ${attachments.length}`);

    // Send notification email (no attachments - all docs are in the vault)
    await emailService.sendOnboardingPackageEmail(
      email,
      name,
      attachments.length,
      templates.map(t => t.title)
    );

    console.log(`[Onboarding Package] Successfully generated ${attachments.length} documents and sent notification to ${email}`);

    return res.json({
      success: true,
      generatedCount: attachments.length
    });

  } catch (error: any) {
    console.error("[Onboarding Package] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// ================================================================
// REMOVED: Cron job endpoints for email reminders
// ================================================================
// These endpoints have been removed as they were not working properly.
// Email reminders are now handled via Cloud Tasks scheduled individually per user.
// - /api/emails/send-website-scan-reminders (removed)
// - /api/emails/send-legal-health-score (removed)

// ================================================================
// Get Social Proof Statistics (for dashboard widget)
// ================================================================
//
// Returns real-time stats about protected users
// Can be cached on frontend with a TTL (time-to-live)
//
// NOTE: Uses a BASE_COUNT to boost numbers for social proof
// Real users are added on top of this base
app.get("/api/stats/social-proof", async (req, res) => {
  try {
    // ============================================================
    // SOCIAL PROOF BASE COUNT
    // ============================================================
    // This is added to real user counts for social proof purposes
    // Example: 36 real users + 1200 base = 1,236 shown to users
    //
    // As real users grow, the total increases (1,237, 1,238, etc.)
    // Adjust this number as your real user base grows
    const BASE_COUNT = 1200;

    // Breakdown base counts by business type (should add up to BASE_COUNT)
    const BASE_BREAKDOWN = {
      yogaStudios: 115,    // ~10% of 1200
      retreatLeaders: 78,  // ~6.5%
      coaches: 180,        // ~15%
      gyms: 132,           // ~11%
      other: 695,          // Remaining: 57.5%
    };
    // ============================================================

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Configuration error",
        message: "Supabase is not configured.",
      });
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get total users with completed profiles
    const { count: totalProtected, error: totalError } = await supabaseAdmin
      .from('business_profiles')
      .select('*', { count: 'exact', head: true })
      .not('business_name', 'is', null)
      .neq('business_name', '')
      .neq('business_name', 'My Wellness Business');

    if (totalError) {
      console.error('[Social Proof Stats] Error getting total:', totalError);
    }

    // Get breakdown by business type
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('business_profiles')
      .select('business_type')
      .not('business_name', 'is', null)
      .neq('business_name', '')
      .neq('business_name', 'My Wellness Business');

    if (profilesError) {
      console.error('[Social Proof Stats] Error getting profiles:', profilesError);
    }

    // Calculate breakdown counts
    const breakdown = {
      yogaStudios: 0,
      retreatLeaders: 0,
      coaches: 0,
      gyms: 0,
      other: 0,
    };

    if (profiles) {
      profiles.forEach((profile: any) => {
        const type = profile.business_type;
        if (type === 'Yoga Studio') {
          breakdown.yogaStudios++;
        } else if (type === 'Retreat Leader') {
          breakdown.retreatLeaders++;
        } else if (type === 'Online Coaching' || type === 'Personal Trainer') {
          breakdown.coaches++;
        } else if (type === 'Gym / Fitness Studio') {
          breakdown.gyms++;
        } else {
          breakdown.other++;
        }
      });
    }

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentSignups, error: recentError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('password_created_at', sevenDaysAgo);

    if (recentError) {
      console.error('[Social Proof Stats] Error getting recent signups:', recentError);
    }

    // Add BASE_COUNT to all stats for social proof
    const realUsers = totalProtected || 0;
    const realRecentSignups = recentSignups || 0;

    // Calculate boosted "recent signups" (show ~2-3% of total as "this week")
    // This keeps the ratio realistic as you grow
    const boostedTotal = BASE_COUNT + realUsers;
    const boostedRecentSignups = Math.max(
      Math.floor(boostedTotal * 0.025), // 2.5% of total shown as "this week"
      realRecentSignups + 10 // Or at least 10 + real signups
    );

    const stats = {
      totalProtected: boostedTotal, // BASE_COUNT + real users
      breakdown: {
        yogaStudios: BASE_BREAKDOWN.yogaStudios + breakdown.yogaStudios,
        retreatLeaders: BASE_BREAKDOWN.retreatLeaders + breakdown.retreatLeaders,
        coaches: BASE_BREAKDOWN.coaches + breakdown.coaches,
        gyms: BASE_BREAKDOWN.gyms + breakdown.gyms,
        other: BASE_BREAKDOWN.other + breakdown.other,
      },
      recentSignups: boostedRecentSignups,
      lastUpdated: new Date().toISOString(),
      // For debugging: include real counts (not shown to users)
      _debug: {
        realUsers: realUsers,
        realRecentSignups: realRecentSignups,
        baseCount: BASE_COUNT,
      }
    };

    console.log('[Social Proof Stats] Real users:', realUsers);
    console.log('[Social Proof Stats] Boosted total:', boostedTotal);
    console.log('[Social Proof Stats] Stats sent to frontend:', stats);

    // Cache this response for 1 hour (3600 seconds)
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(stats);
  } catch (error: any) {
    console.error("[Social Proof Stats] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to fetch social proof stats",
    });
  }
});

// ================================================================
// Get Booking Information (for pre-booking screen)
// ================================================================
//
// Returns booking statistics for social proof and scarcity
// Shows: bookings this week, average response time, next available
//
app.get("/api/stats/booking-info", async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Configuration error",
        message: "Supabase is not configured.",
      });
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get bookings from this week (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: bookingsThisWeek, error: bookingsError } = await supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('calendly_booked_at', sevenDaysAgo)
      .not('calendly_booked_at', 'is', null);

    if (bookingsError) {
      console.error('[Booking Stats] Error getting bookings:', bookingsError);
    }

    // Calculate average response time (time between contact creation and booking)
    // This is a simplified calculation - you can make it more sophisticated
    const { data: recentBookings, error: responseTimeError } = await supabaseAdmin
      .from('contacts')
      .select('created_at, calendly_booked_at')
      .not('calendly_booked_at', 'is', null)
      .not('created_at', 'is', null)
      .limit(100); // Sample last 100 bookings

    let averageResponseTime = '1 hour'; // Default
    if (!responseTimeError && recentBookings && recentBookings.length > 0) {
      const responseTimes = recentBookings
        .filter(b => b.created_at && b.calendly_booked_at)
        .map(b => {
          const created = new Date(b.created_at).getTime();
          const booked = new Date(b.calendly_booked_at).getTime();
          return booked - created; // milliseconds
        })
        .filter(time => time > 0 && time < 7 * 24 * 60 * 60 * 1000); // Within 7 days

      if (responseTimes.length > 0) {
        const avgMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const avgHours = Math.round(avgMs / (1000 * 60 * 60));
        if (avgHours < 1) {
          const avgMinutes = Math.round(avgMs / (1000 * 60));
          averageResponseTime = `${avgMinutes} minutes`;
        } else if (avgHours < 24) {
          averageResponseTime = `${avgHours} hour${avgHours !== 1 ? 's' : ''}`;
        } else {
          const avgDays = Math.round(avgHours / 24);
          averageResponseTime = `${avgDays} day${avgDays !== 1 ? 's' : ''}`;
        }
      }
    }

    // Calculate next available time (simplified - you can integrate with Calendly API)
    // For now, we'll use a simple heuristic
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2pm tomorrow

    const nextAvailable = tomorrow.getTime() > now.getTime()
      ? `Tomorrow at ${tomorrow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      : 'Today at 2pm';

    // Boost bookings count for social proof (similar to social proof widget)
    const BASE_BOOKINGS = 100; // Base count for social proof
    const realBookings = bookingsThisWeek || 0;
    const boostedBookings = BASE_BOOKINGS + realBookings;

    const stats = {
      bookingsThisWeek: boostedBookings,
      averageResponseTime: averageResponseTime,
      nextAvailable: nextAvailable,
      lastUpdated: new Date().toISOString(),
      // For debugging: include real counts (not shown to users)
      _debug: {
        realBookings: realBookings,
        baseBookings: BASE_BOOKINGS,
      }
    };

    console.log('[Booking Stats] Real bookings this week:', realBookings);
    console.log('[Booking Stats] Boosted bookings:', boostedBookings);
    console.log('[Booking Stats] Stats sent to frontend:', stats);

    // Cache this response for 30 minutes (1800 seconds)
    res.set('Cache-Control', 'public, max-age=1800');
    res.json(stats);
  } catch (error: any) {
    console.error("[Booking Stats] Error:", error);
    // Return default stats if there's an error
    res.json({
      bookingsThisWeek: 127,
      averageResponseTime: '1 hour',
      nextAvailable: 'Tomorrow at 2pm',
      lastUpdated: new Date().toISOString(),
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

    const { name, email, phone, website, source } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: "email and name are required",
      });
    }

    // Normalize phone number to E.164 format
    // Be lenient - if phone validation fails, just use the original value
    // This ensures we don't reject leads due to invalid phone numbers
    let normalizedPhone = phone ? normalizePhone(phone, 'US') : null;

    if (phone && !normalizedPhone) {
      // Log warning but don't reject - use original phone value
      console.warn("[Save Contact] Invalid phone format, using original:", phone);
      normalizedPhone = phone; // Use original value instead of rejecting
    }

    // Normalize website URL
    let normalizedWebsite = website?.trim() || "";
    if (normalizedWebsite && !normalizedWebsite.startsWith("http")) {
      normalizedWebsite = `https://${normalizedWebsite}`;
    }

    const contactData = {
      name,
      email,
      phone: normalizedPhone || "",
      website: normalizedWebsite,
      source: source || "wellness", // Default if not provided
    };

    console.log("[Save Contact] Attempting to save:", contactData);
    const supabaseResult = await supabaseService.saveContact(contactData);
    console.log("[Save Contact] Successfully saved to Supabase:", supabaseResult);

    // Send contact created email immediately (fire and forget - don't block response)
    // Only send if this is a new contact (not a duplicate)
    if (supabaseResult && Array.isArray(supabaseResult) && supabaseResult.length > 0) {
      const contact = supabaseResult[0];
      // Check if this contact was just created (not an existing one)
      // We'll send the email regardless, but the email service will handle gracefully
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      
      // Send email asynchronously (fire and forget)
      (async () => {
        try {
          console.log("[Save Contact] Sending contact created email to:", email);
          
          // Generate magic link using Supabase admin API
          if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.RESEND_API_KEY) {
            const supabaseAdmin = createClient(
              process.env.SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            const redirectUrl = `${process.env.DASHBOARD_URL || 'https://free.consciouscounsel.ca'}/wellness/dashboard`;
            
            let magicLinkUrl = redirectUrl; // Default fallback
            try {
              const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: email.trim(),
                options: {
                  redirectTo: redirectUrl,
                },
              });

              if (!linkError && linkData?.properties?.action_link) {
                magicLinkUrl = linkData.properties.action_link;
                console.log("[Save Contact] Magic link generated successfully");
              } else {
                console.warn("[Save Contact] Magic link generation failed, using dashboard URL:", linkError?.message);
              }
            } catch (linkErr: any) {
              console.warn("[Save Contact] Error generating magic link, using dashboard URL:", linkErr.message);
            }

            // Send email via email service
            await emailService.sendContactCreatedEmail(
              email.trim(),
              firstName,
              magicLinkUrl
            );
            
            console.log("[Save Contact] ✅ Contact created email sent successfully");
          } else {
            console.warn("[Save Contact] ⚠️ Missing required env vars for email (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or RESEND_API_KEY)");
          }
        } catch (emailError: any) {
          console.error("[Save Contact] ❌ Error sending contact created email:", emailError);
          // Don't throw - we don't want to break the contact save
        }
      })();
    }

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
        phone: normalizedPhone || "",
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
          phone: normalizedPhone || "",
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

                        // Uppercase to match UI columns explicitly
                        EMAIL_SUBJECT: workflowResult.email.subject,
                        EMAIL_BODY_HTML: workflowResult.email.body,
                        EMAIL_BODY: cleanEmailBody
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

// Update Calendly booking status for a contact and user
app.post("/api/contacts/update-calendly-booking", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    // Use service role key to bypass RLS (allows updating by email even if user_id not set yet)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      serviceKey || ""
    );

    const bookingTimestamp = new Date().toISOString();
    const results: any = {
      contact: null,
      user: null,
    };

    // Update contact record
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .update({
        calendly_booked_at: bookingTimestamp,
        updated_at: bookingTimestamp
      })
      .eq("email", email.trim().toLowerCase())
      .select();

    if (contactError) {
      console.error("[Update Calendly Booking] Contact update error:", contactError);
    } else if (contactData && contactData.length > 0) {
      results.contact = contactData[0];
      console.log(`[Update Calendly Booking] ✅ Updated contact ${email} with Calendly booking timestamp`);
    } else {
      console.warn(`[Update Calendly Booking] No contact found with email: ${email}`);
    }

    // Also update users table if user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .update({
        calendly_booked_at: bookingTimestamp,
        updated_at: bookingTimestamp
      })
      .eq("email", email.trim().toLowerCase())
      .select();

    if (userError) {
      console.error("[Update Calendly Booking] User update error:", userError);
    } else if (userData && userData.length > 0) {
      results.user = userData[0];
      console.log(`[Update Calendly Booking] ✅ Updated user ${email} with Calendly booking timestamp`);
    } else {
      console.log(`[Update Calendly Booking] No user found with email: ${email} (user may not have created password yet)`);
    }

    // Return success if at least one record was updated
    if (results.contact || results.user) {
      return res.json({
        success: true,
        message: "Calendly booking status updated",
        data: results,
      });
    } else {
      // Neither contact nor user found
      return res.status(404).json({
        error: "Contact or user not found",
        message: `No contact or user found with email: ${email}`,
      });
    }
  } catch (error: any) {
    console.error("[Update Calendly Booking] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to update Calendly booking status",
    });
  }
});

// Calendly webhook endpoint
app.post("/api/webhooks/calendly", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log("[Calendly Webhook] Received webhook event");

    // Get the raw body for signature verification
    const rawBody = req.body.toString('utf8');
    const signature = req.headers['calendly-webhook-signature'] as string;

    // Verify webhook signature if signing key is configured
    if (process.env.CALENDLY_WEBHOOK_SIGNING_KEY && signature) {
      const isValid = calendlyService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error("[Calendly Webhook] ❌ Invalid webhook signature");
        return res.status(401).json({
          error: "Invalid webhook signature"
        });
      }
      console.log("[Calendly Webhook] ✅ Webhook signature verified");
    }

    // Parse the JSON payload
    const event = JSON.parse(rawBody);

    // Process the webhook event
    const result = await calendlyService.processWebhookEvent(event);

    if (result.success) {
      console.log(`[Calendly Webhook] ✅ ${result.message}`);
      return res.status(200).json(result);
    } else {
      console.error(`[Calendly Webhook] ❌ ${result.message}`);
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("[Calendly Webhook] ❌ Error processing webhook:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to process webhook"
    });
  }
});

// Get appointments for a specific email
app.get("/api/appointments/:email", async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const appointments = await calendlyService.getAppointmentsByEmail(email);

    return res.json({
      success: true,
      data: appointments
    });
  } catch (error: any) {
    console.error("[Get Appointments] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to fetch appointments"
    });
  }
});

// Get upcoming appointments
app.get("/api/appointments/upcoming", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const appointments = await calendlyService.getUpcomingAppointments(limit);

    return res.json({
      success: true,
      data: appointments
    });
  } catch (error: any) {
    console.error("[Get Upcoming Appointments] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to fetch upcoming appointments"
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
// Trademark Risk Report API Endpoint
// ============================================

// Helper functions for trademark lead magnet flow
function getRiskIcon(riskLevel: string): string {
  if (riskLevel === 'HIGH') return '⚠️';
  if (riskLevel === 'MODERATE') return '⚡';
  return '✅';
}

function getUrgencyMessage(riskLevel: string): string {
  if (riskLevel === 'HIGH') return 'Immediate action recommended';
  if (riskLevel === 'MODERATE') return 'Protection advised before expansion';
  return 'Consider protection as you grow';
}

function generateVerdictFromUSPTO(usptoResults: any, businessName: string): string {
  const { riskLevel, totalResults, recommendation } = usptoResults;

  if (riskLevel === 'HIGH') {
    return `We found ${totalResults} registered trademark(s) that could conflict with "${businessName}". ${recommendation} Using this name without clearance could lead to legal challenges, cease and desist letters, and costly rebranding down the line. It's critical to address these conflicts before investing heavily in branding or expansion.`;
  } else if (riskLevel === 'MODERATE') {
    return `Our USPTO database search found ${totalResults} similar trademark(s) that warrant attention. ${recommendation} While these may not be exact matches, they could create marketplace confusion as you grow your business. We recommend a comprehensive trademark search and consultation to assess your specific risk level and protection options.`;
  } else {
    return `Good news! Our initial USPTO database search found no exact matches for "${businessName}". ${recommendation || 'This is a positive first step.'} However, this is a preliminary automated scan and doesn't guarantee availability. Before making significant branding investments, we recommend a comprehensive search covering state registrations, common law usage, and domain availability.`;
  }
}

function formatConflictsForPDF(topConflicts: any[]): string {
  if (!topConflicts || topConflicts.length === 0) {
    return `
      <div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 8px; margin: 15px 0;">
        <p style="color: #16a34a; font-size: 11pt; font-weight: bold;">No exact trademark matches found in our USPTO database search.</p>
        <p style="color: #374151; font-size: 10pt; margin-top: 8px;">This is a good sign! However, a comprehensive search is still recommended.</p>
      </div>
    `;
  }

  const conflictsList = topConflicts.map(conflict => `
    <div class="conflict-item">
      <div class="conflict-mark">${conflict.markText || 'N/A'}</div>
      <div class="conflict-owner">Owner: ${conflict.owner || 'Unknown'}</div>
      <div class="conflict-status ${conflict.statusClass || 'status-live'}">${conflict.status || 'LIVE'}</div>
    </div>
  `).join('');

  return `
    <div class="conflicts-list">
      <h4 style="font-size: 12pt; margin-bottom: 12px; color: #1a1a1a;">Top Conflicting Trademarks:</h4>
      ${conflictsList}
      ${topConflicts.length >= 5 ? '<p style="font-size: 9pt; color: #666; margin-top: 10px; font-style: italic;">Note: Additional conflicts may exist. Full list available in comprehensive search.</p>' : ''}
    </div>
  `;
}

// USPTO Trademark Search Endpoint
app.post("/api/trademarks/uspto-search", async (req, res) => {
  try {
    const { businessName } = req.body;

    if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
      return res.status(400).json({ error: "Business name is required" });
    }

    console.log(`[USPTO] Searching trademarks for: "${businessName}"`);

    // Perform USPTO trademark search
    const searchResults = await usptoService.searchTrademarks(businessName.trim());

    console.log(`[USPTO] Search complete. Found: ${searchResults.totalResults} results`);
    console.log(`[USPTO] Risk level: ${searchResults.riskLevel}`);

    // Return the search results
    return res.json(searchResults);
  } catch (error: any) {
    console.error('[USPTO] Error in trademark search:', error);
    return res.status(500).json({
      error: 'Failed to search USPTO database',
      message: error.message
    });
  }
});

// Trademark Risk Report Request Endpoint (Lead Magnet Flow - Simplified)
app.post("/api/trademarks/request", async (req, res) => {
  try {
    const { user_id, businessName, email, name, usptoResults } = req.body;

    // Validation
    if (!businessName || !email) {
      return res.status(400).json({ error: "Missing required fields: businessName, email" });
    }

    if (!usptoResults) {
      return res.status(400).json({ error: "USPTO search results required" });
    }

    console.log(`[Trademark] Lead magnet request for: ${businessName} (${email})`);
    console.log(`[Trademark] USPTO results:`, usptoResults ? `${usptoResults.totalResults} conflicts found, risk: ${usptoResults.riskLevel}` : 'NOT PROVIDED');

    // Calculate risk score from USPTO results (simplified - no quiz needed)
    const riskLevel = usptoResults.riskLevel;
    const riskScore = Math.min(40, usptoResults.totalResults * 2); // Simple scoring: 2 points per conflict, max 40

    // Generate verdict from USPTO data
    const verdict = generateVerdictFromUSPTO(usptoResults, businessName);

    // Prepare top conflicts for PDF (top 5)
    const topConflicts = (usptoResults.trademarks || []).slice(0, 5).map((tm: any) => ({
      markText: tm.markText,
      owner: tm.owner,
      status: tm.liveOrDead || 'LIVE',
      statusClass: (tm.liveOrDead === 'LIVE') ? 'status-live' : 'status-dead'
    }));

    // 1. Generate PDF Report using NEW LEAD MAGNET TEMPLATE
    let pdfBuffer: Buffer | undefined;
    try {
      const pdfData = {
        businessName: businessName,
        riskLevel: riskLevel,
        riskClass: riskLevel.toLowerCase(),
        riskIcon: getRiskIcon(riskLevel),
        urgencyMessage: getUrgencyMessage(riskLevel),
        totalConflicts: usptoResults.totalResults,
        conflictsSection: formatConflictsForPDF(topConflicts),
        verdict: verdict,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        year: new Date().getFullYear()
      };

      pdfBuffer = await documentGenerationService.generateDocument(
        'trademark_risk_report_lead_magnet',  // NEW TEMPLATE
        pdfData
      );
      console.log('[Trademark] Lead magnet PDF generated successfully, size:', pdfBuffer.length);
    } catch (pdfError: any) {
      console.error('[Trademark] Error generating PDF:', pdfError);
      // Continue without PDF - email will still be sent
    }

    // 2. Insert into Supabase trademark_requests (simplified)
    let dbSaveSuccess = false;
    let dbError: any = null;

    if (user_id) {
      console.log('[Trademark] Saving lead to database with user_id:', user_id);

      try {
        const insertData: any = {
          user_id: user_id,
          business_name: businessName,
          quiz_score: riskScore,
          risk_level: riskLevel,
          status: 'completed',
          email_sent_at: new Date().toISOString(),
          uspto_total_conflicts: usptoResults.totalResults,
          uspto_risk_level: usptoResults.riskLevel
        };

        console.log('[Trademark] Insert data keys:', Object.keys(insertData));

        const { data, error: insertError } = await supabaseService.client
          .from('trademark_requests')
          .insert(insertData)
          .select();

        dbError = insertError;

        if (dbError) {
          console.error('[Trademark] ❌ Database insert error:', dbError);
          console.error('[Trademark] Error message:', dbError.message);
          dbSaveSuccess = false;
          // Log but don't fail the request - email was still sent
        } else {
          console.log('[Trademark] ✅ Successfully saved lead to database');
          console.log('[Trademark] Record ID:', data?.[0]?.id);
          dbSaveSuccess = true;

          // Log event: trademark_risk_report_sent (if legal_timeline table exists)
          try {
            const { error: eventError } = await supabaseService.client
              .from('legal_timeline')
              .insert({
                user_id: user_id,
                event_type: 'trademark_risk_report_sent',
                event_data: {
                  business_name: businessName,
                  risk_level: riskLevel,
                  score: riskScore,
                  total_conflicts: usptoResults.totalResults
                },
                created_at: new Date().toISOString()
              });
            if (eventError) {
              console.warn('[Trademark] Could not log event (table may not exist):', eventError.message);
            } else {
              console.log('[Trademark] Event logged: trademark_risk_report_sent');
            }
          } catch (eventError: any) {
            console.warn('[Trademark] Error logging event (non-critical):', eventError?.message || eventError);
          }
        }
      } catch (dbErr: any) {
        console.error('[Trademark] Database operation failed:', dbErr);
        console.error('[Trademark] Error stack:', dbErr?.stack);
      }
    } else {
      console.warn('[Trademark] ⚠️ No user_id provided, skipping DB save');
      dbSaveSuccess = false;
      dbError = { message: 'No user_id provided in request' };
    }

    // 3. Send Risk Report Email with PDF attachment
    await emailService.sendTrademarkRiskReport(
      email,
      name || 'there',
      businessName,
      riskLevel,
      riskScore,
      pdfBuffer
    );

    // 4. Send Admin Alert
    await emailService.sendAdminTrademarkAlert(email, businessName, riskLevel, riskScore);

    // 5. Add "completed IP scan" tag to GoHighLevel
    try {
      console.log(`[Trademark] Adding 'completed IP scan' tag to GoHighLevel for ${email}...`);
      // Lookup contact first
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

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        const contactId = lookupData.contacts?.[0]?.id || lookupData.contact?.id;

        if (contactId) {
          const existingTags = lookupData.contacts?.[0]?.tags || lookupData.contact?.tags || [];
          const newTag = "completed IP scan";

          if (!existingTags.includes(newTag)) {
            const updatedTags = [...existingTags, newTag];

            await fetch(
              `https://services.leadconnectorhq.com/contacts/${contactId}`,
              {
                method: "PUT",
                headers: {
                  Authorization: "Bearer pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb",
                  Version: "2021-07-28",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ tags: updatedTags }),
              }
            );
            console.log(`[Trademark] ✅ Added 'completed IP scan' tag to contact ${contactId}`);
          } else {
            console.log(`[Trademark] Contact already has 'completed IP scan' tag`);
          }
        }
      } else {
        console.warn(`[Trademark] GHL Contact lookup failed for ${email}, cannot add tag.`);
      }
    } catch (ghlError) {
      console.error(`[Trademark] Error adding GHL tag:`, ghlError);
    }

    return res.json({
      success: true,
      message: "Risk report sent to your email",
      riskLevel: riskLevel,
      riskScore: riskScore,
      totalConflicts: usptoResults.totalResults,
      dbSaved: dbSaveSuccess
    });
  } catch (error: any) {
    console.error('[Trademark] Error processing request:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Direct PDF Download endpoint (Lead Magnet - simplified)
app.post("/api/trademarks/download-report", async (req, res) => {
  try {
    const { businessName, usptoResults } = req.body;

    if (!businessName || !usptoResults) {
      return res.status(400).json({ error: "Missing required fields: businessName, usptoResults" });
    }

    console.log(`[Trademark Download] Generating PDF for: ${businessName}`);

    const riskLevel = usptoResults.riskLevel;
    const verdict = generateVerdictFromUSPTO(usptoResults, businessName);
    const topConflicts = (usptoResults.trademarks || []).slice(0, 5).map((tm: any) => ({
      markText: tm.markText,
      owner: tm.owner,
      status: tm.liveOrDead || 'LIVE',
      statusClass: (tm.liveOrDead === 'LIVE') ? 'status-live' : 'status-dead'
    }));

    const pdfData = {
      businessName: businessName,
      riskLevel: riskLevel,
      riskClass: riskLevel.toLowerCase(),
      riskIcon: getRiskIcon(riskLevel),
      urgencyMessage: getUrgencyMessage(riskLevel),
      totalConflicts: usptoResults.totalResults,
      conflictsSection: formatConflictsForPDF(topConflicts),
      verdict: verdict,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      year: new Date().getFullYear()
    };

    const pdfBuffer = await documentGenerationService.generateDocument(
      'trademark_risk_report_lead_magnet',
      pdfData
    );

    console.log('[Trademark Download] PDF generated successfully, size:', pdfBuffer.length);

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Trademark-Risk-Report-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[Trademark Download] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Download PDF endpoint - regenerates PDF on demand
app.post("/api/trademarks/download-pdf", async (req, res) => {
  try {
    const { user_id, businessName, score, riskLevel, answers, answerDetails } = req.body;

    if (!businessName || !user_id) {
      return res.status(400).json({ error: "Missing required fields: businessName, user_id" });
    }

    console.log(`[Trademark PDF Download] Generating PDF for: ${businessName} (user: ${user_id})`);

    // Generate risk factors based on quiz answers
    const riskFactors = generateRiskFactors(answers, score, riskLevel);

    // Extract answer details for PDF (use provided answerDetails if available, otherwise extract from answers)
    const extractedDetails = answerDetails ? extractAnswerDetailsFromDetails(answerDetails) : extractAnswerDetails(answers);

    // Generate verdict text based on risk level
    const verdict = generateVerdict(riskLevel, score);

    // Generate translation text
    const translationText = generateTranslationText(riskLevel, score);

    // Generate PDF Report
    const reportData = {
      businessName: businessName,
      businessType: 'Wellness Business',
      riskLevel: riskLevel || 'MODERATE RISK',
      score: score || 0,
      riskFactor1: riskFactors[0] || 'No federal trademark registration',
      riskFactor2: riskFactors[1] || 'Similar name search not fully completed',
      riskFactor3: riskFactors[2] || 'Expansion beyond current location planned',
      riskFactor4: riskFactors[3] || 'Domain availability uncertain',
      email: '', // Not needed for download
      // New fields for improved PDF
      verdict: verdict,
      trademarkRegistered: extractedDetails.trademarkRegistered,
      trademarkRegisteredIcon: extractedDetails.trademarkRegisteredIcon,
      expansionPlanned: extractedDetails.expansionPlanned,
      expansionPlannedIcon: extractedDetails.expansionPlannedIcon,
      similarNameSearch: extractedDetails.similarNameSearch,
      similarNameSearchIcon: extractedDetails.similarNameSearchIcon,
      domainOwnership: extractedDetails.domainOwnership,
      translationText: translationText,
      // New question answers
      brandNameOrigin: extractedDetails.brandNameOrigin || 'Not specified',
      includesLocation: extractedDetails.includesLocation || 'No',
      brandUsageDuration: extractedDetails.brandUsageDuration || 'Not specified',
      brandUsageLocations: extractedDetails.brandUsageLocations || 'Not specified',
      expansionPlans: extractedDetails.expansionPlans || 'Not specified',
      brandingInvestments: extractedDetails.brandingInvestments || 'Not specified',
      receivedConfusion: extractedDetails.receivedConfusion || 'No',
      differentFromLegalName: extractedDetails.differentFromLegalName || 'Not sure',
      workedWithLawyer: extractedDetails.workedWithLawyer || 'No',
    };

    const pdfBuffer = await documentGenerationService.generateDocument(
      'trademark_risk_report',
      reportData
    );

    console.log('[Trademark PDF Download] PDF generated successfully, size:', pdfBuffer.length);

    // Set headers for PDF download
    const filename = `Trademark-Risk-Report-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    // Send PDF
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[Trademark PDF Download] Error generating PDF:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Helper function to generate risk factors based on quiz answers
function generateRiskFactors(answers: number[] | undefined, score: number, riskLevel: string): string[] {
  const factors: string[] = [];

  if (!answers || answers.length === 0) {
    // Default factors based on score (updated for max score of 40)
    if (score >= 25) {
      factors.push('No federal trademark registration');
      factors.push('Similar name search not fully completed');
      factors.push('Expansion beyond current location planned');
      factors.push('Domain availability uncertain');
    } else if (score >= 12) {
      factors.push('No federal trademark registration');
      factors.push('Similar name search not fully completed');
      factors.push('Some protection gaps identified');
    } else {
      factors.push('Basic protection in place');
      factors.push('Consider comprehensive search for expansion');
    }
    return factors;
  }

  // Generate factors based on actual answers - use specific, non-duplicate factors
  // Answer 1: Trademark registration (index 0)
  if (answers[0] >= 5) {
    factors.push('No federal trademark registration on file');
  }

  // Answer 2: Similar name check (index 1)
  if (answers[1] === 5) {
    factors.push('No similar name search completed');
  } else if (answers[1] === 3) {
    factors.push('Partial clearance search completed');
  }

  // Answer 3: Domain ownership (index 2)
  if (answers[2] === 3) {
    factors.push('Domain not owned by business');
  } else if (answers[2] === 2) {
    factors.push('Domain ownership status unclear');
  }

  // Answer 4: Expansion plans (index 3)
  if (answers[3] === 3) {
    factors.push('Planned expansion beyond current location');
  } else if (answers[3] === 1) {
    factors.push('Potential future expansion considered');
  }

  // Fill remaining slots with specific factors if needed
  if (factors.length < 4) {
    const additionalFactors = [
      'Brand protection strategy needs development',
      'Legal consultation recommended before major investment',
      'Trademark monitoring not established',
      'Comprehensive search not yet conducted'
    ];

    for (let i = factors.length; i < 4; i++) {
      factors.push(additionalFactors[i - factors.length] || 'Additional protection recommended');
    }
  }

  return factors.slice(0, 4); // Ensure exactly 4 factors
}

// Helper function to extract answer details from quiz answers
function extractAnswerDetails(answers: number[] | undefined): any {
  // Question 1: Trademark registration (score 0 = yes, 5 = no)
  const q1Score = answers?.[0] ?? 5;
  const trademarkRegistered = q1Score === 0 ? 'Yes' : 'No';
  const trademarkRegisteredIcon = q1Score === 0 ? '✅' : '❌';

  // Question 2: Similar name search (score 0 = full search, 3 = partial, 5 = none)
  const q2Score = answers?.[1] ?? 5;
  let similarNameSearch = 'No';
  let similarNameSearchIcon = '❌';
  if (q2Score === 0) {
    similarNameSearch = 'Yes';
    similarNameSearchIcon = '✅';
  } else if (q2Score === 3) {
    similarNameSearch = 'Partial';
    similarNameSearchIcon = '⚠️';
  }

  // Question 3: Domain ownership (score 0 = yes, 2 = unchecked, 3 = no)
  const q3Score = answers?.[2] ?? 2;
  let domainOwnership = 'Unchecked';
  if (q3Score === 0) {
    domainOwnership = 'Yes';
  } else if (q3Score === 3) {
    domainOwnership = 'No';
  }

  // Question 4: Expansion plans (score 0 = no, 1 = maybe, 3 = yes)
  const q4Score = answers?.[3] ?? 0;
  let expansionPlanned = 'No';
  let expansionPlannedIcon = '❌';
  if (q4Score === 3) {
    expansionPlanned = 'Yes';
    expansionPlannedIcon = '✅';
  } else if (q4Score === 1) {
    expansionPlanned = 'Maybe';
    expansionPlannedIcon = '⚠️';
  }

  return {
    trademarkRegistered,
    trademarkRegisteredIcon,
    expansionPlanned,
    expansionPlannedIcon,
    similarNameSearch,
    similarNameSearchIcon,
    domainOwnership,
  };
}

// Helper function to extract answer details from answerDetails array (more accurate)
function extractAnswerDetailsFromDetails(answerDetails: Array<{ questionId: number, answerText: string | string[], score: number }>): any {
  const result: any = {};

  // Find answers by question ID
  const getAnswer = (questionId: number) => {
    return answerDetails.find(a => a.questionId === questionId);
  };

  // Question 1: Trademark registration
  const q1 = getAnswer(1);
  if (q1) {
    const answer = typeof q1.answerText === 'string' ? q1.answerText : q1.answerText[0];
    result.trademarkRegistered = answer.includes('Yes, I have a registration') ? 'Yes' : 'No';
    result.trademarkRegisteredIcon = answer.includes('Yes, I have a registration') ? '✅' : '❌';
  }

  // Question 2: Similar name search
  const q2 = getAnswer(2);
  if (q2) {
    const answer = typeof q2.answerText === 'string' ? q2.answerText : q2.answerText[0];
    if (answer.includes('full federal search')) {
      result.similarNameSearch = 'Yes';
      result.similarNameSearchIcon = '✅';
    } else if (answer.includes('googled')) {
      result.similarNameSearch = 'Partial';
      result.similarNameSearchIcon = '⚠️';
    } else {
      result.similarNameSearch = 'No';
      result.similarNameSearchIcon = '❌';
    }
  }

  // Question 3: Domain ownership
  const q3 = getAnswer(3);
  if (q3) {
    const answer = typeof q3.answerText === 'string' ? q3.answerText : q3.answerText[0];
    if (answer.includes('Yes, I own it')) {
      result.domainOwnership = 'Yes';
    } else if (answer.includes('someone else owns it')) {
      result.domainOwnership = 'No';
    } else {
      result.domainOwnership = 'Unchecked';
    }
  }

  // Question 4: Expansion plans (old question)
  const q4 = getAnswer(4);
  if (q4) {
    const answer = typeof q4.answerText === 'string' ? q4.answerText : q4.answerText[0];
    if (answer.includes('Yes, definitely')) {
      result.expansionPlanned = 'Yes';
      result.expansionPlannedIcon = '✅';
    } else if (answer.includes('Maybe')) {
      result.expansionPlanned = 'Maybe';
      result.expansionPlannedIcon = '⚠️';
    } else {
      result.expansionPlanned = 'No';
      result.expansionPlannedIcon = '❌';
    }
  }

  // Question 5: Brand name origin
  const q5 = getAnswer(5);
  if (q5) {
    result.brandNameOrigin = typeof q5.answerText === 'string' ? q5.answerText : q5.answerText[0];
  }

  // Question 6: Includes location
  const q6 = getAnswer(6);
  if (q6) {
    result.includesLocation = typeof q6.answerText === 'string' ? q6.answerText : q6.answerText[0];
  }

  // Question 7: Usage duration
  const q7 = getAnswer(7);
  if (q7) {
    result.brandUsageDuration = typeof q7.answerText === 'string' ? q7.answerText : q7.answerText[0];
  }

  // Question 8: Brand usage locations (multi-select)
  const q8 = getAnswer(8);
  if (q8) {
    result.brandUsageLocations = Array.isArray(q8.answerText)
      ? q8.answerText.join(', ')
      : q8.answerText;
  }

  // Question 9: Expansion plans (new question)
  const q9 = getAnswer(9);
  if (q9) {
    result.expansionPlans = typeof q9.answerText === 'string' ? q9.answerText : q9.answerText[0];
  }

  // Question 10: Branding investments (multi-select)
  const q10 = getAnswer(10);
  if (q10) {
    result.brandingInvestments = Array.isArray(q10.answerText)
      ? q10.answerText.join(', ')
      : q10.answerText;
  }

  // Question 11: Received confusion
  const q11 = getAnswer(11);
  if (q11) {
    result.receivedConfusion = typeof q11.answerText === 'string' ? q11.answerText : q11.answerText[0];
  }

  // Question 12: Different from legal name
  const q12 = getAnswer(12);
  if (q12) {
    result.differentFromLegalName = typeof q12.answerText === 'string' ? q12.answerText : q12.answerText[0];
  }

  // Question 13: Worked with lawyer (optional)
  const q13 = getAnswer(13);
  if (q13) {
    result.workedWithLawyer = typeof q13.answerText === 'string' ? q13.answerText : q13.answerText[0];
  }

  // Merge with defaults from extractAnswerDetails if missing
  const defaults = extractAnswerDetails(undefined);
  return { ...defaults, ...result };
}

// Helper function to generate verdict text based on risk level
function generateVerdict(riskLevel: string, score: number): string {
  if (riskLevel.includes('HIGH')) {
    return `Based on your responses, your brand shows high trademark risk. Immediate action is recommended before investing further in branding or expansion to avoid potential conflicts and forced rebranding.`;
  } else if (riskLevel.includes('MODERATE')) {
    return `Based on your responses, your brand shows moderate trademark risk. Additional protection is recommended before expansion or major brand investment to minimize potential conflicts.`;
  } else {
    return `Based on your responses, your brand shows low immediate trademark risk, but additional protection is recommended before expansion or major brand investment.`;
  }
}

// Helper function to generate translation text
function generateTranslationText(riskLevel: string, score: number): string {
  if (riskLevel.includes('HIGH')) {
    return `These factors indicate a higher likelihood of trademark conflicts. Immediate action is recommended to protect your brand and avoid costly rebranding.`;
  } else if (riskLevel.includes('MODERATE')) {
    return `These factors don't indicate a current conflict, but they increase exposure as your brand grows. Proactive protection is advised.`;
  } else {
    return `These factors don't indicate a current conflict, but they increase exposure as your brand grows. Monitoring and additional protection are recommended.`;
  }
}

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

// Generate HTML version of document (for copy-as-text feature)
app.post("/api/documents/generate-html", async (req, res) => {
  try {
    const { templateName, userId } = req.body;

    if (!templateName) {
      return res.status(400).json({
        error: "templateName is required",
      });
    }

    console.log(`[API] Generating HTML for: ${templateName} for user: ${userId || 'anonymous'}`);

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

    // Generate the HTML
    const html = await documentGenerationService.generateHtmlOnly(
      templateName,
      profileData
    );

    // Set response headers for HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error: any) {
    console.error("[API] Error generating HTML:", error);
    console.error("[API] Error stack:", error.stack);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to generate HTML",
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

// ============================================
// Admin Impersonation API Endpoint
// ============================================

// Admin login as user endpoint
app.post("/api/admin/impersonate-user", async (req, res) => {
  try {
    const { adminToken, targetUserId } = req.body;

    if (!adminToken || !targetUserId) {
      return res.status(400).json({
        error: "adminToken and targetUserId are required",
      });
    }

    // Verify admin token and get admin user
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    // Use service role to verify the token and get user info
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the admin token by calling Supabase's auth API
    // We'll use fetch to call the /auth/v1/user endpoint with the token
    try {
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'apikey': anonKey,
        },
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        console.error('[Admin Impersonate] Token verification failed:', userResponse.status, errorData);
        return res.status(401).json({
          error: "Invalid admin token",
          details: errorData.message || `HTTP ${userResponse.status}`,
        });
      }

      const adminUserData = await userResponse.json();

      if (!adminUserData || !adminUserData.id) {
        return res.status(401).json({
          error: "Invalid admin token",
          details: "User data not found in token",
        });
      }

      // Check if user is admin using service role (bypasses RLS)
      const { data: adminData, error: adminCheckError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('user_id', adminUserData.id)
        .single();

      if (adminCheckError || adminData?.role !== 'admin') {
        console.error('[Admin Impersonate] Admin check error:', adminCheckError);
        return res.status(403).json({
          error: "Only admins can impersonate users",
          details: adminCheckError?.message || "User is not an admin",
        });
      }

      // Admin verified, continue with impersonation
    } catch (error: any) {
      console.error('[Admin Impersonate] Token verification error:', error);
      return res.status(401).json({
        error: "Invalid admin token",
        details: error.message || "Token verification failed",
      });
    }

    // Get the target user's auth record
    const { data: targetUser, error: targetError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

    if (targetError || !targetUser) {
      return res.status(404).json({
        error: "Target user not found",
      });
    }

    // Generate a magic link that can be used to sign in
    // We'll generate a link and extract the token from it
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email || '',
    });

    if (linkError || !linkData) {
      console.error('[Admin Impersonate] Error generating link:', linkError);
      return res.status(500).json({
        error: "Failed to generate session link",
        message: linkError?.message || "Unknown error",
      });
    }

    // Extract the token from the magic link
    // Supabase's generateLink returns properties with hashed_token and action_link
    const actionLink = linkData.properties.action_link;
    const hashedToken = linkData.properties.hashed_token;

    console.log('[Admin Impersonate] Generated link data:', {
      hasActionLink: !!actionLink,
      hasHashedToken: !!hashedToken,
      properties: Object.keys(linkData.properties || {}),
    });

    // First, try to get token_hash from properties (this is the most reliable)
    let tokenHash: string | null = hashedToken || null;
    let token: string | null = null;
    let type: string = 'magiclink';

    // Try to extract token from the action_link URL
    if (actionLink) {
      try {
        const linkUrl = new URL(actionLink);

        // Try query params first
        token = linkUrl.searchParams.get('token');
        const urlTokenHash = linkUrl.searchParams.get('token_hash');
        const urlType = linkUrl.searchParams.get('type');

        if (urlTokenHash) tokenHash = urlTokenHash;
        if (urlType) type = urlType;

        // If not in query params, try hash fragment
        if (!token && linkUrl.hash) {
          const hashParams = new URLSearchParams(linkUrl.hash.substring(1));
          token = hashParams.get('access_token') || hashParams.get('token');
          const hashTokenHash = hashParams.get('token_hash');
          const hashType = hashParams.get('type');

          if (hashTokenHash) tokenHash = hashTokenHash;
          if (hashType) type = hashType;
        }

        // If we still don't have a token, try to extract from the full URL string
        if (!token) {
          const tokenMatch = actionLink.match(/[#&?]token=([^&#]+)/) || actionLink.match(/[#&?]access_token=([^&#]+)/);
          if (tokenMatch) {
            token = decodeURIComponent(tokenMatch[1]);
          }
        }
      } catch (urlError: any) {
        console.error('[Admin Impersonate] URL parsing error:', urlError);
        // Continue - we'll use the action link directly if parsing fails
      }
    }

    // If we have tokenHash but no token, or if we have the action link, use direct link approach
    if (!tokenHash || (!token && !actionLink)) {
      console.error('[Admin Impersonate] Missing required data:', {
        hasToken: !!token,
        hasTokenHash: !!tokenHash,
        hasActionLink: !!actionLink,
        properties: linkData.properties,
      });

      // Fallback: return the full action link and let the frontend handle it
      if (actionLink) {
        return res.json({
          success: true,
          data: {
            userId: targetUserId,
            email: targetUser.user.email,
            actionLink: actionLink,
            useDirectLink: true,
          },
        });
      }

      return res.status(500).json({
        error: "Failed to extract token from magic link",
        details: "No token hash or action link available",
      });
    }

    // Return the token and hash so the client can use it to sign in
    res.json({
      success: true,
      data: {
        userId: targetUserId,
        email: targetUser.user.email,
        token: token,
        tokenHash: tokenHash,
        type: type || 'magiclink',
      },
    });
  } catch (error: any) {
    console.error("[Admin Impersonate] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to impersonate user",
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

