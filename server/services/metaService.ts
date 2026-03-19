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
      fbc?: string;
      fbp?: string;
    },
    eventData?: {
      eventName?: string;
      eventTime?: number;
      eventSourceUrl?: string;
      actionSource?: string;
      eventId?: string; // Required for deduplication with Pixel events
    }
  ): Promise<any> {
    return this.sendEvent("Lead", userData, eventData);
  }

  /**
   * Send a Schedule event to Meta Conversions API
   */
  async sendScheduleEvent(
    userData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      fbc?: string;
      fbp?: string;
    },
    eventData?: {
      eventTime?: number;
      eventSourceUrl?: string;
      actionSource?: string;
      eventId?: string;
    }
  ): Promise<any> {
    return this.sendEvent("Schedule", userData, {
      ...eventData,
      eventName: "Schedule",
    });
  }

  /**
   * Internal: send any event type to Meta CAPI
   */
  private async sendEvent(
    defaultEventName: string,
    userData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      website?: string;
      fbc?: string;
      fbp?: string;
    },
    eventData?: {
      eventName?: string;
      eventTime?: number;
      eventSourceUrl?: string;
      actionSource?: string;
      eventId?: string;
    }
  ): Promise<any> {
    try {
      // Hash email and phone for privacy (SHA256)
      const hashedEmail = userData.email
        ? await this.hashData(userData.email.toLowerCase().trim())
        : undefined;
      // Phone should already be in E.164 format (+15551234567) from backend normalization
      // Meta requires E.164 format with country code, so we keep it as-is
      const hashedPhone = userData.phone
        ? await this.hashData(userData.phone.trim())
        : undefined;

      // Prepare user data object
      const userDataObj: any = {};
      if (hashedEmail) userDataObj.em = hashedEmail;
      if (hashedPhone) userDataObj.ph = hashedPhone;
      if (userData.firstName) userDataObj.fn = await this.hashData(userData.firstName.toLowerCase().trim());
      if (userData.lastName) userDataObj.ln = await this.hashData(userData.lastName.toLowerCase().trim());
      // fbc and fbp are NOT hashed — they're click/browser IDs, not PII
      if (userData.fbc) userDataObj.fbc = userData.fbc;
      if (userData.fbp) userDataObj.fbp = userData.fbp;

      // Prepare event data
      const event: any = {
        event_name: eventData?.eventName || defaultEventName,
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
      console.error(`Error sending ${defaultEventName} event to Meta:`, error);
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
