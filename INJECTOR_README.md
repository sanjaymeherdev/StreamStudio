# Overlay JS Injector - Setup Guide

## Overview
The Overlay Admin JS Injector allows you to:
1. Select from existing JS templates (in `/public/js/`)
2. Fill in placeholder values with validated input
3. Send the final JavaScript to Supabase realtime table for injection into overlays

## Features

### Template Selection
- **Existing Templates Mode**: Browse and select from pre-built JS templates
- **Custom JS Mode**: Write your own JavaScript code

### Placeholder Validation
- Strict character whitelist prevents syntax-breaking characters
- Allowed: `a-z, A-Z, 0-9, space, . , @ _ - ₹ $ # & ! ? : / +`
- Blocked: `' " \ { } < > ; = ( ) [ ] ` ` and other dangerous symbols
- Uses `JSON.stringify()` for safe value substitution

### Real-time Injection
- Sends processed JS to `overlay_injects` Supabase table
- Android app listens for changes via Supabase Realtime
- Injects JS directly into WebView using `evaluateJavascript()`

## Database Schema Required

Run the complete SQL script from `/workspace/sql/overlay_injects_setup.sql` in your Supabase SQL Editor.

This creates:
- `overlay_injects` table with all required columns
- Indexes for performance
- Realtime publication
- Helper functions (auto-expiry, pending queue)
- Row Level Security policies
- Default expiry trigger
- Monitoring view

**Quick Setup:**
```sql
-- Minimum required:
CREATE TABLE IF NOT EXISTS overlay_injects (
    id BIGSERIAL PRIMARY KEY,
    js_code TEXT NOT NULL,
    device_slug TEXT,
    template_name TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

ALTER PUBLICATION supabase_realtime ADD TABLE overlay_injects;
```

## API Endpoints

### GET `/api/js-templates`
Returns all JS templates with placeholder info:
```json
[
  {
    "id": "01-subscriber-alert",
    "name": "01 Subscriber Alert",
    "filename": "01-subscriber-alert.js",
    "js_code": "...",
    "placeholders": ["name", "detail"]
  }
]
```

### POST `/api/overlay-inject`
Send processed JS to Supabase:
```json
{
  "js_code": "renderTemplate({...})",
  "table_name": "overlay_injects",
  "device_slug": "main-overlay",
  "template_name": "Subscriber Alert"
}
```

### GET `/api/overlay-injects`
Retrieve stored injections:
```bash
GET /api/overlay-injects?device_slug=main-overlay&limit=50
```

## Usage

1. **Start the server**: `node server.js`
2. **Open admin UI**: Navigate to `/admin-inject.html`
3. **Select a template** or write custom JS
4. **Fill placeholders** (validation happens in real-time)
5. **Click "Send to Overlay"** to inject into Supabase

## Template Format

Templates use `{{placeholder}}` syntax:

```javascript
renderTemplate({
  name: "subscriber-alert",
  elements: [
    { type:'text', x:90, y:102, content:'{{name}}', color:'#fff', fontSize:32 }
  ],
  animation: { type:'slide', direction:'down', duration:0.5 },
  duration: 6,
  loopCount: 1
}, {});
```

For templates requiring math (like progress bars), use IIFE pattern:

```javascript
(function() {
  var current = parseFloat("{{current}}") || 0;
  var target = parseFloat("{{target}}") || 1;
  var pct = Math.max(0, Math.min(1, current / target));
  var barWidth = Math.round(540 * pct);
  
  renderTemplate({...}, {});
})();
```

## Security Notes

1. **Input Validation**: Admin UI validates all placeholder values before substitution
2. **JSON.stringify**: Values are safely escaped using `JSON.stringify()`
3. **Character Whitelist**: Only safe characters allowed in placeholder values
4. **Supabase RLS**: Configure Row Level Security on `overlay_injects` table as needed

## Android Integration

In your `MainActivity.kt`, listen for Supabase Realtime changes:

```kotlin
supabase.from("overlay_injects")
    .query()
    .subscribe { change ->
        when(change) {
            is PostgresChange.Insert -> {
                val jsCode = change.data["js_code"].toString()
                webView.evaluateJavascript(jsCode, null)
            }
        }
    }
```
