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
        if (docUrl) {
          try {
            const content = await this.scrapePage(docUrl);
            if (content) {
              legalDocuments[docType as keyof LegalDocuments] = content;
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
}

