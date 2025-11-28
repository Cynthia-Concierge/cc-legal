/**
 * Configuration Service
 * Manages custom prompts and AutoGen agent configurations using Supabase
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface NodePromptConfig {
  nodeId: string;
  prompt: string;
  lastModified?: number;
}

export interface AutoGenAgentConfig {
  agentId: string;
  systemMessage: string;
  model?: string;
  temperature?: number;
  enabled?: boolean;
}

export interface WorkflowConfig {
  nodePrompts: Record<string, NodePromptConfig>;
  autogenAgents: Record<string, AutoGenAgentConfig>;
  lastModified?: number;
}

export class ConfigService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Load all configurations from Supabase
   */
  async loadConfig(): Promise<WorkflowConfig> {
    try {
      const { data, error } = await this.supabase
        .from("workflow_config")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("[ConfigService] Error loading config:", error);
        return { nodePrompts: {}, autogenAgents: {} };
      }

      const config: WorkflowConfig = {
        nodePrompts: {},
        autogenAgents: {},
      };

      if (data) {
        data.forEach((item) => {
          if (item.config_type === "node_prompt") {
            config.nodePrompts[item.config_key] = {
              nodeId: item.config_key,
              prompt: item.config_value.prompt,
              lastModified: new Date(item.updated_at).getTime(),
            };
          } else if (item.config_type === "autogen_agent") {
            config.autogenAgents[item.config_key] = {
              agentId: item.config_key,
              ...item.config_value,
            };
          }
        });
      }

      return config;
    } catch (error) {
      console.error("[ConfigService] Error loading config:", error);
      return { nodePrompts: {}, autogenAgents: {} };
    }
  }

  /**
   * Get node prompt configuration
   */
  async getNodePrompt(nodeId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from("workflow_config")
        .select("config_value")
        .eq("config_type", "node_prompt")
        .eq("config_key", nodeId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.config_value?.prompt || null;
    } catch (error) {
      console.error(`[ConfigService] Error getting prompt for ${nodeId}:`, error);
      return null;
    }
  }

  /**
   * Set node prompt configuration
   */
  async setNodePrompt(nodeId: string, prompt: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("workflow_config")
        .upsert(
          {
            config_type: "node_prompt",
            config_key: nodeId,
            config_value: { prompt },
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "config_type,config_key",
          }
        );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`[ConfigService] Error saving prompt for ${nodeId}:`, error);
      throw error;
    }
  }

  /**
   * Get AutoGen agent configuration
   */
  async getAutoGenAgent(agentId: string): Promise<AutoGenAgentConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from("workflow_config")
        .select("config_value")
        .eq("config_type", "autogen_agent")
        .eq("config_key", agentId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        agentId,
        ...data.config_value,
      };
    } catch (error) {
      console.error(`[ConfigService] Error getting agent config for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Set AutoGen agent configuration
   */
  async setAutoGenAgent(agentId: string, config: Omit<AutoGenAgentConfig, "agentId">): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("workflow_config")
        .upsert(
          {
            config_type: "autogen_agent",
            config_key: agentId,
            config_value: config,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "config_type,config_key",
          }
        );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`[ConfigService] Error saving agent config for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(configType: "node_prompt" | "autogen_agent", configKey: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("workflow_config")
        .delete()
        .eq("config_type", configType)
        .eq("config_key", configKey);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`[ConfigService] Error deleting config:`, error);
      throw error;
    }
  }

  /**
   * Reset all configurations
   */
  async resetConfig(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("workflow_config")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("[ConfigService] Error resetting config:", error);
      throw error;
    }
  }
}

