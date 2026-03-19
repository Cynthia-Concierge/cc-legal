// @ts-nocheck
/**
 * Widget Service
 * Handles widget initialization and Gemini Live integration
 */

import { GeminiLiveService } from "./geminiLiveService.js";
import { BusinessConfigService, WidgetConfig } from "./businessConfigService.js";

export interface WidgetChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface WidgetChatResponse {
  message: string;
  conversationId?: string;
}

export class WidgetService {
  private geminiService: GeminiLiveService;
  private configService: BusinessConfigService;
  private conversations: Map<string, any> = new Map(); // Store active chat sessions

  constructor(
    geminiApiKey: string,
    configService: BusinessConfigService
  ) {
    this.geminiService = new GeminiLiveService(geminiApiKey);
    this.configService = configService;
  }

  /**
   * Initialize widget for a business
   */
  async initializeWidget(businessId: string): Promise<WidgetConfig | null> {
    try {
      const config = await this.configService.getWidgetConfig(businessId);
      return config;
    } catch (error: any) {
      console.error("Error initializing widget:", error);
      return null;
    }
  }

  /**
   * Send a message through the widget chat
   */
  async sendMessage(
    businessId: string,
    userMessage: string,
    conversationId?: string
  ): Promise<WidgetChatResponse> {
    try {
      // Get business config
      const config = await this.configService.getWidgetConfig(businessId);
      if (!config) {
        throw new Error("Business config not found");
      }

      // Get or create conversation
      const convKey = conversationId || `conv_${businessId}_${Date.now()}`;
      let chat = this.conversations.get(convKey);

      if (!chat) {
        // Create new chat session
        const geminiConfig = {
          businessName: config.name,
          businessConfig: config,
        };
        chat = await this.geminiService.createChat(geminiConfig);
        this.conversations.set(convKey, chat);
      }

      // Send message and get response
      const response = await this.geminiService.sendMessage(chat, userMessage);

      return {
        message: response,
        conversationId: convKey,
      };
    } catch (error: any) {
      console.error("Error sending widget message:", error);
      throw error;
    }
  }

  /**
   * Generate response using direct API call (for stateless requests)
   */
  async generateResponse(
    businessId: string,
    userMessage: string,
    conversationHistory: WidgetChatMessage[] = []
  ): Promise<string> {
    try {
      const config = await this.configService.getWidgetConfig(businessId);
      if (!config) {
        throw new Error("Business config not found");
      }

      // Convert conversation history to Gemini format
      const geminiHistory = conversationHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const geminiConfig = {
        businessName: config.name,
        businessConfig: config,
      };

      const response = await this.geminiService.generateResponse(
        geminiConfig,
        userMessage,
        geminiHistory
      );

      return response;
    } catch (error: any) {
      console.error("Error generating widget response:", error);
      throw error;
    }
  }

  /**
   * Clean up conversation
   */
  cleanupConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * Clean up old conversations (call periodically)
   */
  cleanupOldConversations(maxAge: number = 3600000): void {
    // Default: 1 hour
    const now = Date.now();
    for (const [id, chat] of this.conversations.entries()) {
      // Simple cleanup - in production, track creation time
      // For now, just limit total conversations
      if (this.conversations.size > 1000) {
        // Remove oldest (first) entry
        const firstKey = this.conversations.keys().next().value;
        if (firstKey) {
          this.conversations.delete(firstKey);
        }
      }
    }
  }
}

