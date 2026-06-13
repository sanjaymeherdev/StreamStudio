# StreamStudio - RTMP Overlay Management System

A complete web-based overlay management system for live streaming with scheduled triggers, real-time updates, and analytics.

## Features

- **Overlay Builder**: Create custom overlays with drag-and-drop or JSON editor
- **Schedule Manager**: Schedule overlays to trigger at specific times with realtime database updates
- **Analytics Dashboard**: View overlay performance, schedule logs, and trigger history
- **Real-time Updates**: Supabase Realtime automatically pushes schedule changes to connected clients
- **Template System**: Save and reuse overlay designs
- **JS Injection**: Inject custom JavaScript into overlays dynamically

## Prerequisites

- Node.js 16+ 
- npm
- Supabase account (free tier works)

## Installation

```bash
# Clone or download the project
cd streamstudio

# Install dependencies
npm install

# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env with your Supabase URL and API key
```

## Database Setup

Run the following SQL in your Supabase SQL Editor. This creates all required tables without Row Level Security (RLS).

### Complete SQL Setup Script

```sql
-- ============================================
-- STREAMSTUDIO DATABASE SETUP
-- No RLS - For development/testing only
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEMPLATES TABLE
-- Stores overlay template definitions
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    html_content TEXT NOT NULL,
    css_content TEXT DEFAULT '',
    js_content TEXT DEFAULT '',
    thumbnail_url VARCHAR(500) DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCHEDULES TABLE
-- Stores scheduled overlay triggers
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    device_id VARCHAR(100) DEFAULT 'phone1',
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ DEFAULT NULL,
    repeat_interval_seconds INTEGER DEFAULT 0,
    repeat_qty INTEGER DEFAULT 1,
    loop_count INTEGER DEFAULT 1,
    duration_seconds INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient schedule queries
CREATE INDEX IF NOT EXISTS idx_schedules_start ON schedules(start_datetime);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_device ON schedules(device_id);

-- ============================================
-- DEVICE_STATE TABLE
-- Tracks current state of each device
-- ============================================
CREATE TABLE IF NOT EXISTS device_state (
    device_id VARCHAR(100) PRIMARY KEY,
    template_id UUID REFERENCES templates(id),
    active_url VARCHAR(500) DEFAULT '',
    overlay_active_until TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCHEDULE_LOGS TABLE
-- Logs all schedule trigger events
-- ============================================
CREATE TABLE IF NOT EXISTS schedule_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    device_id VARCHAR(100) DEFAULT 'phone1',
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT DEFAULT '',
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    repeat_count INTEGER DEFAULT 1
);

-- Index for log queries
CREATE INDEX IF NOT EXISTS idx_schedule_logs_triggered ON schedule_logs(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_logs_schedule ON schedule_logs(schedule_id);

-- ============================================
-- OVERLAY_DESIGNS TABLE
-- Stores visual overlay designs (JSON format)
-- ============================================
CREATE TABLE IF NOT EXISTS overlay_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    design_json JSONB NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overlay_designs_slug ON overlay_designs(slug);

-- ============================================
-- OVERLAY_INJECTS TABLE
-- Stores JS code injections for overlays
-- ============================================
CREATE TABLE IF NOT EXISTS overlay_injects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    js_code TEXT NOT NULL,
    device_slug VARCHAR(100) DEFAULT '',
    template_name VARCHAR(255) DEFAULT '',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HELPER FUNCTION: Get Due Schedules
-- Returns schedules that should trigger now
-- ============================================
CREATE OR REPLACE FUNCTION get_due_schedules()
RETURNS TABLE (
    schedule_id UUID,
    template_id UUID,
    device_id VARCHAR,
    duration_seconds INTEGER,
    repeat_interval_seconds INTEGER,
    repeat_qty INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as schedule_id,
        s.template_id,
        s.device_id,
        s.duration_seconds,
        s.repeat_interval_seconds,
        s.repeat_qty
    FROM schedules s
    WHERE s.is_active = true
      AND s.start_datetime <= NOW()
      AND (s.end_datetime IS NULL OR s.end_datetime > NOW())
    ORDER BY s.start_datetime ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA (Optional)
-- ============================================

-- Insert a default device
INSERT INTO device_state (device_id, template_id, active_url, updated_at)
VALUES ('phone1', NULL, '', NOW())
ON CONFLICT (device_id) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS (No RLS)
-- ============================================

-- Grant all permissions to authenticated and anon users
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Disable RLS on all tables (for development only!)
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE overlay_designs DISABLE ROW LEVEL SECURITY;
ALTER TABLE overlay_injects DISABLE ROW LEVEL SECURITY;
```

## Configuration

### Environment Variables (.env)

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
RENDER_EXTERNAL_URL=https://your-app.onrender.com
```

### Update Supabase Credentials in Frontend

Update the following files with your Supabase credentials:

1. `public/index.html` (line ~184)
2. `public/schedules.html` (line ~367)
3. `public/streamstats.html` (line ~367)

Search for:
```javascript
const SUPABASE_URL = 'https://yfjzvpzgecbnfysacbjq.supabase.co';
const SUPABASE_ANON_KEY = 'your-key-here';
```

## Usage

### Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Admin Dashboard

Visit `http://localhost:3000` to access the admin dashboard with three main sections:

#### 1. Overlay Builder (`/designer.html`)
- Create custom overlays visually or with JSON
- Preview overlays in real-time
- Save templates for later use

#### 2. Schedule Manager (`/schedules.html`)
- View all scheduled overlays in a realtime table
- Create new schedules with:
  - Template selection
  - Device ID assignment
  - Start/end datetime
  - Repeat intervals
  - Duration control
- Edit or delete existing schedules
- Test trigger overlays manually
- **Realtime updates**: Changes propagate instantly via Supabase Realtime

#### 3. Analytics (`/streamstats.html`)
- View statistics:
  - Total templates
  - Active schedules
  - Triggers today
  - Success rate
- Recent schedule logs with status
- All templates overview
- Upcoming schedules
- Export logs to CSV
- **Realtime updates**: New logs appear automatically

### How Scheduling Works

1. **Create a Schedule**: Use the Schedule Manager to create a schedule
2. **Database Update**: Schedule is saved to Supabase `schedules` table
3. **Realtime Trigger**: The server polls every 60 seconds (via self-cron) checking for due schedules
4. **Device State Update**: When a schedule is due, the `device_state` table is updated
5. **WebView Detection**: Your Android app (or other client) listens to `device_state` changes via Supabase Realtime
6. **Overlay Display**: The WebView loads the overlay URL from `active_url` field
7. **Auto-hide**: After the specified duration, the overlay automatically hides
8. **Logging**: All triggers are logged to `schedule_logs` table

### API Endpoints

#### Templates
- `GET /api/templates` - List all templates
- `GET /api/template/:id` - Get single template
- `POST /api/templates` - Create template
- `PUT /api/template/:id` - Update template
- `DELETE /api/template/:id` - Delete template

#### Schedules
- `GET /api/schedules` - List all schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedule/:id` - Update schedule
- `DELETE /api/schedule/:id` - Delete schedule
- `POST /api/trigger-now` - Manually trigger an overlay
- `GET /api/schedule-logs` - Get schedule execution logs

#### Overlays
- `GET /api/overlay/:templateId` - Get rendered overlay HTML
- `GET /o/:slug` - Get overlay by design slug

#### JS Templates
- `GET /api/js-templates` - List available JS injection templates
- `POST /api/overlay-inject` - Inject JS code into database
- `GET /api/overlay-injects` - Retrieve stored injections

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Admin Dashboard│────▶│  Express.js  │────▶│   Supabase      │
│  (HTML/JS)      │     │   Server     │     │   Database      │
└─────────────────┘     └──────────────┘     └─────────────────┘
                               │                      │
                               │                      │
                         ┌─────▼─────┐         ┌──────▼──────┐
                         │  Cron Job │         │  Realtime   │
                         │  (60s)    │         │  WebSocket  │
                         └───────────┘         └─────────────┘
                                                       │
                                                ┌──────▼──────┐
                                                │  Android    │
                                                │  WebView    │
                                                └─────────────┘
```

## File Structure

```
streamstudio/
├── server.js              # Main Express server
├── scheduler.js           # Schedule management module
├── package.json           # Dependencies
├── .env                   # Environment variables
├── public/
│   ├── index.html         # Admin dashboard
│   ├── designer.html      # Overlay builder
│   ├── schedules.html     # Schedule manager (realtime table)
│   ├── streamstats.html   # Analytics dashboard
│   ├── admin-inject.html  # JS injection interface
│   ├── about.html         # About page
│   ├── app.js             # Shared frontend utilities
│   ├── style.css          # Global styles
│   └── js/                # JS template files
│       ├── 01-subscriber-alert.js
│       ├── 02-donation-alert.js
│       └── ...
└── README.md              # This file
```

## Deployment (Render.com)

1. **Create new Web Service** on Render
2. **Connect** your GitHub repository
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`
5. **Environment Variables**: Add all from `.env`
6. **Deploy**

The server includes auto keep-alive pings every 14 minutes to prevent sleeping on free tier.

## Security Notes

⚠️ **WARNING**: This setup disables Row Level Security (RLS) for ease of development. For production:

1. Enable RLS on all tables
2. Create proper policies for authenticated users
3. Use service role keys only on the server
4. Never expose service role keys in frontend code

Example RLS policy:
```sql
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
ON templates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

## Troubleshooting

### Schedules not triggering?
- Check server logs for `[scheduler]` messages
- Verify `start_datetime` is in the past
- Ensure `is_active = true`
- Check server is running (not sleeping on free tier)

### Realtime not working?
- Verify Supabase credentials are correct
- Check browser console for WebSocket errors
- Ensure tables have proper indexes

### Overlay not showing?
- Check `device_state` table for correct `active_url`
- Verify Android app is listening to Supabase changes
- Check overlay URL is accessible

## License

MIT License - Feel free to use and modify for your projects!

## Support

For issues or questions, check the server logs and Supabase dashboard for error messages.

---

Built with ❤️ for streamers who need professional overlays without the complexity.
