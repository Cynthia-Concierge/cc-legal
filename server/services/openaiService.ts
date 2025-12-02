/**
 * OpenAI Service
 * Handles ChatGPT API calls for analysis and email generation
 */

interface AnalysisResult {
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
}

interface EmailContent {
  subject: string;
  body: string;
}

import { NodePromptConfig } from "./configService.js";

export class OpenAIService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";
  private customPrompts?: Record<string, NodePromptConfig>;

  constructor(apiKey: string, customPrompts?: Record<string, NodePromptConfig>) {
    this.apiKey = apiKey;
    this.customPrompts = customPrompts;
  }

  /**
   * Analyze legal documents and find what's missing
   */
  async analyzeLegalDocuments(
    websiteUrl: string,
    legalDocuments: Record<string, string | undefined>
  ): Promise<AnalysisResult> {
    try {
      const documentsSummary = this.prepareDocumentsSummary(legalDocuments);

      // Use custom prompt if available, otherwise use simplified default
      const customPrompt = this.customPrompts?.legal_analysis?.prompt;
      const basePrompt = customPrompt || `You are a legal compliance expert. Analyze this website's legal documents and tell me what's wrong in simple, easy-to-understand language.

Website: ${websiteUrl}

Legal documents found:
${documentsSummary}

Your job: Find what's wrong with their legal setup. Keep it simple and clear.

Focus on:
1. **Missing Documents** - What legal pages are they missing? (Privacy Policy, Terms, Refund Policy, etc.)
2. **Problems in Existing Documents** - What's wrong with the documents they do have? Use plain language.
3. **What This Means** - Explain why each problem matters in simple terms.

Output format (JSON only):
{
  "missingDocuments": ["Privacy Policy", "Terms of Service", etc.],
  "issues": [
    {
      "document": "Privacy Policy",
      "issue": "Simple description of what's wrong (e.g., 'Missing data collection disclosure')",
      "severity": "high|medium|low",
      "whyItMatters": "Simple explanation (e.g., 'You could face fines if you collect data without proper disclosure')"
    }
  ],
  "summary": "One paragraph summary in plain language - what's the main problem and why it matters"
}

Keep descriptions short, clear, and easy to understand. No legal jargon.`;

      // Replace placeholders in prompt
      const prompt = basePrompt
        .replace(/\$\{websiteUrl\}/g, websiteUrl)
        .replace(/\$\{documentsSummary\}/g, documentsSummary);

      const response = await this.callChatGPT(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error("Error analyzing legal documents:", error);
      throw error;
    }
  }

  /**
   * Generate a personalized email based on the analysis
   */
  async generatePersonalizedEmail(
    websiteUrl: string,
    analysis: AnalysisResult,
    leadInfo?: {
      name?: string;
      company?: string;
      email?: string;
    }
  ): Promise<EmailContent> {
    try {
      // Convert analysis to JSON string for the prompt
      const analysisJSON = JSON.stringify(analysis, null, 2);

      // Use custom prompt if available, otherwise use default
      const customPrompt = this.customPrompts?.email_generation?.prompt;
      const basePrompt = customPrompt || `You are writing as "Chad" from Conscious Counsel — a friendly, helpful, human legal expert who just reviewed their website after they opted in for our free legal protection resources.

Your tone: warm, simple, conversational, human, approachable, helpful — NOT salesy, NOT corporate, NOT robotic.

Your job is to send them a personalized follow-up email showing the most important things we found after reviewing their website.

Here is the context from the analysis:

${analysisJSON}

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

- Use friendly micro-phrases like:

  - "Quick heads up"

  - "Nothing to stress about"

  - "Here are the big things I noticed"

  - "Super easy fix"

  - "Just want to help you stay protected"

- Reference 3–5 specific issues from the audit.

### CALL-TO-ACTION RULES:

End with a warm, low-pressure CTA that gives TWO options:

1. Option to book a free call:
   - Include a clickable link: <a href="https://calendly.com/chad-consciouscounsel/connection-call-with-chad?back=1&month=2025-10">Book a free call with us here</a>
   - Use friendly language like "If you want help fixing any of this, I'm happy to walk you through it."

2. Option to reply with questions:
   - Encourage them to reply directly to the email with any questions
   - Use language like "Or if you have any questions, just reply to this email and I'll get back to you."
   - Make it feel personal and approachable

### SUBJECT LINE INSTRUCTIONS:

Create a subject line that is:

- personal

- warm

- curious

- non-spammy

- written like a real human

- short (3–6 words)

- pattern-breaking

- NOT salesy

- NOT corporate

- NOT formal

DO NOT use these clichés:

- "Quick follow-up"

- "Review of your website"

- "Website audit"

- "Compliance check"

- "Important update"

- "Action required"

- "Urgent"

- "Free consultation"

Aim for subject lines that spark curiosity without sounding like marketing.

Use styles like:

- "Hey quick question"

- "Noticed something small…"

- "Saw this on your site"

- "A quick heads up"

- "Something you might want to know"

- "Loved something on your site"

Return **one single** subject line. It should feel like a real person wrote it quickly.

### EMAIL FORMAT:

Return JSON ONLY in this format:

{

  "subject": "short human subject line",

  "body": "HTML email body with short paragraphs, simple bullet points, and a friendly tone"

}

### HTML FORMATTING REQUIREMENTS:

- Use proper line spacing between paragraphs and sections
- Add line-height: 1.6 or 1.8 to paragraphs for readability
- Use <p> tags with style="line-height: 1.6; margin-bottom: 16px;" for paragraphs
- ALWAYS format bullet points using proper HTML: <ul style="margin-bottom: 16px;"> and <li style="margin-bottom: 8px;"> tags
- Do NOT use plain text with dashes (-) or periods for bullet points - always use HTML <ul> and <li> tags
- Add spacing between bullet points (margin-bottom: 8px on list items)
- IMPORTANT: Use EITHER paragraph margins OR single line breaks (<br>), NOT both - avoid double spacing
- Between sections, use a single <p> tag with margin-bottom (do NOT add extra <br> tags if using paragraph margins)
- Make sure there's visual breathing room but avoid excessive spacing
- CRITICAL: Add ONE extra line break (<br>) or one paragraph margin between the bullet points list and the "Here's why it matters" section - do NOT double space

### EMAIL CONTENT OUTLINE:

1. Friendly intro:

   - "Hey, this is Chad from Conscious Counsel…"

   - Acknowledge they opted in.

   - Mention you reviewed their site personally.

2. Quick bullet-point list of findings:

   - Missing legal docs

   - Risky claims

   - Missing disclaimers

   - Missing policies

   - Any obvious gaps

   CRITICAL: Include between 5-10 bullet points in this section. Never include fewer than 5 or more than 10 items.
   
   Select the most important findings from the analysis (missing documents, document issues, marketing risks, operational risks) and combine them into a comprehensive list of 5-10 items.
   
   CRITICAL FORMATTING: Format this section as proper HTML bullet points using <ul> and <li> tags. Example:
   <ul style="margin-bottom: 16px;">
     <li style="margin-bottom: 8px;">Missing legal documents like a Cookie Policy and a Coaching Agreement</li>
     <li style="margin-bottom: 8px;">Some risky claims without proper disclaimers</li>
     <li style="margin-bottom: 8px;">No jurisdiction clauses in your Terms of Service</li>
   </ul>
   
   Do NOT use plain text with dashes or periods. Always use proper HTML <ul> and <li> tags for bullet points.
   
   CRITICAL: Do NOT include "why it matters" explanations within each bullet point. Each bullet should only state the finding itself, not explain why it matters.
   
   IMPORTANT: Add ONE single line break (<br>) or one paragraph margin between the bullet points and the next section - avoid double spacing.

3. "Here's why it matters" section:
   - Write ONE single sentence that summarizes why these findings matter overall
   - Focus on the real-world consequences (legal trouble, stress, financial risk)
   - Make it compelling but not fear-mongering
   - Do NOT repeat the bullet points from above - create a fresh, concise reason
   - CRITICAL: Do NOT include individual "why it matters" explanations for each bullet point
   - CRITICAL: Do NOT use the "whyItMatters" fields from the analysis data - create ONE unified summary sentence
   - Example tone: "Getting these in place protects you from legal headaches and lets you focus on what you do best."
   - Keep it to exactly ONE sentence - no more, no less

4. Reassurance:

   - "Nothing to stress about"

   - "These are all fixable"

5. Quick recommendations section (optional but recommended):

   - Include 5-10 actionable recommendations based on the findings
   - Format as HTML bullet points using <ul> and <li> tags
   - Keep recommendations simple and actionable
   - Examples: "Draft and implement a comprehensive Cookie Policy", "Add jurisdiction clauses to your Terms of Service"
   - CRITICAL: Include between 5-10 recommendations. Never include fewer than 5 or more than 10 items.
   - If including recommendations, add them after the "Here's why it matters" section but before the reassurance

6. CTA to get help (give TWO options):

   - Option 1: Link to book a free legal audit call
   - Option 2: Encourage them to reply to the email with any questions
   - Make both options feel equally valid and low-pressure

7. Signoff from Chad:

   - Always end with a personal signoff from Chad
   - Use a warm, friendly closing
   - Examples: "Talk soon,", "Hope this helps,", "Looking forward to hearing from you,"
   - Include "Chad" or "Chad from Conscious Counsel"
   - Keep it short and human

Make the email feel like a real person (Chad) typed it after reviewing their website.

Write the best, warmest, most human legal audit follow-up email you can.`;

      // Replace placeholders in prompt
      const prompt = basePrompt
        .replace(/\$\{analysisJSON\}/g, analysisJSON)
        .replace(/\$\{websiteUrl\}/g, websiteUrl)
        .replace(/\$\{leadInfo\}/g, JSON.stringify(leadInfo || {}, null, 2));

      const response = await this.callChatGPT(prompt);
      return this.parseEmailResponse(response);
    } catch (error) {
      console.error("Error generating email:", error);
      throw error;
    }
  }

  /**
   * Call ChatGPT API
   */
  async callChatGPT(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency, can be changed to gpt-4
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that provides detailed, accurate analysis. Always respond with valid JSON when requested.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
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
      console.error("Error calling ChatGPT:", error);
      throw error;
    }
  }

  /**
   * Prepare a summary of legal documents for analysis
   */
  private prepareDocumentsSummary(
    legalDocuments: Record<string, string | undefined>
  ): string {
    const summary: string[] = [];

    for (const [docType, content] of Object.entries(legalDocuments)) {
      if (content) {
        // Truncate long documents to avoid token limits
        const truncatedContent =
          content.length > 5000
            ? content.substring(0, 5000) + "... [truncated]"
            : content;
        summary.push(
          `${docType}:\n${truncatedContent}\n---\n`
        );
      } else {
        summary.push(`${docType}: NOT FOUND\n---\n`);
      }
    }

    return summary.join("\n");
  }

  /**
   * Parse analysis response from ChatGPT
   */
  private parseAnalysisResponse(response: string): AnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        missingDocuments: [],
        issues: [],
        marketingRisks: [],
        operationalRisks: [],
        recommendations: [],
        summary: response,
      };
    } catch (error) {
      console.error("Error parsing analysis response:", error);
      return {
        missingDocuments: [],
        issues: [],
        marketingRisks: [],
        operationalRisks: [],
        recommendations: [],
        summary: response,
      };
    }
  }

  /**
   * Design a website based on scraped data
   */
  async designWebsite(
    websiteUrl: string,
    scrapedData: any
  ): Promise<{
    structure: {
      pages: Array<{
        name: string;
        path: string;
        description: string;
        sections: Array<{
          name: string;
          type: string;
          content: string;
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
    design: {
      colorScheme: string;
      typography: string;
      layout: string;
      recommendations: string[];
    };
    improvements: Array<{
      area: string;
      current: string;
      improved: string;
      reason: string;
    }>;
  }> {
    try {
      const scrapedDataJSON = JSON.stringify(scrapedData, null, 2);
      const truncatedData = scrapedDataJSON.length > 10000
        ? scrapedDataJSON.substring(0, 10000) + "\n... [Data truncated]"
        : scrapedDataJSON;

      const prompt = `You are an expert website designer and UX strategist. Your job is to analyze a scraped website and create a comprehensive redesign that makes it 100x better.

Website URL: ${websiteUrl}

Scraped Website Data:
${truncatedData}

Your task:
1. Analyze the current website structure, navigation, and content
2. Identify areas for improvement (UX, conversion, engagement, clarity)
3. Design a new website structure with:
   - Improved page organization
   - Better navigation flow
   - Enhanced user experience
   - Modern design principles
   - Conversion optimization
4. Create a detailed redesign plan with specific improvements

Output your response as JSON with this structure:
{
  "structure": {
    "pages": [
      {
        "name": "Home",
        "path": "/",
        "description": "Page description",
        "sections": [
          {
            "name": "Hero",
            "type": "hero",
            "content": "Section content description"
          }
        ]
      }
    ]
  },
  "navigation": {
    "items": [
      {
        "label": "Home",
        "path": "/",
        "order": 1
      }
    ]
  },
  "design": {
    "colorScheme": "Modern, professional color palette",
    "typography": "Typography recommendations",
    "layout": "Layout approach",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "improvements": [
    {
      "area": "Navigation",
      "current": "Current state",
      "improved": "Improved state",
      "reason": "Why this improvement matters"
    }
  ]
}`;

      const response = await this.callChatGPT(prompt);
      return this.parseWebsiteDesignResponse(response);
    } catch (error) {
      console.error("Error designing website:", error);
      throw error;
    }
  }

  /**
   * Parse website design response from ChatGPT
   */
  private parseWebsiteDesignResponse(response: string): {
    structure: {
      pages: Array<{
        name: string;
        path: string;
        description: string;
        sections: Array<{
          name: string;
          type: string;
          content: string;
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
    design: {
      colorScheme: string;
      typography: string;
      layout: string;
      recommendations: string[];
    };
    improvements: Array<{
      area: string;
      current: string;
      improved: string;
      reason: string;
    }>;
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        structure: {
          pages: [],
        },
        navigation: {
          items: [],
        },
        design: {
          colorScheme: "Not specified",
          typography: "Not specified",
          layout: "Not specified",
          recommendations: [],
        },
        improvements: [],
      };
    } catch (error) {
      console.error("Error parsing website design response:", error);
      return {
        structure: {
          pages: [],
        },
        navigation: {
          items: [],
        },
        design: {
          colorScheme: "Not specified",
          typography: "Not specified",
          layout: "Not specified",
          recommendations: [],
        },
        improvements: [],
      };
    }
  }

  /**
   * Parse email response from ChatGPT
   */
  private parseEmailResponse(response: string): EmailContent {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        subject: "Legal Compliance Review for Your Website",
        body: response,
      };
    } catch (error) {
      console.error("Error parsing email response:", error);
      return {
        subject: "Legal Compliance Review for Your Website",
        body: response,
      };
    }
  }
}

