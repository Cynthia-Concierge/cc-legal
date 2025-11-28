# Workflow Configuration Setup Guide

This guide explains how to set up and use the in-UI editing feature for workflow prompts and AutoGen agent configurations.

## Database Setup

1. **Create the workflow_config table in Supabase:**

   Run the SQL script in `supabase_workflow_config_table.sql` in your Supabase SQL Editor:

   ```sql
   -- This creates the table and necessary indexes
   -- See supabase_workflow_config_table.sql for full SQL
   ```

2. **Verify the table was created:**
   - Go to Supabase Dashboard → Table Editor
   - You should see the `workflow_config` table

## How It Works

### Configuration Storage
- All custom prompts and AutoGen agent configurations are stored in Supabase
- Configurations are loaded when the server starts
- Changes are saved in real-time and immediately applied to the workflow

### Editing Prompts

1. **In the UI:**
   - Click on any workflow node (Firecrawl, Legal Analysis, Email Generation)
   - Navigate to the "Prompt" tab
   - Click "Edit" button
   - Modify the prompt text
   - Click "Save" to apply changes

2. **Placeholders:**
   - Use `${websiteUrl}` - Replaced with the website URL
   - Use `${documentsSummary}` - Replaced with the documents summary (Legal Analysis only)
   - Use `${analysisJSON}` - Replaced with the analysis JSON (Email Generation only)
   - Use `${leadInfo}` - Replaced with lead information JSON (Email Generation only)

### Editing AutoGen Agent Configurations

1. **In the UI:**
   - Click on a node that has AutoGen enabled (Legal Analysis or Email Generation)
   - Navigate to the "AutoGen Config" tab
   - Click "Edit Agents" button
   - Modify agent system messages, models, or temperature
   - Click "Save" on individual agents or "Save All" to save all changes

2. **Agent Types:**
   - **Legal Analysis Agents:**
     - `compliance_specialist` - Reviews compliance issues
     - `risk_assessor` - Validates risk categorization
     - `recommendations_specialist` - Ensures recommendations are actionable
   
   - **Email Generation Agents:**
     - `tone_specialist` - Reviews email tone and voice
     - `content_specialist` - Validates email structure
     - `personalization_specialist` - Ensures personalization

## API Endpoints

### Get All Configurations
```
GET /api/workflow-config
```

### Get Node Prompt
```
GET /api/workflow-config/node/:nodeId/prompt
```

### Save Node Prompt
```
PUT /api/workflow-config/node/:nodeId/prompt
Body: { "prompt": "..." }
```

### Get AutoGen Agent Config
```
GET /api/workflow-config/autogen/:agentId
```

### Save AutoGen Agent Config
```
PUT /api/workflow-config/autogen/:agentId
Body: {
  "systemMessage": "...",
  "model": "gpt-4o-mini",
  "temperature": 0.7
}
```

### Delete Configuration
```
DELETE /api/workflow-config/:type/:key
```

## Real-Time Updates

When you save a configuration:
1. It's immediately saved to Supabase
2. The workflow configuration is reloaded
3. The workflow service is updated with new configs
4. The next workflow run will use the new configurations

## Default Configurations

If no custom configuration exists:
- The system uses the default prompts and agent configurations
- Defaults are defined in the service files
- Custom configs override defaults when present

## Tips

1. **Test Changes:** After editing prompts, run a test workflow to see the results
2. **Version Control:** Consider keeping track of prompt versions in a separate document
3. **Placeholders:** Always use the correct placeholder format `${variableName}`
4. **Agent Configs:** Start with small changes to agent system messages to see the impact

## Troubleshooting

### Configurations Not Saving
- Check Supabase connection in `.env` file
- Verify the `workflow_config` table exists
- Check server console for errors

### Changes Not Applying
- Restart the server after making changes
- Verify the configuration was saved in Supabase
- Check that the workflow is using the updated config service

### Placeholders Not Replacing
- Ensure placeholders use exact format: `${variableName}`
- Check that the placeholder name matches the expected variable
- Verify the node type supports the placeholder you're using

