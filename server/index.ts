/**
 * Backend API Server
 * Handles scraping requests and coordinates Firecrawl and OpenAI services
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { FirecrawlService } from "./services/firecrawlService.js";
import { OpenAIService } from "./services/openaiService.js";

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

