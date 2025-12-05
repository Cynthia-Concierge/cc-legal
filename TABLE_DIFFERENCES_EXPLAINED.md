# Understanding workflow_results vs workflow_config Tables

## Quick Summary

**`workflow_results`** = **DATA** (What the workflow produces)
- Stores the actual results from running the legal analysis workflow
- Contains: legal documents, analysis, emails, contact info, etc.
- One row per workflow execution
- This is your **output/results** table

**`workflow_config`** = **SETTINGS** (How the workflow behaves)
- Stores custom prompts and AutoGen agent configurations
- Contains: custom prompts for nodes, agent system messages, etc.
- Used to customize HOW the workflow runs
- This is your **configuration/settings** table

---

## 📊 workflow_results Table

### Purpose
Stores the **actual results** from each time you run the legal analysis workflow.

### What Gets Stored
Every time you analyze a website, a new row is created with:

| Column | What It Contains |
|--------|------------------|
| `website_url` | The website that was analyzed |
| `legal_documents` | JSONB - Privacy policies, terms, etc. found on the site |
| `analysis` | JSONB - The legal analysis (issues, risks, recommendations) |
| `email_subject` | The generated email subject line |
| `email_body` | The generated email body (HTML) |
| `scraped_email` | Email addresses found on the website |
| `instagram_url` | Instagram links found |
| `facebook_url` | Facebook links found |
| `twitter_url` | Twitter/X links found |
| `linkedin_url` | LinkedIn links found |
| `tiktok_url` | TikTok links found |
| `status` | Whether the workflow completed successfully |
| `created_at` | When this analysis was run |

### Example Data
```json
{
  "website_url": "https://example.com",
  "legal_documents": {
    "privacyPolicy": "Full text of privacy policy...",
    "termsOfService": "Full text of terms..."
  },
  "analysis": {
    "issues": [
      {
        "issue": "Missing GDPR compliance",
        "severity": "high"
      }
    ],
    "recommendations": ["Add GDPR notice", "Update privacy policy"]
  },
  "email_subject": "Quick question about your legal documents",
  "email_body": "<p>Hi there, I noticed...</p>",
  "scraped_email": "contact@example.com",
  "instagram_url": "https://instagram.com/example"
}
```

### When It's Used
- **Automatically** after every workflow run
- **Read** when you view past analyses in the UI
- **Updated** when you re-run an analysis for the same website

---

## ⚙️ workflow_config Table

### Purpose
Stores **custom settings** that control HOW the workflow runs.

### What Gets Stored
Custom configurations that override default behavior:

| Column | What It Contains |
|--------|------------------|
| `config_type` | Either `'node_prompt'` or `'autogen_agent'` |
| `config_key` | The ID of the node/agent (e.g., `'legal_analysis'`, `'compliance_specialist'`) |
| `config_value` | JSONB - The actual configuration (prompt text, agent settings, etc.) |

### Example Data

**Custom Prompt:**
```json
{
  "config_type": "node_prompt",
  "config_key": "legal_analysis",
  "config_value": {
    "prompt": "Analyze the following legal documents for GDPR compliance. Focus on data collection practices..."
  }
}
```

**AutoGen Agent Config:**
```json
{
  "config_type": "autogen_agent",
  "config_key": "compliance_specialist",
  "config_value": {
    "systemMessage": "You are a GDPR compliance expert...",
    "model": "gpt-4o-mini",
    "temperature": 0.7
  }
}
```

### When It's Used
- **Read** when the workflow starts (to get custom prompts/agent configs)
- **Written** when you edit prompts or agent settings in the UI
- **Optional** - If the table is empty, the workflow uses default prompts/configs

---

## 🔄 How They Work Together

```
1. User runs workflow for "example.com"
   ↓
2. System checks workflow_config table
   - If custom prompts exist → use them
   - If not → use default prompts
   ↓
3. Workflow executes using those prompts/configs
   ↓
4. Results are saved to workflow_results table
   - New row created with all the analysis data
```

---

## 📝 Real-World Analogy

Think of it like a restaurant:

- **`workflow_results`** = The **orders/meals** (what was produced)
  - Each row = one meal that was served
  - Contains: what was ordered, when, who it was for, etc.

- **`workflow_config`** = The **recipe book** (how to cook)
  - Contains: custom recipes, cooking instructions, ingredient preferences
  - Used to determine HOW to prepare the meal

---

## ✅ What You Need to Know

1. **Both tables are needed** for full functionality
2. **`workflow_results`** is essential - without it, you can't save analysis results
3. **`workflow_config`** is optional - the workflow works with default prompts if it doesn't exist
4. **You already have `workflow_results`** (I can see it in your Supabase dashboard)
5. **You just created `workflow_config`** (that's why you're seeing it now)

---

## 🎯 Summary

| Feature | workflow_results | workflow_config |
|---------|------------------|-----------------|
| **Type** | Data/Results | Settings/Configuration |
| **Purpose** | Store workflow outputs | Customize workflow behavior |
| **Frequency** | One row per workflow run | One row per custom setting |
| **Required?** | ✅ Yes (essential) | ⚠️ Optional (nice to have) |
| **When Created** | Automatically after each run | Manually when you customize |
| **Example** | "Analysis of example.com" | "Use this custom prompt" |

Both tables serve different purposes and work together to give you:
- **Results storage** (`workflow_results`)
- **Customization** (`workflow_config`)

You're all set! 🎉

