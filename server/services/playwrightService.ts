/**
 * Playwright Service
 * Handles screenshot capture for website analysis
 */

import { chromium, Browser, Page } from "playwright";

export interface ScreenshotOptions {
  fullPage?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
  waitForSelector?: string;
  waitForTimeout?: number;
}

export class PlaywrightService {
  private browser: Browser | null = null;

  /**
   * Initialize browser (lazy loading)
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
      });
    }
    return this.browser;
  }

  /**
   * Take a screenshot of a webpage
   */
  async takeScreenshot(
    url: string,
    options: ScreenshotOptions = {}
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport
      if (options.viewportWidth || options.viewportHeight) {
        await page.setViewportSize({
          width: options.viewportWidth || 1920,
          height: options.viewportHeight || 1080,
        });
      }

      // Navigate to URL
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: options.waitForTimeout || 10000,
        });
      } else if (options.waitForTimeout) {
        await page.waitForTimeout(options.waitForTimeout);
      }

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: options.fullPage !== false, // Default to full page
        type: "png",
      });

      return screenshot as Buffer;
    } catch (error) {
      console.error(`Error taking screenshot of ${url}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Take multiple screenshots (for navigation detection)
   */
  async takeMultipleScreenshots(
    urls: string[],
    options: ScreenshotOptions = {}
  ): Promise<Map<string, Buffer>> {
    const screenshots = new Map<string, Buffer>();

    for (const url of urls) {
      try {
        const screenshot = await this.takeScreenshot(url, options);
        screenshots.set(url, screenshot);
      } catch (error) {
        console.error(`Failed to screenshot ${url}:`, error);
        // Continue with other URLs
      }
    }

    return screenshots;
  }

  /**
   * Extract navigation structure by analyzing page
   */
  async extractNavigation(url: string): Promise<{
    links: Array<{ label: string; url: string }>;
    screenshot?: Buffer;
  }> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Extract all navigation links
      const links = await page.evaluate(() => {
        const navLinks: Array<{ label: string; url: string }> = [];
        const seen = new Set<string>();

        // Find all links in nav elements
        const navElements = document.querySelectorAll("nav a, header a");
        navElements.forEach((link) => {
          const href = (link as HTMLAnchorElement).href;
          const text = link.textContent?.trim() || "";

          if (
            href &&
            text &&
            !href.startsWith("#") &&
            !href.startsWith("mailto:") &&
            !href.startsWith("tel:") &&
            !seen.has(href)
          ) {
            seen.add(href);
            navLinks.push({
              label: text,
              url: href,
            });
          }
        });

        return navLinks;
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: true,
        type: "png",
      });

      return {
        links,
        screenshot: screenshot as Buffer,
      };
    } catch (error) {
      console.error(`Error extracting navigation from ${url}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Close browser (cleanup)
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Cleanup on service destruction
   */
  async destroy(): Promise<void> {
    await this.close();
  }
}

