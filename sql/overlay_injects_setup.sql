-- ============================================
-- OVERLAY INJECTS TABLE (Realtime JS Delivery)
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS overlay_injects (
    id BIGSERIAL PRIMARY KEY,
    
    -- Core JS content
    js_code TEXT NOT NULL,
    
    -- Targeting & routing
    device_slug TEXT,                    -- Specific device (null = broadcast to all)
    template_name TEXT,                  -- Original template name for reference
    filename TEXT,                       -- Optional custom filename
    
    -- Status tracking
    status TEXT DEFAULT 'pending',       -- pending, sent, processed, failed, expired
    error_message TEXT,                  -- Store any execution errors
    
    -- Metadata
    created_by TEXT,                     -- Admin user who created it
    priority INTEGER DEFAULT 0,          -- Higher priority = process first
    expires_at TIMESTAMPTZ,              -- Auto-expire old injections
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,                 -- When sent to device
    processed_at TIMESTAMPTZ,            -- When device confirmed processing
    
    -- Additional context
    metadata JSONB DEFAULT '{}'::jsonb   -- Store placeholder values, version, etc.
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Fast lookup by device
CREATE INDEX IF NOT EXISTS idx_overlay_injects_device 
ON overlay_injects(device_slug, status, created_at DESC);

-- Fast lookup by status (for pending queue)
CREATE INDEX IF NOT EXISTS idx_overlay_injects_status 
ON overlay_injects(status, priority DESC, created_at ASC);

-- Fast lookup for recent injections
CREATE INDEX IF NOT EXISTS idx_overlay_injects_recent 
ON overlay_injects(created_at DESC);

-- Index on expires_at for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_overlay_injects_expires 
ON overlay_injects(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Ensure publication exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE overlay_injects;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-expire old pending injections
CREATE OR REPLACE FUNCTION expire_old_overlay_injects()
RETURNS void AS $$
BEGIN
    UPDATE overlay_injects
    SET status = 'expired'
    WHERE status = 'pending'
    AND (
        expires_at < NOW()
        OR created_at < NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get next pending injection for a device
CREATE OR REPLACE FUNCTION get_next_pending_overlay(p_device_slug TEXT)
RETURNS SETOF overlay_injects AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM overlay_injects
    WHERE status = 'pending'
    AND (device_slug IS NULL OR device_slug = p_device_slug)
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY priority DESC, created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================

ALTER TABLE overlay_injects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert
CREATE POLICY "Allow insert for authenticated users"
ON overlay_injects FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view their own injections
CREATE POLICY "Allow select for authenticated users"
ON overlay_injects FOR SELECT
TO authenticated
USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access"
ON overlay_injects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-set expires_at if not provided (24 hour default)
CREATE OR REPLACE FUNCTION set_default_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NEW.created_at + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_default_expiry
BEFORE INSERT ON overlay_injects
FOR EACH ROW
EXECUTE FUNCTION set_default_expiry();

-- ============================================
-- VIEW FOR MONITORING
-- ============================================

CREATE OR REPLACE VIEW v_overlay_injects_summary AS
SELECT 
    status,
    COUNT(*) as count,
    COUNT(DISTINCT device_slug) as unique_devices,
    MAX(created_at) as latest_injection
FROM overlay_injects
GROUP BY status
ORDER BY count DESC;
