-- ============================================
-- Calendly Appointments Table Migration
-- ============================================
-- Stores full appointment details from Calendly webhooks

-- Create calendly_appointments table
CREATE TABLE IF NOT EXISTS calendly_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Calendly event details
    calendly_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL, -- 'invitee.created', 'invitee.canceled', 'invitee.rescheduled'

    -- Appointment details
    event_name TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled'
    location TEXT,

    -- Invitee details
    invitee_email TEXT NOT NULL,
    invitee_name TEXT,
    invitee_phone TEXT,

    -- Cancellation/reschedule tracking
    canceled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    rescheduled_from_event_id TEXT, -- If this was rescheduled from another event

    -- Questions & answers (JSON)
    questions_answers JSONB,

    -- UTM parameters & tracking (JSON)
    utm_parameters JSONB,

    -- Raw webhook payload (for debugging)
    raw_payload JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendly_appointments_event_id ON calendly_appointments(calendly_event_id);
CREATE INDEX IF NOT EXISTS idx_calendly_appointments_email ON calendly_appointments(invitee_email);
CREATE INDEX IF NOT EXISTS idx_calendly_appointments_start_time ON calendly_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_calendly_appointments_status ON calendly_appointments(status);
CREATE INDEX IF NOT EXISTS idx_calendly_appointments_created_at ON calendly_appointments(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_calendly_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendly_appointments_updated_at
    BEFORE UPDATE ON calendly_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_calendly_appointments_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE calendly_appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role has full access to calendly_appointments"
    ON calendly_appointments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to view their own appointments
CREATE POLICY "Users can view their own appointments"
    ON calendly_appointments
    FOR SELECT
    TO authenticated
    USING (invitee_email = auth.jwt() ->> 'email');

-- Policy: Allow admin users to view all appointments
CREATE POLICY "Admin users can view all appointments"
    ON calendly_appointments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

COMMENT ON TABLE calendly_appointments IS 'Stores full appointment details from Calendly webhook events';
COMMENT ON COLUMN calendly_appointments.calendly_event_id IS 'Unique event ID from Calendly';
COMMENT ON COLUMN calendly_appointments.event_type IS 'Type of webhook event (invitee.created, invitee.canceled, invitee.rescheduled)';
COMMENT ON COLUMN calendly_appointments.status IS 'Current status of appointment (active, canceled)';
COMMENT ON COLUMN calendly_appointments.rescheduled_from_event_id IS 'If rescheduled, the original event ID';
