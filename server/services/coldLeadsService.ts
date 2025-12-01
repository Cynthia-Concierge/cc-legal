/**
 * Cold Leads Service
 * Handles importing and managing cold leads from Instantly or CSV files
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface ColdLeadData {
  firstName?: string;
  lastName?: string;
  company?: string;
  location?: string;
  linkedinUrl?: string;
  email1?: string;
  email2?: string;
  companyWebsite?: string;
  source?: string;
}

export interface ColdLeadRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  location: string | null;
  linkedin_url: string | null;
  email_1: string | null;
  email_2: string | null;
  company_website: string | null;
  source: string | null;
  imported_at: string;
  created_at: string;
  updated_at: string;
}

export class ColdLeadsService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Save a single cold lead to Supabase
   */
  async saveColdLead(leadData: ColdLeadData): Promise<any> {
    try {
      const {
        firstName,
        lastName,
        company,
        location,
        linkedinUrl,
        email1,
        email2,
        companyWebsite,
        source = "instantly",
      } = leadData;

      const { data, error } = await this.supabase
        .from("cold_leads")
        .insert([
          {
            first_name: firstName || null,
            last_name: lastName || null,
            company: company || null,
            location: location || null,
            linkedin_url: linkedinUrl || null,
            email_1: email1 || null,
            email_2: email2 || null,
            company_website: companyWebsite || null,
            source: source,
            imported_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error saving cold lead to Supabase:", error);
      throw error;
    }
  }

  /**
   * Import multiple cold leads in a batch
   */
  async importColdLeads(leads: ColdLeadData[]): Promise<{ success: number; failed: number; errors: any[] }> {
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    // Process in batches of 100 to avoid overwhelming Supabase
    const batchSize = 100;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      const batchData = batch.map((lead) => ({
        first_name: lead.firstName || null,
        last_name: lead.lastName || null,
        company: lead.company || null,
        location: lead.location || null,
        linkedin_url: lead.linkedinUrl || null,
        email_1: lead.email1 || null,
        email_2: lead.email2 || null,
        company_website: lead.companyWebsite || null,
        source: lead.source || "instantly",
        imported_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      try {
        const { data, error } = await this.supabase
          .from("cold_leads")
          .insert(batchData)
          .select();

        if (error) {
          throw error;
        }

        success += data?.length || 0;
      } catch (error: any) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error);
        failed += batch.length;
        errors.push({
          batch: i / batchSize + 1,
          error: error.message,
        });
      }
    }

    return { success, failed, errors };
  }

  /**
   * Get all cold leads (with pagination)
   */
  async getAllColdLeads(limit: number = 50, offset: number = 0): Promise<ColdLeadRow[]> {
    try {
      const { data, error } = await this.supabase
        .from("cold_leads")
        .select("*")
        .order("imported_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error fetching cold leads:", error);
      throw error;
    }
  }

  /**
   * Get cold leads by company
   */
  async getColdLeadsByCompany(company: string): Promise<ColdLeadRow[]> {
    try {
      const { data, error } = await this.supabase
        .from("cold_leads")
        .select("*")
        .ilike("company", `%${company}%`)
        .order("imported_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error fetching cold leads by company:", error);
      throw error;
    }
  }

  /**
   * Search cold leads by name, company, or email
   */
  async searchColdLeads(query: string): Promise<ColdLeadRow[]> {
    try {
      const { data, error } = await this.supabase
        .from("cold_leads")
        .select("*")
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%,email_1.ilike.%${query}%,email_2.ilike.%${query}%`
        )
        .order("imported_at", { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error searching cold leads:", error);
      throw error;
    }
  }

  /**
   * Delete a cold lead by ID
   */
  async deleteColdLead(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("cold_leads")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error("Error deleting cold lead:", error);
      throw error;
    }
  }
}

