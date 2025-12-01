/**
 * Business Config Service
 * Handles storage and retrieval of business configuration JSON
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface BusinessConfig {
  id: string;
  business_id: string;
  raw_scrape?: any;
  normalized_scrape?: any;
  structured_data?: any;
  services?: any[];
  pricing?: any;
  faq?: any[];
  images?: {
    logo?: string;
    hero?: string;
    [key: string]: any;
  };
  navigation?: any;
  booking_rules?: {
    type: "mock" | "calendly" | "squarespace" | "aestheticpro" | "custom";
    calendar?: any[];
    availability?: any;
    [key: string]: any;
  };
  face_analysis_profile?: any;
  created_at: string;
  updated_at: string;
}

export interface BusinessConfigInput {
  business_id: string;
  raw_scrape?: any;
  normalized_scrape?: any;
  structured_data?: any;
  services?: any[];
  pricing?: any;
  faq?: any[];
  images?: any;
  navigation?: any;
  booking_rules?: any;
  face_analysis_profile?: any;
}

export interface WidgetConfig {
  name: string;
  domain: string;
  locations?: any[];
  services: any[];
  pricing: any;
  hours?: string;
  faqs: any[];
  bookingSystem: {
    type: string;
    calendar?: any[];
    [key: string]: any;
  };
  images: {
    logo?: string;
    hero?: string;
    [key: string]: any;
  };
  navigation?: any;
  [key: string]: any;
}

export class BusinessConfigService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get config for a business
   */
  async getConfig(businessId: string): Promise<BusinessConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from("business_configs")
        .select("*")
        .eq("business_id", businessId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error getting business config:", error);
      throw error;
    }
  }

  /**
   * Create or update config for a business
   */
  async upsertConfig(input: BusinessConfigInput): Promise<BusinessConfig> {
    try {
      const { data, error } = await this.supabase
        .from("business_configs")
        .upsert(
          {
            business_id: input.business_id,
            raw_scrape: input.raw_scrape || null,
            normalized_scrape: input.normalized_scrape || null,
            structured_data: input.structured_data || null,
            services: input.services || null,
            pricing: input.pricing || null,
            faq: input.faq || null,
            images: input.images || null,
            navigation: input.navigation || null,
            booking_rules: input.booking_rules || null,
            face_analysis_profile: input.face_analysis_profile || null,
          },
          {
            onConflict: "business_id",
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error upserting business config:", error);
      throw error;
    }
  }

  /**
   * Update specific fields in config
   */
  async updateConfig(
    businessId: string,
    updates: Partial<BusinessConfigInput>
  ): Promise<BusinessConfig> {
    try {
      const updateData: any = {};
      if (updates.raw_scrape !== undefined) updateData.raw_scrape = updates.raw_scrape;
      if (updates.normalized_scrape !== undefined) updateData.normalized_scrape = updates.normalized_scrape;
      if (updates.structured_data !== undefined) updateData.structured_data = updates.structured_data;
      if (updates.services !== undefined) updateData.services = updates.services;
      if (updates.pricing !== undefined) updateData.pricing = updates.pricing;
      if (updates.faq !== undefined) updateData.faq = updates.faq;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.navigation !== undefined) updateData.navigation = updates.navigation;
      if (updates.booking_rules !== undefined) updateData.booking_rules = updates.booking_rules;
      if (updates.face_analysis_profile !== undefined) updateData.face_analysis_profile = updates.face_analysis_profile;

      const { data, error } = await this.supabase
        .from("business_configs")
        .update(updateData)
        .eq("business_id", businessId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error updating business config:", error);
      throw error;
    }
  }

  /**
   * Get widget-ready config (formatted for widget.js)
   */
  async getWidgetConfig(businessId: string): Promise<WidgetConfig | null> {
    try {
      // Get business info
      const { data: business, error: businessError } = await this.supabase
        .from("businesses")
        .select("name, domain")
        .eq("id", businessId)
        .single();

      if (businessError || !business) {
        return null;
      }

      // Get config
      const config = await this.getConfig(businessId);
      if (!config) {
        return null;
      }

      // Format for widget
      const widgetConfig: WidgetConfig = {
        name: business.name,
        domain: business.domain,
        services: config.services || [],
        pricing: config.pricing || {},
        faqs: config.faq || [],
        bookingSystem: {
          type: config.booking_rules?.type || "mock",
          calendar: config.booking_rules?.calendar || [],
          ...(config.booking_rules || {}),
        },
        images: config.images || {},
        navigation: config.navigation,
      };

      // Add structured data if available
      if (config.structured_data) {
        Object.assign(widgetConfig, config.structured_data);
      }

      return widgetConfig;
    } catch (error: any) {
      console.error("Error getting widget config:", error);
      return null;
    }
  }

  /**
   * Delete config for a business
   */
  async deleteConfig(businessId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("business_configs")
        .delete()
        .eq("business_id", businessId);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error deleting business config:", error);
      throw error;
    }
  }
}

