/**
 * Workflow Results Service
 * Handles saving workflow results to Supabase database
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface WorkflowResultData {
  websiteUrl: string;
  leadInfo?: {
    name?: string;
    company?: string;
    email?: string;
  };
  legalDocuments?: Record<string, string | undefined>;
  analysis?: {
    missingDocuments: string[];
    issues: Array<{
      document: string;
      issue: string;
      severity: "high" | "medium" | "low";
      whyItMatters?: string;
    }>;
    marketingRisks?: Array<{
      risk: string;
      severity: "high" | "medium" | "low";
      whyItMatters: string;
    }>;
    operationalRisks?: Array<{
      risk: string;
      severity: "high" | "medium" | "low";
      whyItMatters?: string;
    }>;
    recommendations: string[];
    summary: string;
  };
  email?: {
    subject: string;
    body: string;
  };
  contactInfo?: {
    instagram?: string;
    socialLinks?: Record<string, string>;
    emails?: string[];
  };
  executionDetails?: Record<string, any>;
  error?: string;
  status?: "pending" | "running" | "completed" | "error";
}

export class WorkflowResultsService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Save workflow results to Supabase
   */
  async saveWorkflowResult(resultData: WorkflowResultData): Promise<any> {
    try {
      const {
        websiteUrl,
        leadInfo,
        legalDocuments,
        analysis,
        email,
        contactInfo,
        executionDetails,
        error,
        status = error ? "error" : "completed",
      } = resultData;

      // Organize contact info into separate fields
      const scrapedEmails = contactInfo?.emails || [];
      const scrapedEmail = scrapedEmails.length > 0 ? scrapedEmails[0] : null;
      const socialLinks = contactInfo?.socialLinks || {};
      
      // Extract individual social media URLs
      const instagramUrl = contactInfo?.instagram || socialLinks.instagram || null;
      const facebookUrl = socialLinks.facebook || null;
      const twitterUrl = socialLinks.twitter || null;
      const linkedinUrl = socialLinks.linkedin || null;
      const tiktokUrl = socialLinks.tiktok || null;
      
      // Collect other social links (excluding the ones we have dedicated columns for)
      const otherSocialLinks: Record<string, string> = {};
      const knownPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
      for (const [platform, url] of Object.entries(socialLinks)) {
        const platformLower = platform.toLowerCase();
        // Only include platforms that don't have dedicated columns
        if (!knownPlatforms.includes(platformLower) && url) {
          otherSocialLinks[platform] = url;
        }
      }

      const { data, error: dbError } = await this.supabase
        .from("workflow_results")
        .insert([
          {
            website_url: websiteUrl,
            lead_name: leadInfo?.name || null,
            lead_company: leadInfo?.company || null,
            lead_email: leadInfo?.email || null,
            legal_documents: legalDocuments || null,
            analysis: analysis || null,
            scraped_email: scrapedEmail,
            scraped_emails: scrapedEmails.length > 0 ? scrapedEmails : null,
            instagram_url: instagramUrl,
            facebook_url: facebookUrl,
            twitter_url: twitterUrl,
            linkedin_url: linkedinUrl,
            tiktok_url: tiktokUrl,
            other_social_links: Object.keys(otherSocialLinks).length > 0 ? otherSocialLinks : null,
            email_subject: email?.subject || null,
            email_body: email?.body || null,
            execution_details: executionDetails || null,
            status: status,
            error_message: error || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      console.log("[WorkflowResults] Successfully saved workflow result:", data.id);

      // Update cold_leads table if this is a successful analysis
      if (status === "completed" && websiteUrl) {
        try {
          await this.updateColdLeadWithContactInfo(
            websiteUrl,
            leadInfo?.email,
            scrapedEmail,
            scrapedEmails,
            instagramUrl,
            facebookUrl,
            twitterUrl,
            linkedinUrl,
            tiktokUrl,
            otherSocialLinks
          );
        } catch (updateError: any) {
          // Don't fail the whole operation if updating cold_leads fails
          console.warn("[WorkflowResults] Failed to update cold_leads:", updateError.message);
        }
      }

      return data;
    } catch (error: any) {
      console.error("Error saving workflow result to Supabase:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Attempted to save:", {
        websiteUrl,
        hasLegalDocuments: !!legalDocuments,
        hasAnalysis: !!analysis,
        hasContactInfo: !!contactInfo,
        status,
      });
      throw error;
    }
  }

  /**
   * Update cold_leads table with analyzed_at timestamp and contact information
   */
  private async updateColdLeadWithContactInfo(
    websiteUrl: string,
    leadEmail?: string,
    scrapedEmail?: string | null,
    scrapedEmails?: string[] | null,
    instagramUrl?: string | null,
    facebookUrl?: string | null,
    twitterUrl?: string | null,
    linkedinUrl?: string | null,
    tiktokUrl?: string | null,
    otherSocialLinks?: Record<string, string> | null
  ): Promise<void> {
    try {
      const analyzedAt = new Date().toISOString();
      
      // Prepare update data with contact info
      const updateData: any = {
        analyzed_at: analyzedAt,
      };

      // Only update contact info fields if they have values
      if (scrapedEmail) updateData.scraped_email = scrapedEmail;
      if (scrapedEmails && scrapedEmails.length > 0) updateData.scraped_emails = scrapedEmails;
      if (instagramUrl) updateData.instagram_url = instagramUrl;
      if (facebookUrl) updateData.facebook_url = facebookUrl;
      if (twitterUrl) updateData.twitter_url = twitterUrl;
      if (linkedinUrl) updateData.linkedin_url_scraped = linkedinUrl;
      if (tiktokUrl) updateData.tiktok_url = tiktokUrl;
      if (otherSocialLinks && Object.keys(otherSocialLinks).length > 0) {
        updateData.other_social_links = otherSocialLinks;
      }

      // Try to match by website URL first
      if (websiteUrl) {
        const { data: websiteData, error: websiteError } = await this.supabase
          .from("cold_leads")
          .update(updateData)
          .eq("company_website", websiteUrl)
          .select();

        if (!websiteError && websiteData && websiteData.length > 0) {
          console.log(`[WorkflowResults] Updated cold_leads with contact info for website: ${websiteUrl}`);
          return;
        }
      }

      // If website match failed, try to match by email
      if (leadEmail) {
        const { data: emailData, error: emailError } = await this.supabase
          .from("cold_leads")
          .update(updateData)
          .or(`email_1.eq.${leadEmail},email_2.eq.${leadEmail}`)
          .select();

        if (!emailError && emailData && emailData.length > 0) {
          console.log(`[WorkflowResults] Updated cold_leads with contact info for email: ${leadEmail}`);
          return;
        }
      }

      // If no match found, log it but don't error
      console.log(`[WorkflowResults] No matching cold_leads found for website: ${websiteUrl} or email: ${leadEmail}`);
    } catch (error: any) {
      console.error("[WorkflowResults] Error updating cold_leads:", error);
      throw error;
    }
  }

  /**
   * Get workflow results by website URL
   */
  async getWorkflowResultsByWebsite(websiteUrl: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("workflow_results")
        .select("*")
        .eq("website_url", websiteUrl)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error fetching workflow results:", error);
      throw error;
    }
  }

  /**
   * Get workflow result by ID
   */
  async getWorkflowResultById(id: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from("workflow_results")
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
      console.error("Error fetching workflow result:", error);
      throw error;
    }
  }

  /**
   * Get all workflow results (with pagination)
   */
  async getAllWorkflowResults(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("workflow_results")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error fetching workflow results:", error);
      throw error;
    }
  }
}

