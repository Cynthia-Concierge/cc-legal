/**
 * Instantly.ai Service
 * Handles adding leads to Instantly.ai campaigns
 */

export class InstantlyService {
  private apiKey: string;
  private baseUrl = "https://api.instantly.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Add a lead to an Instantly.ai campaign
   */
  async addLeadToCampaign(
    email: string,
    campaignId: string,
    leadData: {
      first_name?: string;
      last_name?: string;
      company?: string;
      website?: string;
      phone?: string;
      custom_variables?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/lead/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": this.apiKey,
          },
          body: JSON.stringify({
            email,
            campaign_id: campaignId,
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            company: leadData.company,
            website: leadData.website,
            phone: leadData.phone,
            custom_variables: leadData.custom_variables || {},
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Instantly.ai API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding lead to Instantly.ai:", error);
      throw error;
    }
  }
}

