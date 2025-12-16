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

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";
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
      const { createClient } = require("@supabase/supabase-js");
      // Use require() for CommonJS modules
      const { SupabaseService } = require(path.join(servicesPath, "supabaseService.js"));
      const { WorkflowResultsService } = require(path.join(servicesPath, "workflowResultsService.js"));
      const { ColdLeadsService } = require(path.join(servicesPath, "coldLeadsService.js"));
      const { EmailGenerationWorkflow } = require(path.join(servicesPath, "emailGenerationWorkflow.js"));
      const { ConfigService } = require(path.join(servicesPath, "configService.js"));
      const { InstantlyService } = require(path.join(servicesPath, "instantlyService.js"));
      const { FirecrawlService } = require(path.join(servicesPath, "firecrawlService.js"));
      const { OpenAIService } = require(path.join(servicesPath, "openaiService.js"));

      // Initialize services (only the ones we actually use in routes)
      // Get Supabase config from secrets (env vars) - in v2, secrets are automatically available as env vars
      // Trim whitespace in case secrets have extra spaces
      const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
      const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
      const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || "").trim();

      // Use service_role key if available (bypasses RLS), otherwise use anon key
      const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

      console.log("[Firebase Functions] Supabase config:", {
        hasUrl: !!supabaseUrl,
        urlLength: supabaseUrl.length,
        urlPrefix: supabaseUrl.substring(0, 30),
        hasServiceRoleKey: !!supabaseServiceRoleKey,
        serviceRoleKeyLength: supabaseServiceRoleKey.length,
        hasAnonKey: !!supabaseAnonKey,
        anonKeyLength: supabaseAnonKey.length,
        usingKeyType: supabaseServiceRoleKey ? "service_role" : (supabaseAnonKey ? "anon" : "none"),
        finalKeyLength: supabaseKey.length,
      });

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(`Missing Supabase configuration. URL: ${!!supabaseUrl} (${supabaseUrl.length} chars), Key: ${!!supabaseKey} (${supabaseKey.length} chars)`);
      }

      // Validate URL format
      try {
        new URL(supabaseUrl);
      } catch (e) {
        throw new Error(`Invalid Supabase URL format: ${supabaseUrl.substring(0, 50)}`);
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

      // Initialize InstantlyService
      const instantlyService = new InstantlyService(
        (process.env.INSTANTLY_AI_API_KEY || "").trim()
      );

      // Initialize FirecrawlService and OpenAIService for website compliance scan
      const firecrawlService = new FirecrawlService(
        (process.env.FIRECRAWL_API_KEY || "").trim()
      );
      const openaiService = new OpenAIService(
        (process.env.OPENAI_API_KEY || "").trim()
      );

      // Initialize EmailService
      const { EmailService } = require(path.join(servicesPath, "emailService.js"));
      const emailService = new EmailService(
        (process.env.RESEND_API_KEY || "").trim(),
        process.env.EMAIL_FROM_ADDRESS
      );

      // Initialize DocumentGenerationService
      // Note: This is in src/ but compiled to lib/ so we use require from relative path to compiled file or use path join
      const { DocumentGenerationService } = require(path.join(__dirname, "documentGenerationService.js"));
      const documentGenerationService = new DocumentGenerationService();

      if (!process.env.EMAIL_FROM_ADDRESS) {
        console.warn("[Firebase Functions] WARNING: EMAIL_FROM_ADDRESS is not set. Emails may fail to send to non-test addresses.");
        console.warn("[Firebase Functions] Defaulting to 'onboarding@resend.dev' which only works for the Resend account owner.");
      } else {
        console.log(`[Firebase Functions] Email service configured with FROM address: ${process.env.EMAIL_FROM_ADDRESS}`);
      }

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
        const firecrawlKey = (process.env.FIRECRAWL_API_KEY || "").trim();
        const openaiKey = (process.env.OPENAI_API_KEY || "").trim();

        console.log("[Firebase Functions] Initializing email workflow:", {
          hasFirecrawlKey: !!firecrawlKey,
          hasOpenaiKey: !!openaiKey,
          firecrawlKeyLength: firecrawlKey.length,
          openaiKeyLength: openaiKey.length,
          hasWorkflowConfig: !!workflowConfig,
        });

        if (!firecrawlKey || !openaiKey) {
          throw new Error(`Missing required API keys. FIRECRAWL_API_KEY: ${!!firecrawlKey}, OPENAI_API_KEY: ${!!openaiKey}`);
        }

        emailWorkflow = new EmailGenerationWorkflow(
          firecrawlKey,
          openaiKey,
          process.env.USE_AUTOGEN !== "false",
          workflowConfig
        );
        console.log("[Firebase Functions] Email workflow initialized successfully");
      } catch (error: any) {
        console.error("[Firebase Functions] ===== ERROR INITIALIZING EMAIL WORKFLOW =====");
        console.error("[Firebase Functions] Error initializing email workflow:", error);
        console.error("[Firebase Functions] Error message:", error?.message);
        console.error("[Firebase Functions] Error stack:", error?.stack);
        // Don't set emailWorkflow to null - let it be undefined so we can check for it
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

      // Get workflow prompts and autogen configs (before execution)
      app.get("/api/workflow-config", async (req, res) => {
        try {
          const { websiteUrl, leadInfo } = req.query;

          console.log("[API] /api/workflow-config called with:", { websiteUrl, leadInfo });

          if (!emailWorkflow) {
            return res.status(500).json({
              error: "Email workflow not initialized",
            });
          }

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

          return res.json({
            success: true,
            data: {
              prompts,
              autogenConfigs,
            },
          });
        } catch (error: any) {
          console.error("[API] Error getting workflow config:", error);
          console.error("[API] Error stack:", error.stack);
          return res.status(500).json({
            error: "Internal server error",
            message: error.message || "An error occurred while fetching workflow configuration",
          });
        }
      });

      // Get cold leads (handle both /api/cold-leads and /cold-leads paths)
      const coldLeadsHandler = async (req: any, res: any) => {
        try {
          const limit = parseInt(req.query.limit as string) || 50;
          const offset = parseInt(req.query.offset as string) || 0;
          const search = req.query.search as string;

          const serviceKey = ((process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) || "").trim();
          const serviceUrl = (process.env.SUPABASE_URL || "").trim();

          console.log("[Cold Leads API] Config check:", {
            hasUrl: !!serviceUrl,
            urlLength: serviceUrl.length,
            urlPrefix: serviceUrl.substring(0, 30),
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
            keyLength: serviceKey.length,
            keyPrefix: serviceKey.substring(0, 20) + "...",
          });

          if (!serviceUrl || !serviceKey) {
            return res.status(500).json({
              error: "Configuration error",
              message: `Supabase credentials not configured. URL: ${!!serviceUrl}, Key: ${!!serviceKey}`,
            });
          }

          // Validate URL format
          try {
            new URL(serviceUrl);
          } catch (e) {
            return res.status(500).json({
              error: "Configuration error",
              message: `Invalid Supabase URL format: ${serviceUrl.substring(0, 50)}`,
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
      };

      app.get("/api/cold-leads", coldLeadsHandler);
      app.get("/cold-leads", coldLeadsHandler);

      // Send Welcome Email
      app.post("/api/emails/welcome", async (req, res) => {
        try {
          const { email, name } = req.body;

          if (!email) {
            return res.status(400).json({ error: "Email is required" });
          }

          if (!process.env.RESEND_API_KEY) {
            console.error("[Firebase Functions] RESEND_API_KEY is not set");
            return res.status(500).json({
              error: "Configuration error",
              message: "Email service is not configured (missing API key).",
            });
          }

          if (!process.env.EMAIL_FROM_ADDRESS) {
            console.warn("[Firebase Functions] EMAIL_FROM_ADDRESS is not set. Using default 'onboarding@resend.dev'.");
          } else {
            console.log(`[Firebase Functions] Sending welcome email from: ${process.env.EMAIL_FROM_ADDRESS}`);
          }

          const result = await emailService.sendWelcomeEmail(email, name);

          // Also notify admin (fire and forget)
          emailService.sendAdminAlert(email, name).catch((err: any) =>
            console.error("[Firebase Functions] Failed to send admin alert:", err)
          );

          return res.json({
            success: true,
            data: result,
          });
        } catch (error: any) {
          console.error("[Firebase Functions] Error sending welcome email:", error);
          return res.status(500).json({
            error: "Internal server error",
            message: error.message || "Failed to send welcome email",
          });
        }
      });

      // Send Onboarding Package (3 Free Documents)
      app.post("/api/documents/onboarding-package", async (req, res) => {
        try {
          const { userId } = req.body;

          if (!userId) {
            return res.status(400).json({ error: "userId is required" });
          }

          console.log(`[Onboarding Package] Processing for user ${userId}`);

          if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(500).json({ error: "Server configuration error" });
          }

          // Client setup
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

          // Get Profile Data
          const { data: profile, error } = await supabaseAdmin
            .from('business_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error || !profile) {
            console.error('[Onboarding Package] Profile not found:', error);
            // Try fallback to local answers if passed? No, enforce DB for security
            return res.status(404).json({ error: "Profile not found" });
          }

          // Get User Email
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
          const email = authUser?.user?.email;
          const name = profile.business_name || authUser?.user?.user_metadata?.name || 'there';

          if (!email) {
            return res.status(404).json({ error: "User email not found" });
          }

          // Prepare Profile Data for DocGen
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

          // Generate Documents
          const templates = [
            { id: 'social_media_disclaimer', name: 'Social Media Disclaimer.pdf' },
            { id: 'media_release_form', name: 'Photo Release Form.pdf' },
            { id: 'client_intake_form', name: 'Client Intake Form.pdf' }
          ];

          const attachments = [];

          for (const tmpl of templates) {
            try {
              console.log(`[Onboarding Package] Generating ${tmpl.id}...`);
              const pdfBuffer = await documentGenerationService.generateDocument(tmpl.id, profileData);
              attachments.push({
                filename: tmpl.name,
                content: pdfBuffer
              });
            } catch (err) {
              console.error(`[Onboarding Package] Failed to generate ${tmpl.id}:`, err);
              // Continue with others
            }
          }

          if (attachments.length === 0) {
            return res.status(500).json({ error: "Failed to generate any documents" });
          }

          // Send Email
          await emailService.sendOnboardingPackageEmail(email, name, attachments);

          console.log(`[Onboarding Package] Successfully sent ${attachments.length} documents to ${email}`);

          return res.json({
            success: true,
            sentCount: attachments.length
          });

        } catch (error: any) {
          console.error("[Onboarding Package] Error:", error);
          return res.status(500).json({
            error: "Internal server error",
            message: error.message
          });
        }
      });

      // Schedule Website Scan Reminder (Cloud Tasks)
      app.post("/api/emails/schedule-website-scan-reminder", async (req, res) => {
        try {
          const { userId, email, name } = req.body;

          if (!userId || !email) {
            return res.status(400).json({ error: "userId and email are required" });
          }

          const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
          const location = "us-central1"; // Default location
          const queue = "email-reminders"; // Your queue name

          if (!project) {
            console.error("[Schedule] Project ID not found");
            return res.status(500).json({ error: "Server configuration error: Project ID missing" });
          }

          const tasksClient = new CloudTasksClient();
          const queuePath = tasksClient.queuePath(project, location, queue);

          // Construct the full URL for the worker
          // In production, this is your function URL. In emulator, it's localhost.
          // We'll trust the request host header or fallback to a configured base URL
          const functionUrl = req.get("host")?.includes("localhost")
            ? `http://${req.get("host")}/api/workers/send-website-scan-reminder` // standardized standard local URL
            : `https://${location}-${project}.cloudfunctions.net/api/api/workers/send-website-scan-reminder`; // typical firebase function URL structure

          const payload = { userId };
          const scheduleTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

          const task = {
            httpRequest: {
              httpMethod: "POST" as const,
              url: functionUrl,
              body: Buffer.from(JSON.stringify(payload)).toString("base64"),
              headers: {
                "Content-Type": "application/json",
              },
            },
            scheduleTime: {
              seconds: Math.floor(scheduleTime.getTime() / 1000),
            },
          };

          try {
            // @ts-ignore - types can be tricky with google cloud libs sometimes
            const [response] = await tasksClient.createTask({ parent: queuePath, task });
            console.log(`[Schedule] Created task ${response.name} for user ${userId} at ${scheduleTime.toISOString()}`);
            return res.json({ success: true, message: "Reminder scheduled", taskName: response.name });
          } catch (error: any) {
            console.error("[Schedule] Error creating task:", error);
            // Fallback: Just log it, or you could implement a fallback strategy
            return res.status(500).json({ error: "Failed to schedule task", details: error.message });
          }

        } catch (error: any) {
          console.error("[Schedule] Error:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      });

      // Worker: Send Website Scan Reminder
      app.post("/api/workers/send-website-scan-reminder", async (req, res) => {
        try {
          const { userId } = req.body;

          if (!userId) {
            return res.status(400).json({ error: "userId required" });
          }

          console.log(`[Worker] Processing scan reminder for user ${userId}`);

          if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("[Worker] Missing configuration");
            return res.status(500).json({ error: "Configuration missing" });
          }

          // Client setup
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

          const { EmailService } = require(path.join(servicesPath, "emailService.js"));
          const emailServiceInstance = new EmailService(process.env.RESEND_API_KEY, process.env.EMAIL_FROM_ADDRESS);

          // Check if user still needs reminder
          const { data: profile, error } = await supabaseAdmin
            .from('business_profiles')
            .select('business_name, website_url, has_scanned_website, website_scan_reminder_sent_at')
            .eq('user_id', userId)
            .single();

          if (error || !profile) {
            console.log(`[Worker] Profile not found for ${userId}, aborting.`);
            return res.json({ status: "skipped", reason: "profile_not_found" });
          }

          if (profile.has_scanned_website) {
            console.log(`[Worker] User ${userId} already scanned website, aborting.`);
            return res.json({ status: "skipped", reason: "already_scanned" });
          }

          if (profile.website_scan_reminder_sent_at) {
            console.log(`[Worker] User ${userId} already sent reminder at ${profile.website_scan_reminder_sent_at}, aborting.`);
            return res.json({ status: "skipped", reason: "already_sent" });
          }

          // Get Email
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
          let email, name;

          if (authUser?.user?.email) {
            email = authUser.user.email;
            name = authUser.user.user_metadata?.name || email.split('@')[0];
          } else {
            // Fallback
            const { data: appUser } = await supabaseAdmin.from('users').select('email, name').eq('user_id', userId).single();
            if (appUser) {
              email = appUser.email;
              name = appUser.name;
            }
          }

          if (!email) {
            console.log(`[Worker] No email found for user ${userId}, aborting.`);
            return res.json({ status: "skipped", reason: "no_email" });
          }

          // Send Email
          await emailServiceInstance.sendWebsiteScanReminder(email, name);

          // Update DB
          await supabaseAdmin
            .from('business_profiles')
            .update({ website_scan_reminder_sent_at: new Date().toISOString() })
            .eq('user_id', userId);

          console.log(`[Worker] Sent reminder to ${email}`);
          return res.json({ success: true, email });

        } catch (error: any) {
          console.error("[Worker] Error:", error);
          return res.status(500).json({ error: error.message });
        }
      });

      // Schedule Profile Completion Reminder (Cloud Tasks)
      app.post("/api/emails/schedule-profile-completion-reminder", async (req, res) => {
        try {
          const { userId } = req.body;

          if (!userId) {
            return res.status(400).json({ error: "userId is required" });
          }

          const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
          const location = "us-central1"; // Default location
          const queue = "email-reminders"; // Reuse the same queue as other email reminders

          if (!project) {
            console.error("[Profile Reminder Schedule] Project ID not found");
            return res.status(500).json({ error: "Server configuration error: Project ID missing" });
          }

          const tasksClient = new CloudTasksClient();
          const queuePath = tasksClient.queuePath(project, location, queue);

          // Construct the full URL for the worker
          const functionUrl = req.get("host")?.includes("localhost")
            ? `http://${req.get("host")}/api/workers/send-profile-completion-reminder`
            : `https://${location}-${project}.cloudfunctions.net/api/api/workers/send-profile-completion-reminder`;

          const payload = { userId };
          const scheduleTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

          const task = {
            httpRequest: {
              httpMethod: "POST" as const,
              url: functionUrl,
              body: Buffer.from(JSON.stringify(payload)).toString("base64"),
              headers: {
                "Content-Type": "application/json",
              },
            },
            scheduleTime: {
              seconds: Math.floor(scheduleTime.getTime() / 1000),
            },
          };

          try {
            // @ts-ignore - types can be tricky with google cloud libs sometimes
            const [response] = await tasksClient.createTask({ parent: queuePath, task });
            console.log(`[Profile Reminder Schedule] Created task ${response.name} for user ${userId} at ${scheduleTime.toISOString()}`);
            return res.json({ success: true, message: "Profile completion reminder scheduled", taskName: response.name });
          } catch (error: any) {
            console.error("[Profile Reminder Schedule] Error creating task:", error);
            return res.status(500).json({ error: "Failed to schedule profile completion reminder task", details: error.message });
          }
        } catch (error: any) {
          console.error("[Profile Reminder Schedule] Error:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      });

      // Worker: Send Profile Completion Reminder
      app.post("/api/workers/send-profile-completion-reminder", async (req, res) => {
        try {
          const { userId } = req.body;

          if (!userId) {
            return res.status(400).json({ error: "userId required" });
          }

          console.log(`[Profile Reminder Worker] Processing profile completion reminder for user ${userId}`);

          if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("[Profile Reminder Worker] Missing configuration");
            return res.status(500).json({ error: "Configuration missing" });
          }

          // Client setup
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

          const { EmailService } = require(path.join(servicesPath, "emailService.js"));
          const emailServiceInstance = new EmailService(process.env.RESEND_API_KEY, process.env.EMAIL_FROM_ADDRESS);

          // Get user record
          const { data: userRow, error: userError } = await supabaseAdmin
            .from("users")
            .select("email, name, profile_completed, profile_completion_reminder_sent_at")
            .eq("user_id", userId)
            .single();

          if (userError || !userRow) {
            console.log(`[Profile Reminder Worker] User row not found for ${userId}, aborting.`, userError);
            return res.json({ status: "skipped", reason: "user_not_found" });
          }

          if (userRow.profile_completed) {
            console.log(`[Profile Reminder Worker] User ${userId} already completed profile, aborting.`);
            return res.json({ status: "skipped", reason: "profile_completed" });
          }

          if (userRow.profile_completion_reminder_sent_at) {
            console.log(`[Profile Reminder Worker] User ${userId} already sent reminder at ${userRow.profile_completion_reminder_sent_at}, aborting.`);
            return res.json({ status: "skipped", reason: "already_sent" });
          }

          const email = (userRow.email || "").trim().toLowerCase();
          const name = userRow.name || (email ? email.split("@")[0] : undefined);

          if (!email) {
            console.log(`[Profile Reminder Worker] No email found for user ${userId}, aborting.`);
            return res.json({ status: "skipped", reason: "no_email" });
          }

          // Send Email
          await emailServiceInstance.sendProfileCompletionReminder(email, name);

          // Update DB
          await supabaseAdmin
            .from("users")
            .update({ profile_completion_reminder_sent_at: new Date().toISOString() })
            .eq("user_id", userId);

          console.log(`[Profile Reminder Worker] Sent profile completion reminder to ${email}`);
          return res.json({ success: true, email });
        } catch (error: any) {
          console.error("[Profile Reminder Worker] Error:", error);
          return res.status(500).json({ error: error.message });
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

          const { name, email, phone, website, source } = req.body;

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
            source,
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
          console.log("[Save Contact] Checking workflow prerequisites:", {
            hasWebsite: !!normalizedWebsite,
            hasEmailWorkflow: !!emailWorkflow,
            hasWorkflowResultsService: !!workflowResultsService,
            website: normalizedWebsite,
          });

          if (!emailWorkflow) {
            console.error("[Save Contact] Email workflow not initialized - cannot run legal analysis");
          }

          if (!workflowResultsService) {
            console.error("[Save Contact] WorkflowResultsService not initialized - cannot save results");
          }

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
                  console.log("[Save Contact] ===== STARTING WORKFLOW EXECUTION =====");
                  console.log("[Save Contact] Auto-triggering legal analyzer for:", normalizedWebsite);
                  console.log("[Save Contact] Lead info:", { name, email, website: normalizedWebsite });

                  const leadInfo = {
                    name: name,
                    company: "",
                    email: email,
                  };

                  const workflowStartTime = Date.now();
                  console.log("[Save Contact] Executing workflow...");
                  const workflowResult = await emailWorkflow.execute(normalizedWebsite, leadInfo);
                  const workflowDuration = Date.now() - workflowStartTime;
                  console.log(`[Save Contact] Workflow completed in ${workflowDuration}ms`);

                  console.log("[Save Contact] Workflow result:", {
                    hasError: !!workflowResult.error,
                    hasEmail: !!workflowResult.email,
                    hasAnalysis: !!workflowResult.analysis,
                    hasLegalDocuments: !!workflowResult.legalDocuments,
                    emailSubject: workflowResult.email?.subject,
                    emailBodyLength: workflowResult.email?.body?.length,
                  });

                  if (workflowResult.error) {
                    console.error("[Save Contact] Workflow error:", workflowResult.error);
                    console.error("[Save Contact] Full error details:", JSON.stringify(workflowResult, null, 2));
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

                      console.log("[Save Contact] Saving workflow results to database...");
                      const savedResult = await workflowResultsService.saveWorkflowResult({
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
                      console.log("[Save Contact] Saved result ID:", savedResult?.id);

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
                            emailSubjectPreview: workflowResult.email.subject?.substring(0, 50),
                            emailBodyPreview: workflowResult.email.body?.substring(0, 100),
                          });

                          // Update the lead by adding again with updateIfExists: true
                          // This will update the existing lead's custom variables
                          console.log("[Save Contact] Calling Instantly.ai API to update lead...");
                          const instantlyUpdateResult = await instantlyService.addLeadToCampaign(
                            email.trim().toLowerCase(),
                            campaignId,
                            instantlyLeadData,
                            true // updateIfExists - will update existing lead in campaign
                          );

                          console.log("[Save Contact] Successfully updated Instantly.ai lead with personalized email content");
                          console.log("[Save Contact] Instantly.ai update result:", JSON.stringify(instantlyUpdateResult, null, 2));
                        } catch (instantlyErr: any) {
                          console.error("[Save Contact] Error updating Instantly.ai lead with email:", instantlyErr);
                          // Don't throw - workflow already succeeded and lead was already added
                        }
                      }
                    } catch (saveError: any) {
                      console.error("[Save Contact] ===== ERROR SAVING WORKFLOW RESULTS =====");
                      console.error("[Save Contact] Error saving workflow results:", saveError);
                      console.error("[Save Contact] Error message:", saveError?.message);
                      console.error("[Save Contact] Error stack:", saveError?.stack);
                      console.error("[Save Contact] Error details:", JSON.stringify(saveError, null, 2));
                    }
                  }
                } catch (workflowError: any) {
                  console.error("[Save Contact] ===== ERROR RUNNING WORKFLOW =====");
                  console.error("[Save Contact] Error running workflow:", workflowError);
                  console.error("[Save Contact] Error message:", workflowError?.message);
                  console.error("[Save Contact] Error stack:", workflowError?.stack);
                  console.error("[Save Contact] Full error:", JSON.stringify(workflowError, null, 2));

                  // Try to save error result to database
                  try {
                    await workflowResultsService.saveWorkflowResult({
                      websiteUrl: normalizedWebsite,
                      leadInfo: { name, email, company: "" },
                      error: workflowError?.message || "Unknown workflow error",
                      status: "error",
                    });
                    console.log("[Save Contact] Saved workflow error to database");
                  } catch (saveErrorErr: any) {
                    console.error("[Save Contact] Failed to save workflow error to database:", saveErrorErr);
                  }
                } finally {
                  console.log("[Save Contact] ===== WORKFLOW EXECUTION COMPLETE =====");
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

          return res.json({
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

      // Get contacts endpoint (handle both /api/contacts and /contacts paths)
      const contactsHandler = async (req: any, res: any) => {
        try {
          const limit = parseInt(req.query.limit as string) || 50;
          const offset = parseInt(req.query.offset as string) || 0;

          const serviceKey = ((process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) || "").trim();
          const serviceUrl = (process.env.SUPABASE_URL || "").trim();

          console.log("[Contacts API] Config check:", {
            hasUrl: !!serviceUrl,
            urlLength: serviceUrl.length,
            urlPrefix: serviceUrl.substring(0, 30),
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
            keyLength: serviceKey.length,
            keyPrefix: serviceKey.substring(0, 20) + "...",
          });

          if (!serviceUrl || !serviceKey) {
            return res.status(500).json({
              error: "Configuration error",
              message: `Supabase credentials not configured. URL: ${!!serviceUrl}, Key: ${!!serviceKey}`,
            });
          }

          // Validate URL format
          try {
            new URL(serviceUrl);
          } catch (e) {
            return res.status(500).json({
              error: "Configuration error",
              message: `Invalid Supabase URL format: ${serviceUrl.substring(0, 50)}`,
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
      };

      app.get("/api/contacts", contactsHandler);
      app.get("/contacts", contactsHandler);

      // Get workflow results endpoint (handle both /api/workflow-results and /workflow-results paths)
      const workflowResultsHandler = async (req: any, res: any) => {
        try {
          const limit = parseInt(req.query.limit as string) || 50;
          const offset = parseInt(req.query.offset as string) || 0;

          const serviceKey = ((process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) || "").trim();
          const serviceUrl = (process.env.SUPABASE_URL || "").trim();

          console.log("[Workflow Results API] Config check:", {
            hasUrl: !!serviceUrl,
            urlLength: serviceUrl.length,
            urlPrefix: serviceUrl.substring(0, 30),
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
            keyLength: serviceKey.length,
            keyPrefix: serviceKey.substring(0, 20) + "...",
          });

          if (!serviceUrl || !serviceKey) {
            return res.status(500).json({
              error: "Configuration error",
              message: `Supabase credentials not configured. URL: ${!!serviceUrl}, Key: ${!!serviceKey}`,
            });
          }

          // Validate URL format
          try {
            new URL(serviceUrl);
          } catch (e) {
            return res.status(500).json({
              error: "Configuration error",
              message: `Invalid Supabase URL format: ${serviceUrl.substring(0, 50)}`,
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
      };

      app.get("/api/workflow-results", workflowResultsHandler);
      app.get("/workflow-results", workflowResultsHandler);

      // Simple website compliance scan endpoint (no AutoGen, no complex workflow)
      // Just scrapes footer, extracts legal links, and briefly analyzes each
      app.post("/api/scan-website-compliance", async (req, res) => {
        try {
          const { websiteUrl } = req.body;

          if (!websiteUrl) {
            res.status(400).json({
              error: "websiteUrl is required",
            });
            return;
          }

          // Validate URL format
          let normalizedUrl = websiteUrl.trim();
          if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
            normalizedUrl = "https://" + normalizedUrl;
          }

          try {
            new URL(normalizedUrl);
          } catch {
            res.status(400).json({
              error: "Invalid URL format",
            });
            return;
          }

          console.log(`[Simple Scan] Starting compliance scan for: ${normalizedUrl}`);

          // Step 1: Scrape homepage footer to get legal links
          let html = "";
          let markdown = "";

          try {
            const pageData = await (firecrawlService as any).scrapePageWithHtml(normalizedUrl);
            html = pageData.html || "";
            markdown = pageData.markdown || "";
          } catch (error: any) {
            console.warn("[Simple Scan] Failed to scrape with HTML, trying markdown only:", error.message);
            markdown = await (firecrawlService as any).scrapePage(normalizedUrl);
            html = "";
          }

          // Step 2: Extract legal links from footer
          const legalLinks = html
            ? (firecrawlService as any).findLegalDocumentLinksFromHtml(html, normalizedUrl, markdown)
            : (firecrawlService as any).findLegalDocumentLinks(markdown, normalizedUrl);

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
                const content = await (firecrawlService as any).scrapePage(docUrl);
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

      // Trademark Risk Report Request Endpoint
      app.post("/api/trademarks/request", async (req, res) => {
        try {
          const { user_id, businessName, score, riskLevel, email, name, answers, answerDetails } = req.body;

          if (!businessName || !email) {
            return res.status(400).json({ error: "Missing required fields: businessName, email" });
          }

          console.log(`[Trademark] Received request for: ${businessName} (${email})`);

          // Generate risk factors based on quiz answers
          const riskFactors = generateRiskFactors(answers, score, riskLevel);

          // Extract answer details for PDF (use provided answerDetails if available, otherwise extract from answers)
          const extractedDetails = answerDetails ? extractAnswerDetailsFromDetails(answerDetails) : extractAnswerDetails(answers);

          // Generate verdict text based on risk level
          const verdict = generateVerdict(riskLevel, score);

          // Generate translation text
          const translationText = generateTranslationText(riskLevel, score);

          // 1. Generate PDF Report
          let pdfBuffer: Buffer | undefined;
          try {
            const reportData = {
              businessName: businessName,
              businessType: 'Wellness Business', // Could be passed from frontend if available
              riskLevel: riskLevel || 'MODERATE RISK',
              score: score || 0,
              riskFactor1: riskFactors[0] || 'No federal trademark registration',
              riskFactor2: riskFactors[1] || 'Similar name search not fully completed',
              riskFactor3: riskFactors[2] || 'Expansion beyond current location planned',
              riskFactor4: riskFactors[3] || 'Domain availability uncertain',
              email: email,
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

            pdfBuffer = await documentGenerationService.generateDocument(
              'trademark_risk_report',
              reportData
            );
            console.log('[Trademark] PDF generated successfully, size:', pdfBuffer.length);
          } catch (pdfError: any) {
            console.error('[Trademark] Error generating PDF:', pdfError);
            // Continue without PDF - email will still be sent
          }

          // 2. Insert into Supabase trademark_requests
          if (user_id) {
            const { error: dbError } = await supabaseService.client
              .from('trademark_requests')
              .insert({
                user_id: user_id,
                business_name: businessName,
                quiz_score: score,
                risk_level: riskLevel,
                status: 'completed' // Changed from 'pending' since we're sending the report immediately
              });

            if (dbError) {
              console.error('[Trademark] Database error:', dbError);
            } else {
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
                      score: score
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
          } else {
            console.warn('[Trademark] No user_id provided, skipping DB save (or handle anonymous)');
          }

          // 3. Send Risk Report Email with PDF attachment
          await emailService.sendTrademarkRiskReport(
            email,
            name,
            businessName,
            riskLevel,
            score,
            pdfBuffer
          );

          // 4. Send Admin Alert
          await emailService.sendAdminTrademarkAlert(email, businessName, riskLevel, score);

          return res.json({ success: true, message: "Risk report processed and sent" });
        } catch (error: any) {
          console.error('[Trademark] Error processing request:', error);
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
          return;
        } catch (error: any) {
          console.error("[API] Error generating document:", error);
          console.error("[API] Error stack:", error.stack);
          res.status(500).json({
            error: "Internal server error",
            message: error.message || "Failed to generate document",
            stack: error.stack,
          });
          return;
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
// Using v2 API - secrets must be explicitly declared
// Make sure these secrets are set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
export const api = functions.https.onRequest(
  {
    timeoutSeconds: 540,
    memory: "1GiB",
    secrets: [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_ANON_KEY",
      "FIRECRAWL_API_KEY",
      "OPENAI_API_KEY",
      "INSTANTLY_AI_API_KEY",
      "RESEND_API_KEY",
      "EMAIL_FROM_ADDRESS",
    ],
    region: "us-central1",
  },
  app
);


