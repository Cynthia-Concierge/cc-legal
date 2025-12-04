/**
 * Meta Conversions API Service
 * Handles sending conversion events to Meta (Facebook) via the Conversions API
 */

export class MetaService {
  private accessToken: string;
  private pixelId: string;
  private baseUrl = "https://graph.facebook.com/v21.0";

  constructor(accessToken: string, pixelId: string) {
    this.accessToken = accessToken;
    this.pixelId = pixelId;
  }

  /**
   * Send a Lead event to Meta Conversions API
   */
  async sendLeadEvent(
    userData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      website?: string;
    },
    eventData?: {
      eventName?: string;
      eventTime?: number;
      eventSourceUrl?: string;
      actionSource?: string;
      eventId?: string; // Required for deduplication with Pixel events
    }
  ): Promise<any> {
    try {
      // Hash email and phone for privacy (SHA256)
      const hashedEmail = userData.email
        ? await this.hashData(userData.email.toLowerCase().trim())
        : undefined;
      const hashedPhone = userData.phone
        ? await this.hashData(userData.phone.replace(/\D/g, "")) // Remove non-digits
        : undefined;

      // Prepare user data object
      const userDataObj: any = {};
      if (hashedEmail) userDataObj.em = hashedEmail;
      if (hashedPhone) userDataObj.ph = hashedPhone;
      if (userData.firstName) userDataObj.fn = await this.hashData(userData.firstName.toLowerCase().trim());
      if (userData.lastName) userDataObj.ln = await this.hashData(userData.lastName.toLowerCase().trim());

      // Prepare event data
      const event: any = {
        event_name: eventData?.eventName || "Lead",
        event_time: eventData?.eventTime || Math.floor(Date.now() / 1000),
        action_source: eventData?.actionSource || "website",
        user_data: userDataObj,
      };

      // Add event_id for deduplication (CRITICAL - must match Pixel event_id)
      if (eventData?.eventId) {
        event.event_id = eventData.eventId;
      }

      // Add event source URL if provided
      if (eventData?.eventSourceUrl) {
        event.event_source_url = eventData.eventSourceUrl;
      }

      // Prepare the request payload
      const payload = {
        data: [event],
        access_token: this.accessToken,
      };

      const url = `${this.baseUrl}/${this.pixelId}/events`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }

        throw new Error(
          `Meta API error: ${errorData.error?.message || errorText} (Status: ${response.status})`
        );
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("Error sending lead event to Meta:", error);
      throw error;
    }
  }

  /**
   * Hash data using SHA-256 (required by Meta for PII)
   */
  private async hashData(data: string): Promise<string> {
    // Use Node.js crypto module
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}
