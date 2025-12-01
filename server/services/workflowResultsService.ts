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
        executionDetails,
        error,
        status = error ? "error" : "completed",
      } = resultData;

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
      return data;
    } catch (error: any) {
      console.error("Error saving workflow result to Supabase:", error);
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

