-- ============================================
-- JS TEMPLATES TABLE FOR SCHEDULER
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- JS_TEMPLATES TABLE
-- Stores JavaScript templates for overlays with placeholders
-- ============================================
CREATE TABLE IF NOT EXISTS js_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    js_code TEXT NOT NULL,
    placeholders JSONB DEFAULT '[]'::jsonb,  -- Array of placeholder names
    category VARCHAR(100) DEFAULT 'general',  -- alert, banner, widget, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_js_templates_name ON js_templates(name);
CREATE INDEX IF NOT EXISTS idx_js_templates_category ON js_templates(category);
CREATE INDEX IF NOT EXISTS idx_js_templates_active ON js_templates(is_active);

-- ============================================
-- UPDATE SCHEDULES TABLE TO SUPPORT JS_TEMPLATES
-- ============================================
-- Add js_template_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' AND column_name = 'js_template_id'
    ) THEN
        ALTER TABLE schedules ADD COLUMN js_template_id UUID REFERENCES js_templates(id) ON DELETE SET NULL;
        ALTER TABLE schedules ADD COLUMN placeholder_values JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- ============================================
-- SEED DATA: 5 DEFAULT JS TEMPLATES
-- ============================================

-- Template 1: Subscriber Alert
INSERT INTO js_templates (name, description, js_code, placeholders, category) VALUES
('subscriber-alert', 'New subscriber notification overlay', 
$$renderTemplate({
  name: "subscriber-alert",
  elements: [
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:460, height:120, color:'rgba(8,10,16,0.85)', borderRadius:16, zIndex:1 },
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:6, height:120, color:'#22c55e', zIndex:2 },
    { type:'text', x:90, y:78, content:'NEW SUBSCRIBER', color:'#22c55e', fontSize:14, fontWeight:700, zIndex:3 },
    { type:'text', x:90, y:102, content:'{{name}}', color:'#fff', fontSize:32, fontWeight:800, zIndex:3 },
    { type:'text', x:90, y:148, content:'{{detail}}', color:'rgba(255,255,255,0.6)', fontSize:15, fontWeight:400, zIndex:3 }
  ],
  animation: { type:'slide', direction:'down', duration:0.5 },
  duration: 6,
  loopCount: 1
}, {});$$,
'["name", "detail"]'::jsonb,
'alert')
ON CONFLICT (name) DO NOTHING;

-- Template 2: Donation Alert
INSERT INTO js_templates (name, description, js_code, placeholders, category) VALUES
('donation-alert', 'Donation received notification with amount',
$$renderTemplate({
  name: "donation-alert",
  elements: [
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:500, height:140, color:'rgba(8,10,16,0.9)', borderRadius:16, zIndex:1 },
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:6, height:140, color:'#fbbf24', zIndex:2 },
    { type:'text', x:90, y:78, content:'💰 DONATION RECEIVED', color:'#fbbf24', fontSize:14, fontWeight:700, zIndex:3 },
    { type:'text', x:90, y:105, content:'{{donor_name}}', color:'#fff', fontSize:28, fontWeight:800, zIndex:3 },
    { type:'text', x:90, y:145, content:'${{amount}} - {{message}}', color:'rgba(255,255,255,0.7)', fontSize:16, fontWeight:400, zIndex:3 }
  ],
  animation: { type:'zoom', duration:0.4 },
  duration: 8,
  loopCount: 1
}, {});$$,
'["donor_name", "amount", "message"]'::jsonb,
'alert')
ON CONFLICT (name) DO NOTHING;

-- Template 3: Social Media Banner
INSERT INTO js_templates (name, description, js_code, placeholders, category) VALUES
('social-banner', 'Display social media handles banner',
$$renderTemplate({
  name: "social-banner",
  elements: [
    { type:'shape', shapeType:'rectangle', x:60, y:900, width:400, height:60, color:'rgba(8,10,16,0.85)', borderRadius:12, zIndex:1 },
    { type:'text', x:80, y:915, content:'Follow: {{handle}}', color:'#fff', fontSize:20, fontWeight:600, zIndex:2 },
    { type:'text', x:80, y:940, content:'{{platform}}', color:'#6366f1', fontSize:14, fontWeight:500, zIndex:2 }
  ],
  animation: { type:'slide', direction:'up', duration:0.4 },
  duration: 10,
  loopCount: 1
}, {});$$,
'["handle", "platform"]'::jsonb,
'banner')
ON CONFLICT (name) DO NOTHING;

-- Template 4: Countdown Timer
INSERT INTO js_templates (name, description, js_code, placeholders, category) VALUES
('countdown-timer', 'Countdown to event overlay',
$$renderTemplate({
  name: "countdown-timer",
  elements: [
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:350, height:100, color:'rgba(8,10,16,0.9)', borderRadius:16, zIndex:1 },
    { type:'text', x:80, y:80, content:'STARTING IN', color:'#ef4444', fontSize:16, fontWeight:700, zIndex:2 },
    { type:'text', x:80, y:115, content:'{{time}}', color:'#fff', fontSize:42, fontWeight:800, zIndex:2 },
    { type:'text', x:80, y:145, content:'{{event_name}}', color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:400, zIndex:2 }
  ],
  animation: { type:'fade', duration:0.3 },
  duration: 5,
  loopCount: 1
}, {});$$,
'["time", "event_name"]'::jsonb,
'widget')
ON CONFLICT (name) DO NOTHING;

-- Template 5: Leaderboard Display
INSERT INTO js_templates (name, description, js_code, placeholders, category) VALUES
('leaderboard-display', 'Show top supporters leaderboard',
$$renderTemplate({
  name: "leaderboard-display",
  elements: [
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:400, height:200, color:'rgba(8,10,16,0.92)', borderRadius:16, zIndex:1 },
    { type:'text', x:80, y:80, content:'🏆 TOP SUPPORTERS', color:'#fbbf24', fontSize:18, fontWeight:800, zIndex:2 },
    { type:'text', x:80, y:115, content:'1. {{top1}}', color:'#fff', fontSize:16, fontWeight:600, zIndex:2 },
    { type:'text', x:80, y:145, content:'2. {{top2}}', color:'rgba(255,255,255,0.8)', fontSize:16, fontWeight:500, zIndex:2 },
    { type:'text', x:80, y:175, content:'3. {{top3}}', color:'rgba(255,255,255,0.6)', fontSize:16, fontWeight:500, zIndex:2 },
    { type:'text', x:80, y:210, content:'{{subtitle}}', color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:400, zIndex:2 }
  ],
  animation: { type:'slide', direction:'right', duration:0.5 },
  duration: 10,
  loopCount: 1
}, {});$$,
'["top1", "top2", "top3", "subtitle"]'::jsonb,
'widget')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON js_templates TO anon;
GRANT ALL ON js_templates TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Disable RLS for development (enable for production!)
ALTER TABLE js_templates DISABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get due JS template schedules
-- ============================================
CREATE OR REPLACE FUNCTION get_due_js_schedules()
RETURNS TABLE (
    schedule_id UUID,
    js_template_id UUID,
    device_id VARCHAR,
    duration_seconds INTEGER,
    placeholder_values JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as schedule_id,
        s.js_template_id,
        s.device_id,
        s.duration_seconds,
        s.placeholder_values
    FROM schedules s
    WHERE s.is_active = true
      AND s.js_template_id IS NOT NULL
      AND s.start_datetime <= NOW()
      AND (s.end_datetime IS NULL OR s.end_datetime > NOW())
    ORDER BY s.start_datetime ASC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_due_js_schedules TO anon;
GRANT EXECUTE ON FUNCTION get_due_js_schedules TO authenticated;
