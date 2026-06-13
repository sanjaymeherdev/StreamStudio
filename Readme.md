## STREAMSTUDIO BY SANJAY MEHER
- Turn your mobile into a live streaming studio

## 🎬 Overlay JS Injector (NEW!)

A powerful admin interface for managing and injecting JavaScript overlays in real-time.

### Quick Start

1. **Run SQL Setup** (in Supabase SQL Editor):
   ```bash
   # Copy the contents of /workspace/sql/overlay_injects_setup.sql
   # Paste into Supabase Dashboard > SQL Editor > Run
   ```

2. **Start Server**:
   ```bash
   node server.js
   ```

3. **Open Admin UI**:
   - Navigate to: `http://localhost:3000/admin-inject.html`
   - Or production URL: `YOUR_RENDER_URL/admin-inject.html`

### Features

✅ **15 Pre-built Templates**: Subscriber alerts, donations, leaderboards, polls, weather, QR codes & more
✅ **Strict Validation**: Only safe characters allowed (prevents JS injection attacks)
✅ **Real-time Delivery**: Supabase Realtime pushes JS to Android app instantly
✅ **Custom JS Mode**: Create your own templates with placeholder support
✅ **Device Targeting**: Send overlays to specific devices or broadcast to all
✅ **Auto-expiry**: Old pending injections auto-expire after 24 hours

### Available Templates

| ID | Name | Placeholders | Use Case |
|----|------|--------------|----------|
| 01 | Subscriber Alert | name, detail | New subscriber notifications |
| 02 | Donation Alert | name, amount, message | Donation thank you |
| 03 | Follow Alert | name | New follower notification |
| 04 | Raid Alert | name, viewers | Raid incoming |
| 05 | Sub Goal Bar | current, target | Progress bar for goals |
| 06 | Social Banner | handle, platform | Social media promotion |
| 07 | Promo Banner | title, subtitle, cta | Product/service promo |
| 08 | Countdown | label, seconds | Event countdown timer |
| 09 | Chat Message | username, message | Display chat on stream |
| 10 | BRB Screen | reason, time | Break announcement |
| 11 | Live Ticker | message, duration, loopCount | Scrolling news/sponsors |
| 12 | Leaderboard | title, supporters_json, duration, loopCount | Top supporters list |
| 13 | QR Display | qr_url, label, duration, loopCount | Payment/follow QR code |
| 14 | Poll Results | question, option1, votes1, option2, votes2 | Live poll display |
| 15 | Weather Widget | location, temp, condition, high, low | Current weather info |

### API Endpoints

```
GET  /api/js-templates          - List all templates with placeholders
POST /api/overlay-inject        - Send JS to Supabase realtime table
GET  /api/overlay-injects       - Retrieve stored injections
```

### Security

- Character whitelist: `a-z A-Z 0-9 space . , @ _ - ₹ $ # & ! ? : / +`
- JSON.stringify() escaping for all values
- Row Level Security (RLS) enabled on database table
- No dangerous symbols allowed in placeholder values

### Android Integration

In your `MainActivity.kt`:

```kotlin
supabase.from("overlay_injects")
    .query()
    .eq("status", "pending")
    .subscribe { change ->
        val jsCode = change.data["js_code"].toString()
        webView.evaluateJavascript(jsCode, null)
        // Update status to 'processed'
    }
```

---

## Original Features

- **Overlay Builder** (`/designer.html`) - Visual drag-and-drop editor
- **Template Management** - CRUD for HTML/CSS/JS templates  
- **Schedule System** - Time-based overlay triggering
- **Device State Tracking** - Manage active overlays per device
- **20+ Animations** - fadeIn, slide, zoom, bounce, pulse, spin, glitch, etc.

