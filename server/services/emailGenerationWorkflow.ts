/**
 * LangGraph Workflow for Email Generation
 * Orchestrates: Firecrawl scraping -> Legal Analysis -> Email Generation
 */

import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { FirecrawlService } from "./firecrawlService.js";
import { OpenAIService } from "./openaiService.js";
import { AutoGenService } from "./autogenService.js";
import { WorkflowConfig } from "./configService.js";

/**
 * State interface for the workflow
 */
export interface AutoGenReview {
  agent: string;
  review: string;
  suggestions: string[];
  approved: boolean;
}

export interface NodeExecutionDetails {
  nodeId: string;
  nodeName: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  autogenEnabled: boolean;
  autogenReviews?: AutoGenReview[];
  prompt?: string;
  input?: any;
  output?: any;
  error?: string;
}

export interface EmailGenerationState {
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
  error?: string;
  executionDetails?: Record<string, NodeExecutionDetails>;
}

// Define state annotation using LangGraph's Annotation API
const StateAnnotation = Annotation.Root({
  websiteUrl: Annotation<string>({
    reducer: (left: string, right: string) => right ?? left,
  }),
  leadInfo: Annotation<{
    name?: string;
    company?: string;
    email?: string;
  }>({
    reducer: (left, right) => right ?? left,
  }),
  legalDocuments: Annotation<Record<string, string | undefined>>({
    reducer: (left, right) => right ?? left,
  }),
  analysis: Annotation<EmailGenerationState["analysis"]>({
    reducer: (left, right) => right ?? left,
  }),
  email: Annotation<EmailGenerationState["email"]>({
    reducer: (left, right) => right ?? left,
  }),
  error: Annotation<string>({
    reducer: (left: string, right: string) => right ?? left,
  }),
  executionDetails: Annotation<Record<string, NodeExecutionDetails>>({
    reducer: (left = {}, right = {}) => ({ ...left, ...right }),
  }),
});

/**
 * Email Generation Workflow Service
 */
export class EmailGenerationWorkflow {
  private firecrawlService: FirecrawlService;
  private openaiService: OpenAIService;
  private autogenService: AutoGenService;
  private graph: ReturnType<typeof this.buildWorkflow>;
  private useAutoGen: boolean;
  private config: WorkflowConfig;

  constructor(
    firecrawlApiKey: string,
    openaiApiKey: string,
    useAutoGen: boolean = true,
    config?: WorkflowConfig
  ) {
    this.firecrawlService = new FirecrawlService(firecrawlApiKey);
    this.config = config || { nodePrompts: {}, autogenAgents: {} };
    
    // Initialize services with custom configs
    this.openaiService = new OpenAIService(openaiApiKey, this.config.nodePrompts);
    this.autogenService = new AutoGenService(openaiApiKey, this.config.autogenAgents);
    this.useAutoGen = useAutoGen;

    // Build the workflow graph
    this.graph = this.buildWorkflow();
  }

  /**
   * Update configuration and reinitialize services
   */
  updateConfig(config: WorkflowConfig): void {
    this.config = config;
    this.openaiService = new OpenAIService(
      process.env.OPENAI_API_KEY || "",
      this.config.nodePrompts
    );
    this.autogenService = new AutoGenService(
      process.env.OPENAI_API_KEY || "",
      this.config.autogenAgents
    );
  }

  /**
   * Build the LangGraph workflow
   */
  private buildWorkflow() {
    const workflow = new StateGraph(StateAnnotation);

    // Add nodes
    workflow.addNode("firecrawl", this.firecrawlNode.bind(this));
    workflow.addNode("legal_analysis", this.legalAnalysisNode.bind(this));
    workflow.addNode("email_generation", this.emailGenerationNode.bind(this));

    // Define the flow - using node names as string literals
    workflow.addEdge(START, "firecrawl" as any);
    workflow.addEdge("firecrawl" as any, "legal_analysis" as any);
    workflow.addEdge("legal_analysis" as any, "email_generation" as any);
    workflow.addEdge("email_generation" as any, END);

    return workflow.compile();
  }

  /**
   * Firecrawl Node: Scrape website and extract legal documents
   */
  private async firecrawlNode(
    state: typeof StateAnnotation.State
  ): Promise<Partial<typeof StateAnnotation.State>> {
    const startTime = Date.now();
    const nodeId = "firecrawl";
    
    try {
      console.log(`[Firecrawl Node] Scraping website: ${state.websiteUrl}`);
      
      const legalDocuments = await this.firecrawlService.scrapeWebsite(
        state.websiteUrl
      );

      // Convert LegalDocuments to Record<string, string | undefined>
      const legalDocsRecord: Record<string, string | undefined> = {};
      if (legalDocuments.privacyPolicy) legalDocsRecord.privacyPolicy = legalDocuments.privacyPolicy;
      if (legalDocuments.termsOfService) legalDocsRecord.termsOfService = legalDocuments.termsOfService;
      if (legalDocuments.refundPolicy) legalDocsRecord.refundPolicy = legalDocuments.refundPolicy;
      if (legalDocuments.cookiePolicy) legalDocsRecord.cookiePolicy = legalDocuments.cookiePolicy;
      if (legalDocuments.disclaimer) legalDocsRecord.disclaimer = legalDocuments.disclaimer;
      if (legalDocuments.other) {
        legalDocuments.other.forEach((doc, idx) => {
          legalDocsRecord[`other_${idx}`] = doc;
        });
      }

      const endTime = Date.now();
      console.log(`[Firecrawl Node] Found ${Object.keys(legalDocsRecord).length} legal documents`);

      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Firecrawl",
        startTime,
        endTime,
        duration: endTime - startTime,
        autogenEnabled: false,
        input: { websiteUrl: state.websiteUrl },
        output: { documentCount: Object.keys(legalDocsRecord).length },
      };

      return {
        legalDocuments: legalDocsRecord,
        executionDetails,
      };
    } catch (error: any) {
      const endTime = Date.now();
      console.error("[Firecrawl Node] Error:", error);
      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Firecrawl",
        startTime,
        endTime,
        duration: endTime - startTime,
        autogenEnabled: false,
        input: { websiteUrl: state.websiteUrl },
        error: error.message || "Unknown error",
      };

      return {
        error: `Firecrawl error: ${error.message || "Unknown error"}`,
        executionDetails,
      };
    }
  }

  /**
   * Legal Analysis Node: Analyze legal documents using LLM
   * Enhanced with AutoGen multi-agent review
   */
  private async legalAnalysisNode(
    state: typeof StateAnnotation.State
  ): Promise<Partial<typeof StateAnnotation.State>> {
    const startTime = Date.now();
    const nodeId = "legal_analysis";
    
    try {
      if (state.error) {
        return { error: state.error };
      }

      if (!state.legalDocuments) {
        return { error: "No legal documents found to analyze" };
      }

      console.log("[Legal Analysis Node] Analyzing legal documents...");

      // Get the prompt that will be used (we'll extract it from the service)
      const prompt = this.getLegalAnalysisPrompt(state.websiteUrl, state.legalDocuments);

      const analysis = await this.openaiService.analyzeLegalDocuments(
        state.websiteUrl,
        state.legalDocuments
      );

      console.log(`[Legal Analysis Node] Analysis complete. Found ${analysis.issues.length} issues`);

      let finalAnalysis = analysis;
      let autogenReviews: AutoGenReview[] | undefined;
      let autogenError: string | undefined;

      // Enhance with AutoGen if enabled
      if (this.useAutoGen) {
        console.log("[Legal Analysis Node] Running AutoGen multi-agent review...");
        try {
          const { enhancedAnalysis, reviews } = await this.autogenService.reviewLegalAnalysis(
            analysis,
            state.legalDocuments,
            state.websiteUrl
          );

          finalAnalysis = enhancedAnalysis;
          autogenReviews = reviews;

          console.log(`[Legal Analysis Node] AutoGen review complete. ${reviews.filter(r => r.approved).length}/${reviews.length} agents approved.`);
        } catch (autogenError_: any) {
          autogenError = autogenError_.message;
          console.warn("[Legal Analysis Node] AutoGen review failed, using original analysis:", autogenError);
        }
      }

      const endTime = Date.now();

      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Legal Analysis",
        startTime,
        endTime,
        duration: endTime - startTime,
        autogenEnabled: this.useAutoGen,
        autogenReviews,
        prompt,
        input: {
          websiteUrl: state.websiteUrl,
          documentCount: Object.keys(state.legalDocuments).length,
        },
        output: {
          issuesFound: finalAnalysis.issues.length,
          missingDocuments: finalAnalysis.missingDocuments.length,
        },
        error: autogenError,
      };

      return {
        analysis: finalAnalysis,
        executionDetails,
      };
    } catch (error: any) {
      const endTime = Date.now();
      console.error("[Legal Analysis Node] Error:", error);
      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Legal Analysis",
        startTime,
        endTime,
        duration: endTime - startTime,
        autogenEnabled: this.useAutoGen,
        input: {
          websiteUrl: state.websiteUrl,
          documentCount: state.legalDocuments ? Object.keys(state.legalDocuments).length : 0,
        },
        error: error.message || "Unknown error",
      };

      return {
        error: `Legal analysis error: ${error.message || "Unknown error"}`,
        executionDetails,
      };
    }
  }

  /**
   * Get the prompt used for legal analysis (for display purposes)
   */
  private getLegalAnalysisPrompt(
    websiteUrl: string,
    legalDocuments?: Record<string, string | undefined>
  ): string {
    // Use custom prompt if available
    const customPrompt = this.config.nodePrompts?.legal_analysis?.prompt;
    if (customPrompt) {
      // Replace placeholders if documents are provided
      if (legalDocuments) {
        const documentsSummary = Object.entries(legalDocuments)
          .map(([docType, content]) => {
            if (content) {
              const truncatedContent = content.length > 5000
                ? content.substring(0, 5000) + "... [truncated]"
                : content;
              return `${docType}:\n${truncatedContent}\n---\n`;
            }
            return `${docType}: NOT FOUND\n---\n`;
          })
          .join("\n");
        return customPrompt
          .replace(/\$\{websiteUrl\}/g, websiteUrl)
          .replace(/\$\{documentsSummary\}/g, documentsSummary);
      }
      return customPrompt.replace(/\$\{websiteUrl\}/g, websiteUrl);
    }

    // Default prompt - prepare documents summary
    const documentsSummary = legalDocuments
      ? Object.entries(legalDocuments)
          .map(([docType, content]) => {
            if (content) {
              const truncatedContent = content.length > 5000
                ? content.substring(0, 5000) + "... [truncated]"
                : content;
              return `${docType}:\n${truncatedContent}\n---\n`;
            }
            return `${docType}: NOT FOUND\n---\n`;
          })
          .join("\n")
      : "[Documents will be provided after scraping]";

    // Default full prompt
    return `You are an expert legal compliance auditor specializing in fitness, wellness, coaching, and online service businesses. 

Your job is to analyze the *entire legal footprint* of a business based on the website content provided.

The business website URL is: ${websiteUrl}

Here are all legal documents and website text detected:

${documentsSummary}

Using this data, produce a comprehensive legal risk assessment that covers:

1. **Missing Required Legal Documents**
   Identify all documents that should exist for this type of business, including:
   - Privacy Policy
   - Terms of Service
   - Disclaimer (health, fitness, medical, coaching)
   - Refund / Cancellation Policy
   - Cookie Policy / Tracking Notice
   - Media Release / Testimonial Consent
   - Liability Waiver / Release of Claims
   - Coaching Agreement (if applicable)
   - Challenge / Program Terms (if applicable)

2. **Gaps or Issues in EXISTING Legal Documents**
   For each document found:
   - identify missing clauses
   - identify outdated language
   - identify vague or unenforceable terms
   - identify missing jurisdiction/venue clauses
   - identify missing limitation of liability clauses
   - identify missing indemnification clauses
   - identify missing assumption of risk language
   - evaluate compliance with GDPR/CCPA if collecting data

3. **Marketing & FTC Compliance Risks**
   Identify risky elements such as:
   - before/after photos without media release rights
   - testimonials without disclaimers
   - weight loss or health claims without qualifiers
   - "guarantees" or "promises" without proper legal structure

4. **Operational & Website Compliance Risks**
   - missing contact details
   - missing business address
   - unclear pricing
   - accessibility (ADA) issues
   - broken policy links
   - missing consent checkboxes during checkout or opt-in

5. **Severity Scoring**
   For EACH issue, assign:
   - severity: "high", "medium", or "low"
   - explain why

6. **Specific, Practical Recommendations**
   Clear, actionable steps to fix every issue.

Output your response as clean JSON with the structure specified in the full prompt.`;
  }

  /**
   * Get prompts for nodes before execution (public method)
   */
  public getNodePrompts(
    websiteUrl: string,
    leadInfo?: { name?: string; company?: string; email?: string }
  ): Record<string, string> {
    const prompts: Record<string, string> = {};

    // Firecrawl doesn't use a prompt (it's just scraping)
    prompts.firecrawl = "This node scrapes the website using Firecrawl API to extract legal documents. No prompt is used.";

    // Legal Analysis prompt
    prompts.legal_analysis = this.getLegalAnalysisPrompt(websiteUrl);

    // Email Generation prompt
    prompts.email_generation = this.getEmailGenerationPrompt(
      websiteUrl,
      {
        missingDocuments: [],
        issues: [],
        recommendations: [],
        summary: "[Analysis will be provided after legal analysis step]",
      },
      leadInfo
    );

    return prompts;
  }

  /**
   * Get AutoGen agent configurations (public method)
   */
  public getAutoGenConfigs(): Record<string, any> {
    const configs: Record<string, any> = {};

    // Legal Analysis AutoGen agents
    configs.legal_analysis = {
      enabled: this.useAutoGen,
      agents: {
        compliance_specialist: {
          name: "Compliance Specialist",
          systemMessage: this.config.autogenAgents?.compliance_specialist?.systemMessage || 
            `You are an expert legal compliance specialist. Your role is to review legal analysis results and ensure:
1. All compliance issues are properly identified
2. Severity ratings are accurate
3. Missing documents are correctly identified
4. Recommendations are actionable and specific

Be thorough but concise. Focus on accuracy and completeness.`,
          model: this.config.autogenAgents?.compliance_specialist?.model || "gpt-4o-mini",
          temperature: this.config.autogenAgents?.compliance_specialist?.temperature ?? 0.7,
        },
        risk_assessor: {
          name: "Risk Assessor",
          systemMessage: this.config.autogenAgents?.risk_assessor?.systemMessage ||
            `You are a legal risk assessment expert. Your role is to:
1. Validate that all risks (marketing, operational) are properly categorized
2. Ensure severity levels match the actual risk level
3. Verify that "why it matters" explanations are clear and accurate
4. Identify any additional risks that may have been missed

Provide constructive feedback and suggestions.`,
          model: this.config.autogenAgents?.risk_assessor?.model || "gpt-4o-mini",
          temperature: this.config.autogenAgents?.risk_assessor?.temperature ?? 0.7,
        },
        recommendations_specialist: {
          name: "Recommendations Specialist",
          systemMessage: this.config.autogenAgents?.recommendations_specialist?.systemMessage ||
            `You are a legal recommendations expert. Your role is to:
1. Ensure recommendations are specific and actionable
2. Verify recommendations address all identified issues
3. Suggest improvements to make recommendations more practical
4. Ensure recommendations are prioritized appropriately

Be practical and focus on what can actually be implemented.`,
          model: this.config.autogenAgents?.recommendations_specialist?.model || "gpt-4o-mini",
          temperature: this.config.autogenAgents?.recommendations_specialist?.temperature ?? 0.7,
        },
      },
    };

    // Email Generation AutoGen agents
    configs.email_generation = {
      enabled: this.useAutoGen,
      agents: {
        tone_specialist: {
          name: "Tone Specialist",
          systemMessage: this.config.autogenAgents?.tone_specialist?.systemMessage ||
            `You are an expert in email tone and communication. Your role is to:
1. Ensure the email tone is warm, human, and approachable
2. Verify it doesn't sound salesy or corporate
3. Check that it maintains Chad's personal voice
4. Ensure it's written at a 6-8th grade reading level

Focus on making the email feel like a real person wrote it.`,
          model: this.config.autogenAgents?.tone_specialist?.model || "gpt-4o-mini",
          temperature: this.config.autogenAgents?.tone_specialist?.temperature ?? 0.7,
        },
        content_specialist: {
          name: "Content Specialist",
          systemMessage: this.config.autogenAgents?.content_specialist?.systemMessage ||
            `You are an expert in email content and structure. Your role is to:
1. Ensure all important findings are included (5-10 bullet points)
2. Verify the email has proper structure (intro, findings, why it matters, CTA)
3. Check that recommendations are included if appropriate
4. Ensure the CTA has both options (book call and reply)

Focus on completeness and clarity.`,
          model: this.config.autogenAgents?.content_specialist?.model || "gpt-4o-mini",
          temperature: this.config.autogenAgents?.content_specialist?.temperature ?? 0.7,
        },
        personalization_specialist: {
          name: "Personalization Specialist",
          systemMessage: this.config.autogenAgents?.personalization_specialist?.systemMessage ||
            `You are an expert in email personalization. Your role is to:
1. Ensure the email feels personalized to the lead
2. Verify subject line is human and non-spammy
3. Check that the email references specific findings from their website
4. Ensure it doesn't sound like a template

Focus on making it feel like Chad personally reviewed their site.`,
          model: this.config.autogenAgents?.personalization_specialist?.model || "gpt-4o-mini",
          temperature: this.config.autogenAgents?.personalization_specialist?.temperature ?? 0.7,
        },
        subject_line_specialist: {
          name: "Subject Line Specialist",
          systemMessage: this.config.autogenAgents?.subject_line_specialist?.systemMessage ||
            `You are the Subject Line Specialist.

Your job:

1. Generate 5 subject line options.
2. Tone: human, casual, NOT salesy.
3. Style: curiosity-based, buyer-intent ambiguous.
4. Must include the lead's first name and business name.
5. Must not trigger spam filters.
6. Must feel like it could be a customer or partner inquiry.

Examples:

- "Ben — quick question about Bedrock Retreats"
- "Quick question about your bookings"
- "Saw something odd on your pricing page"
- "Are you still accepting new clients?"
- "Heads up about something on your site"

Output JSON:

{
  "subjectLines": ["...", "...", "...", "...", "..."]
}`,
          model: this.config.autogenAgents?.subject_line_specialist?.model || "gpt-4o-mini",
          temperature: this.config.autogenAgents?.subject_line_specialist?.temperature ?? 0.7,
        },
        formatting_specialist: {
          name: "Formatting & Readability Specialist",
          systemMessage: this.config.autogenAgents?.formatting_specialist?.systemMessage ||
            `You are an expert in cold email formatting, readability, and visual clarity.

Your role is to:

1. Ensure the email is easy to read, skim, and digest.
2. Add proper spacing between sections (1 blank line between each section).
3. Ensure bullet points are clean, short, and aligned (use "-" or "•" only).
4. Remove any walls of text.
5. Make sure paragraphs are 1–2 sentences max.
6. Make sure the CTA and Calendly link stand out and are visually isolated.
7. Ensure hyperlinks are short, clean, and human-looking (e.g., "here" or "my calendar", not full URLs).
8. Ensure the email renders perfectly on mobile and desktop.
9. Keep everything in plain text or light HTML that works in Instantly.ai.

Important:

- No fancy formatting
- No bold, italics, emojis, or colors
- No long URLs
- No marketing design tricks
- Focus on clarity and human readability

Your output should be the fully formatted email body only.`,
          model: this.config.autogenAgents?.formatting_specialist?.model || "gpt-4o-mini",
          temperature: this.config.autogenAgents?.formatting_specialist?.temperature ?? 0.7,
        },
      },
    };

    return configs;
  }

  /**
   * Email Generation Node: Generate personalized email using LLM
   * Enhanced with AutoGen multi-agent review
   */
  private async emailGenerationNode(
    state: typeof StateAnnotation.State
  ): Promise<Partial<typeof StateAnnotation.State>> {
    const startTime = Date.now();
    const nodeId = "email_generation";
    
    try {
      if (state.error) {
        return { error: state.error };
      }

      if (!state.analysis) {
        return { error: "No analysis available for email generation" };
      }

      console.log("[Email Generation Node] Generating personalized email...");

      // Get the prompt that will be used
      const prompt = this.getEmailGenerationPrompt(state.websiteUrl, state.analysis, state.leadInfo);

      const email = await this.openaiService.generatePersonalizedEmail(
        state.websiteUrl,
        state.analysis,
        state.leadInfo
      );

      console.log("[Email Generation Node] Email generated successfully");

      let finalEmail = email;
      let autogenReviews: AutoGenReview[] | undefined;
      let autogenError: string | undefined;

      // Enhance with AutoGen if enabled
      if (this.useAutoGen) {
        console.log("[Email Generation Node] Running AutoGen multi-agent review...");
        try {
          const { enhancedEmail, reviews } = await this.autogenService.reviewEmailGeneration(
            email,
            state.analysis,
            state.leadInfo
          );

          finalEmail = enhancedEmail;
          autogenReviews = reviews;

          console.log(`[Email Generation Node] AutoGen review complete. ${reviews.filter(r => r.approved).length}/${reviews.length} agents approved.`);
        } catch (autogenError_: any) {
          autogenError = autogenError_.message;
          console.warn("[Email Generation Node] AutoGen review failed, using original email:", autogenError);
        }
      }

      const endTime = Date.now();

      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Email Generation",
        startTime,
        endTime,
        duration: endTime - startTime,
        autogenEnabled: this.useAutoGen,
        autogenReviews,
        prompt,
        input: {
          websiteUrl: state.websiteUrl,
          leadInfo: state.leadInfo,
          analysisSummary: state.analysis.summary,
        },
        output: {
          subject: finalEmail.subject,
          bodyLength: finalEmail.body.length,
        },
        error: autogenError,
      };

      return {
        email: finalEmail,
        executionDetails,
      };
    } catch (error: any) {
      const endTime = Date.now();
      console.error("[Email Generation Node] Error:", error);
      const executionDetails: Record<string, NodeExecutionDetails> = {};
      if (state.executionDetails) {
        Object.assign(executionDetails, state.executionDetails);
      }
      executionDetails[nodeId] = {
        nodeId,
        nodeName: "Email Generation",
        startTime,
        endTime,
        duration: endTime - startTime,
        autogenEnabled: this.useAutoGen,
        input: {
          websiteUrl: state.websiteUrl,
          leadInfo: state.leadInfo,
        },
        error: error.message || "Unknown error",
      };

      return {
        error: `Email generation error: ${error.message || "Unknown error"}`,
        executionDetails,
      };
    }
  }

  /**
   * Get the prompt used for email generation (for display purposes)
   */
  private getEmailGenerationPrompt(
    websiteUrl: string,
    analysis: any,
    leadInfo?: { name?: string; company?: string; email?: string }
  ): string {
    // Use custom prompt if available, otherwise use default
    const customPrompt = this.config.nodePrompts?.email_generation?.prompt;
    if (customPrompt) {
      const analysisJSON = JSON.stringify(analysis, null, 2);
      return customPrompt
        .replace(/\$\{analysisJSON\}/g, analysisJSON)
        .replace(/\$\{websiteUrl\}/g, websiteUrl)
        .replace(/\$\{leadInfo\}/g, JSON.stringify(leadInfo || {}, null, 2));
    }

    // Default full prompt (truncated for preview if analysis is large)
    const analysisJSON = JSON.stringify(analysis, null, 2);
    const truncatedAnalysis = analysisJSON.length > 2000 
      ? analysisJSON.substring(0, 2000) + "\n... [Analysis will be provided in full during execution]"
      : analysisJSON;
    
    return `You are writing as "Chad" from Conscious Counsel — a friendly, helpful, human legal expert who just reviewed their website after they opted in for our free legal protection resources.

Your tone: warm, simple, conversational, human, approachable, helpful — NOT salesy, NOT corporate, NOT robotic.

Your job is to send them a personalized follow-up email showing the most important things we found after reviewing their website.

Here is the context from the analysis:
${truncatedAnalysis}

Here is their website:
${websiteUrl}

### IMPORTANT TONE & STYLE RULES:
- Write as a REAL human, not an AI.
- First sentence should feel personal and direct — not formal.
- Use simple English (grade 6–8 reading level).
- Never overload with legal jargon.
- Never sound negative — be supportive.
- Include "quick takeaways" in simple bullet points.
- Make the reader feel like they're in good hands.

### EMAIL CONTENT OUTLINE:
1. Friendly intro acknowledging they opted in
2. Quick bullet-point list of findings (5-10 items)
3. "Here's why it matters" section
4. Reassurance
5. Quick recommendations section (optional, 5-10 items)
6. CTA to get help (TWO options: book call and reply)
7. Signoff from Chad

Return JSON with "subject" and "body" fields. The body should be HTML formatted with proper spacing and bullet points.

[Full prompt includes detailed formatting requirements, subject line instructions, and CTA rules - see OpenAIService for complete prompt]`;
  }

  /**
   * Execute the workflow
   */
  async execute(
    websiteUrl: string,
    leadInfo?: {
      name?: string;
      company?: string;
      email?: string;
    }
  ): Promise<EmailGenerationState> {
    const initialState = {
      websiteUrl,
      leadInfo,
      legalDocuments: undefined,
      analysis: undefined,
      email: undefined,
      error: undefined,
      executionDetails: {},
    };

    try {
      const result = await this.graph.invoke(initialState);
      // Merge all execution details from the result
      const mergedExecutionDetails: Record<string, NodeExecutionDetails> = {};
      if (result.executionDetails) {
        Object.assign(mergedExecutionDetails, result.executionDetails);
      }
      return {
        ...result,
        executionDetails: mergedExecutionDetails,
      } as EmailGenerationState;
    } catch (error: any) {
      console.error("[Workflow] Execution error:", error);
      return {
        ...initialState,
        error: `Workflow execution error: ${error.message || "Unknown error"}`,
      };
    }
  }

  /**
   * Stream the workflow execution (for real-time updates)
   */
  async *stream(
    websiteUrl: string,
    leadInfo?: {
      name?: string;
      company?: string;
      email?: string;
    }
  ): AsyncGenerator<Record<string, any>, void, unknown> {
    const initialState = {
      websiteUrl,
      leadInfo,
      legalDocuments: undefined,
      analysis: undefined,
      email: undefined,
      error: undefined,
    };

    try {
      const stream = await this.graph.stream(initialState);
      for await (const chunk of stream) {
        // Stream returns chunks with node names as keys
        yield chunk as Record<string, any>;
      }
    } catch (error: any) {
      console.error("[Workflow] Streaming error:", error);
      yield {
        error: `Workflow streaming error: ${error.message || "Unknown error"}`,
      };
    }
  }
}

