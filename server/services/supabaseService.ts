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
  first_name?: string;
  last_name?: string;
  source?: string;
}

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
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
            source: contactData.source || "wellness", // Default to 'wellness' if not provided
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
}

