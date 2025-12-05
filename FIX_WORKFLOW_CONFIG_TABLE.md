# Fix: workflow_config Table Missing in Production

## Problem
The `workflow_config` table doesn't exist in your production Supabase database, causing errors:
```
Could not find the table 'public.workflow_config' in the schema cache
```

## Solution

### Step 1: Create the Table in Production Supabase

1. Go to your **production Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the SQL script from `supabase_workflow_config_table.sql`:

```sql
-- Create the workflow_config table for storing custom prompts and AutoGen configurations
CREATE TABLE IF NOT EXISTS workflow_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL, -- 'node_prompt' or 'autogen_agent'
  config_key TEXT NOT NULL, -- node_id or agent_id
  config_value JSONB NOT NULL, -- The actual configuration data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(config_type, config_key)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_workflow_config_type_key ON workflow_config(config_type, config_key);
CREATE INDEX IF NOT EXISTS idx_workflow_config_updated_at ON workflow_config(updated_at DESC);

-- Add a comment to the table
COMMENT ON TABLE workflow_config IS 'Stores custom prompts for workflow nodes and AutoGen agent configurations';

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE TRIGGER update_workflow_config_updated_at
  BEFORE UPDATE ON workflow_config
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_config_updated_at();
```

### Step 2: Verify the Table Was Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see the `workflow_config` table
3. The table should be empty initially (that's fine)

### Step 3: Code Changes (Already Applied)

The code has been updated to:
- Handle missing table gracefully (returns empty config instead of crashing)
- Log a warning instead of an error when table doesn't exist
- Continue working even if the table is missing (uses default prompts)

## What This Table Does

The `workflow_config` table stores:
- **Custom prompts** for workflow nodes (Firecrawl, Legal Analysis, Email Generation)
- **AutoGen agent configurations** (system messages, models, temperature settings)

If the table doesn't exist, the system will use default prompts and configurations, which is why it still works locally (you might not have created the table there either).

## After Creating the Table

Once the table is created in production:
- The warning messages will stop appearing
- You can customize prompts and AutoGen configs via the UI
- All customizations will be saved to this table

## Quick Copy-Paste SQL

Just copy and paste this entire block into Supabase SQL Editor:

```sql
-- Create the workflow_config table for storing custom prompts and AutoGen configurations
CREATE TABLE IF NOT EXISTS workflow_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(config_type, config_key)
);

CREATE INDEX IF NOT EXISTS idx_workflow_config_type_key ON workflow_config(config_type, config_key);
CREATE INDEX IF NOT EXISTS idx_workflow_config_updated_at ON workflow_config(updated_at DESC);

COMMENT ON TABLE workflow_config IS 'Stores custom prompts for workflow nodes and AutoGen agent configurations';

CREATE OR REPLACE FUNCTION update_workflow_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_workflow_config_updated_at
  BEFORE UPDATE ON workflow_config
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_config_updated_at();
```

