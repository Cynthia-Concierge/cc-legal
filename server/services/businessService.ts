/**
 * Business Service
 * Handles CRUD operations for businesses
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface Business {
  id: string;
  domain: string;
  name: string;
  status: "pending" | "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessInput {
  domain: string;
  name: string;
  status?: "pending" | "active" | "inactive";
}

export interface UpdateBusinessInput {
  name?: string;
  status?: "pending" | "active" | "inactive";
}

export class BusinessService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new business
   */
  async createBusiness(input: CreateBusinessInput): Promise<Business> {
    try {
      const { data, error } = await this.supabase
        .from("businesses")
        .insert([
          {
            domain: input.domain.toLowerCase().trim(),
            name: input.name.trim(),
            status: input.status || "pending",
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error creating business:", error);
      throw error;
    }
  }

  /**
   * Get a business by ID
   */
  async getBusinessById(id: string): Promise<Business | null> {
    try {
      const { data, error } = await this.supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error getting business:", error);
      throw error;
    }
  }

  /**
   * Get a business by domain
   */
  async getBusinessByDomain(domain: string): Promise<Business | null> {
    try {
      const { data, error } = await this.supabase
        .from("businesses")
        .select("*")
        .eq("domain", domain.toLowerCase().trim())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error getting business by domain:", error);
      throw error;
    }
  }

  /**
   * List all businesses
   */
  async listBusinesses(): Promise<Business[]> {
    try {
      const { data, error } = await this.supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error listing businesses:", error);
      throw error;
    }
  }

  /**
   * Update a business
   */
  async updateBusiness(
    id: string,
    input: UpdateBusinessInput
  ): Promise<Business> {
    try {
      const updateData: any = {};
      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }
      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      const { data, error } = await this.supabase
        .from("businesses")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error updating business:", error);
      throw error;
    }
  }

  /**
   * Delete a business (cascades to business_configs)
   */
  async deleteBusiness(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("businesses")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error deleting business:", error);
      throw error;
    }
  }
}

