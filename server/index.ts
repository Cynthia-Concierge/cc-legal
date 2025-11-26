/**
 * Backend API Server
 * Handles scraping requests and coordinates Firecrawl and OpenAI services
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { FirecrawlService } from "./services/firecrawlService.js";
import { OpenAIService } from "./services/openaiService.js";
import { InstantlyService } from "./services/instantlyService.js";
import { SupabaseService } from "./services/supabaseService.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Scraping API is running" });
});

// Main scraping endpoint
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

    // Step 1: Scrape website and extract legal documents
    console.log(`Scraping website: ${websiteUrl}`);
    const legalDocuments = await firecrawlService.scrapeWebsite(websiteUrl);

    // Step 2: Analyze legal documents and find what's missing
    console.log("Analyzing legal documents...");
    const analysis = await openaiService.analyzeLegalDocuments(
      websiteUrl,
      legalDocuments
    );

    // Step 3: Generate personalized email
    console.log("Generating personalized email...");
    const email = await openaiService.generatePersonalizedEmail(
      websiteUrl,
      analysis,
      leadInfo
    );

    // Return results
    res.json({
      success: true,
      data: {
        websiteUrl,
        legalDocuments: Object.keys(legalDocuments).filter(
          (key) => legalDocuments[key as keyof typeof legalDocuments]
        ),
        analysis,
        email,
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

