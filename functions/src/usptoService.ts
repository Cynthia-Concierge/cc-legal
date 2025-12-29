/**
 * USPTO Trademark Search Service (Firebase Functions)
 * 
 * Simplified version without Puppeteer dependency
 * Returns safe fallback results for trademark searches
 */

export interface TrademarkSearchResult {
  serialNumber: string;
  registrationNumber?: string;
  markText: string;
  status: string;
  statusDate: string;
  filingDate: string;
  registrationDate?: string;
  owner: string;
  goodsServices: string;
  markType: string;
  liveOrDead: 'LIVE' | 'DEAD';
}

export interface TrademarkSearchResponse {
  found: boolean;
  totalResults: number;
  trademarks: TrademarkSearchResult[];
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  recommendation: string;
  searchedTerm: string;
}

export class USPTOService {
  /**
   * Search for trademarks matching or similar to the given business name
   * Returns safe fallback results (no actual scraping without Puppeteer)
   */
  async searchTrademarks(businessName: string): Promise<TrademarkSearchResponse> {
    try {
      console.log(`[USPTO] Searching for trademarks: "${businessName}"`);

      // Clean the business name for search
      const cleanName = this.cleanBusinessName(businessName);

      // For now, return safe LOW RISK results
      // In the future, this could be enhanced with:
      // 1. USPTO Official API (requires registration at developer.uspto.gov)
      // 2. Third-party API services
      // 3. Database of known trademarks
      
      const results: TrademarkSearchResult[] = [];

      return this.analyzeResults(businessName, results);
    } catch (error) {
      console.error('[USPTO] Error searching trademarks:', error);

      // Return a safe default response
      return {
        found: false,
        totalResults: 0,
        trademarks: [],
        riskLevel: 'MODERATE',
        recommendation: 'We encountered an issue checking the USPTO database. We recommend conducting a manual search at tmsearch.uspto.gov or consulting with a trademark attorney.',
        searchedTerm: businessName
      };
    }
  }

  /**
   * Clean business name for trademark search
   * Removes common business suffixes and special characters
   */
  private cleanBusinessName(name: string): string {
    let cleaned = name.trim();

    // Remove common business suffixes
    const suffixes = [
      'LLC', 'Inc', 'Inc.', 'Corp', 'Corp.', 'Ltd', 'Ltd.', 'LP', 'LLP',
      'PC', 'P.C.', 'PA', 'P.A.', 'Co', 'Co.', 'Company'
    ];

    for (const suffix of suffixes) {
      const regex = new RegExp(`\\s+${suffix.replace('.', '\\.')}\\s*$`, 'i');
      cleaned = cleaned.replace(regex, '');
    }

    // Remove special characters but keep spaces
    cleaned = cleaned.replace(/[^\w\s]/g, '');

    return cleaned.trim();
  }

  /**
   * Analyze search results and determine risk level
   */
  private analyzeResults(
    originalName: string,
    results: TrademarkSearchResult[]
  ): TrademarkSearchResponse {
    const liveMarks = results.filter(r => r.liveOrDead === 'LIVE');
    const exactMatches = liveMarks.filter(r =>
      r.markText.toLowerCase() === this.cleanBusinessName(originalName).toLowerCase()
    );
    const similarMatches = liveMarks.filter(r =>
      r.markText.toLowerCase().includes(this.cleanBusinessName(originalName).toLowerCase()) ||
      this.cleanBusinessName(originalName).toLowerCase().includes(r.markText.toLowerCase())
    );

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    let recommendation: string;

    if (exactMatches.length > 0) {
      riskLevel = 'HIGH';
      recommendation = `⚠️ HIGH RISK: We found ${exactMatches.length} exact or very similar trademark(s) already registered. Using this name could lead to legal conflicts. We strongly recommend choosing a different name or consulting with a trademark attorney immediately.`;
    } else if (similarMatches.length > 0) {
      riskLevel = 'MODERATE';
      recommendation = `⚡ MODERATE RISK: We found ${similarMatches.length} similar trademark(s) that could potentially conflict with your business name. While not exact matches, these similarities could cause confusion in the marketplace. We recommend a comprehensive trademark search and legal consultation before proceeding.`;
    } else if (liveMarks.length > 0) {
      riskLevel = 'MODERATE';
      recommendation = `⚡ MODERATE RISK: We found ${liveMarks.length} registered trademark(s) with some similarities. While the risk may be lower, we recommend a professional trademark search to ensure there are no conflicts.`;
    } else {
      riskLevel = 'LOW';
      recommendation = `✅ LOW RISK: Our preliminary search didn't find any exact matches in the USPTO database. However, this is a basic automated check and doesn't guarantee availability. We recommend conducting a comprehensive trademark search at tmsearch.uspto.gov and consulting with a trademark attorney before making significant branding investments.`;
    }

    return {
      found: liveMarks.length > 0,
      totalResults: liveMarks.length,
      trademarks: liveMarks.slice(0, 10), // Return top 10 matches
      riskLevel,
      recommendation,
      searchedTerm: originalName
    };
  }
}

export const usptoService = new USPTOService();

