/**
 * AutoGen-Inspired Multi-Agent Service
 * Provides agent-based collaboration for enhancing workflow nodes
 */

import { OpenAIService } from "./openaiService.js";
import { AutoGenAgentConfig } from "./configService.js";

interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AgentConfig {
  name: string;
  systemMessage: string;
  model?: string;
  temperature?: number;
}

interface AgentReviewResult {
  agent: string;
  review: string;
  suggestions: string[];
  approved: boolean;
}

export class AutoGenService {
  private openaiService: OpenAIService;
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";
  private customAgentConfigs?: Record<string, AutoGenAgentConfig>;

  constructor(apiKey: string, customAgentConfigs?: Record<string, AutoGenAgentConfig>) {
    this.openaiService = new OpenAIService(apiKey);
    this.apiKey = apiKey;
    this.customAgentConfigs = customAgentConfigs;
  }

  /**
   * Create a specialized agent for a specific task
   */
  private createAgent(config: AgentConfig): AgentConfig {
    // Check for custom configuration
    const customConfig = this.customAgentConfigs?.[config.name];
    
    return {
      name: config.name,
      systemMessage: customConfig?.systemMessage || config.systemMessage,
      model: customConfig?.model || config.model || "gpt-4o-mini",
      temperature: customConfig?.temperature ?? config.temperature ?? 0.7,
    };
  }

  /**
   * Execute an agent conversation
   */
  private async executeAgent(
    agent: AgentConfig,
    messages: AgentMessage[]
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: agent.model,
          messages: [
            {
              role: "system",
              content: agent.systemMessage,
            },
            ...messages,
          ],
          temperature: agent.temperature,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error(`[AutoGen] Error executing agent ${agent.name}:`, error);
      throw error;
    }
  }

  /**
   * Multi-agent review system for legal analysis
   * Uses multiple specialized agents to review and enhance the analysis
   */
  async reviewLegalAnalysis(
    originalAnalysis: any,
    legalDocuments: Record<string, string | undefined>,
    websiteUrl: string
  ): Promise<{
    enhancedAnalysis: any;
    reviews: AgentReviewResult[];
  }> {
    console.log("[AutoGen] Starting multi-agent review of legal analysis...");

    // Create specialized review agents
    const complianceAgent = this.createAgent({
      name: "compliance_specialist",
      systemMessage: `You are an expert legal compliance specialist. Your role is to review legal analysis results and ensure:
1. All compliance issues are properly identified
2. Severity ratings are accurate
3. Missing documents are correctly identified
4. Recommendations are actionable and specific

Be thorough but concise. Focus on accuracy and completeness.`,
    });

    const riskAssessmentAgent = this.createAgent({
      name: "risk_assessor",
      systemMessage: `You are a legal risk assessment expert. Your role is to:
1. Validate that all risks (marketing, operational) are properly categorized
2. Ensure severity levels match the actual risk level
3. Verify that "why it matters" explanations are clear and accurate
4. Identify any additional risks that may have been missed

Provide constructive feedback and suggestions.`,
    });

    const recommendationsAgent = this.createAgent({
      name: "recommendations_specialist",
      systemMessage: `You are a legal recommendations expert. Your role is to:
1. Ensure recommendations are specific and actionable
2. Verify recommendations address all identified issues
3. Suggest improvements to make recommendations more practical
4. Ensure recommendations are prioritized appropriately

Be practical and focus on what can actually be implemented.`,
    });

    // Prepare analysis summary for agents
    const analysisSummary = JSON.stringify(originalAnalysis, null, 2);

    // Execute parallel agent reviews
    const [complianceReview, riskReview, recommendationsReview] =
      await Promise.all([
        this.executeAgent(complianceAgent, [
          {
            role: "user",
            content: `Review this legal analysis for the website ${websiteUrl}:

${analysisSummary}

Provide:
1. A review of the analysis quality
2. Any missing issues or inaccuracies
3. Suggestions for improvement
4. Approval status (approved/needs_revision)

Respond in JSON format:
{
  "review": "your review text",
  "suggestions": ["suggestion1", "suggestion2"],
  "approved": true/false,
  "reason": "why approved or not"
}`,
          },
        ]),
        this.executeAgent(riskAssessmentAgent, [
          {
            role: "user",
            content: `Review the risk assessment in this legal analysis for ${websiteUrl}:

${analysisSummary}

Focus on:
1. Marketing and operational risks
2. Severity ratings
3. Missing risks
4. Quality of explanations

Respond in JSON format:
{
  "review": "your review text",
  "suggestions": ["suggestion1", "suggestion2"],
  "approved": true/false,
  "reason": "why approved or not"
}`,
          },
        ]),
        this.executeAgent(recommendationsAgent, [
          {
            role: "user",
            content: `Review the recommendations in this legal analysis for ${websiteUrl}:

${analysisSummary}

Focus on:
1. Actionability of recommendations
2. Completeness (do they address all issues?)
3. Practicality
4. Prioritization

Respond in JSON format:
{
  "review": "your review text",
  "suggestions": ["suggestion1", "suggestion2"],
  "approved": true/false,
  "reason": "why approved or not"
}`,
          },
        ]),
      ]);

    // Parse agent reviews
    const reviews: AgentReviewResult[] = [
      this.parseAgentReview(complianceReview, complianceAgent.name),
      this.parseAgentReview(riskReview, riskAssessmentAgent.name),
      this.parseAgentReview(recommendationsReview, recommendationsAgent.name),
    ];

    // If all agents approve, return original analysis
    // Otherwise, enhance based on suggestions
    const allApproved = reviews.every((r) => r.approved);

    if (allApproved) {
      console.log("[AutoGen] All agents approved the analysis");
      return {
        enhancedAnalysis: originalAnalysis,
        reviews,
      };
    }

    // Enhance analysis based on agent suggestions
    console.log("[AutoGen] Enhancing analysis based on agent feedback...");
    const enhancedAnalysis = await this.enhanceAnalysisWithFeedback(
      originalAnalysis,
      reviews,
      websiteUrl
    );

    return {
      enhancedAnalysis,
      reviews,
    };
  }

  /**
   * Multi-agent review system for email generation
   * Uses agents to refine and improve email content
   */
  async reviewEmailGeneration(
    originalEmail: { subject: string; body: string },
    analysis: any,
    leadInfo?: { name?: string; company?: string; email?: string }
  ): Promise<{
    enhancedEmail: { subject: string; body: string };
    reviews: AgentReviewResult[];
  }> {
    console.log("[AutoGen] Starting multi-agent review of email generation...");

    // Create specialized email review agents
    const toneAgent = this.createAgent({
      name: "tone_specialist",
      systemMessage: `You are an expert in email tone and communication. Your role is to:
1. Ensure the email tone is warm, human, and approachable
2. Verify it doesn't sound salesy or corporate
3. Check that it maintains Chad's personal voice
4. Ensure it's written at a 6-8th grade reading level

Focus on making the email feel like a real person wrote it.`,
    });

    const contentAgent = this.createAgent({
      name: "content_specialist",
      systemMessage: `You are an expert in email content and structure. Your role is to:
1. Ensure all important findings are included (5-10 bullet points)
2. Verify the email has proper structure (intro, findings, why it matters, CTA)
3. Check that recommendations are included if appropriate
4. Ensure the CTA has both options (book call and reply)

Focus on completeness and clarity.`,
    });

    const personalizationAgent = this.createAgent({
      name: "personalization_specialist",
      systemMessage: `You are an expert in email personalization. Your role is to:
1. Ensure the email feels personalized to the lead
2. Verify subject line is human and non-spammy
3. Check that the email references specific findings from their website
4. Ensure it doesn't sound like a template

Focus on making it feel like Chad personally reviewed their site.`,
    });

    const subjectLineAgent = this.createAgent({
      name: "subject_line_specialist",
      systemMessage: `You are the Subject Line Specialist.

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
    });

    const formattingAgent = this.createAgent({
      name: "formatting_specialist",
      systemMessage: `You are an expert in cold email formatting, readability, and visual clarity.

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
    });

    // Execute parallel agent reviews
    const [toneReview, contentReview, personalizationReview, subjectLineReview, formattingReview] =
      await Promise.all([
        this.executeAgent(toneAgent, [
          {
            role: "user",
            content: `Review the tone and voice of this email:

Subject: ${originalEmail.subject}

Body: ${originalEmail.body}

Lead Info: ${JSON.stringify(leadInfo || {})}

Provide:
1. Review of tone quality
2. Suggestions for improvement
3. Approval status

Respond in JSON format:
{
  "review": "your review text",
  "suggestions": ["suggestion1", "suggestion2"],
  "approved": true/false,
  "reason": "why approved or not"
}`,
          },
        ]),
        this.executeAgent(contentAgent, [
          {
            role: "user",
            content: `Review the content and structure of this email:

Subject: ${originalEmail.subject}

Body: ${originalEmail.body}

Analysis Context: ${JSON.stringify(analysis, null, 2).substring(0, 2000)}

Provide:
1. Review of content completeness
2. Suggestions for improvement
3. Approval status

Respond in JSON format:
{
  "review": "your review text",
  "suggestions": ["suggestion1", "suggestion2"],
  "approved": true/false,
  "reason": "why approved or not"
}`,
          },
        ]),
        this.executeAgent(personalizationAgent, [
          {
            role: "user",
            content: `Review the personalization of this email:

Subject: ${originalEmail.subject}

Body: ${originalEmail.body}

Lead Info: ${JSON.stringify(leadInfo || {})}

Provide:
1. Review of personalization quality
2. Suggestions for improvement
3. Approval status

Respond in JSON format:
{
  "review": "your review text",
  "suggestions": ["suggestion1", "suggestion2"],
  "approved": true/false,
  "reason": "why approved or not"
}`,
          },
        ]),
        this.executeAgent(subjectLineAgent, [
          {
            role: "user",
            content: `Generate 5 subject line options for this email.

Current Subject: ${originalEmail.subject}

Analysis Context: ${JSON.stringify(analysis, null, 2).substring(0, 2000)}
Lead Info: ${JSON.stringify(leadInfo || {})}

Requirements:
1. Generate 5 different subject line options
2. Tone: human, casual, NOT salesy
3. Style: curiosity-based, buyer-intent ambiguous
4. Must include the lead's first name (if available) and business name (if available)
5. Must not trigger spam filters
6. Must feel like it could be a customer or partner inquiry

Examples of good subject lines:
- "Ben — quick question about Bedrock Retreats"
- "Quick question about your bookings"
- "Saw something odd on your pricing page"
- "Are you still accepting new clients?"
- "Heads up about something on your site"

Output JSON format:
{
  "subjectLines": ["option 1", "option 2", "option 3", "option 4", "option 5"],
  "review": "brief explanation of why these work",
  "approved": true/false,
  "reason": "why approved or not"
}`,
          },
        ]),
        this.executeAgent(formattingAgent, [
          {
            role: "user",
            content: `Review ONLY the formatting and readability of this email body:

Email Body:
${originalEmail.body}

Evaluate the email body against these formatting criteria:
1. Is it easy to read, skim, and digest?
2. Are there proper spacing between sections (1 blank line between each section)?
3. Are bullet points clean, short, and aligned (using "-" or "•" only)?
4. Are there any walls of text that need to be broken up?
5. Are paragraphs 1–2 sentences max?
6. Do the CTA and Calendly link stand out and are visually isolated?
7. Are hyperlinks short, clean, and human-looking (e.g., "here" or "my calendar", not full URLs)?
8. Will it render perfectly on mobile and desktop?
9. Is it in plain text or light HTML that works in Instantly.ai?
10. Does it avoid fancy formatting, bold, italics, emojis, colors, long URLs, and marketing design tricks?

Provide:
1. Detailed review of the formatting and readability
2. Specific suggestions for improvement (or a reformatted email body if needed)
3. Approval status

Respond in JSON format:
{
  "review": "your detailed review text",
  "suggestions": ["suggestion1", "suggestion2", "reformatted email body if needed"],
  "approved": true/false,
  "reason": "why approved or not"
}`,
          },
        ]),
      ]);

    // Parse agent reviews
    const reviews: AgentReviewResult[] = [
      this.parseAgentReview(toneReview, toneAgent.name),
      this.parseAgentReview(contentReview, contentAgent.name),
      this.parseAgentReview(personalizationReview, personalizationAgent.name),
      this.parseAgentReview(subjectLineReview, subjectLineAgent.name),
      this.parseAgentReview(formattingReview, formattingAgent.name),
    ];

    // If all agents approve, return original email
    const allApproved = reviews.every((r) => r.approved);

    if (allApproved) {
      console.log("[AutoGen] All agents approved the email");
      return {
        enhancedEmail: originalEmail,
        reviews,
      };
    }

    // Enhance email based on agent suggestions
    console.log("[AutoGen] Enhancing email based on agent feedback...");
    const enhancedEmail = await this.enhanceEmailWithFeedback(
      originalEmail,
      reviews,
      analysis,
      leadInfo
    );

    return {
      enhancedEmail,
      reviews,
    };
  }

  /**
   * Enhance analysis based on agent feedback
   */
  private async enhanceAnalysisWithFeedback(
    originalAnalysis: any,
    reviews: AgentReviewResult[],
    websiteUrl: string
  ): Promise<any> {
    const suggestions = reviews.flatMap((r) => r.suggestions);
    const suggestionsText = suggestions.join("\n- ");

    const enhancementPrompt = `You are enhancing a legal analysis based on expert agent feedback.

Original Analysis:
${JSON.stringify(originalAnalysis, null, 2)}

Agent Suggestions:
- ${suggestionsText}

Please enhance the analysis by incorporating the valid suggestions while maintaining the original structure and format. Return the enhanced analysis as JSON in the same format as the original.`;

    try {
      const response = await this.openaiService.callChatGPT(enhancementPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return originalAnalysis;
    } catch (error) {
      console.error("[AutoGen] Error enhancing analysis:", error);
      return originalAnalysis;
    }
  }

  /**
   * Enhance email based on agent feedback
   */
  private async enhanceEmailWithFeedback(
    originalEmail: { subject: string; body: string },
    reviews: AgentReviewResult[],
    analysis: any,
    leadInfo?: { name?: string; company?: string; email?: string }
  ): Promise<{ subject: string; body: string }> {
    const suggestions = reviews.flatMap((r) => r.suggestions);
    const suggestionsText = suggestions.join("\n- ");

    // Check if subject line options were provided
    const subjectLineOptions = suggestions
      .filter(s => s.startsWith("Subject line option:"))
      .map(s => s.replace("Subject line option: ", ""));

    const enhancementPrompt = `You are enhancing an email based on expert agent feedback.

Original Email:
Subject: ${originalEmail.subject}
Body: ${originalEmail.body}

Agent Suggestions:
- ${suggestionsText}

Analysis Context: ${JSON.stringify(analysis, null, 2).substring(0, 2000)}
Lead Info: ${JSON.stringify(leadInfo || {})}

${subjectLineOptions.length > 0 ? `IMPORTANT: The Subject Line Specialist has provided these subject line options:
${subjectLineOptions.map((sl, i) => `${i + 1}. ${sl}`).join('\n')}

Please use one of these subject line options (or a variation that maintains the same style) for the enhanced email.` : ''}

Please enhance the email by incorporating the valid suggestions while maintaining Chad's warm, human tone. Return the enhanced email as JSON:
{
  "subject": "enhanced subject line",
  "body": "enhanced HTML email body"
}`;

    try {
      const response = await this.openaiService.callChatGPT(enhancementPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return originalEmail;
    } catch (error) {
      console.error("[AutoGen] Error enhancing email:", error);
      return originalEmail;
    }
  }

  /**
   * Parse agent review response
   */
  private parseAgentReview(
    response: string,
    agentName: string
  ): AgentReviewResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Handle subject line specialist's subjectLines array
        let suggestions = parsed.suggestions || [];
        if (agentName === "subject_line_specialist" && parsed.subjectLines && Array.isArray(parsed.subjectLines)) {
          // Add subject lines as suggestions, prefixed for clarity
          suggestions = [
            ...parsed.subjectLines.map((sl: string) => `Subject line option: ${sl}`),
            ...suggestions
          ];
        }
        
        return {
          agent: agentName,
          review: parsed.review || response,
          suggestions,
          approved: parsed.approved !== false,
        };
      }
    } catch (error) {
      console.error(`[AutoGen] Error parsing review from ${agentName}:`, error);
    }

    return {
      agent: agentName,
      review: response,
      suggestions: [],
      approved: false,
    };
  }

  /**
   * 7-Agent AutoGen Team for Website Redesign
   * Sequential collaboration: IA -> UX -> CRO -> Copywriter -> UI Designer -> Wireframe Engineer -> Final Composer
   */
  async designWebsiteWithAutoGenTeam(
    websiteUrl: string,
    normalizedData: {
      url: string;
      metadata: {
        title: string;
        description: string;
      };
      hero: {
        headline: string;
        subheadline: string;
        primaryCTA: string;
        secondaryCTA?: string;
      };
      navigation: {
        main: Array<{
          label: string;
          url: string;
        }>;
      };
      services: string[];
      socialLinks?: Record<string, string>;
      sections: string[];
      ctas?: string[];
    },
    onAgentProgress?: (agent: string, status: "starting" | "completed") => void
  ): Promise<{
    structure: {
      pages: Array<{
        name: string;
        path: string;
        sections: Array<{
          name: string;
          type: string;
          content: any;
        }>;
      }>;
    };
    navigation: {
      items: Array<{
        label: string;
        path: string;
        order: number;
      }>;
    };
    copy: any;
    design: {
      colorScheme: string[];
      typography: any;
      layout: string;
      recommendations: string[];
    };
    components: any;
    improvements: Array<{
      area: string;
      current: string;
      improved: string;
      reason: string;
    }>;
  }> {
    console.log("[AutoGen Team] Starting 7-agent website redesign collaboration...");

    // Progress callback for real-time updates
    const onAgentProgress = (agentName: string, status: "starting" | "completed") => {
      // This will be used by the workflow to emit progress
      console.log(`[AutoGen Team] Agent: ${agentName} - ${status}`);
    };

    // Prepare normalized data for agents
    const scrapedMarkdown = JSON.stringify(normalizedData, null, 2);
    const scrapedMetadata = JSON.stringify(normalizedData.metadata, null, 2);
    let domain: string;
    try {
      domain = new URL(websiteUrl).hostname;
    } catch {
      domain = websiteUrl;
    }

    // Step 1: Information Architect Agent
    console.log("[AutoGen Team] Agent 1: Information Architect starting...");
    onAgentProgress?.("information_architect", "starting");
    const infoArchitect = this.createAgent({
      name: "information_architect",
      systemMessage: `You are the Information Architect.

Your job:
- Analyze the scraped website data
- Understand the business, purpose, and customer flow
- Create a modern, simplified sitemap
- Improve page hierarchy and grouping
- Remove unnecessary pages
- Add missing high-value pages (e.g., pricing, testimonials, FAQ, booking)

Output:
- A clear sitemap
- A description of each page's purpose
- Navigation recommendations

Be concise and focused. Output your analysis as structured text.`,
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    const iaOutput = await this.executeAgent(infoArchitect, [
      {
        role: "user",
        content: `Here is the normalized website data you must analyze:

[SCRAPED_MARKDOWN]
${scrapedMarkdown.substring(0, 6000)}

[METADATA]
${scrapedMetadata}

[DOMAIN]
${domain}

Your job is to perform the responsibilities in your system message and output your sitemap, page purposes, and navigation recommendations.`,
      },
    ]);
    onAgentProgress?.("information_architect", "completed");

    // Step 2: UX Strategist Agent
    console.log("[AutoGen Team] Agent 2: UX Strategist starting...");
    onAgentProgress?.("ux_strategist", "starting");
    const uxStrategist = this.createAgent({
      name: "ux_strategist",
      systemMessage: `You are the Senior UX Strategist.

Your job:
- Take the sitemap from the IA agent
- Redesign the flow of the website so it is clean, modern, and high-converting
- Define the sections needed on each page
- Recommend layout improvements and content flow
- Apply UX best practices (visual hierarchy, scannability, mobile-first, simplicity)

Output:
- Section-by-section breakdown for every page
- Layout flow notes
- Mobile-first UX considerations

Be specific and actionable.`,
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    const uxOutput = await this.executeAgent(uxStrategist, [
      {
        role: "user",
        content: `Here is everything from the previous agent:

INFORMATION ARCHITECT OUTPUT:
${iaOutput}

Using the responsibilities in your system message, create the UX breakdown, page sections, flow notes, and mobile-first strategy.`,
      },
    ]);
    onAgentProgress?.("ux_strategist", "completed");

    // Step 3: CRO / Conversion Expert Agent
    console.log("[AutoGen Team] Agent 3: CRO Expert starting...");
    onAgentProgress?.("cro_expert", "starting");
    const croExpert = this.createAgent({
      name: "cro_expert",
      systemMessage: `You are the Conversion Optimization Expert.

Your job:
- Analyze CTAs, service offerings, social proof, and trust indicators
- Improve all CTAs (buttons, placements, urgency, clarity)
- Recommend where testimonials should appear
- Strengthen the hero section for maximum conversion
- Add any missing sections needed for trust or persuasion

Output:
- CTA recommendations
- Social proof recommendations
- Conversion improvements to every section

Focus on conversion optimization.`,
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    const croOutput = await this.executeAgent(croExpert, [
      {
        role: "user",
        content: `Here is the current work so far:

INFORMATION ARCHITECT:
${iaOutput}

UX STRATEGIST:
${uxOutput}

Using the responsibilities in your system message, produce all CTA enhancements, social proof strategy, and conversion improvements.`,
      },
    ]);
    onAgentProgress?.("cro_expert", "completed");

    // Step 4: Copywriter Agent
    console.log("[AutoGen Team] Agent 4: Copywriter starting...");
    onAgentProgress?.("copywriter", "starting");
    const copywriter = this.createAgent({
      name: "copywriter",
      systemMessage: `You are the Website Copywriter.

Your job:
- Rewrite the hero text, service descriptions, and core paragraphs
- Make the copy clearer, more emotional, and more value-driven
- Keep it concise but persuasive
- Maintain brand voice based on the scraped data
- Produce improved headlines, subheadings, service blurbs, and button text

Output:
- Rewritten hero copy
- Rewritten section copy
- Rewritten service descriptions
- A library of CTA button variations

Write compelling, conversion-focused copy.`,
      model: "gpt-4o-mini",
      temperature: 0.8,
    });

    const copyOutput = await this.executeAgent(copywriter, [
      {
        role: "user",
        content: `Use the IA, UX, and CRO outputs to rewrite all hero copy, headlines, service descriptions, blurbs, and CTA text.

INFORMATION ARCHITECT:
${iaOutput}

UX STRATEGIST:
${uxOutput}

CRO STRATEGIST:
${croOutput}

Rewrite the copy now according to your system instructions.`,
      },
    ]);
    onAgentProgress?.("copywriter", "completed");

    // Step 5: Brand/UI Designer Agent
    console.log("[AutoGen Team] Agent 5: UI Designer starting...");
    onAgentProgress?.("ui_designer", "starting");
    const uiDesigner = this.createAgent({
      name: "ui_designer",
      systemMessage: `You are the UI/Visual Designer.

Your job:
- Create a modern design style based on the scraped brand colors and fonts
- Recommend a color palette (primary, secondary, accents)
- Recommend typography pairings
- Recommend image style
- Recommend spacing, layout density, and component feel

Output:
- Color palette
- Typography guidelines
- Visual style notes
- Imagery recommendations

Be specific about design choices.`,
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    const designOutput = await this.executeAgent(uiDesigner, [
      {
        role: "user",
        content: `Use these prior outputs:

IA:
${iaOutput}
UX:
${uxOutput}
CRO:
${croOutput}
COPY:
${copyOutput}

Now produce the color palettes, type system, visual style, and design rules based on your system instructions.`,
      },
    ]);
    onAgentProgress?.("ui_designer", "completed");

    // Step 6: Component & Wireframe Engineer Agent
    console.log("[AutoGen Team] Agent 6: Wireframe Engineer starting...");
    onAgentProgress?.("wireframe_engineer", "starting");
    const wireframeEngineer = this.createAgent({
      name: "wireframe_engineer",
      systemMessage: `You are the Component & Wireframe Engineer.

Your job:
- Convert the strategy, UX, copy, and design inputs into a structured blueprint
- Define components for Gemini (hero, service cards, testimonials, CTA bars, footer)
- Specify responsive behavior
- Outline layout grids

Output:
- Wireframe description for each page
- Component definitions
- Responsive rules
- A clear blueprint Gemini can implement into HTML/CSS/React

Be technical and specific about component structure.`,
      model: "gpt-4o-mini",
      temperature: 0.6,
    });

    const componentOutput = await this.executeAgent(wireframeEngineer, [
      {
        role: "user",
        content: `Use the full strategy:

IA:
${iaOutput}
UX:
${uxOutput}
CRO:
${croOutput}
COPY:
${copyOutput}
DESIGN:
${designOutput}

Now define all components, layouts, wireframes, and responsive behavior according to your system message.`,
      },
    ]);
    onAgentProgress?.("wireframe_engineer", "completed");

    // Step 7: Final JSON Composer Agent (CRITICAL - Outputs only JSON)
    console.log("[AutoGen Team] Agent 7: Final JSON Composer starting...");
    onAgentProgress?.("final_composer", "starting");
    const finalComposer = this.createAgent({
      name: "final_composer",
      systemMessage: `You are the Final Composer Agent.

Your job:
- Take all agents' outputs
- Integrate them into ONE clean JSON object
- Do NOT add commentary or explanation
- Output ONLY valid JSON using exactly this schema:

{
  "structure": {
    "pages": [
      {
        "name": "",
        "path": "",
        "sections": [
          {
            "name": "",
            "type": "",
            "content": {}
          }
        ]
      }
    ]
  },
  "navigation": {
    "items": [
      {
        "label": "",
        "path": "",
        "order": 1
      }
    ]
  },
  "copy": {},
  "design": {
    "colorScheme": [],
    "typography": {},
    "layout": "",
    "recommendations": []
  },
  "components": {},
  "improvements": [
    {
      "area": "",
      "current": "",
      "improved": "",
      "reason": ""
    }
  ]
}

STRICT RULES:
- Output must be valid JSON
- No markdown
- No backticks
- No explanations
- Start with { and end with }
- Only output the JSON object`,
      model: "gpt-4o-mini",
      temperature: 0.3, // Lower temperature for more consistent JSON
    });

    const finalOutput = await this.executeAgent(finalComposer, [
      {
        role: "user",
        content: `Combine all previous outputs into one JSON object using ONLY the schema in your system message.

IA:
${iaOutput}
UX:
${uxOutput}
CRO:
${croOutput}
COPY:
${copyOutput}
DESIGN:
${designOutput}
COMPONENTS:
${componentOutput}

Output ONLY valid JSON and nothing else.`,
      },
    ]);

    // Parse the final JSON output
    try {
      // Clean the output - remove markdown code blocks if present
      let cleanedOutput = finalOutput.trim();
      if (cleanedOutput.startsWith("```json")) {
        cleanedOutput = cleanedOutput.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (cleanedOutput.startsWith("```")) {
        cleanedOutput = cleanedOutput.replace(/```\n?/g, "");
      }

      // Extract JSON object
      const jsonMatch = cleanedOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("[AutoGen Team] Successfully composed final JSON");
        onAgentProgress?.("final_composer", "completed");
        return parsed;
      }

      throw new Error("No valid JSON found in final output");
    } catch (error) {
      console.error("[AutoGen Team] Error parsing final JSON:", error);
      console.error("[AutoGen Team] Raw output:", finalOutput);
      throw new Error(`Failed to parse final JSON output: ${error}`);
    }
  }
}

