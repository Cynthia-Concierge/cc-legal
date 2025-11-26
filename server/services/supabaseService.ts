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
      // Split name into first and last name
      const nameParts = contactData.name.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      const { data, error } = await this.supabase
        .from("contacts")
        .insert([
          {
            email: contactData.email,
            name: contactData.name,
            first_name: first_name,
            last_name: last_name,
            phone: contactData.phone,
            website: contactData.website,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error saving contact to Supabase:", error);
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

