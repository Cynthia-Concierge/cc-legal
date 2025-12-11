/**
 * Instantly.ai Service
 * Handles adding leads to Instantly.ai campaigns
 * Uses API v2 with Bearer token authentication
 */

export class InstantlyService {
  private apiKey: string;
  private baseUrl = "https://api.instantly.ai/api/v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Add a lead to an Instantly.ai campaign
   * Uses API v2 format with Bearer token authentication
   * @param updateIfExists - If true, will update existing lead in campaign by NOT skipping it
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
    },
    updateIfExists: boolean = false
  ): Promise<any> {
    try {
      // When updateIfExists is true, we want to UPDATE the lead, so we should NOT skip it
      // skip_if_in_campaign: false means "don't skip, add/update even if in campaign"
      // skip_if_in_campaign: true means "skip if already in campaign" (won't update)
      const skipIfInCampaign = !updateIfExists;
      
      console.log("[InstantlyService] Adding/updating lead:", {
        email,
        campaignId,
        updateIfExists,
        skipIfInCampaign,
        hasCustomVariables: !!leadData.custom_variables,
        customVariableKeys: leadData.custom_variables ? Object.keys(leadData.custom_variables) : [],
      });

      // API v2 uses Bearer token authentication
      const response = await fetch(
        `${this.baseUrl}/leads/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            leads: [
              {
                email,
                first_name: leadData.first_name,
                last_name: leadData.last_name,
                company_name: leadData.company,
                website: leadData.website,
                phone: leadData.phone,
                custom_variables: leadData.custom_variables || {},
              }
            ],
            campaign_id: campaignId,
            skip_if_in_workspace: false,
            skip_if_in_campaign: skipIfInCampaign, // false = update existing, true = skip existing
            skip_if_in_list: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || response.statusText;
        throw new Error(
          `Instantly.ai API error: ${response.status} - ${errorMessage}`
        );
      }

      const result = await response.json();
      console.log("[InstantlyService] Instantly.ai API response:", {
        email,
        campaignId,
        status: result.status || "success",
        uploaded: result.uploaded || result.uploaded_count || 0,
        skipped: result.skipped || result.skipped_count || 0,
        errors: result.errors || result.error_count || 0,
        fullResponse: JSON.stringify(result, null, 2),
      });
      
      return result;
    } catch (error: any) {
      console.error("[InstantlyService] Error adding lead to Instantly.ai:", {
        email,
        campaignId,
        error: error.message,
        status: error.status,
      });
      throw error;
    }
  }
}

