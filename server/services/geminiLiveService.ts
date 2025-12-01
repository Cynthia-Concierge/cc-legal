/**
 * Gemini Live Service
 * Handles Gemini Live API integration for AI receptionist
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface GeminiConfig {
  businessName: string;
  businessConfig: any;
  systemPrompt?: string;
}

export class GeminiLiveService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate system prompt from business config
   */
  generateSystemPrompt(config: GeminiConfig, customPrompt?: string): string {
    if (customPrompt) {
      return customPrompt.replace("{{business.name}}", config.businessName);
    }

    const { businessName, businessConfig } = config;

    const services = businessConfig.services || [];
    const pricing = businessConfig.pricing || {};
    const faqs = businessConfig.faqs || [];
    const hours = businessConfig.hours || "Not specified";
    const bookingType = businessConfig.bookingSystem?.type || "mock";

    let prompt = `You are the AI receptionist for ${businessName}.\n\n`;
    prompt += `Your role is to:\n`;
    prompt += `- Answer questions about services, pricing, and availability\n`;
    prompt += `- Help customers book appointments\n`;
    prompt += `- Provide information about the business\n`;
    prompt += `- Be friendly, professional, and helpful\n\n`;

    if (services.length > 0) {
      prompt += `Available Services:\n`;
      services.forEach((service: any, index: number) => {
        if (typeof service === "string") {
          prompt += `${index + 1}. ${service}\n`;
        } else if (service.name) {
          prompt += `${index + 1}. ${service.name}${service.description ? ` - ${service.description}` : ""}${service.price ? ` - $${service.price}` : ""}\n`;
        }
      });
      prompt += `\n`;
    }

    if (Object.keys(pricing).length > 0) {
      prompt += `Pricing Information:\n`;
      prompt += JSON.stringify(pricing, null, 2);
      prompt += `\n\n`;
    }

    if (faqs.length > 0) {
      prompt += `Frequently Asked Questions:\n`;
      faqs.forEach((faq: any, index: number) => {
        if (typeof faq === "string") {
          prompt += `Q${index + 1}: ${faq}\n`;
        } else if (faq.question) {
          prompt += `Q${index + 1}: ${faq.question}\n`;
          prompt += `A${index + 1}: ${faq.answer || "See above"}\n\n`;
        }
      });
    }

    prompt += `\nBusiness Hours: ${hours}\n\n`;

    if (bookingType === "mock") {
      prompt += `Booking System: Mock/Demo mode. When customers want to book, confirm their details and let them know you'll process the booking. Use the booking tools provided.\n`;
    } else {
      prompt += `Booking System: Real booking system (${bookingType}). Use the booking tools provided to schedule appointments.\n`;
    }

    prompt += `\nImportant Rules:\n`;
    prompt += `- Never hallucinate information. Only use what's provided in the business config.\n`;
    prompt += `- If you don't know something, say so and offer to help find the information.\n`;
    prompt += `- Always be professional and courteous.\n`;
    prompt += `- Reference the business name naturally in conversation.\n`;

    return prompt;
  }

  /**
   * Create a chat session with Gemini
   */
  async createChat(config: GeminiConfig, customPrompt?: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const systemPrompt = this.generateSystemPrompt(config, customPrompt);
      
      // Start chat with system prompt as first message
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [{ text: "Hello! I'm the AI receptionist for " + config.businessName + ". How can I help you today?" }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      return chat;
    } catch (error: any) {
      console.error("Error creating Gemini chat:", error);
      throw error;
    }
  }

  /**
   * Send a message to Gemini and get response
   */
  async sendMessage(
    chat: any,
    message: string
  ): Promise<string> {
    try {
      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Error sending message to Gemini:", error);
      throw error;
    }
  }

  /**
   * Generate a response using the model directly (for API endpoints)
   */
  async generateResponse(
    config: GeminiConfig,
    userMessage: string,
    conversationHistory: GeminiMessage[] = [],
    customPrompt?: string
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const systemPrompt = this.generateSystemPrompt(config, customPrompt);
      
      // Build conversation history
      const history: any[] = [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm ready to help customers." }],
        },
      ];

      // Add conversation history
      history.push(...conversationHistory);

      // Add current user message
      history.push({
        role: "user",
        parts: [{ text: userMessage }],
      });

      const chat = model.startChat({
        history: history.slice(0, -1), // All except last message
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Error generating Gemini response:", error);
      throw error;
    }
  }
}

