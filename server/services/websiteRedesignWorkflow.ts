// @ts-nocheck
/**
 * LangGraph Workflow for Website Redesign
 * Orchestrates: Full Website Scraping -> Website Design & Layout
 */

import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { FirecrawlService } from "./firecrawlService.js";
import type { NormalizedWebsiteData } from "./firecrawlService.js";
import { AutoGenService } from "./autogenService.js";

/**
 * State interface for the website redesign workflow
 */

export interface WebsiteRedesignState {
  websiteUrl: string;
  scrapedData?: NormalizedWebsiteData;
  normalizedData?: {
    url: string;
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      headline: string;
      subheadline: string;
      primaryCTA: string;
      secondaryCTA?: string;
    };
    navigation: {
      main: Array<{
        label: string;
        url: string;
      }>;
    };
    services: string[];
    socialLinks?: Record<string, string>;
    sections: string[];
    ctas?: string[];
  };
  redesignedWebsite?: {
    structure: {
      pages: Array<{
        name: string;
        path: string;
        sections: Array<{
          name: string;
          type: string;
          content: any;
        }>;
      }>;
    };
    navigation: {
      items: Array<{
        label: string;
        path: string;
        order: number;
      }>;
    };
    copy?: any;
    design: {
      colorScheme: string[] | string;
      typography: any;
      layout: string;
      recommendations: string[];
    };
    components?: any;
    improvements: Array<{
      area: string;
      current: string;
      improved: string;
      reason: string;
    }>;
  };
  error?: string;
  executionDetails?: Record<string, NodeExecutionDetails>;
}

export interface NodeExecutionDetails {
  nodeId: string;
  nodeName: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  prompt?: string;
  input?: any;
  output?: any;
  error?: string;
}

// Define state annotation using LangGraph's Annotation API
const StateAnnotation = Annotation.Root({
  websiteUrl: Annotation<string>({
    reducer: (left: string, right: string) => right ?? left,
  }),
  scrapedData: Annotation<WebsiteRedesignState["scrapedData"]>({
    reducer: (left, right) => right ?? left,
  }),
  normalizedData: Annotation<WebsiteRedesignState["normalizedData"]>({
    reducer: (left, right) => right ?? left,
  }),
  redesignedWebsite: Annotation<WebsiteRedesignState["redesignedWebsite"]>({
    reducer: (left, right) => right ?? left,
  }),
  geminiPrompt: Annotation<WebsiteRedesignState["geminiPrompt"]>({
    reducer: (left, right) => right ?? left,
  }),
  error: Annotation<string>({
    reducer: (left: string, right: string) => right ?? left,
  }),
  executionDetails: Annotation<Record<string, NodeExecutionDetails>>({
    reducer: (left = {}, right = {}) => ({ ...left, ...right }),
  }),
});

/**
 * Website Redesign Workflow Service
 */
export class WebsiteRedesignWorkflow {
  private firecrawlService: FirecrawlService;
  private autogenService: AutoGenService;
  private graph: ReturnType<typeof this.buildWorkflow>;

  constructor(firecrawlApiKey: string, openaiApiKey: string) {
    this.firecrawlService = new FirecrawlService(firecrawlApiKey);
    this.autogenService = new AutoGenService(openaiApiKey);
    this.graph = this.buildWorkflow();
  }

  /**
   * Build the LangGraph workflow
   */
  private buildWorkflow() {
    const workflow = new StateGraph(StateAnnotation);

    // Add nodes
    workflow.addNode("full_scrape", this.fullScrapeNode.bind(this));
    workflow.addNode("normalize_data", this.normalizeDataNode.bind(this));
    workflow.addNode("website_design", this.websiteDesignNode.bind(this));
    workflow.addNode("final_prompt", this.finalPromptNode.bind(this));

    // Define the flow
    workflow.addEdge(START, "full_scrape" as any);
    workflow.addEdge("full_scrape" as any, "normalize_data" as any);
    workflow.addEdge("normalize_data" as any, "website_design" as any);
    workflow.addEdge("website_design" as any, "final_prompt" as any);
    workflow.addEdge("final_prompt" as any, END);

    return workflow.compile();
  }

  /**
   * Full Scrape Node: Scrape entire website for redesign
   */
  private async fullScrapeNode(
    state: typeof StateAnnotation.State
  ): Promise<Partial<typeof StateAnnotation.State>> {
    const startTime = Date.now();
    const nodeId = "full_scrape";
    
    try {
      console.log(`[Full Scrape Node] Scraping website: ${state.websiteUrl}`);
      
      const scrapedData = await this.firecrawlService.scrapeFullWebsite(
        state.websiteUrl
      );

      const endTime = Date.now();
      console.log(`[Full Scrape Node] Scraped ${scrapedData.pages.length} pages with ${scrapedData.navigation.items.length} nav items`);

      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Full Website Scrape",
        startTime,
        endTime,
        duration: endTime - startTime,
        input: { websiteUrl: state.websiteUrl },
        output: { 
          summary: {
            pagesScraped: scrapedData.pages.length,
            navigationItems: scrapedData.navigation.items.length,
            totalSections: scrapedData.pages.reduce((sum, page) => sum + page.sections.length, 0),
            logoFound: !!scrapedData.logo,
          },
          fullData: scrapedData,
        },
      };

      return {
        scrapedData,
        executionDetails,
      };
    } catch (error: any) {
      const endTime = Date.now();
      console.error("[Full Scrape Node] Error:", error);
      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Full Website Scrape",
        startTime,
        endTime,
        duration: endTime - startTime,
        input: { websiteUrl: state.websiteUrl },
        error: error.message || "Unknown error",
      };

      return {
        error: `Full scrape error: ${error.message || "Unknown error"}`,
        executionDetails,
      };
    }
  }

  /**
   * Normalize Data Node: Clean and structure scraped data for AutoGen
   */
  private async normalizeDataNode(
    state: typeof StateAnnotation.State
  ): Promise<Partial<typeof StateAnnotation.State>> {
    const startTime = Date.now();
    const nodeId = "normalize_data";
    
    try {
      if (state.error) {
        return { error: state.error };
      }

      if (!state.scrapedData) {
        return { error: "No scraped data available for normalization" };
      }

      console.log("[Normalize Data Node] Cleaning and structuring scraped data...");

      const normalizedData = this.normalizeScrapedData(
        state.websiteUrl,
        state.scrapedData
      );

      const endTime = Date.now();
      console.log(`[Normalize Data Node] Normalized ${normalizedData.services.length} services, ${normalizedData.navigation.main.length} nav items`);

      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Data Normalization",
        startTime,
        endTime,
        duration: endTime - startTime,
        input: {
          summary: {
            pagesScraped: state.scrapedData.pages.length,
            navigationItems: state.scrapedData.navigation.items.length,
          },
          fullData: state.scrapedData,
        },
        output: {
          summary: {
            servicesNormalized: normalizedData.services.length,
            navItemsNormalized: normalizedData.navigation.main.length,
            sectionsFound: normalizedData.sections.length,
          },
          fullData: normalizedData,
        },
      };

      return {
        normalizedData,
        executionDetails,
      };
    } catch (error: any) {
      const endTime = Date.now();
      console.error("[Normalize Data Node] Error:", error);
      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Data Normalization",
        startTime,
        endTime,
        duration: endTime - startTime,
        input: {
          websiteUrl: state.websiteUrl,
        },
        error: error.message || "Unknown error",
      };

      return {
        error: `Normalization error: ${error.message || "Unknown error"}`,
        executionDetails,
      };
    }
  }

  /**
   * Normalize scraped data into format expected by AutoGen
   * The scraped data is already normalized, but we need to convert it to the format
   * expected by the AutoGen service
   */
  private normalizeScrapedData(
    websiteUrl: string,
    scrapedData: WebsiteRedesignState["scrapedData"]
  ): WebsiteRedesignState["normalizedData"] {
    if (!scrapedData) {
      throw new Error("No scraped data to normalize");
    }

    // Find homepage
    const homepage = scrapedData.pages.find(p => p.url === "/" || p.name === "Home") || scrapedData.pages[0];
    
    // Extract hero from homepage first section
    const heroSection = homepage?.sections[0] || { heading: "Welcome", copy: "", ctas: [] };
    const heroCTA = heroSection.ctas[0] || { label: "Get Started", url: "/contact" };
    const secondaryCTA = heroSection.ctas[1];

    // Extract all services from all pages
    const services: string[] = [];
    for (const page of scrapedData.pages) {
      for (const section of page.sections) {
        // Look for service-like sections
        if (section.heading.toLowerCase().includes("service") || 
            section.heading.toLowerCase().includes("feature") ||
            section.heading.toLowerCase().includes("offer")) {
          // Extract bullet points or list items from copy
          const bulletMatches = section.copy.match(/^[\*\-\•]\s*(.+)$/gm);
          if (bulletMatches) {
            bulletMatches.forEach(match => {
              const service = match.replace(/^[\*\-\•]\s*/, "").trim();
              if (service.length > 5 && service.length < 100 && !services.includes(service)) {
                services.push(service);
              }
            });
          }
        }
      }
    }

    // Extract all sections
    const sections: string[] = [];
    for (const page of scrapedData.pages) {
      for (const section of page.sections) {
        if (section.heading && !sections.includes(section.heading)) {
          sections.push(section.heading);
        }
      }
    }

    // Extract CTAs from all pages
    const ctas: string[] = [];
    for (const page of scrapedData.pages) {
      for (const section of page.sections) {
        for (const cta of section.ctas) {
          if (!ctas.includes(cta.label)) {
            ctas.push(cta.label);
          }
        }
      }
    }

    // Extract social links from navigation (if any)
    const socialLinks: Record<string, string> = {};
    for (const navItem of scrapedData.navigation.items) {
      const url = navItem.url.toLowerCase();
      if (url.includes("facebook.com")) socialLinks.facebook = navItem.url;
      else if (url.includes("instagram.com")) socialLinks.instagram = navItem.url;
      else if (url.includes("twitter.com") || url.includes("x.com")) socialLinks.twitter = navItem.url;
      else if (url.includes("linkedin.com")) socialLinks.linkedin = navItem.url;
      else if (url.includes("youtube.com")) socialLinks.youtube = navItem.url;
    }

    return {
      url: websiteUrl,
      metadata: {
        title: homepage?.name || "Website",
        description: "",
      },
      hero: {
        headline: heroSection.heading || "Welcome",
        subheadline: heroSection.copy.substring(0, 150) || "Discover our services",
        primaryCTA: heroCTA.label,
        secondaryCTA: secondaryCTA?.label,
      },
      navigation: {
        main: scrapedData.navigation.items.map(item => ({
          label: item.label,
          url: item.url,
        })),
      },
      services: services.slice(0, 10), // Limit to 10
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      sections: sections.slice(0, 20), // Limit to 20
      ctas: ctas.length > 0 ? ctas : undefined,
    };
  }

  /**
   * Clean markdown - remove footer, duplicated nav, scripts, etc.
   */
  private cleanMarkdown(markdown: string): string {
    let cleaned = markdown;

    // Remove footer sections (common patterns)
    cleaned = cleaned.replace(/footer|©|copyright|all rights reserved/gi, "");
    
    // Remove script blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
    cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
    
    // Remove repeated navigation patterns
    cleaned = cleaned.replace(/(Home|About|Services|Contact)[\s\n]*\1/gi, "");
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    
    return cleaned.trim();
  }

  /**
   * Extract hero section
   */
  private extractHero(markdown: string): {
    headline: string;
    subheadline: string;
    primaryCTA: string;
    secondaryCTA?: string;
  } {
    // Find first H1
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    const headline = h1Match ? h1Match[1].trim() : "Welcome";

    // Find first paragraph after H1
    const afterH1 = markdown.split(/^#\s+/m)[1] || "";
    const paragraphMatch = afterH1.match(/^(.+?)$/m);
    const subheadline = paragraphMatch ? paragraphMatch[1].trim().substring(0, 150) : "Discover our services";

    // Find CTAs (common patterns)
    const ctaPatterns = [
      /(?:book|schedule|get started|start now|learn more|contact us|call now)/i,
      /(?:consultation|appointment|request|sign up)/i,
    ];

    let primaryCTA = "Get Started";
    let secondaryCTA: string | undefined;

    const ctaMatches = markdown.match(new RegExp(ctaPatterns[0].source, "i"));
    if (ctaMatches) {
      primaryCTA = ctaMatches[0];
    }

    const secondaryMatch = markdown.match(new RegExp(ctaPatterns[1].source, "i"));
    if (secondaryMatch && secondaryMatch[0].toLowerCase() !== primaryCTA.toLowerCase()) {
      secondaryCTA = secondaryMatch[0];
    }

    return {
      headline,
      subheadline,
      primaryCTA,
      secondaryCTA,
    };
  }

  /**
   * Extract main navigation (filter out footer, social, policy links)
   */
  private extractMainNavigation(
    links: Array<{ text: string; url: string }>,
    baseUrl: string
  ): Array<{ label: string; url: string }> {
    const excludedPatterns = [
      /privacy|terms|cookie|refund|disclaimer|legal/i,
      /facebook|instagram|twitter|linkedin|youtube|tiktok|pinterest/i,
      /blog|news|articles/i,
      /#/,
    ];

    const mainNav: Array<{ label: string; url: string }> = [];
    const seen = new Set<string>();

    for (const link of links) {
      const text = link.text.trim();
      const url = link.url;

      // Skip excluded patterns
      if (excludedPatterns.some(pattern => pattern.test(text) || pattern.test(url))) {
        continue;
      }

      // Skip if already seen
      if (seen.has(text.toLowerCase())) {
        continue;
      }

      // Only include top-level pages (not deep paths)
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/").filter(p => p);
        if (pathParts.length <= 1) {
          mainNav.push({
            label: text,
            url: url,
          });
          seen.add(text.toLowerCase());
        }
      } catch {
        // Invalid URL, skip
        continue;
      }

      // Limit to 8 main nav items
      if (mainNav.length >= 8) {
        break;
      }
    }

    return mainNav;
  }

  /**
   * Extract and clean services
   */
  private extractCleanServices(
    existingServices: string[],
    markdown: string
  ): string[] {
    const services: string[] = [];
    const seen = new Set<string>();

    // Use existing services if available
    for (const service of existingServices) {
      const cleaned = service.trim();
      if (cleaned.length > 3 && cleaned.length < 50 && !seen.has(cleaned.toLowerCase())) {
        services.push(cleaned);
        seen.add(cleaned.toLowerCase());
      }
    }

    // Extract from markdown if needed (look for service-like headings)
    if (services.length < 5) {
      const serviceHeadings = markdown.match(/^##\s+(.+)$/gm) || [];
      for (const heading of serviceHeadings) {
        const text = heading.replace(/^##\s+/, "").trim();
        if (text.length > 3 && text.length < 50 && !seen.has(text.toLowerCase())) {
          services.push(text);
          seen.add(text.toLowerCase());
        }
        if (services.length >= 10) break;
      }
    }

    return services.slice(0, 10);
  }

  /**
   * Extract social links
   */
  private extractSocialLinks(
    links: Array<{ text: string; url: string }>,
    markdown: string
  ): Record<string, string> {
    const socialLinks: Record<string, string> = {};
    const socialPatterns = {
      instagram: /instagram\.com\/([^\/\s\)]+)/i,
      facebook: /facebook\.com\/([^\/\s\)]+)/i,
      twitter: /(?:twitter|x)\.com\/([^\/\s\)]+)/i,
      linkedin: /linkedin\.com\/(?:company|in)\/([^\/\s\)]+)/i,
      youtube: /youtube\.com\/(?:channel\/|user\/|@)?([^\/\s\)]+)/i,
      tiktok: /tiktok\.com\/@?([^\/\s\)]+)/i,
    };

    // Check links
    for (const link of links) {
      for (const [platform, pattern] of Object.entries(socialPatterns)) {
        if (pattern.test(link.url) && !socialLinks[platform]) {
          socialLinks[platform] = link.url;
        }
      }
    }

    // Check markdown
    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      if (!socialLinks[platform]) {
        const match = markdown.match(pattern);
        if (match) {
          socialLinks[platform] = match[0];
        }
      }
    }

    return socialLinks;
  }

  /**
   * Extract CTAs
   */
  private extractCTAs(markdown: string): string[] {
    const ctas: string[] = [];
    const ctaPatterns = [
      /(?:book|schedule|appointment|consultation)/i,
      /(?:get started|start now|begin)/i,
      /(?:learn more|read more|discover)/i,
      /(?:contact|call|reach out)/i,
    ];

    for (const pattern of ctaPatterns) {
      const match = markdown.match(pattern);
      if (match && !ctas.includes(match[0])) {
        ctas.push(match[0]);
      }
    }

    return ctas.slice(0, 5);
  }

  /**
   * Extract and clean sections
   */
  private extractSections(sections: string[]): string[] {
    const cleaned: string[] = [];
    const excluded = ["footer", "header", "navigation", "menu", "copyright"];

    for (const section of sections) {
      const lower = section.toLowerCase();
      if (!excluded.some(ex => lower.includes(ex)) && section.length > 3 && section.length < 50) {
        cleaned.push(section);
      }
      if (cleaned.length >= 15) break;
    }

    return cleaned;
  }

  /**
   * Website Design Node: Analyze and redesign the website using 7-agent AutoGen team
   */
  private async websiteDesignNode(
    state: typeof StateAnnotation.State
  ): Promise<Partial<typeof StateAnnotation.State>> {
    const startTime = Date.now();
    const nodeId = "website_design";
    
    try {
      if (state.error) {
        return { error: state.error };
      }

      if (state.error) {
        return { error: state.error };
      }

      if (!state.normalizedData) {
        return { error: "No normalized data available for design" };
      }

      console.log("[Website Design Node] Starting 7-agent AutoGen team collaboration...");

      // Use AutoGen team with normalized data
      const redesignedWebsite = await this.autogenService.designWebsiteWithAutoGenTeam(
        state.websiteUrl,
        state.normalizedData
      );

      console.log("[Website Design Node] AutoGen team collaboration complete");

      const endTime = Date.now();

      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Website Design (AutoGen Team)",
        startTime,
        endTime,
        duration: endTime - startTime,
        input: {
          websiteUrl: state.websiteUrl,
          servicesCount: state.normalizedData.services.length,
          navItemsCount: state.normalizedData.navigation.main.length,
          sectionsCount: state.normalizedData.sections.length,
        },
        output: {
          pagesDesigned: redesignedWebsite.structure.pages.length,
          improvementsCount: redesignedWebsite.improvements?.length || 0,
          agentsUsed: 7,
        },
      };

      return {
        redesignedWebsite,
        executionDetails,
      };
    } catch (error: any) {
      const endTime = Date.now();
      console.error("[Website Design Node] Error:", error);
      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Website Design (AutoGen Team)",
        startTime,
        endTime,
        duration: endTime - startTime,
        input: {
          websiteUrl: state.websiteUrl,
        },
        error: error.message || "Unknown error",
      };

      // Don't return error - let workflow continue to final_prompt
      // The final_prompt node can work without redesignedWebsite
      return {
        redesignedWebsite: undefined,
        executionDetails,
      };
    }
  }

  /**
   * Final Prompt Node: Generate creative Gemini prompt for website redesign
   */
  private async finalPromptNode(
    state: typeof StateAnnotation.State
  ): Promise<Partial<typeof StateAnnotation.State>> {
    const startTime = Date.now();
    const nodeId = "final_prompt";
    
    try {
      if (!state.scrapedData) {
        return { error: "No scraped data available for prompt generation" };
      }

      console.log("[Final Prompt Node] Generating creative Gemini prompt...");

      // Extract aesthetic direction from redesigned website if available, otherwise use defaults
      let aesthetic: {
        colorScheme: string[] | string;
        typography: any;
        layout: string;
        recommendations: string[];
      };

      if (state.redesignedWebsite?.design) {
        aesthetic = {
          colorScheme: state.redesignedWebsite.design.colorScheme,
          typography: state.redesignedWebsite.design.typography,
          layout: state.redesignedWebsite.design.layout,
          recommendations: state.redesignedWebsite.design.recommendations || [],
        };
      } else {
        // Use default aesthetic if website design failed
        console.log("[Final Prompt Node] Using default aesthetic (website design not available)");
        aesthetic = {
          colorScheme: "Modern, clean color palette",
          typography: "Professional, readable typography",
          layout: "Responsive, mobile-first layout",
          recommendations: [
            "Use a modern, premium design aesthetic",
            "Ensure strong visual hierarchy",
            "Implement smooth animations and transitions",
            "Focus on clarity and user experience",
          ],
        };
      }

      // Use scrapedData for the full structure (pages with sections, images, CTAs)
      const normalized = {
        navigation: {
          items: state.scrapedData.navigation.items,
        },
        pages: state.scrapedData.pages,
      };

      // Generate the creative Gemini prompt
      const finalPrompt = this.generateGeminiPrompt(aesthetic, normalized);

      console.log("[Final Prompt Node] Gemini prompt generated successfully");

      const endTime = Date.now();

      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Final Gemini Prompt Generation",
        startTime,
        endTime,
        duration: endTime - startTime,
        input: {
          pagesCount: normalized.pages.length,
          navItemsCount: normalized.navigation.items.length,
          hasAesthetic: !!aesthetic,
        },
        output: {
          promptLength: finalPrompt.length,
          promptPreview: finalPrompt.substring(0, 200) + "...",
        },
      };

      return {
        geminiPrompt: finalPrompt,
        executionDetails,
      };
    } catch (error: any) {
      const endTime = Date.now();
      console.error("[Final Prompt Node] Error:", error);
      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Final Gemini Prompt Generation",
        startTime,
        endTime,
        duration: endTime - startTime,
        input: {
          websiteUrl: state.websiteUrl,
        },
        error: error.message || "Unknown error",
      };

      return {
        error: `Final prompt generation error: ${error.message || "Unknown error"}`,
        executionDetails,
      };
    }
  }

  /**
   * Generate creative Gemini prompt for website redesign
   */
  private generateGeminiPrompt(
    aesthetic: {
      colorScheme: string[] | string;
      typography: any;
      layout: string;
      recommendations: string[];
    },
    normalized: {
      navigation: {
        items: Array<{
          label: string;
          url: string;
          children?: Array<{
            label: string;
            url: string;
          }>;
        }>;
      };
      pages: Array<{
        name: string;
        url: string;
        sections: Array<{
          heading: string;
          copy: string;
          images: string[];
          ctas: Array<{
            label: string;
            url: string;
          }>;
        }>;
      }>;
    }
  ): string {
    return `You are a senior front-end designer and web engineer.

Your job: **Redesign this entire website into a modern, beautiful, premium version**, using the real structure, copy, and images provided below.  

Do NOT change the copy unless you need small formatting fixes.  

Do NOT change the navigation structure.  

Do NOT invent new services or pages.  

---

# 🌈 BRAND AESTHETIC (Creative Direction Only)

Use this aesthetic direction as inspiration — interpret it freely:

${JSON.stringify(aesthetic, null, 2)}

This is NOT strict.  

You may choose the best:

- fonts  

- spacing  

- layout  

- color system  

- animations  

- UI style  

- visual hierarchy  

Your goal: **make it look significantly nicer, more premium, more modern, and more high-end** than the current site.

---

# 📘 WEBSITE STRUCTURE (USE EXACTLY)

Below is the full cleaned website structure with navigation items, pages, sections, images, and CTAs.  

This is the content you must rebuild.

## Navigation

\`\`\`json
${JSON.stringify(normalized.navigation, null, 2)}
\`\`\`

## Pages

\`\`\`json
${JSON.stringify(normalized.pages, null, 2)}
\`\`\`

---

# 🧩 WHAT TO BUILD

Build a **fully responsive multi-page website**, using:

- **Next.js 14 App Router**

- **TailwindCSS**

- Reusable **components** for hero, sections, cards, grids, nav, footer

- Real images (from URLs) placed thoughtfully

- A modern UI with strong visual hierarchy

Your redesign should emphasize:

- A beautiful hero for each major page  

- Elegant spacing + composition  

- Polished mobile layouts  

- Smooth micro-animations  

- A high-end premium look  

**Give Gemini creative freedom**.  

Your priority is *beauty, clarity, and premium feel.*

---

# 📦 WHAT TO RETURN

Return ONLY:

### ✔ 1. A short explanation of your redesign choices  

### ✔ 2. A complete, working **Next.js codebase**, including:

- \`app/\` pages for each route  

- \`components/\`  

- \`public/\` (download images by URL)  

- \`layout.tsx\`, \`globals.css\`, \`tailwind.config.js\`  

- Navigation with dropdowns  

- All sections rebuilt  

- All images placed in modern UI blocks  

This website must run out of the box.

---

# Begin now.`;
  }

  /**
   * Get prompts for nodes before execution (public method)
   */
  public getNodePrompts(websiteUrl: string): Record<string, string> {
    const prompts: Record<string, string> = {};

    // Full Scrape doesn't use a prompt (it's just scraping)
    prompts.full_scrape = "This node scrapes the website using Firecrawl API to extract homepage content, navigation links, services, and structure. No prompt is used.";

    // Normalize Data doesn't use a prompt (it's data processing)
    prompts.normalize_data = "This node cleans and structures the scraped data, extracting hero section, main navigation, services, CTAs, and social links. Removes noise like footer, duplicated nav, and scripts.";

    // Website Design uses 7-agent AutoGen team
    prompts.website_design = this.getWebsiteDesignPrompt(websiteUrl);

    return prompts;
  }

  /**
   * Get AutoGen agent configurations (public method)
   */
  public getAutoGenConfigs(): Record<string, any> {
    const configs: Record<string, any> = {};

    // Website Design AutoGen agents (7-agent team)
    configs.website_design = {
      enabled: true,
      agents: {
        information_architect: {
          name: "Information Architect",
          systemMessage: `You are the Information Architect.

Your job:
- Analyze the scraped website data
- Understand the business, purpose, and customer flow
- Create a modern, simplified sitemap
- Improve page hierarchy and grouping
- Remove unnecessary pages
- Add missing high-value pages (e.g., pricing, testimonials, FAQ, booking)

Output:
- A clear sitemap
- A description of each page's purpose
- Navigation recommendations

Be concise and focused. Output your analysis as structured text.`,
          model: "gpt-4o-mini",
          temperature: 0.7,
        },
        ux_strategist: {
          name: "UX Strategist",
          systemMessage: `You are the Senior UX Strategist.

Your job:
- Take the sitemap from the IA agent
- Redesign the flow of the website so it is clean, modern, and high-converting
- Define the sections needed on each page
- Recommend layout improvements and content flow
- Apply UX best practices (visual hierarchy, scannability, mobile-first, simplicity)

Output:
- Section-by-section breakdown for every page
- Layout flow notes
- Mobile-first UX considerations

Be specific and actionable.`,
          model: "gpt-4o-mini",
          temperature: 0.7,
        },
        cro_expert: {
          name: "CRO / Conversion Expert",
          systemMessage: `You are the Conversion Optimization Expert.

Your job:
- Analyze CTAs, service offerings, social proof, and trust indicators
- Improve all CTAs (buttons, placements, urgency, clarity)
- Recommend where testimonials should appear
- Strengthen the hero section for maximum conversion
- Add any missing sections needed for trust or persuasion

Output:
- CTA recommendations
- Social proof recommendations
- Conversion improvements to every section

Focus on conversion optimization.`,
          model: "gpt-4o-mini",
          temperature: 0.7,
        },
        copywriter: {
          name: "Copywriter",
          systemMessage: `You are the Website Copywriter.

Your job:
- Rewrite the hero text, service descriptions, and core paragraphs
- Make the copy clearer, more emotional, and more value-driven
- Keep it concise but persuasive
- Maintain brand voice based on the scraped data
- Produce improved headlines, subheadings, service blurbs, and button text

Output:
- Rewritten hero copy
- Rewritten section copy
- Rewritten service descriptions
- A library of CTA button variations

Write compelling, conversion-focused copy.`,
          model: "gpt-4o-mini",
          temperature: 0.8,
        },
        ui_designer: {
          name: "Brand/UI Designer",
          systemMessage: `You are the UI/Visual Designer.

Your job:
- Create a modern design style based on the scraped brand colors and fonts
- Recommend a color palette (primary, secondary, accents)
- Recommend typography pairings
- Recommend image style
- Recommend spacing, layout density, and component feel

Output:
- Color palette
- Typography guidelines
- Visual style notes
- Imagery recommendations

Be specific about design choices.`,
          model: "gpt-4o-mini",
          temperature: 0.7,
        },
        wireframe_engineer: {
          name: "Component & Wireframe Engineer",
          systemMessage: `You are the Component & Wireframe Engineer.

Your job:
- Convert the strategy, UX, copy, and design inputs into a structured blueprint
- Define components for Gemini (hero, service cards, testimonials, CTA bars, footer)
- Specify responsive behavior
- Outline layout grids

Output:
- Wireframe description for each page
- Component definitions
- Responsive rules
- A clear blueprint Gemini can implement into HTML/CSS/React

Be technical and specific about component structure.`,
          model: "gpt-4o-mini",
          temperature: 0.6,
        },
        final_composer: {
          name: "Final JSON Composer",
          systemMessage: `You are the Final Composer Agent.

Your job:
- Take all agents' outputs
- Integrate them into ONE clean JSON object
- Do NOT add commentary or explanation
- Output ONLY valid JSON using exactly this schema:

{
  "structure": {
    "pages": [
      {
        "name": "",
        "path": "",
        "sections": [
          {
            "name": "",
            "type": "",
            "content": {}
          }
        ]
      }
    ]
  },
  "navigation": {
    "items": [
      {
        "label": "",
        "path": "",
        "order": 1
      }
    ]
  },
  "copy": {},
  "design": {
    "colorScheme": [],
    "typography": {},
    "layout": "",
    "recommendations": []
  },
  "components": {},
  "improvements": [
    {
      "area": "",
      "current": "",
      "improved": "",
      "reason": ""
    }
  ]
}

STRICT RULES:
- Output must be valid JSON
- No markdown
- No backticks
- No explanations
- Start with { and end with }
- Only output the JSON object`,
          model: "gpt-4o-mini",
          temperature: 0.3,
        },
      },
    };

    return configs;
  }

  /**
   * Get the prompt used for website design (shows AutoGen team setup)
   */
  private getWebsiteDesignPrompt(websiteUrl: string): string {
    return `This node uses a 7-agent AutoGen team to redesign the website. The agents collaborate sequentially:

1. Information Architect - Creates sitemap and page hierarchy
2. UX Strategist - Designs flow and defines sections
3. CRO Expert - Optimizes CTAs and conversion elements
4. Copywriter - Rewrites copy for clarity and conversion
5. UI Designer - Creates color palette and typography
6. Wireframe Engineer - Defines components and layout
7. Final Composer - Outputs final JSON blueprint

Website URL: ${websiteUrl}

The team will analyze the scraped website data and create a comprehensive redesign blueprint.

Each agent receives the outputs from previous agents and builds upon them to create the final design.`;
  }

  /**
   * Execute the workflow
   */
  async execute(websiteUrl: string): Promise<WebsiteRedesignState> {
    const initialState = {
      websiteUrl,
      scrapedData: undefined,
      normalizedData: undefined,
      redesignedWebsite: undefined,
      geminiPrompt: undefined,
      error: undefined,
      executionDetails: {},
    };

    try {
      const result = await this.graph.invoke(initialState);
      const mergedExecutionDetails: Record<string, NodeExecutionDetails> = {};
      if (result.executionDetails) {
        Object.assign(mergedExecutionDetails, result.executionDetails);
      }
      return {
        ...result,
        executionDetails: mergedExecutionDetails,
      } as WebsiteRedesignState;
    } catch (error: any) {
      console.error("[Workflow] Execution error:", error);
      return {
        ...initialState,
        error: `Workflow execution error: ${error.message || "Unknown error"}`,
      };
    }
  }

  /**
   * Execute workflow up to a specific step
   * Supports: "full_scrape", "normalize_data", "website_design"
   */
  async executeUpToStep(
    websiteUrl: string,
    stopAtStep: "full_scrape" | "normalize_data" | "website_design" | "final_prompt"
  ): Promise<WebsiteRedesignState> {
    const initialState = {
      websiteUrl,
      scrapedData: undefined,
      normalizedData: undefined,
      redesignedWebsite: undefined,
      geminiPrompt: undefined,
      error: undefined,
      executionDetails: {},
    };

    try {
      let currentState = initialState;

      // Step 1: Full Scrape
      if (stopAtStep === "full_scrape" || stopAtStep === "normalize_data" || stopAtStep === "website_design") {
        console.log(`[Workflow] Executing step: full_scrape`);
        const scrapeResult = await this.fullScrapeNode(currentState);
        currentState = { ...currentState, ...scrapeResult };
        
        if (currentState.error) {
          return currentState as WebsiteRedesignState;
        }

        if (stopAtStep === "full_scrape") {
          return {
            ...currentState,
            executionDetails: currentState.executionDetails || {},
          } as WebsiteRedesignState;
        }
      }

      // Step 2: Normalize Data
      if (stopAtStep === "normalize_data" || stopAtStep === "website_design") {
        console.log(`[Workflow] Executing step: normalize_data`);
        const normalizeResult = await this.normalizeDataNode(currentState);
        currentState = { ...currentState, ...normalizeResult };
        
        if (currentState.error) {
          return currentState as WebsiteRedesignState;
        }

        if (stopAtStep === "normalize_data") {
          return {
            ...currentState,
            executionDetails: currentState.executionDetails || {},
          } as WebsiteRedesignState;
        }
      }

      // Step 3: Website Design
      if (stopAtStep === "website_design" || stopAtStep === "final_prompt") {
        console.log(`[Workflow] Executing step: website_design`);
        const designResult = await this.websiteDesignNode(currentState);
        currentState = { ...currentState, ...designResult };
        
        // Don't stop on error - continue to final_prompt if needed
        // The final_prompt node can work without redesignedWebsite
        if (stopAtStep === "website_design") {
          return {
            ...currentState,
            executionDetails: currentState.executionDetails || {},
          } as WebsiteRedesignState;
        }
      }

      // Step 4: Final Prompt
      if (stopAtStep === "final_prompt") {
        console.log(`[Workflow] Executing step: final_prompt`);
        const promptResult = await this.finalPromptNode(currentState);
        currentState = { ...currentState, ...promptResult };
      }

      const mergedExecutionDetails: Record<string, NodeExecutionDetails> = {};
      if (currentState.executionDetails) {
        Object.assign(mergedExecutionDetails, currentState.executionDetails);
      }

      return {
        ...currentState,
        executionDetails: mergedExecutionDetails,
      } as WebsiteRedesignState;
    } catch (error: any) {
      console.error("[Workflow] Partial execution error:", error);
      return {
        ...initialState,
        error: `Workflow execution error: ${error.message || "Unknown error"}`,
      };
    }
  }

  /**
   * Stream the workflow execution (for real-time updates)
   */
  async *stream(
    websiteUrl: string
  ): AsyncGenerator<Record<string, any>, void, unknown> {
    const initialState = {
      websiteUrl,
      scrapedData: undefined,
      normalizedData: undefined,
      redesignedWebsite: undefined,
      geminiPrompt: undefined,
      error: undefined,
      executionDetails: {},
    };

    // Track agent progress for website_design node
    let currentAgent: string | null = null;

    try {
      const stream = await this.graph.stream(initialState);
      for await (const chunk of stream) {
        // Stream returns chunks with node names as keys
        const update = chunk as Record<string, any>;
        
        // Add agent progress info for website_design node
        if (update.website_design && currentAgent) {
          update.website_design = {
            ...update.website_design,
            activeAgent: currentAgent,
          };
        }
        
        yield update;
      }
    } catch (error: any) {
      console.error("[Workflow] Streaming error:", error);
      yield {
        error: `Workflow streaming error: ${error.message || "Unknown error"}`,
      };
    }
  }
}

