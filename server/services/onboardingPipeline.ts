/**
 * Onboarding Pipeline
 * Orchestrates Firecrawl + Playwright + Vision normalization for business onboarding
 */

import { FirecrawlService } from "./firecrawlService.js";
import { PlaywrightService } from "./playwrightService.js";
import { OpenAIService } from "./openaiService.js";

export interface OnboardingResult {
  businessId: string;
  rawScrape: any;
  normalizedScrape: any;
  structuredData: {
    name: string;
    services: any[];
    pricing: any;
    faq: any[];
    hours?: string;
    locations?: any[];
    images: {
      logo?: string;
      hero?: string;
      [key: string]: any;
    };
    navigation?: any;
    bookingRules?: any;
  };
  screenshots?: Map<string, Buffer>;
}

export class OnboardingPipeline {
  private firecrawlService: FirecrawlService;
  private playwrightService: PlaywrightService;
  private openaiService: OpenAIService;

  constructor(
    firecrawlApiKey: string,
    openaiApiKey: string
  ) {
    this.firecrawlService = new FirecrawlService(firecrawlApiKey);
    this.playwrightService = new PlaywrightService();
    this.openaiService = new OpenAIService(openaiApiKey);
  }

  /**
   * Onboard a new business - full pipeline
   */
  async onboardBusiness(
    domain: string,
    businessName?: string
  ): Promise<OnboardingResult> {
    try {
      console.log(`[Onboarding] Starting pipeline for: ${domain}`);

      // STEP 1: Firecrawl - Scrape website
      console.log(`[Onboarding] Step 1: Scraping website with Firecrawl...`);
      const normalizedWebsiteData = await this.firecrawlService.scrapeFullWebsite(
        domain.startsWith("http") ? domain : `https://${domain}`
      );

      // STEP 2: Playwright - Take screenshots for navigation detection
      console.log(`[Onboarding] Step 2: Taking screenshots with Playwright...`);
      const screenshots = await this.captureScreenshots(normalizedWebsiteData);

      // STEP 3: Vision/LLM - Normalize and structure data
      console.log(`[Onboarding] Step 3: Normalizing data with AI...`);
      const structuredData = await this.normalizeData(
        normalizedWebsiteData,
        businessName || normalizedWebsiteData.domain
      );

      // STEP 4: Compile results
      const result: OnboardingResult = {
        businessId: "", // Will be set by caller
        rawScrape: normalizedWebsiteData,
        normalizedScrape: normalizedWebsiteData,
        structuredData,
        screenshots,
      };

      console.log(`[Onboarding] Pipeline complete for: ${domain}`);
      return result;
    } catch (error: any) {
      console.error(`[Onboarding] Error onboarding business ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Capture screenshots of key pages
   */
  private async captureScreenshots(
    websiteData: any
  ): Promise<Map<string, Buffer>> {
    const screenshots = new Map<string, Buffer>();

    try {
      // Take screenshot of homepage
      const homepageUrl = `https://${websiteData.domain}`;
      const homepageScreenshot = await this.playwrightService.takeScreenshot(
        homepageUrl,
        { fullPage: true }
      );
      screenshots.set("homepage", homepageScreenshot);

      // Take screenshots of key navigation pages (limit to 5)
      if (websiteData.navigation?.items) {
        const navItems = websiteData.navigation.items.slice(0, 5);
        for (const item of navItems) {
          try {
            const url = item.url.startsWith("http")
              ? item.url
              : `https://${websiteData.domain}${item.url}`;
            const screenshot = await this.playwrightService.takeScreenshot(
              url,
              { fullPage: true }
            );
            screenshots.set(item.label, screenshot);
          } catch (error) {
            console.warn(`Failed to screenshot ${item.url}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error capturing screenshots:", error);
      // Don't fail the whole pipeline if screenshots fail
    }

    return screenshots;
  }

  /**
   * Normalize and structure scraped data using AI
   */
  private async normalizeData(
    websiteData: any,
    businessName: string
  ): Promise<OnboardingResult["structuredData"]> {
    try {
      // Prepare prompt for AI normalization
      const prompt = this.buildNormalizationPrompt(websiteData, businessName);

      // Call OpenAI to structure the data
      const response = await this.openaiService.callChatGPT(prompt);

      // Parse JSON response
      let structuredData: any;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredData = JSON.parse(jsonMatch[0]);
        } else {
          structuredData = JSON.parse(response);
        }
      } catch (parseError) {
        console.warn("Failed to parse AI response as JSON, using fallback structure");
        structuredData = this.createFallbackStructure(websiteData, businessName);
      }

      // Merge with extracted data from Firecrawl
      const finalData: OnboardingResult["structuredData"] = {
        name: businessName,
        services: structuredData.services || this.extractServices(websiteData),
        pricing: structuredData.pricing || this.extractPricing(websiteData),
        faq: structuredData.faq || [],
        hours: structuredData.hours || this.extractHours(websiteData),
        locations: structuredData.locations || [],
        images: {
          logo: websiteData.logo,
          ...(structuredData.images || {}),
        },
        navigation: websiteData.navigation,
        bookingRules: {
          type: "mock",
          calendar: structuredData.calendar || [],
        },
      };

      return finalData;
    } catch (error: any) {
      console.error("Error normalizing data:", error);
      // Return fallback structure
      return this.createFallbackStructure(websiteData, businessName);
    }
  }

  /**
   * Build prompt for AI normalization
   */
  private buildNormalizationPrompt(websiteData: any, businessName: string): string {
    const pagesText = websiteData.pages
      ?.slice(0, 10)
      .map((page: any) => {
        const sectionsText = page.sections
          ?.map((section: any) => `## ${section.heading}\n${section.copy}`)
          .join("\n\n");
        return `# ${page.name}\n${sectionsText || ""}`;
      })
      .join("\n\n") || "";

    return `You are an expert at extracting structured business information from website data.

Business Name: ${businessName}
Domain: ${websiteData.domain}

Website Content:
${pagesText}

Extract and structure the following information as JSON:

{
  "services": [array of services/treatments with name, description, price if available],
  "pricing": {object with pricing tiers, packages, or general pricing info},
  "faq": [array of {question, answer} objects],
  "hours": "business hours as string",
  "locations": [array of location objects if multiple locations],
  "calendar": [array of available time slots if mentioned],
  "images": {hero: "url if found", other image references}
}

Return ONLY valid JSON, no markdown, no explanation.`;
  }

  /**
   * Create fallback structure if AI fails
   */
  private createFallbackStructure(
    websiteData: any,
    businessName: string
  ): OnboardingResult["structuredData"] {
    return {
      name: businessName,
      services: this.extractServices(websiteData),
      pricing: this.extractPricing(websiteData),
      faq: [],
      hours: undefined,
      locations: [],
      images: {
        logo: websiteData.logo,
      },
      navigation: websiteData.navigation,
      bookingRules: {
        type: "mock",
        calendar: [],
      },
    };
  }

  /**
   * Extract services from website data
   */
  private extractServices(websiteData: any): any[] {
    const services: any[] = [];

    // Look for services in page sections
    if (websiteData.pages) {
      for (const page of websiteData.pages) {
        if (page.sections) {
          for (const section of page.sections) {
            // Look for service-like headings
            if (
              section.heading &&
              (section.heading.toLowerCase().includes("service") ||
                section.heading.toLowerCase().includes("treatment") ||
                section.heading.toLowerCase().includes("package"))
            ) {
              // Try to extract service names from copy
              const lines = section.copy.split("\n").filter((line: string) => line.trim().length > 0);
              lines.forEach((line: string) => {
                if (line.length > 5 && line.length < 100) {
                  services.push({ name: line.trim() });
                }
              });
            }
          }
        }
      }
    }

    return services.slice(0, 20); // Limit to 20 services
  }

  /**
   * Extract pricing from website data
   */
  private extractPricing(websiteData: any): any {
    const pricing: any = {};

    // Look for pricing in page sections
    if (websiteData.pages) {
      for (const page of websiteData.pages) {
        if (page.sections) {
          for (const section of page.sections) {
            if (
              section.heading &&
              section.heading.toLowerCase().includes("pric")
            ) {
              pricing.description = section.copy;
            }
          }
        }
      }
    }

    return pricing;
  }

  /**
   * Extract hours from website data
   */
  private extractHours(websiteData: any): string | undefined {
    // Look for hours in page sections
    if (websiteData.pages) {
      for (const page of websiteData.pages) {
        if (page.sections) {
          for (const section of page.sections) {
            if (
              section.heading &&
              (section.heading.toLowerCase().includes("hour") ||
                section.heading.toLowerCase().includes("open"))
            ) {
              return section.copy;
            }
          }
        }
      }
    }
    return undefined;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.playwrightService.destroy();
  }
}

