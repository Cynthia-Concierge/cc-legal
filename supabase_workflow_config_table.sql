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
-- Using a specific function name to avoid conflicts with other tables
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

