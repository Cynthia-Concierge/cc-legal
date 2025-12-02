/**
 * Firebase Functions Entry Point
 * 
 * This integrates the Express server routes into Firebase Functions.
 * 
 * Environment Variables Setup:
 * - For production: Use Firebase Secrets (recommended)
 *   firebase functions:secrets:set FIRECRAWL_API_KEY
 *   firebase functions:secrets:set OPENAI_API_KEY
 *   (secrets automatically become environment variables)
 * 
 * - For local dev: Use .env file or firebase emulators with --env-file flag
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Environment variables are automatically available from:
// 1. Firebase Secrets (production) - set via firebase functions:secrets:set
// 2. .env file (local development) - loaded by Firebase emulators
// 3. process.env (any other source)
// No need to manually load them - Firebase handles this automatically

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "API is running on Firebase Functions",
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check environment variables (remove in production)
app.get("/debug/env", (req, res) => {
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    supabaseUrlPrefix: process.env.SUPABASE_URL?.substring(0, 30) || "not set",
    usingKeyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : (process.env.SUPABASE_ANON_KEY ? "anon" : "none"),
  });
});

// Lazy initialization of services and routes
let routesInitialized = false;
let initPromise: Promise<void> | null = null;

async function initializeRoutes() {
  if (routesInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Import services - files are copied to lib/server/services during build
      // In Firebase Functions, __dirname points to /workspace/lib
      const path = require("path");
      const servicesPath = path.join(__dirname, "server", "services");
      // Use require() for CommonJS modules
      const { SupabaseService } = require(path.join(servicesPath, "supabaseService.js"));
      const { WorkflowResultsService } = require(path.join(servicesPath, "workflowResultsService.js"));
      const { ColdLeadsService } = require(path.join(servicesPath, "coldLeadsService.js"));
      const { EmailGenerationWorkflow } = require(path.join(servicesPath, "emailGenerationWorkflow.js"));
      const { ConfigService } = require(path.join(servicesPath, "configService.js"));

      // Initialize services (only the ones we actually use in routes)
      // Get Supabase config from secrets (env vars) or legacy config
      const supabaseUrl = process.env.SUPABASE_URL || functions.config().supabase?.url || "";
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || functions.config().supabase?.service_role_key || "";
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || functions.config().supabase?.anon_key || "";
      
      // Use service_role key if available (bypasses RLS), otherwise use anon key
      const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
      
      console.log("[Firebase Functions] Supabase config:", {
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!supabaseServiceRoleKey,
        hasAnonKey: !!supabaseAnonKey,
        usingKeyType: supabaseServiceRoleKey ? "service_role" : (supabaseAnonKey ? "anon" : "none"),
      });
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error(`Missing Supabase configuration. URL: ${!!supabaseUrl}, Key: ${!!supabaseKey}`);
      }
      
      const supabaseService = new SupabaseService(supabaseUrl, supabaseKey);
      // Use service_role key for workflowResultsService to bypass RLS
      const workflowResultsKey = supabaseServiceRoleKey || supabaseAnonKey || "";
      const workflowResultsService = new WorkflowResultsService(
        process.env.SUPABASE_URL || "",
        workflowResultsKey
      );
      const configService = new ConfigService(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_ANON_KEY || ""
      );

      // Load workflow configurations
      let workflowConfig;
      try {
        workflowConfig = await configService.loadConfig();
        console.log("[Firebase Functions] Config loaded successfully");
      } catch (error) {
        console.error("[Firebase Functions] Error loading config, using defaults:", error);
        workflowConfig = { nodePrompts: {}, autogenAgents: {} };
      }

      // Initialize workflows
      let emailWorkflow: any;
      try {
        emailWorkflow = new EmailGenerationWorkflow(
          process.env.FIRECRAWL_API_KEY || "",
          process.env.OPENAI_API_KEY || "",
          process.env.USE_AUTOGEN !== "false",
          workflowConfig
        );
        console.log("[Firebase Functions] Email workflow initialized successfully");
      } catch (error) {
        console.error("[Firebase Functions] Error initializing email workflow:", error);
      }

      // Website redesign workflow - commented out for now, can be added later
      // let websiteRedesignWorkflow: any;
      // try {
      //   const { WebsiteRedesignWorkflow } = await import("../../server/services/websiteRedesignWorkflow.js");
      //   websiteRedesignWorkflow = new WebsiteRedesignWorkflow(
      //     process.env.FIRECRAWL_API_KEY || "",
      //     process.env.OPENAI_API_KEY || ""
      //   );
      //   console.log("[Firebase Functions] Website redesign workflow initialized successfully");
      // } catch (error) {
      //   console.error("[Firebase Functions] Error initializing website redesign workflow:", error);
      // }

      // Set up API routes
      // Note: This is a subset of routes from server/index.ts
      // You may need to add more routes as needed

      // Scrape and analyze endpoint
      app.post("/api/scrape-and-analyze", async (req, res) => {
        try {
          const { websiteUrl, leadInfo } = req.body;

          if (!websiteUrl) {
            return res.status(400).json({ error: "websiteUrl is required" });
          }

          try {
            new URL(websiteUrl);
          } catch {
            return res.status(400).json({ error: "Invalid URL format" });
          }

          if (!emailWorkflow) {
            return res.status(500).json({ error: "Email workflow not initialized" });
          }

          console.log(`[Workflow] Starting email generation workflow for: ${websiteUrl}`);
          const result = await emailWorkflow.execute(websiteUrl, leadInfo);

          if (result.error) {
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

          try {
            // Extract contact information from socialMedia if available
            const contactInfo = result.socialMedia ? {
              instagram: result.socialMedia.instagram,
              socialLinks: result.socialMedia.socialLinks,
              emails: result.socialMedia.emails || [],
            } : undefined;

            await workflowResultsService.saveWorkflowResult({
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
          } catch (saveError: any) {
            console.error("[Workflow] Error saving workflow results:", saveError);
          }

          return res.json({
            success: true,
            data: {
              websiteUrl: result.websiteUrl,
              legalDocuments: result.legalDocuments
                ? Object.keys(result.legalDocuments).filter(
                    (key) => result.legalDocuments![key as keyof typeof result.legalDocuments]
                  )
                : [],
              socialMedia: (result as any).socialMedia || undefined,
              analysis: result.analysis,
              executionDetails: result.executionDetails || {},
            },
          });
        } catch (error: any) {
          console.error("Error in scrape-and-analyze:", error);
          return res.status(500).json({
            error: "Internal server error",
            message: error.message || "An error occurred during scraping and analysis",
          });
        }
      });

      // Get cold leads
      app.get("/api/cold-leads", async (req, res) => {
        try {
          const limit = parseInt(req.query.limit as string) || 50;
          const offset = parseInt(req.query.offset as string) || 0;
          const search = req.query.search as string;

          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
          const serviceUrl = process.env.SUPABASE_URL || "";
          
          if (!serviceUrl || !serviceKey) {
            return res.status(500).json({
              error: "Configuration error",
              message: "Supabase credentials not configured",
            });
          }

          const leadsService = new ColdLeadsService(serviceUrl, serviceKey);
          
          let leads;
          if (search) {
            leads = await leadsService.searchColdLeads(search);
          } else {
            leads = await leadsService.getAllColdLeads(limit, offset);
          }

          return res.json({
            success: true,
            data: leads,
          });
        } catch (error: any) {
          console.error("[Cold Leads API] Error:", error);
          return res.status(500).json({
            error: "Internal server error",
            message: error.message || "Failed to fetch cold leads",
          });
        }
      });

      // Save contact
      app.post("/api/save-contact", async (req, res) => {
        try {
          // Validate Supabase configuration
          const hasSupabaseKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
          if (!process.env.SUPABASE_URL || !hasSupabaseKey) {
            console.error("[Save Contact] Missing Supabase configuration:", {
              hasSupabaseUrl: !!process.env.SUPABASE_URL,
              hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
              hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
            });
            return res.status(500).json({
              error: "Server configuration error",
              message: "Supabase credentials are not configured. Please set SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variables.",
            });
          }

          console.log("[Save Contact] Request received:", {
            body: req.body,
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
            usingKeyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon",
          });

          const { name, email, phone, website } = req.body;

          if (!email || !name) {
            console.error("[Save Contact] Missing required fields:", { email, name });
            return res.status(400).json({
              error: "email and name are required",
            });
          }

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
          const result = await supabaseService.saveContact(contactData);
          console.log("[Save Contact] Successfully saved:", result);

          // Automatically trigger legal analyzer workflow if website URL is provided
          // Run asynchronously - don't block the response
          if (normalizedWebsite && emailWorkflow && workflowResultsService) {
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
                  company: "",
                  email: email,
                };

                const workflowResult = await emailWorkflow.execute(normalizedWebsite, leadInfo);

                if (workflowResult.error) {
                  console.error("[Save Contact] Workflow error:", workflowResult.error);
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
                  } catch (saveError: any) {
                    console.error("[Save Contact] Error saving workflow results:", saveError);
                  }
                }
              } catch (workflowError: any) {
                console.error("[Save Contact] Error running workflow:", workflowError);
              }
            })(); // Immediately invoke async function
            }
          }

          return res.json({
            success: true,
            data: result,
          });
        } catch (error: any) {
          console.error("[Save Contact] Error saving contact:", error);
          console.error("[Save Contact] Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            stack: error.stack,
          });
          
          // Return detailed error information
          const errorResponse: any = {
            error: "Internal server error",
            message: error.message || "Failed to save contact",
          };
          
          // Add Supabase-specific error details if available
          if (error.code) {
            errorResponse.code = error.code;
          }
          if (error.details) {
            errorResponse.details = error.details;
          }
          if (error.hint) {
            errorResponse.hint = error.hint;
          }
          
          return res.status(500).json(errorResponse);
        }
      });

      // Get contacts endpoint
      app.get("/api/contacts", async (req, res) => {
        try {
          const limit = parseInt(req.query.limit as string) || 50;
          const offset = parseInt(req.query.offset as string) || 0;

          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
          const serviceUrl = process.env.SUPABASE_URL || "";
          
          if (!serviceUrl || !serviceKey) {
            return res.status(500).json({
              error: "Configuration error",
              message: "Supabase credentials not configured",
            });
          }

          // Create a Supabase client to query contacts
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(serviceUrl, serviceKey);

          const { data, error } = await supabase
            .from("contacts")
            .select("*")
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) {
            throw error;
          }

          return res.json({
            success: true,
            data: data || [],
          });
        } catch (error: any) {
          console.error("[Contacts API] Error:", error);
          return res.status(500).json({
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

          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
          const serviceUrl = process.env.SUPABASE_URL || "";
          
          if (!serviceUrl || !serviceKey) {
            return res.status(500).json({
              error: "Configuration error",
              message: "Supabase credentials not configured",
            });
          }

          // Use service role key if available for better access
          const resultsService = new WorkflowResultsService(serviceUrl, serviceKey);
          const results = await resultsService.getAllWorkflowResults(limit, offset);

          return res.json({
            success: true,
            data: results,
          });
        } catch (error: any) {
          console.error("[Workflow Results API] Error:", error);
          return res.status(500).json({
            error: "Internal server error",
            message: error.message || "Failed to fetch workflow results",
          });
        }
      });

      routesInitialized = true;
      console.log("[Firebase Functions] Routes initialized successfully");
    } catch (error) {
      console.error("[Firebase Functions] Error initializing routes:", error);
      throw error;
    }
  })();

  return initPromise;
}

// Middleware to ensure routes are initialized
app.use(async (req, res, next) => {
  if (!routesInitialized && req.path !== "/health") {
    try {
      await initializeRoutes();
    } catch (error) {
      console.error("[Firebase Functions] Failed to initialize routes:", error);
      return res.status(500).json({
        error: "Server initialization failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  return next();
});

// Export the Express app as a Firebase Function
// Using v1 API - secrets are automatically available as environment variables
// Make sure these secrets are set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
export const api = functions
  .region("us-central1")
  .runWith({
    timeoutSeconds: 540,
    memory: "1GB",
    // Secrets set via firebase functions:secrets:set are automatically available
    // No need to explicitly declare them in v1 functions
  })
  .https.onRequest(app);
