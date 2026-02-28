/**
 * Supabase Service
 * Handles saving contacts to Supabase database
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  website: string;
  instagram_handle?: string;
  first_name?: string;
  last_name?: string;
  source?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  ad_attributed?: boolean;
}

export class SupabaseService {
  private supabase: SupabaseClient;
  public client: SupabaseClient; // Expose client for direct database access

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.client = this.supabase; // Expose as client for backward compatibility
  }

  /**
   * Save a contact to the Supabase database
   */
  async saveContact(contactData: ContactData): Promise<any> {
    try {
      // Validate required fields
      if (!contactData.email || !contactData.name) {
        throw new Error("Email and name are required");
      }

      // Split name into first and last name
      const nameParts = contactData.name.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      const { data, error } = await this.supabase
        .from("contacts")
        .insert([
          {
            email: contactData.email.trim().toLowerCase(),
            name: contactData.name.trim(),
            first_name: first_name,
            last_name: last_name,
            phone: contactData.phone?.trim() || "",
            website: contactData.website?.trim() || "",
            instagram: (contactData.instagram_handle && contactData.instagram_handle.trim()) || null,
            source: contactData.source || "wellness", // Default to 'wellness' if not provided
            utm_source: contactData.utm_source || null,
            utm_medium: contactData.utm_medium || null,
            utm_campaign: contactData.utm_campaign || null,
            utm_content: contactData.utm_content ?? null,
            utm_term: contactData.utm_term ?? null,
            ad_attributed: contactData.ad_attributed ?? false,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        // Handle duplicate email error gracefully
        if (error.code === "23505" || error.message?.includes("duplicate") || error.message?.includes("unique")) {
          console.log("Contact with this email already exists:", contactData.email);
          // Return the existing contact instead of throwing an error
          const { data: existingData } = await this.supabase
            .from("contacts")
            .select()
            .eq("email", contactData.email.trim().toLowerCase())
            .limit(1);

          if (existingData && existingData.length > 0) {
            return existingData;
          }
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error saving contact to Supabase:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
  }

  /**
   * Check if a contact with the given email already exists
   */
  async contactExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("contacts")
        .select("email")
        .eq("email", email)
        .limit(1);

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error: any) {
      console.error("Error checking if contact exists:", error);
      return false;
    }
  }

  /**
   * Save a lead to the book_a_call_funnel table
   * Allows multiple submissions per email (tracks each submission separately)
   */
  async saveBookCallFunnelLead(leadData: {
    name: string;
    email: string;
    phone: string;
    meta_lead_event_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer?: string;
  }): Promise<any> {
    try {
      if (!leadData.email || !leadData.name || !leadData.phone) {
        throw new Error("Email, name, and phone are required");
      }

      const { data, error } = await this.supabase
        .from("book_a_call_funnel")
        .insert([
          {
            name: leadData.name.trim(),
            email: leadData.email.trim().toLowerCase(),
            phone: leadData.phone.trim(),
            meta_lead_event_id: leadData.meta_lead_event_id || null,
            utm_source: leadData.utm_source || null,
            utm_medium: leadData.utm_medium || null,
            utm_campaign: leadData.utm_campaign || null,
            referrer: leadData.referrer || null,
            status: 'form_submitted',
            form_submitted_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error saving book call funnel lead:", error);
      throw error;
    }
  }

  /**
   * Update a book_a_call_funnel lead when Calendly booking is completed
   * Updates the most recent record for this email that hasn't been scheduled yet
   */
  async updateBookCallFunnelBooking(email: string, bookingData: {
    calendly_event_uri?: string;
    meta_schedule_event_id?: string;
  }): Promise<any> {
    try {
      // Find the most recent record for this email that hasn't been scheduled yet
      const { data: existingRecords, error: findError } = await this.supabase
        .from("book_a_call_funnel")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .eq("status", "form_submitted")
        .order("form_submitted_at", { ascending: false })
        .limit(1);

      if (findError) {
        throw findError;
      }

      if (!existingRecords || existingRecords.length === 0) {
        // No unscheduled record found - this is okay, might have been scheduled already
        console.log(`No unscheduled record found for email: ${email}`);
        return null;
      }

      const recordToUpdate = existingRecords[0];

      // Update the record
      const { data, error } = await this.supabase
        .from("book_a_call_funnel")
        .update({
          calendly_scheduled_at: new Date().toISOString(),
          calendly_event_uri: bookingData.calendly_event_uri || null,
          meta_schedule_event_id: bookingData.meta_schedule_event_id || null,
          status: 'call_scheduled',
        })
        .eq("id", recordToUpdate.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error updating book call funnel booking:", error);
      throw error;
    }
  }
}

