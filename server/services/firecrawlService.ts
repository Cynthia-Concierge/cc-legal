/**
 * Firecrawl Service
 * Handles website scraping using Firecrawl API
 */

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  };
  error?: string;
}

interface LegalDocuments {
  privacyPolicy?: string;
  termsOfService?: string;
  refundPolicy?: string;
  cookiePolicy?: string;
  disclaimer?: string;
  other?: string[];
}

export class FirecrawlService {
  private apiKey: string;
  private baseUrl = "https://api.firecrawl.dev/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Scrape a website and extract legal documents
   */
  async scrapeWebsite(url: string): Promise<LegalDocuments> {
    try {
      // First, scrape the main page
      const mainPageContent = await this.scrapePage(url);

      // Find links to legal documents
      const legalLinks = this.findLegalDocumentLinks(mainPageContent, url);

      // Scrape each legal document
      const legalDocuments: LegalDocuments = {};

      for (const [docType, docUrl] of Object.entries(legalLinks)) {
        if (docUrl && docType !== "other") {
          try {
            const content = await this.scrapePage(docUrl);
            if (content) {
              (legalDocuments as any)[docType] = content;
            }
          } catch (error) {
            console.error(`Error scraping ${docType} from ${docUrl}:`, error);
          }
        }
      }

      return legalDocuments;
    } catch (error) {
      console.error("Error in scrapeWebsite:", error);
      throw error;
    }
  }

  /**
   * Scrape a single page using Firecrawl
   */
  private async scrapePage(url: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Firecrawl API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      const data: FirecrawlScrapeResponse = await response.json();

      if (!data.success || !data.data?.markdown) {
        throw new Error(data.error || "No content returned from Firecrawl");
      }

      return data.data.markdown;
    } catch (error) {
      console.error(`Error scraping page ${url}:`, error);
      throw error;
    }
  }

  /**
   * Find links to legal documents from the main page content
   */
  private findLegalDocumentLinks(
    content: string,
    baseUrl: string
  ): Record<string, string | null> {
    const legalLinks: Record<string, string | null> = {
      privacyPolicy: null,
      termsOfService: null,
      refundPolicy: null,
      cookiePolicy: null,
      disclaimer: null,
    };

    // Common patterns for legal document links
    const patterns = {
      privacyPolicy: [
        /privacy[\s-]?policy/gi,
        /privacy[\s-]?notice/gi,
        /data[\s-]?protection/gi,
      ],
      termsOfService: [
        /terms[\s-]?of[\s-]?service/gi,
        /terms[\s-]?and[\s-]?conditions/gi,
        /terms[\s-]?of[\s-]?use/gi,
        /user[\s-]?agreement/gi,
      ],
      refundPolicy: [
        /refund[\s-]?policy/gi,
        /return[\s-]?policy/gi,
        /cancellation[\s-]?policy/gi,
      ],
      cookiePolicy: [
        /cookie[\s-]?policy/gi,
        /cookie[\s-]?notice/gi,
      ],
      disclaimer: [
        /disclaimer/gi,
        /legal[\s-]?notice/gi,
      ],
    };

    // Extract URLs from markdown content
    const urlRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const urls: Array<{ text: string; url: string }> = [];
    let match;

    while ((match = urlRegex.exec(content)) !== null) {
      urls.push({ text: match[1], url: match[2] });
    }

    // Also extract plain URLs
    const plainUrlRegex = /https?:\/\/[^\s\)]+/g;
    while ((match = plainUrlRegex.exec(content)) !== null) {
      urls.push({ text: match[0], url: match[0] });
    }

    // Match URLs to document types
    for (const urlInfo of urls) {
      const linkText = urlInfo.text.toLowerCase();
      const linkUrl = urlInfo.url;

      for (const [docType, docPatterns] of Object.entries(patterns)) {
        if (!legalLinks[docType]) {
          for (const pattern of docPatterns) {
            if (pattern.test(linkText)) {
              // Resolve relative URLs
              const fullUrl = linkUrl.startsWith("http")
                ? linkUrl
                : new URL(linkUrl, baseUrl).href;
              legalLinks[docType] = fullUrl;
              break;
            }
          }
        }
      }
    }

    // Also try to find links in the footer or common locations
    // This is a simplified approach - in production, you might want to parse HTML
    const footerSection = content.toLowerCase();
    for (const [docType, docPatterns] of Object.entries(patterns)) {
      if (!legalLinks[docType]) {
        for (const pattern of docPatterns) {
          if (pattern.test(footerSection)) {
            // Try to construct common URL patterns
            const base = new URL(baseUrl);
            const possiblePaths = [
              `/${docType.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
              `/legal/${docType.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
              `/${docType.replace(/([A-Z])/g, "-$1").toLowerCase()}.html`,
            ];

            for (const path of possiblePaths) {
              try {
                const testUrl = new URL(path, baseUrl).href;
                // We'll let the scrape attempt determine if it exists
                legalLinks[docType] = testUrl;
                break;
              } catch {
                // Invalid URL, continue
              }
            }
            break;
          }
        }
      }
    }

    return legalLinks;
  }

  /**
   * Scrape entire website for redesign purposes
   * Optimized: Only scrapes homepage with minimal data extraction
   * Returns structured data about navigation, services, and structure
   */
  async scrapeFullWebsite(url: string): Promise<{
    mainPage: {
      markdown: string;
      metadata?: {
        title?: string;
        description?: string;
      };
    };
    navigation: {
      links: Array<{
        text: string;
        url: string;
      }>;
    };
    services?: string[];
    structure: {
      sections: string[];
      footer?: string;
      header?: string;
    };
  }> {
    try {
      // Scrape main page only - using onlyMainContent: true for cleaner data
      const mainPageResponse = await fetch(`${this.baseUrl}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      if (!mainPageResponse.ok) {
        throw new Error(`Firecrawl API error: ${mainPageResponse.status}`);
      }

      const mainPageData: FirecrawlScrapeResponse = await mainPageResponse.json();
      
      if (!mainPageData.success || !mainPageData.data?.markdown) {
        throw new Error(mainPageData.error || "No content returned from Firecrawl");
      }

      // Extract navigation links from markdown (simplified - only main nav)
      const navigationLinks = this.extractNavigationLinks(mainPageData.data.markdown, url);
      
      // Extract services/features (simplified)
      const services = this.extractServices(mainPageData.data.markdown);
      
      // Extract page structure (only H1-H3, limited header/footer)
      const structure = this.extractStructure(mainPageData.data.markdown);

      return {
        mainPage: {
          markdown: mainPageData.data.markdown,
          metadata: mainPageData.data.metadata,
        },
        navigation: {
          links: navigationLinks,
        },
        services,
        structure,
      };
    } catch (error) {
      console.error("Error in scrapeFullWebsite:", error);
      throw error;
    }
  }

  /**
   * Extract navigation links from markdown content
   * Simplified: Only extracts main navigation links (first 20 unique links)
   */
  private extractNavigationLinks(content: string, baseUrl: string): Array<{ text: string; url: string }> {
    const links: Array<{ text: string; url: string }> = [];
    
    // Extract markdown links [text](url) - only first 50 matches to avoid over-processing
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let matchCount = 0;
    
    while ((match = markdownLinkRegex.exec(content)) !== null && matchCount < 50) {
      matchCount++;
      const text = match[1].trim();
      let url = match[2].trim();
      
      // Skip anchor links, mailto, tel, etc.
      if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        continue;
      }
      
      // Resolve relative URLs
      if (!url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
      }
      
      // Only include links from the same domain
      try {
        const linkUrl = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (linkUrl.hostname === baseUrlObj.hostname) {
          links.push({ text, url });
        }
      } catch {
        continue;
      }
    }
    
    // Remove duplicates and limit to first 20 unique links
    const uniqueLinks = Array.from(
      new Map(links.map(link => [link.url, link])).values()
    ).slice(0, 20);
    
    return uniqueLinks;
  }

  /**
   * Extract services/features from content
   * Simplified: Only extracts first 10 services from bullet points
   */
  private extractServices(content: string): string[] {
    const services: string[] = [];
    
    // Look for bullet points that might be services (simpler approach)
    const bulletRegex = /^[\*\-\•]\s*(.+)$/gm;
    let bulletMatch;
    while ((bulletMatch = bulletRegex.exec(content)) !== null && services.length < 10) {
      const text = bulletMatch[1].trim();
      // Filter out legal/privacy links and very short/long items
      if (text.length > 10 && text.length < 200 && 
          !text.toLowerCase().includes('privacy') && 
          !text.toLowerCase().includes('terms') &&
          !text.toLowerCase().includes('cookie') &&
          !text.toLowerCase().includes('refund')) {
        services.push(text);
      }
    }
    
    return services.slice(0, 10); // Limit to 10 services
  }

  /**
   * Extract page structure (sections, header, footer)
   * Optimized: Only H1-H3 headers, limited header/footer to 500 chars
   */
  private extractStructure(content: string): {
    sections: string[];
    footer?: string;
    header?: string;
  } {
    const sections: string[] = [];
    
    // Extract only H1, H2, H3 headers (not H4-H6)
    const headerRegex = /^#{1,3}\s+(.+)$/gm;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(content)) !== null) {
      const headerText = headerMatch[1].trim();
      if (headerText.length > 3 && headerText.length < 100) {
        sections.push(headerText);
      }
    }
    
    // Extract footer - limited to 500 characters around footer indicators
    const footerMatch = content.match(/footer|©|copyright|all rights reserved/gi);
    let footer: string | undefined;
    if (footerMatch) {
      const footerIndex = content.lastIndexOf(footerMatch[0]);
      const startIndex = Math.max(0, footerIndex - 250);
      const endIndex = Math.min(content.length, footerIndex + 250);
      footer = content.slice(startIndex, endIndex);
    }
    
    // Extract header - only first 500 characters
    const header = content.slice(0, 500);
    
    return {
      sections: sections.slice(0, 20), // Limit to 20 sections
      footer: footer,
      header: header,
    };
  }
}

