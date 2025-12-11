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

// New interfaces for website redesign scraping
export interface NavigationItem {
  label: string;
  url: string;
  children?: NavigationItem[]; // Subnavigation items
}

export interface PageSection {
  heading: string;
  copy: string;
  images: string[];
  ctas: Array<{
    label: string;
    url: string;
  }>;
}

export interface NormalizedPage {
  name: string;
  url: string;
  sections: PageSection[];
}

export interface NormalizedWebsiteData {
  domain: string;
  logo?: string;
  navigation: {
    items: NavigationItem[];
  };
  pages: NormalizedPage[];
}

interface LegalDocuments {
  privacyPolicy?: string;
  termsOfService?: string;
  refundPolicy?: string;
  cookiePolicy?: string;
  disclaimer?: string;
  other?: string[];
}

export interface SocialMediaInfo {
  instagram?: string;
  socialLinks: Record<string, string>;
  emails?: string[];
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
   * Scrape website and extract legal documents + social media info
   */
  async scrapeWebsiteWithSocial(url: string): Promise<{ legalDocuments: LegalDocuments; socialMedia: SocialMediaInfo }> {
    try {
      // Scrape main page with HTML to get footer
      let markdown = "";
      let html = "";

      try {
        const pageData = await this.scrapePageWithHtml(url);
        markdown = pageData.markdown || "";
        html = pageData.html || "";
      } catch (error: any) {
        console.warn("[Firecrawl] Failed to scrape with HTML, trying markdown only:", error.message);
        // Fallback to markdown-only scraping
        markdown = await this.scrapePage(url);
        html = "";
      }

      // Debug: Verify HTML contains footer/social content
      if (html) {
        const hasFooter = html.includes("footer") || html.match(/<footer/i);
        const hasInstagram = html.includes("instagram");
        const hasEmail = html.includes("@") || html.includes("mailto:");
        console.log(`[Firecrawl] HTML extraction check for ${url}:`, {
          hasFooter,
          hasInstagram,
          hasEmail,
          htmlLength: html.length,
        });
      } else {
        console.warn(`[Firecrawl] WARNING: No HTML returned for ${url} - social links may be missed!`);
      }

      // Extract social media and contact info from footer (even if HTML is empty, try markdown)
      const socialMedia = this.extractSocialMedia(html, markdown);
      const emails = this.extractEmails(html, markdown);

      // Add emails to socialMedia object
      if (emails.length > 0) {
        socialMedia.emails = emails;
      }

      // Find links to legal documents (use HTML if available for better footer extraction)
      const legalLinks = html
        ? this.findLegalDocumentLinksFromHtml(html, url, markdown)
        : this.findLegalDocumentLinks(markdown, url);

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

      return { legalDocuments, socialMedia };
    } catch (error) {
      console.error("Error in scrapeWebsiteWithSocial:", error);
      throw error;
    }
  }

  /**
   * Scrape a single page using Firecrawl
   */
  private async scrapePage(url: string, options: { onlyMainContent?: boolean } = {}): Promise<string> {
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
          onlyMainContent: options.onlyMainContent !== undefined ? options.onlyMainContent : true,
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
   * Scrape a page with HTML to extract footer and social media
   * CRITICAL: Must use onlyMainContent: false + javascript: true to get footer/social links
   */
  private async scrapePageWithHtml(url: string): Promise<{ markdown: string; html: string; metadata?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: url,
          formats: ["html", "markdown"], // HTML first for better extraction
          onlyMainContent: false, // CRITICAL: Must be false to get footer/header/social links
          // Note: Firecrawl automatically handles JavaScript rendering when onlyMainContent is false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Firecrawl API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      const data: any = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "No content returned from Firecrawl");
      }

      return {
        markdown: data.data.markdown || "",
        html: data.data.html || "",
        metadata: data.data.metadata || {},
      };
    } catch (error) {
      console.error(`Error scraping page with HTML ${url}:`, error);
      throw error;
    }
  }

  /**
   * Extract social media links from footer and throughout the page
   */
  extractSocialMedia(html: string, markdown: string): { instagram?: string; socialLinks: Record<string, string>; emails?: string[] } {
    const socialLinks: Record<string, string> = {};
    let instagram: string | undefined;

    // Common social media patterns - more comprehensive
    const socialPatterns = {
      instagram: [
        /instagram\.com\/([a-zA-Z0-9_.]+)/gi,
        /instagram\.com\/p\/([a-zA-Z0-9_.]+)/gi,
        /instagram\.com\/reel\/([a-zA-Z0-9_.]+)/gi,
      ],
      facebook: [
        /facebook\.com\/([a-zA-Z0-9_.]+)/gi,
        /fb\.com\/([a-zA-Z0-9_.]+)/gi,
      ],
      twitter: [
        /twitter\.com\/([a-zA-Z0-9_.]+)/gi,
        /x\.com\/([a-zA-Z0-9_.]+)/gi,
      ],
      linkedin: [
        /linkedin\.com\/(company|in)\/([a-zA-Z0-9_.-]+)/gi,
        /linkedin\.com\/company\/([a-zA-Z0-9_.-]+)/gi,
        /linkedin\.com\/in\/([a-zA-Z0-9_.-]+)/gi,
      ],
      tiktok: [
        /tiktok\.com\/@([a-zA-Z0-9_.]+)/gi,
        /tiktok\.com\/([a-zA-Z0-9_.]+)/gi,
      ],
      youtube: [
        /youtube\.com\/(channel|c|user|@)\/([a-zA-Z0-9_.-]+)/gi,
        /youtube\.com\/@([a-zA-Z0-9_.-]+)/gi,
        /youtu\.be\/([a-zA-Z0-9_.-]+)/gi,
      ],
      pinterest: [
        /pinterest\.com\/([a-zA-Z0-9_.-]+)/gi,
        /pinterest\.([a-z]{2})\/([a-zA-Z0-9_.-]+)/gi,
      ],
    };

    // Helper to normalize URLs
    const normalizeUrl = (url: string): string => {
      if (!url) return "";
      // Handle relative URLs
      if (url.startsWith("//")) {
        return "https:" + url;
      }
      if (url.startsWith("/")) {
        // Can't resolve without base URL, but try to make it absolute
        return url;
      }
      if (!url.startsWith("http")) {
        return "https://" + url;
      }
      return url;
    };

    // Extract from HTML - search entire page, prioritize footer
    if (html) {
      // First, try to find footer section (more likely to have social links)
      const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
      const footerContent = footerMatch ? footerMatch[1] : "";

      // Also look for common footer class/ID patterns
      const footerPatterns = [
        /<div[^>]*(?:class|id)=["'][^"']*footer[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
        /<section[^>]*(?:class|id)=["'][^"']*footer[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi,
      ];

      let allFooterContent = footerContent;
      for (const pattern of footerPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          allFooterContent += " " + match[1];
        }
      }

      // Search areas: footer first, then entire page
      const searchAreas = [
        { content: allFooterContent, priority: 2 }, // Footer has higher priority
        { content: html, priority: 1 }, // Then entire page
      ];

      for (const area of searchAreas) {
        // CRITICAL: First, extract SVG-only links (common pattern: <a href="..."><svg>...</svg></a>)
        // These are often social media icons with no text, which markdown conversion removes
        const svgLinkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>\s*<svg/gi;
        let svgMatch;
        while ((svgMatch = svgLinkRegex.exec(area.content)) !== null) {
          let url = svgMatch[1].trim();
          url = normalizeUrl(url);

          // Check for Instagram
          if (!instagram) {
            for (const pattern of socialPatterns.instagram) {
              if (pattern.test(url)) {
                instagram = url;
                socialLinks.instagram = url;
                break;
              }
            }
          }

          // Check for other social media
          for (const [platform, patterns] of Object.entries(socialPatterns)) {
            if (platform === "instagram" && instagram) continue; // Already handled
            if (!socialLinks[platform]) {
              for (const pattern of patterns) {
                if (pattern.test(url)) {
                  socialLinks[platform] = url;
                  break;
                }
              }
            }
          }
        }

        // Extract all href attributes (standard links)
        const hrefRegex = /href=["']([^"']+)["']/gi;
        let match;
        while ((match = hrefRegex.exec(area.content)) !== null) {
          let url = match[1].trim();
          url = normalizeUrl(url);

          // Check for Instagram
          if (!instagram) {
            for (const pattern of socialPatterns.instagram) {
              if (pattern.test(url)) {
                instagram = url;
                socialLinks.instagram = url;
                break;
              }
            }
          }

          // Check for other social media
          for (const [platform, patterns] of Object.entries(socialPatterns)) {
            if (platform === "instagram" && instagram) continue; // Already handled
            if (!socialLinks[platform]) {
              for (const pattern of patterns) {
                if (pattern.test(url)) {
                  socialLinks[platform] = url;
                  break;
                }
              }
            }
          }
        }

        // Also look for social media in data attributes and aria-labels
        const socialIconPatterns = [
          /(?:aria-label|title|alt)=["']([^"']*(?:instagram|facebook|twitter|linkedin|youtube|pinterest|tiktok)[^"']*)["']/gi,
        ];

        for (const pattern of socialIconPatterns) {
          let iconMatch;
          while ((iconMatch = pattern.exec(area.content)) !== null) {
            const text = iconMatch[1].toLowerCase();
            // Try to find nearby href
            const context = area.content.substring(
              Math.max(0, iconMatch.index - 200),
              Math.min(area.content.length, iconMatch.index + 200)
            );
            const nearbyHref = context.match(/href=["']([^"']+)["']/i);
            if (nearbyHref) {
              let url = normalizeUrl(nearbyHref[1]);
              // Match platform based on text
              if (text.includes("instagram") && !socialLinks.instagram) {
                socialLinks.instagram = url;
                if (!instagram) instagram = url;
              } else if (text.includes("facebook") && !socialLinks.facebook) {
                socialLinks.facebook = url;
              } else if ((text.includes("twitter") || text.includes("x.com")) && !socialLinks.twitter) {
                socialLinks.twitter = url;
              } else if (text.includes("linkedin") && !socialLinks.linkedin) {
                socialLinks.linkedin = url;
              } else if (text.includes("youtube") && !socialLinks.youtube) {
                socialLinks.youtube = url;
              } else if (text.includes("pinterest") && !socialLinks.pinterest) {
                socialLinks.pinterest = url;
              } else if (text.includes("tiktok") && !socialLinks.tiktok) {
                socialLinks.tiktok = url;
              }
            }
          }
        }
      }
    }

    // Also check markdown for links (as fallback)
    if (markdown) {
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let markdownMatch;
      while ((markdownMatch = markdownLinkRegex.exec(markdown)) !== null) {
        let url = markdownMatch[2].trim();
        const text = markdownMatch[1].toLowerCase();
        url = normalizeUrl(url);

        // Check for Instagram
        if (!instagram) {
          for (const pattern of socialPatterns.instagram) {
            if (pattern.test(url) || text.includes("instagram")) {
              instagram = url;
              socialLinks.instagram = url;
              break;
            }
          }
        }

        // Check for other social media
        for (const [platform, patterns] of Object.entries(socialPatterns)) {
          if (platform === "instagram" && instagram) continue;
          if (!socialLinks[platform]) {
            for (const pattern of patterns) {
              if (pattern.test(url) || text.includes(platform)) {
                socialLinks[platform] = url;
                break;
              }
            }
          }
        }
      }

      // Also search for plain URLs in markdown
      const plainUrlRegex = /https?:\/\/(?:www\.)?(instagram|facebook|twitter|x|linkedin|youtube|pinterest|tiktok)\.com[^\s\)]+/gi;
      let plainMatch;
      while ((plainMatch = plainUrlRegex.exec(markdown)) !== null) {
        const url = plainMatch[0];
        const platform = plainMatch[1].toLowerCase();

        // Map platform names
        const platformMap: Record<string, string> = {
          instagram: "instagram",
          facebook: "facebook",
          twitter: "twitter",
          x: "twitter",
          linkedin: "linkedin",
          youtube: "youtube",
          pinterest: "pinterest",
          tiktok: "tiktok",
        };

        const mappedPlatform = platformMap[platform];
        if (mappedPlatform && !socialLinks[mappedPlatform]) {
          socialLinks[mappedPlatform] = url;
          if (mappedPlatform === "instagram" && !instagram) {
            instagram = url;
          }
        }
      }
    }

    // Log what we found for debugging
    if (Object.keys(socialLinks).length > 0) {
      console.log("[Firecrawl] Found social media links:", Object.keys(socialLinks));
    } else {
      console.log("[Firecrawl] No social media links found in HTML or markdown");
    }

    return { instagram, socialLinks };
  }

  /**
   * Extract email addresses from HTML and markdown content
   */
  extractEmails(html: string, markdown: string): string[] {
    const emails = new Set<string>();

    // Common email regex pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

    // Extract from HTML
    if (html) {
      // Look for emails in href="mailto:" links
      const mailtoRegex = /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi;
      let match;
      while ((match = mailtoRegex.exec(html)) !== null) {
        emails.add(match[1].toLowerCase());
      }

      // Also extract plain emails from HTML text content
      // Remove script and style tags first
      const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      while ((match = emailRegex.exec(cleanHtml)) !== null) {
        const email = match[0].toLowerCase();
        // Filter out common false positives
        if (!email.includes('example.com') && !email.includes('test@') && !email.includes('placeholder')) {
          emails.add(email);
        }
      }
    }

    // Extract from markdown
    if (markdown) {
      // Extract from markdown links [text](mailto:email)
      const markdownMailtoRegex = /\[([^\]]+)\]\(mailto:([^)]+)\)/gi;
      let markdownMatch;
      while ((markdownMatch = markdownMailtoRegex.exec(markdown)) !== null) {
        const email = markdownMatch[2].toLowerCase();
        if (email.includes('@')) {
          emails.add(email);
        }
      }

      // Extract plain emails from markdown
      let emailMatch;
      while ((emailMatch = emailRegex.exec(markdown)) !== null) {
        const email = emailMatch[0].toLowerCase();
        // Filter out common false positives
        if (!email.includes('example.com') && !email.includes('test@') && !email.includes('placeholder')) {
          emails.add(email);
        }
      }
    }

    return Array.from(emails).slice(0, 10); // Limit to 10 emails
  }

  /**
   * Find links to legal documents from HTML (prioritizes footer)
   * Falls back to markdown if HTML parsing doesn't find enough links
   */
  private findLegalDocumentLinksFromHtml(
    html: string,
    baseUrl: string,
    markdownFallback: string
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

    // Extract footer section from HTML (where legal links are usually located)
    const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    const footerContent = footerMatch ? footerMatch[1] : "";

    // Also look for common footer class/ID patterns
    const footerPatterns = [
      /<div[^>]*(?:class|id)=["'][^"']*footer[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
      /<section[^>]*(?:class|id)=["'][^"']*footer[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi,
    ];

    let allFooterContent = footerContent;
    for (const pattern of footerPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        allFooterContent += " " + match[1];
      }
    }

    // Search areas: footer first (highest priority), then entire page
    const searchAreas = [
      { content: allFooterContent, priority: 2 },
      { content: html, priority: 1 },
    ];

    // Extract all <a> tags with href attributes
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

    for (const area of searchAreas) {
      let match;
      while ((match = linkRegex.exec(area.content)) !== null) {
        const href = match[1].trim();
        const linkText = match[2].replace(/<[^>]+>/g, "").trim(); // Remove HTML tags from link text

        // Resolve relative URLs
        let fullUrl: string;
        try {
          fullUrl = href.startsWith("http") ? href : new URL(href, baseUrl).href;
        } catch {
          continue; // Skip invalid URLs
        }

        const combinedText = (linkText + " " + href).toLowerCase();

        // Match to document types
        for (const [docType, docPatterns] of Object.entries(patterns)) {
          if (!legalLinks[docType]) {
            for (const pattern of docPatterns) {
              if (pattern.test(combinedText)) {
                legalLinks[docType] = fullUrl;
                break;
              }
            }
          }
        }
      }
    }

    // If we didn't find all links in HTML, fall back to markdown extraction
    const foundCount = Object.values(legalLinks).filter(link => link !== null).length;
    if (foundCount < 2) {
      const markdownLinks = this.findLegalDocumentLinks(markdownFallback, baseUrl);
      // Merge results, preferring HTML results
      for (const [docType, url] of Object.entries(markdownLinks)) {
        if (!legalLinks[docType] && url) {
          legalLinks[docType] = url;
        }
      }
    }

    return legalLinks;
  }

  /**
   * Find links to legal documents from the main page content (markdown)
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
   * NEW IMPLEMENTATION: Scrapes homepage + nav pages only (5-10 pages max)
   * Returns normalized JSON with all pages, sections, images, and CTAs
   */
  async scrapeFullWebsite(url: string): Promise<NormalizedWebsiteData> {
    try {
      console.log(`[Firecrawl] Starting website scrape for: ${url}`);

      // Normalize URL
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
      const domain = new URL(normalizedUrl).origin;

      // STEP 1: Scrape homepage
      const homepageData = await this.scrapeHomepage(normalizedUrl);

      // STEP 2: Extract true navigation
      const navigation = await this.extractNavigation(
        homepageData.markdown,
        homepageData.html || "",
        domain
      );

      // STEP 3: Scrape nav pages (include subnavigation, limit total pages)
      // Collect all nav items (top-level + subnav) but limit to 20 total pages
      const allNavItems: NavigationItem[] = [];
      for (const item of navigation.items) {
        allNavItems.push(item);
        if (item.children) {
          allNavItems.push(...item.children);
        }
        if (allNavItems.length >= 20) break; // Increased limit to capture more pages
      }
      const navPages = await this.scrapeNavPages(domain, allNavItems.slice(0, 20));

      // STEP 4: Normalize homepage
      const homepagePage = this.normalizePageData({
        name: "Home",
        url: "/",
        markdown: homepageData.markdown,
        metadata: homepageData.metadata,
      });

      // STEP 5: Combine all pages
      const allPages = [homepagePage, ...navPages];

      // Extract logo from homepage
      const logo = this.extractLogo(homepageData.markdown, homepageData.html || "", domain);

      return {
        domain,
        logo,
        navigation,
        pages: allPages,
      };
    } catch (error) {
      console.error("Error in scrapeFullWebsite:", error);
      throw error;
    }
  }

  /**
   * STEP 1: Scrape homepage with browser mode to capture JavaScript-rendered content
   */
  private async scrapeHomepage(url: string): Promise<{
    markdown: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: url,
          formats: ["html", "markdown"], // HTML first for better extraction
          onlyMainContent: false, // CRITICAL: Must be false to get footer/header/nav
          // Note: Firecrawl automatically handles JavaScript rendering when onlyMainContent is false
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

      return {
        markdown: data.data.markdown,
        html: data.data.html,
        metadata: data.data.metadata,
      };
    } catch (error) {
      console.error(`Error scraping homepage ${url}:`, error);
      throw error;
    }
  }

  /**
   * STEP 2: Extract ALL internal links including dropdown menus, hidden menus, mobile nav
   * This captures JavaScript-rendered navigation that only appears after interaction
   */
  private async extractNavigation(
    markdown: string,
    html: string,
    domain: string
  ): Promise<{ items: NavigationItem[] }> {
    const allInternalLinks = new Set<string>();
    const linkToLabel = new Map<string, string>();
    const seenUrls = new Set<string>();

    // Extract ALL links from HTML (including hidden dropdown menus, mobile nav, etc.)
    if (html) {
      // Use regex to find all <a> tags with href attributes
      const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const href = linkMatch[1].trim();
        let label = linkMatch[2].trim();

        // Clean label
        label = this.cleanNavLabel(label);

        // Skip if it's a logo, icon, or invalid
        if (this.isLogoOrIcon(linkMatch[0], href, label)) {
          continue;
        }

        // Only process internal links
        if (this.isInternalLink(href, domain)) {
          const normalizedUrl = this.normalizeNavUrl(href, domain);

          if (!seenUrls.has(normalizedUrl) && label.length > 0) {
            allInternalLinks.add(normalizedUrl);
            linkToLabel.set(normalizedUrl, label);
            seenUrls.add(normalizedUrl);
          }
        }
      }
    }

    // Also extract from markdown as fallback
    const markdownLinks = this.extractNavLinksFromMarkdown(markdown, domain);
    for (const link of markdownLinks) {
      if (this.isInternalLink(link.url, domain)) {
        const normalizedUrl = this.normalizeNavUrl(link.url, domain);
        if (!seenUrls.has(normalizedUrl)) {
          allInternalLinks.add(normalizedUrl);
          linkToLabel.set(normalizedUrl, link.text);
          seenUrls.add(normalizedUrl);
        }
      }
    }

    // Now organize into hierarchical structure (parent/child relationships)
    const navItems = this.organizeLinksIntoNavStructure(
      Array.from(allInternalLinks),
      linkToLabel,
      domain
    );

    // Filter and limit
    const filtered = navItems
      .filter(item => {
        return this.isValidNavigationItem(item, domain);
      })
      .slice(0, 15); // Allow more items to include subnav

    return { items: filtered };
  }

  /**
   * Check if a link is internal (same domain)
   */
  private isInternalLink(href: string, domain: string): boolean {
    // Skip anchors, mailto, tel, javascript
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return false;
    }

    // Skip external domains
    if (href.startsWith("http")) {
      try {
        const linkUrl = new URL(href);
        const domainUrl = new URL(domain);
        if (linkUrl.hostname !== domainUrl.hostname) {
          return false;
        }
      } catch {
        return false;
      }
    }

    // Skip common external services
    const lowerHref = href.toLowerCase();
    if (
      lowerHref.includes("shopify") ||
      lowerHref.includes("facebook.com") ||
      lowerHref.includes("instagram.com") ||
      lowerHref.includes("twitter.com") ||
      lowerHref.includes("linkedin.com") ||
      lowerHref.includes("youtube.com") ||
      lowerHref.includes("booking") ||
      lowerHref.includes("calendly") ||
      lowerHref.includes("zocdoc")
    ) {
      return false;
    }

    // Must be relative path or same domain
    return true;
  }

  /**
   * Organize flat list of links into hierarchical nav structure
   * Groups related links (e.g., /treatments/botox under /treatments)
   */
  private organizeLinksIntoNavStructure(
    links: string[],
    linkToLabel: Map<string, string>,
    domain: string
  ): NavigationItem[] {
    const navItems: NavigationItem[] = [];
    const processed = new Set<string>();
    const childrenByParent = new Map<string, string[]>();

    // First pass: Build parent-child relationships
    for (const link of links) {
      const pathParts = link.split("/").filter(p => p);

      // Check if this link has a parent
      if (pathParts.length > 1) {
        // Try different parent path formats
        const parentPath1 = "/" + pathParts.slice(0, -1).join("/");
        const parentPath2 = parentPath1 + "/";

        // Check if parent exists in our links
        const parentPath = links.includes(parentPath1) ? parentPath1 :
          links.includes(parentPath2) ? parentPath2 : null;

        if (parentPath) {
          if (!childrenByParent.has(parentPath)) {
            childrenByParent.set(parentPath, []);
          }
          childrenByParent.get(parentPath)!.push(link);
        }
      }
    }

    // Second pass: Build nav items with children
    // Sort links by depth (shorter paths first) so parents come before children
    const sortedLinks = links.sort((a, b) => {
      const aDepth = a.split("/").filter(p => p).length;
      const bDepth = b.split("/").filter(p => p).length;
      return aDepth - bDepth;
    });

    for (const link of sortedLinks) {
      if (processed.has(link)) continue;

      const label = linkToLabel.get(link) || this.inferLabelFromUrl(link);
      const navItem: NavigationItem = {
        label,
        url: link,
      };

      // Check if this item has children
      const children = childrenByParent.get(link) || [];
      if (children.length > 0) {
        navItem.children = children
          .filter(child => links.includes(child)) // Only include if child is in our links
          .map(child => ({
            label: linkToLabel.get(child) || this.inferLabelFromUrl(child),
            url: child,
          }))
          .slice(0, 20); // Limit subnav items

        // Mark children as processed
        children.forEach(child => processed.add(child));
      }

      navItems.push(navItem);
      processed.add(link);
    }

    // Add remaining links that weren't organized (orphans)
    for (const link of sortedLinks) {
      if (!processed.has(link)) {
        const label = linkToLabel.get(link) || this.inferLabelFromUrl(link);
        navItems.push({
          label,
          url: link,
        });
        processed.add(link);
      }
    }

    return navItems;
  }

  /**
   * Find the main navigation container in HTML
   */
  private findMainNavigationContainer(html: string): string | null {
    // Try to find <nav> elements first
    const navRegex = /<nav[^>]*>([\s\S]*?)<\/nav>/gi;
    const navMatches = Array.from(html.matchAll(navRegex));

    if (navMatches.length > 0) {
      // Prefer nav elements that are likely in the header/top of page
      // Look for navs that appear early in the HTML or have nav-related classes
      for (const match of navMatches) {
        const navHtml = match[0];
        // Check if this nav is likely the main nav (has multiple links, not in footer)
        const linkCount = (navHtml.match(/<a[^>]*href/gi) || []).length;
        const isFooter = /footer/i.test(navHtml) || /bottom/i.test(navHtml);
        const hasNavClasses = /nav|menu|header/i.test(navHtml);

        if (linkCount >= 3 && !isFooter && hasNavClasses) {
          return match[1]; // Return the content inside nav
        }
      }
      // If no ideal match, return the first nav
      return navMatches[0][1];
    }

    // Fallback: Look for navigation in <header>
    const headerRegex = /<header[^>]*>([\s\S]*?)<\/header>/gi;
    const headerMatches = Array.from(html.matchAll(headerRegex));

    if (headerMatches.length > 0) {
      // Return the first header (usually the main one)
      return headerMatches[0][1];
    }

    return null;
  }

  /**
   * Extract navigation structure with subnavigation
   */
  private extractNavStructure(html: string, domain: string): NavigationItem[] {
    const navItems: NavigationItem[] = [];
    const seenUrls = new Set<string>();

    // Find all top-level links (direct children of nav/header or in ul/li structures)
    // Look for <ul> with class containing "nav", "menu", etc.
    const ulRegex = /<ul[^>]*(?:class|id)=["'][^"']*(?:nav|menu|navigation)[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi;
    const ulMatches = Array.from(html.matchAll(ulRegex));

    // Also look for any <ul> that might be navigation
    if (ulMatches.length === 0) {
      const allUlRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
      const allUls = Array.from(html.matchAll(allUlRegex));
      // Filter to likely nav lists (have multiple <li> with links)
      for (const ulMatch of allUls) {
        const liCount = (ulMatch[1].match(/<li/gi) || []).length;
        const linkCount = (ulMatch[1].match(/<a[^>]*href/gi) || []).length;
        if (liCount >= 3 && linkCount >= 3) {
          ulMatches.push(ulMatch);
        }
      }
    }

    // Extract from <ul> structures (most common nav pattern)
    for (const ulMatch of ulMatches) {
      const ulContent = ulMatch[1];
      const items = this.extractNavItemsFromList(ulContent, domain, seenUrls);
      navItems.push(...items);
      if (navItems.length >= 15) break;
    }

    // If no <ul> found, extract direct links from nav/header
    if (navItems.length === 0) {
      const directLinks = this.extractDirectNavLinks(html, domain, seenUrls);
      navItems.push(...directLinks);
    }

    return navItems;
  }

  /**
   * Extract navigation items from a <ul> list structure (handles submenus)
   */
  private extractNavItemsFromList(
    ulContent: string,
    domain: string,
    seenUrls: Set<string>
  ): NavigationItem[] {
    const items: NavigationItem[] = [];

    // Extract <li> elements
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const liMatches = Array.from(ulContent.matchAll(liRegex));

    for (const liMatch of liMatches) {
      if (items.length >= 15) break;

      const liContent = liMatch[1];

      // Find the main link in this <li>
      const mainLinkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i;
      const mainLinkMatch = liContent.match(mainLinkRegex);

      if (mainLinkMatch) {
        const href = mainLinkMatch[1].trim();
        let label = mainLinkMatch[2].trim();

        // Clean label - remove nested HTML tags, images, icons
        label = this.cleanNavLabel(label);

        // Skip if it's a logo, icon, or image
        if (this.isLogoOrIcon(liContent, href, label)) {
          continue;
        }

        if (this.isValidNavLink(href, domain, label) && label.length > 0) {
          const fullUrl = href.startsWith("http") ? href : new URL(href, domain).href;

          if (!seenUrls.has(fullUrl)) {
            // Check for submenu/dropdown in this <li>
            const children = this.extractSubnavigation(liContent, domain, seenUrls);

            const navItem: NavigationItem = {
              label: label || this.inferLabelFromUrl(href),
              url: this.normalizeNavUrl(href, domain),
            };

            if (children.length > 0) {
              navItem.children = children;
            }

            items.push(navItem);
            seenUrls.add(fullUrl);
          }
        }
      }
    }

    return items;
  }

  /**
   * Extract subnavigation items (dropdown menus)
   */
  private extractSubnavigation(
    liContent: string,
    domain: string,
    seenUrls: Set<string>
  ): NavigationItem[] {
    const children: NavigationItem[] = [];

    // Look for nested <ul> (common dropdown pattern)
    const nestedUlRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
    const nestedUls = Array.from(liContent.matchAll(nestedUlRegex));

    for (const nestedUl of nestedUls) {
      const ulContent = nestedUl[1];
      const nestedLiRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const nestedLis = Array.from(ulContent.matchAll(nestedLiRegex));

      for (const nestedLi of nestedLis) {
        if (children.length >= 20) break; // Limit subnav items

        const liContentInner = nestedLi[1];
        const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i;
        const linkMatch = liContentInner.match(linkRegex);

        if (linkMatch) {
          const href = linkMatch[1].trim();
          let label = linkMatch[2].trim();
          label = this.cleanNavLabel(label);

          // Skip logos/icons
          if (this.isLogoOrIcon(liContentInner, href, label)) {
            continue;
          }

          if (this.isValidNavLink(href, domain, label) && label.length > 0) {
            const fullUrl = href.startsWith("http") ? href : new URL(href, domain).href;

            if (!seenUrls.has(fullUrl)) {
              children.push({
                label: label || this.inferLabelFromUrl(href),
                url: this.normalizeNavUrl(href, domain),
              });
              seenUrls.add(fullUrl);
            }
          }
        }
      }
    }

    return children;
  }

  /**
   * Extract direct navigation links (when no <ul> structure)
   */
  private extractDirectNavLinks(
    html: string,
    domain: string,
    seenUrls: Set<string>
  ): NavigationItem[] {
    const items: NavigationItem[] = [];

    // Find all <a> tags
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const links = Array.from(html.matchAll(linkRegex));

    for (const link of links) {
      if (items.length >= 15) break;

      const href = link[1].trim();
      let label = link[2].trim();
      label = this.cleanNavLabel(label);

      // Skip logos/icons
      if (this.isLogoOrIcon(link[0], href, label)) {
        continue;
      }

      if (this.isValidNavLink(href, domain, label) && label.length > 0) {
        const fullUrl = href.startsWith("http") ? href : new URL(href, domain).href;

        if (!seenUrls.has(fullUrl)) {
          items.push({
            label: label || this.inferLabelFromUrl(href),
            url: this.normalizeNavUrl(href, domain),
          });
          seenUrls.add(fullUrl);
        }
      }
    }

    return items;
  }

  /**
   * Clean navigation label (remove HTML, images, icons)
   */
  private cleanNavLabel(label: string): string {
    // Remove HTML tags
    let cleaned = label.replace(/<[^>]+>/g, "");

    // Remove image tags and their alt text patterns
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, ""); // Markdown images
    cleaned = cleaned.replace(/<img[^>]*>/gi, ""); // HTML images

    // Remove SVG icons (common pattern: <svg>...</svg>)
    cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/gi, "");

    // Remove common icon class patterns
    cleaned = cleaned.replace(/\bicon-[\w-]+\b/gi, "");

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Check if a link is a logo or icon (should be excluded from nav)
   */
  private isLogoOrIcon(htmlContent: string, href: string, label: string): boolean {
    const lowerHtml = htmlContent.toLowerCase();
    const lowerHref = href.toLowerCase();
    const lowerLabel = label.toLowerCase();

    // Check for image files in href
    if (/\.(svg|png|jpg|jpeg|gif|webp|ico)(\?|$)/i.test(href)) {
      return true;
    }

    // Check for logo in class/id/alt
    if (/logo|brand|icon|img|image/i.test(lowerHtml) &&
      (lowerHtml.includes('<img') || lowerHtml.includes('<svg') || lowerLabel.length === 0)) {
      return true;
    }

    // Check if label is empty or very short (likely an icon)
    if (label.length === 0 || (label.length <= 2 && !/[a-z]{2,}/i.test(label))) {
      return true;
    }

    // Check for common icon patterns
    if (/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(label)) {
      return true;
    }

    // Check if it's just an image with no text
    if (lowerHtml.includes('<img') && label.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Validate if item is a valid navigation item
   */
  private isValidNavigationItem(item: NavigationItem, domain: string): boolean {
    const url = item.url.toLowerCase();
    const label = item.label.toLowerCase();

    // Exclude external domains
    if (url.startsWith("http")) {
      try {
        const linkUrl = new URL(item.url);
        const domainUrl = new URL(domain);
        if (linkUrl.hostname !== domainUrl.hostname) {
          return false;
        }
      } catch {
        return false;
      }
    }

    // Exclude social media, login, etc.
    if (
      url.includes("facebook.com") ||
      url.includes("instagram.com") ||
      url.includes("twitter.com") ||
      url.includes("linkedin.com") ||
      url.includes("youtube.com") ||
      label.includes("login") ||
      label.includes("sign up") ||
      label.includes("newsletter") ||
      url.includes("/blog/") || // Blog posts
      url.includes("/product/") || // Product detail pages
      url.includes("/category/")
    ) {
      return false;
    }

    // Label should be reasonable
    if (label.length < 1 || label.length > 50) {
      return false;
    }

    // Validate children recursively
    if (item.children) {
      item.children = item.children.filter(child =>
        this.isValidNavigationItem(child, domain)
      );
    }

    return true;
  }

  /**
   * Helper: Check if link is valid for navigation
   */
  private isValidNavLink(href: string, domain: string, label: string): boolean {
    // Skip anchors, mailto, tel, javascript
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return false;
    }

    // Must be same domain or relative
    try {
      if (href.startsWith("http")) {
        const linkUrl = new URL(href);
        const domainUrl = new URL(domain);
        if (linkUrl.hostname !== domainUrl.hostname) {
          return false;
        }
      }
    } catch {
      return false;
    }

    // Label should be reasonable length
    if (label && (label.length < 2 || label.length > 50)) {
      return false;
    }

    return true;
  }

  /**
   * Helper: Normalize nav URL to relative path
   */
  private normalizeNavUrl(href: string, domain: string): string {
    if (href.startsWith("http")) {
      try {
        const url = new URL(href);
        const domainUrl = new URL(domain);
        if (url.hostname === domainUrl.hostname) {
          return url.pathname + url.search;
        }
      } catch {
        return href;
      }
    }
    return href.startsWith("/") ? href : `/${href}`;
  }

  /**
   * Helper: Infer label from URL
   */
  private inferLabelFromUrl(url: string): string {
    const path = url.split("?")[0].split("#")[0];
    const parts = path.split("/").filter(p => p);
    const lastPart = parts[parts.length - 1] || "Home";
    return lastPart
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Helper: Extract nav links from markdown
   */
  private extractNavLinksFromMarkdown(markdown: string, domain: string): Array<{ text: string; url: string }> {
    const links: Array<{ text: string; url: string }> = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null && links.length < 20) {
      const text = match[1].trim();
      const url = match[2].trim();

      if (!url.startsWith("#") && !url.startsWith("mailto:") && !url.startsWith("tel:")) {
        links.push({ text, url });
      }
    }

    return links;
  }

  /**
   * STEP 3: Scrape navigation pages
   */
  private async scrapeNavPages(
    domain: string,
    navItems: NavigationItem[]
  ): Promise<NormalizedPage[]> {
    const pages: NormalizedPage[] = [];
    const maxPages = Math.min(navItems.length, 20); // Limit to 20 pages (includes subnav)

    for (let i = 0; i < maxPages; i++) {
      const navItem = navItems[i];
      try {
        const fullUrl = navItem.url.startsWith("http")
          ? navItem.url
          : `${domain}${navItem.url.startsWith("/") ? navItem.url : `/${navItem.url}`}`;

        console.log(`[Firecrawl] Scraping nav page: ${fullUrl}`);

        const response = await fetch(`${this.baseUrl}/scrape`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            url: fullUrl,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (!response.ok) {
          console.warn(`[Firecrawl] Failed to scrape ${fullUrl}: ${response.status}`);
          continue;
        }

        const data: FirecrawlScrapeResponse = await response.json();

        if (data.success && data.data?.markdown) {
          const normalizedPage = this.normalizePageData({
            name: navItem.label,
            url: navItem.url,
            markdown: data.data.markdown,
            metadata: data.data.metadata,
          });
          pages.push(normalizedPage);
        }
      } catch (error) {
        console.error(`[Firecrawl] Error scraping nav page ${navItem.url}:`, error);
        // Continue with next page on error
        continue;
      }
    }

    return pages;
  }

  /**
   * STEP 4: Normalize page data into required structure
   */
  private normalizePageData(data: {
    name: string;
    url: string;
    markdown: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  }): NormalizedPage {
    const { name, url, markdown, metadata } = data;

    // Extract sections from markdown
    const sections = this.extractSectionsFromMarkdown(markdown);

    return {
      name,
      url,
      sections,
    };
  }

  /**
   * Extract sections with headings, copy, images, and CTAs
   */
  private extractSectionsFromMarkdown(markdown: string): PageSection[] {
    const sections: PageSection[] = [];

    // Split by headers (H1, H2, H3)
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    const parts: Array<{ level: number; heading: string; content: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = headerRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const heading = match[2].trim();
      const contentStart = match.index + match[0].length;

      // Get content before this header (for previous section)
      if (parts.length > 0) {
        parts[parts.length - 1].content = markdown.slice(lastIndex, match.index).trim();
      }

      parts.push({
        level,
        heading,
        content: "",
      });

      lastIndex = contentStart;
    }

    // Add remaining content to last section
    if (parts.length > 0) {
      parts[parts.length - 1].content = markdown.slice(lastIndex).trim();
    }

    // If no headers found, create one section from entire content
    if (parts.length === 0) {
      parts.push({
        level: 1,
        heading: "Content",
        content: markdown.trim(),
      });
    }

    // Convert parts to sections
    for (const part of parts) {
      const images = this.extractImages(part.content);
      const ctas = this.extractCTAs(part.content);
      const copy = this.cleanCopy(part.content);

      sections.push({
        heading: part.heading,
        copy: copy || "",
        images,
        ctas,
      });
    }

    return sections;
  }

  /**
   * Extract image URLs from markdown
   */
  private extractImages(content: string): string[] {
    const images: string[] = [];

    // Markdown images: ![alt](url)
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = markdownImageRegex.exec(content)) !== null) {
      const url = match[2].trim();
      if (url && (url.startsWith("http") || url.startsWith("/"))) {
        images.push(url);
      }
    }

    // HTML img tags
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = htmlImageRegex.exec(content)) !== null) {
      const url = match[1].trim();
      if (url && (url.startsWith("http") || url.startsWith("/"))) {
        images.push(url);
      }
    }

    return [...new Set(images)]; // Remove duplicates
  }

  /**
   * Extract CTAs (buttons/links) from content
   */
  private extractCTAs(content: string): Array<{ label: string; url: string }> {
    const ctas: Array<{ label: string; url: string }> = [];

    // Common CTA patterns
    const ctaPatterns = [
      /(?:book|schedule|get started|start now|learn more|contact us|call now|request|sign up|register|buy now|shop now)/i,
    ];

    // Extract markdown links that match CTA patterns
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const label = match[1].trim();
      const url = match[2].trim();

      // Check if label matches CTA pattern
      const isCTA = ctaPatterns.some(pattern => pattern.test(label));

      if (isCTA && !url.startsWith("#") && !url.startsWith("mailto:") && !url.startsWith("tel:")) {
        ctas.push({ label, url });
      }
    }

    // Extract HTML buttons/links
    const buttonRegex = /<(?:a|button)[^>]+(?:href|onclick)=["']([^"']+)["'][^>]*>([^<]+)<\/(?:a|button)>/gi;
    while ((match = buttonRegex.exec(content)) !== null) {
      const url = match[1].trim();
      const label = match[2].trim().replace(/<[^>]+>/g, "");

      const isCTA = ctaPatterns.some(pattern => pattern.test(label));

      if (isCTA && label.length > 0 && !url.startsWith("#") && !url.startsWith("mailto:") && !url.startsWith("tel:")) {
        ctas.push({ label, url });
      }
    }

    return ctas.slice(0, 5); // Limit to 5 CTAs per section
  }

  /**
   * Clean copy text (remove markdown syntax, images, links but keep text)
   */
  private cleanCopy(content: string): string {
    let cleaned = content;

    // Remove images
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

    // Convert links to just text: [text](url) -> text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Remove HTML tags but keep text
    cleaned = cleaned.replace(/<[^>]+>/g, "");

    // Remove markdown headers
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    cleaned = cleaned.replace(/[ \t]+/g, " ");

    return cleaned.trim();
  }

  /**
   * Extract logo URL from homepage
   */
  private extractLogo(markdown: string, html: string, domain: string): string | undefined {
    // Look for logo in HTML first
    if (html) {
      const logoRegex = /<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["'][^>]*>/i;
      const match = html.match(logoRegex);
      if (match && match[1]) {
        const url = match[1].trim();
        return url.startsWith("http") ? url : new URL(url, domain).href;
      }
    }

    // Fallback: look in markdown
    const markdownImageRegex = /!\[([^\]]*logo[^\]]*)\]\(([^)]+)\)/i;
    const markdownMatch = markdown.match(markdownImageRegex);
    if (markdownMatch && markdownMatch[2]) {
      const url = markdownMatch[2].trim();
      return url.startsWith("http") ? url : new URL(url, domain).href;
    }

    return undefined;
  }

}

