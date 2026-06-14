require('dotenv').config()
const express = require('express')
const fetch = require('node-fetch')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const ws = require('ws')

const app = express()
const PORT = process.env.PORT || 3000
const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yfjzvpzgecbnfysacbjq.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmanp2cHpnZWNibmZ5c2FjYmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTY2MzcsImV4cCI6MjA4MzU3MjYzN30.v27rjgUTGuHAq6sAjhjQYWb-Y9O23f5FpwXQBFZyjmQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: {
        transport: ws
    }
})

// Middleware
app.use(express.json())
// Add after app.use(express.json())
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
app.use(express.static(path.join(__dirname, 'public')))

// ============================================
// HEALTH & KEEP-ALIVE
// ============================================

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Keep-alive ping every 14 minutes (prevents Render from sleeping)
setInterval(async () => {
    try {
        await fetch(`${SELF_URL}/health`)
        console.log('[keep-alive] ping sent at', new Date().toISOString())
    } catch (e) {
        console.log('[keep-alive] ping failed')
    }
}, 14 * 60 * 1000)

// ============================================
// TEMPLATE CRUD
// ============================================

app.get('/api/templates', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: false })
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/template/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', req.params.id)
            .single()
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
})

app.post('/api/templates', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('templates')
            .insert([{
                name: req.body.name,
                description: req.body.description || '',
                html_content: req.body.html_content,
                css_content: req.body.css_content || '',
                js_content: req.body.js_content || '',
                thumbnail_url: req.body.thumbnail_url || '',
                is_active: req.body.is_active !== undefined ? req.body.is_active : true
            }])
            .select()
            .single()
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.put('/api/template/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('templates')
            .update({
                name: req.body.name,
                description: req.body.description,
                html_content: req.body.html_content,
                css_content: req.body.css_content,
                js_content: req.body.js_content,
                thumbnail_url: req.body.thumbnail_url,
                is_active: req.body.is_active,
                updated_at: new Date()
            })
            .eq('id', req.params.id)
            .select()
            .single()
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.delete('/api/template/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', req.params.id)
        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============================================
// OVERLAY DESIGN API
// ============================================

// Generate unique slug
function generateSlug() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < 8; i++) {
        slug += chars[Math.floor(Math.random() * chars.length)];
    }
    return slug;
}

// Save overlay design
app.post('/api/overlay/save', async (req, res) => {
    try {
        const { name, description, design_json } = req.body;
        
        if (!name || !design_json) {
            return res.status(400).json({ error: 'Name and design_json required' });
        }
        
        // Generate unique slug
        let slug = generateSlug();
        let exists = true;
        while (exists) {
            const { data, error } = await supabase
                .from('overlay_designs')
                .select('slug')
                .eq('slug', slug)
                .single();
            if (error || !data) {
                exists = false;
            } else {
                slug = generateSlug();
            }
        }
        
        const { data, error } = await supabase
            .from('overlay_designs')
            .insert([{
                slug: slug,
                name: name,
                description: description || '',
                design_json: design_json
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            id: data.id,
            slug: data.slug,
            url: `${SELF_URL}/o/${slug}`
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all designs
app.get('/api/overlay/designs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('overlay_designs')
            .select('id, slug, name, description, created_at, updated_at, view_count')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single design by slug
app.get('/api/overlay/design/:slug', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('overlay_designs')
            .select('*')
            .eq('slug', req.params.slug)
            .single();
        
        if (error) throw error;
        
        // Increment view count
        await supabase
            .from('overlay_designs')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('slug', req.params.slug);
        
        res.json(data);
    } catch (error) {
        res.status(404).json({ error: 'Design not found' });
    }
});

// Delete design
app.delete('/api/overlay/design/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('overlay_designs')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Render overlay page (transparent, for WebView)
app.get('/o/:slug', async (req, res) => {
    try {
        const { data: design, error } = await supabase
            .from('overlay_designs')
            .select('*')
            .eq('slug', req.params.slug)
            .single();
        
        if (error || !design) {
            return res.status(404).send('<h1>Overlay not found</h1>');
        }
        
        const html = renderOverlayHTML(design.design_json);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        
    } catch (error) {
        res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
    }
});

// Render overlay HTML from design JSON
function renderOverlayHTML(design) {
    const { width = 1920, height = 1080, elements = [], background = 'transparent' } = design;

    let css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            width: 100vw; height: 100vh;
            background: ${background};
            overflow: hidden;
            position: relative;
        }
        .overlay-container {
            position: relative;
            width: ${width}px;
            height: ${height}px;
            transform-origin: top left;
        }
        .ov-el { position: absolute; }

        @keyframes ov-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ov-fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes ov-slideUp { from { transform: translate(var(--tx),calc(var(--ty) + 80px)) rotate(var(--rot)); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)); opacity: 1; } }
        @keyframes ov-slideDown { from { transform: translate(var(--tx),calc(var(--ty) - 80px)) rotate(var(--rot)); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)); opacity: 1; } }
        @keyframes ov-slideLeft { from { transform: translate(calc(var(--tx) + 120px),var(--ty)) rotate(var(--rot)); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)); opacity: 1; } }
        @keyframes ov-slideRight { from { transform: translate(calc(var(--tx) - 120px),var(--ty)) rotate(var(--rot)); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)); opacity: 1; } }
        @keyframes ov-zoomIn { from { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0.3); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1); opacity: 1; } }
        @keyframes ov-zoomOut { from { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1.8); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1); opacity: 1; } }
        @keyframes ov-bounceIn {
            0% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0.4); opacity: 0; }
            60% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1.1); }
            80% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0.95); }
            100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1); opacity: 1; }
        }
        @keyframes ov-pulse { 0%,100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1); } 50% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1.08); } }
        @keyframes ov-shake {
            0%,100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) translateX(0); }
            20% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) translateX(-12px); }
            40% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) translateX(12px); }
            60% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) translateX(-8px); }
            80% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) translateX(8px); }
        }
        @keyframes ov-float { 0%,100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) translateY(0); } 50% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) translateY(-18px); } }
        @keyframes ov-spin { from { transform: translate(var(--tx),var(--ty)) rotate(0deg); } to { transform: translate(var(--tx),var(--ty)) rotate(360deg); } }
        @keyframes ov-swing { 0%,100% { transform: translate(var(--tx),var(--ty)) rotate(0deg); } 25% { transform: translate(var(--tx),var(--ty)) rotate(8deg); } 75% { transform: translate(var(--tx),var(--ty)) rotate(-8deg); } }
        @keyframes ov-flicker { 0%,100% { opacity: 1; } 10% { opacity: 0.1; } 30% { opacity: 1; } 50% { opacity: 0.3; } 70% { opacity: 1; } 90% { opacity: 0.2; } }
        @keyframes ov-rollIn { from { transform: translate(calc(var(--tx) - 200px),var(--ty)) rotate(-120deg); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)); opacity: 1; } }
        @keyframes ov-dropIn {
            0% { transform: translate(var(--tx),calc(var(--ty) - 200px)) rotate(10deg); opacity: 0; }
            70% { transform: translate(var(--tx),calc(var(--ty) + 12px)) rotate(-2deg); }
            100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)); opacity: 1; }
        }
        @keyframes ov-flipX { from { transform: translate(var(--tx),var(--ty)) rotateX(90deg); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotateX(0); opacity: 1; } }
        @keyframes ov-flipY { from { transform: translate(var(--tx),var(--ty)) rotateY(90deg); opacity: 0; } to { transform: translate(var(--tx),var(--ty)) rotateY(0); opacity: 1; } }
        @keyframes ov-typewriter { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0% 0 0); } }
        @keyframes ov-glitch {
            0%,100% { transform: translate(var(--tx),var(--ty)); }
            20% { transform: translate(calc(var(--tx) - 4px),calc(var(--ty) + 2px)); }
            40% { transform: translate(calc(var(--tx) + 4px),calc(var(--ty) - 2px)); }
            60% { transform: translate(calc(var(--tx) - 2px),calc(var(--ty) - 4px)); }
            80% { transform: translate(calc(var(--tx) + 2px),calc(var(--ty) + 4px)); }
        }
    `;

    let html = '<div class="overlay-container">';

    const loopingAnims = ['pulse','swing','float','spin','flicker'];

    elements.forEach(el => {
        const tx = `${el.x || 0}px`;
        const ty = `${el.y || 0}px`;
        const rot = `${el.rotation || 0}deg`;

        let styles = [
            `--tx: ${tx}`,
            `--ty: ${ty}`,
            `--rot: ${rot}`,
            `z-index: ${el.zIndex || 10}`,
            `opacity: ${(el.opacity ?? 100) / 100}`,
            `transform: translate(${tx},${ty}) rotate(${rot})`
        ];

        if (el.animation && el.animation !== 'none') {
            const isLoop = loopingAnims.includes(el.animation);
            const iter = isLoop ? 'infinite' : '1';
            const fill = isLoop ? 'none' : 'both';
            styles.push(`animation: ov-${el.animation} ${el.animDuration || 0.6}s ${el.animEasing || 'ease-out'} ${el.animDelay || 0}s ${iter} ${fill}`);
        }

        let content = '';
        let extraStyles = [];

        switch (el.type) {
            case 'shape':
                if (el.shapeType === 'rectangle') {
                    extraStyles.push(`width:${el.width}px`, `height:${el.height}px`, `background:${el.color}`, `border-radius:${el.borderRadius||0}px`);
                } else if (el.shapeType === 'circle') {
                    extraStyles.push(`width:${el.size}px`, `height:${el.size}px`, `background:${el.color}`, `border-radius:50%`);
                } else if (el.shapeType === 'line') {
                    extraStyles.push(`width:${el.width}px`, `height:${el.thickness}px`, `background:${el.color}`, `border-radius:${(el.thickness||2)/2}px`);
                }
                break;

            case 'image':
                extraStyles.push(`width:${el.width}px`, `border-radius:${el.borderRadius||0}px`, `display:block`);
                content = `<img src="${el.src}" style="width:100%;height:auto;border-radius:${el.borderRadius||0}px;display:block;" alt="">`;
                break;

            case 'text': {
                const shadowMap = {
                    none: 'none',
                    soft: '2px 2px 8px rgba(0,0,0,0.4)',
                    hard: '2px 2px 0 rgba(0,0,0,0.9)',
                    glow: `0 0 20px ${el.color}`
                };
                extraStyles.push(
                    `color:${el.color}`, `font-size:${el.fontSize}px`, `font-weight:${el.fontWeight}`,
                    `font-family:${el.fontFamily}`, `text-align:${el.textAlign}`, `max-width:${el.maxWidth}px`,
                    `background:${el.bgColor}`, `padding:${el.padding||0}px`, `border-radius:${el.borderRadius||0}px`,
                    `white-space:pre-wrap`, `text-shadow:${shadowMap[el.textShadow]||'none'}`
                );
                content = el.content;
                break;
            }

            case 'social': {
                const icons = { youtube: '▶', twitch: '◉', tiktok: '♪', instagram: '◎', twitter: '𝕏', facebook: 'f' };
                extraStyles.push(`background:${el.bgColor}`, `padding:${el.padding}`, `border-radius:${el.borderRadius||0}px`, `display:inline-block`);
                content = `<div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:${el.iconSize}px">${icons[el.platform] || '◈'}</span>
                    <span style="color:${el.textColor};font-size:${el.fontSize}px;font-weight:bold">@${el.username}</span>
                    ${el.showLiveBadge ? '<span style="color:#ff4444;font-size:13px;background:rgba(255,68,68,0.2);padding:2px 8px;border-radius:20px">LIVE</span>' : ''}
                </div>`;
                break;
            }
        }

        html += `<div class="ov-el" style="${styles.concat(extraStyles).join(';')}">${content}</div>`;
    });

    html += '</div>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Overlay</title>
    <style>
        ${css}
        html, body { background: transparent; }
        .overlay-container {
            transform: scale(min(100vw / ${width}, 100vh / ${height}));
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
}
// ============================================
// SCHEDULE CRUD
// ============================================
async function triggerDueSchedules() {
    const checkTime = new Date().toISOString();
    console.log('[scheduler] 🔍 Checking due schedules at', checkTime);
    
    const { data: dueSchedules, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('is_active', true)
        .lte('start_datetime', checkTime)
        .or(`end_datetime.is.null,end_datetime.gte.${checkTime}`);
    
    if (error) {
        console.error('[scheduler] ❌ Query error:', error.message);
        return { triggered: 0, error: error.message };
    }
    
    console.log('[scheduler] Found', dueSchedules?.length || 0, 'due schedules');
    
    let triggered = 0;
    
    for (const schedule of dueSchedules || []) {
        console.log('[scheduler] Processing schedule:', schedule.id, 'duration:', schedule.duration_seconds, 'seconds');
        
        // Check repeat limit
        const { count, error: countError } = await supabase
            .from('schedule_logs')
            .select('*', { count: 'exact', head: true })
            .eq('schedule_id', schedule.id)
            .eq('status', 'completed');
        
        if (countError) {
            console.log('[scheduler] ⚠️ Count error for schedule', schedule.id, ':', countError.message);
            continue;
        }
        
        if (count >= schedule.repeat_qty) {
            console.log('[scheduler] ⏭️ Skipping schedule', schedule.id, '- repeat limit reached');
            continue;
        }
        
        try {
            const { data: template, error: templateError } = await supabase
                .from('templates')
                .select('*')
                .eq('id', schedule.template_id)
                .single();
            
            if (templateError || !template) {
                console.log('[scheduler] ❌ Template not found:', schedule.template_id);
                continue;
            }
            
            console.log('[scheduler] ✓ Found template:', template.name);
            
            const overlayUrl = `${SELF_URL}/api/overlay/${schedule.template_id}`;
            
            // CRITICAL FIX: Use the duration from schedule
            const overlayUntil = new Date(Date.now() + (schedule.duration_seconds * 1000)).toISOString();
            console.log('[scheduler] Overlay will expire at:', overlayUntil);
            
            const { error: updateError } = await supabase
                .from('device_state')
                .update({
                    template_id: schedule.template_id,
                    active_url: overlayUrl,
                    overlay_active_until: overlayUntil,
                    updated_at: new Date()
                })
                .eq('device_id', schedule.device_id);
            
            if (updateError) {
                console.log('[scheduler] ❌ Failed to update device_state:', updateError.message);
                throw updateError;
            }
            
            await supabase
                .from('schedule_logs')
                .insert([{
                    schedule_id: schedule.id,
                    template_id: schedule.template_id,
                    device_id: schedule.device_id,
                    status: 'completed',
                    repeat_count: count + 1,
                    duration_seconds: schedule.duration_seconds
                }]);
            
            triggered++;
            console.log(`[scheduler] ✅ Triggered: "${template.name}" on ${schedule.device_id} for ${schedule.duration_seconds} seconds`);
            
        } catch (err) {
            console.error(`[scheduler] ❌ Failed schedule ${schedule.id}:`, err.message);
            await supabase
                .from('schedule_logs')
                .insert([{
                    schedule_id: schedule.id,
                    template_id: schedule.template_id,
                    device_id: schedule.device_id,
                    status: 'failed',
                    error_message: err.message,
                    duration_seconds: schedule.duration_seconds
                }]);
        }
    }
    
    console.log('[scheduler] 📊 Summary - Triggered:', triggered, 'at', new Date().toISOString());
    return { triggered, checked_at: new Date().toISOString() };
}

app.get('/api/schedules', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
                *,
                templates:template_id (id, name)
            `)
            .order('start_datetime', { ascending: true })
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/schedules', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('schedules')
            .insert([{
                template_id: req.body.template_id,
                device_id: req.body.device_id || 'phone1',
                start_datetime: req.body.start_datetime,
                end_datetime: req.body.end_datetime || null,
                repeat_interval_seconds: req.body.repeat_interval_seconds || 0,
                repeat_qty: req.body.repeat_qty || 1,
                loop_count: req.body.loop_count || 1,
                duration_seconds: req.body.duration_seconds || 10,
                is_active: req.body.is_active !== undefined ? req.body.is_active : true
            }])
            .select()
            .single()
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.put('/api/schedule/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('schedules')
            .update({
                template_id: req.body.template_id,
                device_id: req.body.device_id,
                start_datetime: req.body.start_datetime,
                end_datetime: req.body.end_datetime,
                repeat_interval_seconds: req.body.repeat_interval_seconds,
                repeat_qty: req.body.repeat_qty,
                loop_count: req.body.loop_count,
                duration_seconds: req.body.duration_seconds,
                is_active: req.body.is_active,
                updated_at: new Date()
            })
            .eq('id', req.params.id)
            .select()
            .single()
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.delete('/api/schedule/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', req.params.id)
        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============================================
// SCHEDULE TRIGGER (Internal)
// ============================================

async function triggerDueSchedules() {
    const checkTime = new Date().toISOString();
    console.log('[scheduler] 🔍 Checking due schedules at', checkTime);
    
    const { data: dueSchedules, error } = await supabase
        .from('schedules')
        .select('id, template_id, device_id, duration_seconds, repeat_qty')
        .eq('is_active', true)
        .lte('start_datetime', checkTime)
        .or(`end_datetime.is.null,end_datetime.gte.${checkTime}`);
    
    if (error) {
        console.error('[scheduler] ❌ Query error:', error.message);
        return { triggered: 0, error: error.message };
    }
    
    console.log('[scheduler] Found', dueSchedules?.length || 0, 'due schedules');
    
    let triggered = 0;
    
    for (const schedule of dueSchedules || []) {
        console.log('[scheduler] Processing schedule:', schedule.id, 'for device:', schedule.device_id);
        
        const { count, error: countError } = await supabase
            .from('schedule_logs')
            .select('*', { count: 'exact', head: true })
            .eq('schedule_id', schedule.id)
            .eq('status', 'completed');
        
        if (countError) {
            console.log('[scheduler] ⚠️ Count error for schedule', schedule.id, ':', countError.message);
            continue;
        }
        
        if (count >= schedule.repeat_qty) {
            console.log('[scheduler] ⏭️ Skipping schedule', schedule.id, '- repeat limit reached (', count, '/', schedule.repeat_qty, ')');
            continue;
        }
        
        try {
            const { data: template, error: templateError } = await supabase
                .from('templates')
                .select('*')
                .eq('id', schedule.template_id)
                .single();
            
            if (templateError || !template) {
                console.log('[scheduler] ❌ Template not found:', schedule.template_id);
                continue;
            }
            
            console.log('[scheduler] ✓ Found template:', template.name);
            
            const overlayUrl = `${SELF_URL}/api/overlay/${schedule.template_id}`;
            
            const { error: updateError } = await supabase
                .from('device_state')
                .update({
                    template_id: schedule.template_id,
                    active_url: overlayUrl,
                    overlay_active_until: new Date(Date.now() + (schedule.duration_seconds * 1000)).toISOString(),
                    updated_at: new Date()
                })
                .eq('device_id', schedule.device_id);
            
            if (updateError) {
                console.log('[scheduler] ❌ Failed to update device_state:', updateError.message);
                throw updateError;
            }
            
            await supabase
                .from('schedule_logs')
                .insert([{
                    schedule_id: schedule.id,
                    template_id: schedule.template_id,
                    device_id: schedule.device_id,
                    status: 'completed',
                    repeat_count: count + 1
                }]);
            
            triggered++;
            console.log(`[scheduler] ✅ Triggered: ${template.name} on ${schedule.device_id}`);
            
        } catch (err) {
            console.error(`[scheduler] ❌ Failed schedule ${schedule.id}:`, err.message);
            await supabase
                .from('schedule_logs')
                .insert([{
                    schedule_id: schedule.id,
                    template_id: schedule.template_id,
                    device_id: schedule.device_id,
                    status: 'failed',
                    error_message: err.message
                }]);
        }
    }
    
    console.log('[scheduler] 📊 Summary - Triggered:', triggered, 'at', new Date().toISOString());
    return { triggered, checked_at: new Date().toISOString() };
}
app.get('/health/detailed', async (req, res) => {
    try {
        // Check Supabase connection
        const { data: deviceCheck, error: deviceError } = await supabase
            .from('device_state')
            .select('device_id', { count: 'exact', head: true });
        
        const { data: injectCheck, error: injectError } = await supabase
            .from('overlay_injects')
            .select('id', { count: 'exact', head: true })
            .order('created_at', { ascending: false })
            .limit(1);
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            supabase: {
                connected: !deviceError,
                device_state_count: deviceCheck?.length || 0,
                last_inject_exists: injectCheck?.length > 0
            },
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});
// Internal endpoint (called by self-cron)
app.post('/api/trigger-schedules', async (req, res) => {
    try {
        const result = await triggerDueSchedules()
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Manual trigger for testing
app.post('/api/trigger-now', async (req, res) => {
    try {
        const { template_id, device_id = 'phone1', duration_seconds = 10 } = req.body
        
        const { data: template, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', template_id)
            .single()
        
        if (error || !template) throw new Error('Template not found')
        
        const overlayUrl = `${SELF_URL}/api/overlay/${template_id}`
        
        await supabase
            .from('device_state')
            .update({
                template_id: template_id,
                active_url: overlayUrl,
                overlay_active_until: new Date(Date.now() + (duration_seconds * 1000)).toISOString(),
                updated_at: new Date()
            })
            .eq('device_id', device_id)
        
        res.json({ success: true, template: template.name })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get schedule logs
app.get('/api/schedule-logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50
        const { data, error } = await supabase
            .from('schedule_logs')
            .select(`
                *,
                schedules:schedule_id (id),
                templates:template_id (name)
            `)
            .order('triggered_at', { ascending: false })
            .limit(limit)
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============================================
// SERVE OVERLAY HTML
// ============================================

app.get('/api/overlay/:templateId', async (req, res) => {
    try {
        const { data: template, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', req.params.templateId)
            .single()
        
        if (error || !template) {
            return res.status(404).send('<h1>Template not found</h1>')
        }
        
        const duration = parseInt(req.query.duration) || 10
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: transparent; overflow: hidden; width: 100vw; height: 100vh; }
        #overlay-container { width: 100%; height: 100%; opacity: 1; transition: opacity 0.3s ease; }
        #overlay-container.hiding { opacity: 0; }
        ${template.css_content || ''}
    </style>
</head>
<body>
    <div id="overlay-container">
        ${template.html_content || '<div style="color:white; padding:20px;">No content</div>'}
    </div>
    <script>
        const DURATION = ${duration};
        setTimeout(() => {
            document.getElementById('overlay-container')?.classList.add('hiding');
            setTimeout(() => {
                if (window.Android?.overlayComplete) window.Android.overlayComplete();
            }, 300);
        }, DURATION * 1000);
        ${template.js_content || ''}
        function onStreamState(isLive) {
            if (typeof window.streamStateChanged === 'function') window.streamStateChanged(isLive);
        }
    </script>
</body>
</html>`
        
        res.setHeader('Content-Type', 'text/html')
        res.send(html)
    } catch (error) {
        res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`)
    }
})

// ============================================
// SELF-CRON: Poll every minute internally
// ============================================

setInterval(async () => {
    try {
        const response = await fetch(`http://localhost:${PORT}/api/trigger-schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.triggered > 0) {
            console.log(`[self-cron] Triggered ${result.triggered} overlay(s)`);
        }
        
        // Also trigger JS schedules
        await triggerDueJsSchedules();
        
    } catch (err) {
        // Silent fail
    }
}, 60 * 1000); // Every 60 seconds
// ============================================
// JSON TO HTML CONVERTER (Overlay Builder)
// ============================================

// Convert JSON config to HTML/CSS/JS
function jsonToOverlay(config) {
    const { name, width = 1920, height = 1080, background = 'transparent', elements = [] } = config
    
    let css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            width: 100vw; 
            height: 100vh; 
            background: ${background};
            position: relative;
            overflow: hidden;
            font-family: 'Segoe UI', Arial, sans-serif;
        }
        .overlay-container {
            position: relative;
            width: 100%;
            height: 100%;
        }
    `
    
    let html = '<div class="overlay-container">'
    let js = `
        // Animation controller
        let elements = [];
        
        function fadeIn(el, duration) {
            el.style.opacity = '0';
            el.style.transition = 'opacity ' + duration + 'ms';
            setTimeout(() => el.style.opacity = '1', 50);
        }
        
        function fadeOut(el, duration, callback) {
            el.style.transition = 'opacity ' + duration + 'ms';
            el.style.opacity = '0';
            setTimeout(callback, duration);
        }
    `
    
    elements.forEach((el, idx) => {
        const elementId = `el_${idx}`
        let elementCss = `#${elementId} { position: absolute; `
        
        // Position handling
        const positions = {
            'top-left': { top: '20px', left: '20px', transform: 'none' },
            'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
            'top-right': { top: '20px', right: '20px', transform: 'none' },
            'middle-left': { top: '50%', left: '20px', transform: 'translateY(-50%)' },
            'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
            'middle-right': { top: '50%', right: '20px', transform: 'translateY(-50%)' },
            'bottom-left': { bottom: '20px', left: '20px', transform: 'none' },
            'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
            'bottom-right': { bottom: '20px', right: '20px', transform: 'none' },
            'lower-third': { bottom: '80px', left: '20px', transform: 'none' }
        }
        
        const pos = positions[el.position] || positions['bottom-left']
        Object.assign(elementCss, pos)
        
        if (el.width) elementCss += `width: ${el.width}px; `
        if (el.height) elementCss += `height: ${el.height}px; `
        if (el.opacity) elementCss += `opacity: ${el.opacity}; `
        if (el.rotation) elementCss += `transform: rotate(${el.rotation}deg); `
        
        elementCss += `z-index: ${el.zIndex || 10}; }`
        
        // Animation CSS
        if (el.animation) {
            elementCss += `
                #${elementId} {
                    animation: ${el.animation} ${el.animationDuration || 1}s ${el.animationDelay || 0}s;
                }
            `
            
            if (el.animation === 'fadeIn') {
                css += `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `
            } else if (el.animation === 'slideUp') {
                css += `
                    @keyframes slideUp {
                        from { transform: translateY(100px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `
            } else if (el.animation === 'slideLeft') {
                css += `
                    @keyframes slideLeft {
                        from { transform: translateX(100px); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `
            } else if (el.animation === 'pulse') {
                css += `
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                `
            } else if (el.animation === 'bounce') {
                css += `
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                `
            }
        }
        
        css += elementCss
        
        // HTML element
        switch(el.type) {
            case 'image':
                html += `<img id="${elementId}" src="${el.src}" alt="${el.alt || ''}" style="object-fit: ${el.objectFit || 'contain'}">`
                break
            case 'text':
                html += `<div id="${elementId}" style="color: ${el.color || '#ffffff'}; font-size: ${el.fontSize || 24}px; font-weight: ${el.fontWeight || 'normal'}; text-align: ${el.textAlign || 'center'}; text-shadow: ${el.textShadow || '2px 2px 4px rgba(0,0,0,0.5)'}">${el.content || 'Text'}</div>`
                break
            case 'video':
                html += `<video id="${elementId}" src="${el.src}" autoplay loop muted style="object-fit: ${el.objectFit || 'cover'}" ${el.loop ? 'loop' : ''}>`
                break
            case 'social':
                const socialHtml = getSocialHtml(el.platform, el.username, elementId)
                html += socialHtml
                break
            case 'shape':
                html += `<div id="${elementId}" style="background: ${el.color || '#ffffff'}; border-radius: ${el.borderRadius || 0}px; border: ${el.borderWidth || 0}px solid ${el.borderColor || '#000'}"></div>`
                break
            case 'countdown':
                html += `<div id="${elementId}" style="color: ${el.color || '#ffffff'}; font-size: ${el.fontSize || 48}px; font-weight: bold; text-align: center;">--:--:--</div>`
                js += `
                    (function() {
                        let targetTime = Date.now() + (${el.durationSeconds || 60} * 1000);
                        let countdownEl = document.getElementById('${elementId}');
                        function updateCountdown() {
                            let remaining = Math.max(0, targetTime - Date.now());
                            let hours = Math.floor(remaining / 3600000);
                            let minutes = Math.floor((remaining % 3600000) / 60000);
                            let seconds = Math.floor((remaining % 60000) / 1000);
                            countdownEl.textContent = \`\${hours.toString().padStart(2,'0')}:\${minutes.toString().padStart(2,'0')}:\${seconds.toString().padStart(2,'0')}\`;
                            if(remaining > 0) setTimeout(updateCountdown, 1000);
                        }
                        updateCountdown();
                    })();
                `
                break
            case 'marquee':
                html += `<div id="${elementId}" style="white-space: nowrap; overflow: hidden; color: ${el.color || '#ffffff'}; font-size: ${el.fontSize || 20}px;">
                            <span style="display: inline-block; animation: marquee ${el.durationSeconds || 10}s linear infinite;">${el.content || 'Scrolling text...'}</span>
                         </div>`
                css += `
                    @keyframes marquee {
                        from { transform: translateX(100%); }
                        to { transform: translateX(-100%); }
                    }
                `
                break
            default:
                html += `<div id="${elementId}">Unknown element</div>`
        }
    })
    
    html += '</div>'
    
    function getSocialHtml(platform, username, elementId) {
        const icons = {
            youtube: '▶️',
            twitch: '🎮',
            tiktok: '🎵',
            instagram: '📷',
            twitter: '🐦',
            facebook: '👍',
            discord: '💬'
        }
        const icon = icons[platform] || '💬'
        return `<div id="${elementId}" style="display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 50px; backdrop-filter: blur(10px);">
                    <span style="font-size: 24px;">${icon}</span>
                    <span style="color: white; font-size: 16px;">@${username}</span>
                    <span style="color: #ff4444; font-size: 14px;">LIVE</span>
                </div>`
    }
    
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>${css}</style>
</head>
<body>
    ${html}
    <script>
        ${js}
        
        // Auto-hide if duration set
        const DURATION = ${config.durationSeconds || 0};
        if(DURATION > 0) {
            setTimeout(() => {
                document.body.style.transition = 'opacity 0.3s';
                document.body.style.opacity = '0';
                setTimeout(() => {
                    if(window.Android?.overlayComplete) window.Android.overlayComplete();
                }, 300);
            }, DURATION * 1000);
        }
        
        function onStreamState(isLive) {
            console.log('Stream live:', isLive);
            if(typeof window.streamStateChanged === 'function') window.streamStateChanged(isLive);
        }
    </script>
</body>
</html>`
    
    return {
        html: fullHtml,
        css: css,
        js: js
    }
}

// Create template from JSON config
app.post('/api/template-from-json', async (req, res) => {
    try {
        const { name, description, config } = req.body
        
        if (!config || !config.elements) {
            return res.status(400).json({ error: 'Invalid config: missing elements' })
        }
        
        const overlay = jsonToOverlay(config)
        
        // Save to templates table
        const { data, error } = await supabase
            .from('templates')
            .insert([{
                name: name,
                description: description || '',
                html_content: overlay.html,
                css_content: overlay.css,
                js_content: overlay.js,
                thumbnail_url: config.thumbnail || null,
                is_active: true
            }])
            .select()
            .single()
        
        if (error) throw error
        
        res.json({ 
            success: true, 
            template: data,
            preview: overlay.html
        })
        
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Preview JSON config (without saving)
app.post('/api/preview-overlay', async (req, res) => {
    try {
        const { config } = req.body
        const overlay = jsonToOverlay(config)
        res.setHeader('Content-Type', 'text/html')
        res.send(overlay.html)
    } catch (error) {
        res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`)
    }
})

// Get template as JSON config
app.get('/api/template/:id/json', async (req, res) => {
    try {
        const { data: template, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', req.params.id)
            .single()
        
        if (error) throw error
        
        // This is simplified - ideally you'd store the original JSON
        // For now, return a basic structure
        res.json({
            id: template.id,
            name: template.name,
            description: template.description,
            config: {
                name: template.name,
                elements: extractElementsFromHtml(template.html_content) // You'll need this helper
            }
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Check if design name exists
app.get('/api/overlay/check-name', async (req, res) => {
    try {
        const { name } = req.query;
        const { data, error } = await supabase
            .from('overlay_designs')
            .select('id, name')
            .eq('name', name)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        res.json({ exists: !!data, id: data?.id || null });
    } catch (error) {
        res.json({ exists: false, id: null });
    }
});

// Update existing design (overwrite)
app.put('/api/overlay/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, design_json } = req.body;
        
        const { data, error } = await supabase
            .from('overlay_designs')
            .update({
                name: name,
                description: description || '',
                design_json: design_json,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            id: data.id,
            slug: data.slug,
            url: `${SELF_URL}/o/${data.slug}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ============================================
// JS TEMPLATE ENDPOINTS FOR INJECTOR
// ============================================

// Get all JS templates - UNIFIED endpoint merging file-based and DB-based templates
app.get('/api/js-templates', async (req, res) => {
    try {
        const fs = require('fs');
        const jsDir = path.join(__dirname, 'public', 'js');
        
        // Read file-based templates
        let fileTemplates = [];
        try {
            if (fs.existsSync(jsDir)) {
                const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
                fileTemplates = files.map(file => {
                    const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
                    const placeholders = findPlaceholdersInJs(content);
                    return {
                        id: `file_${file.replace('.js', '')}`,
                        name: file.replace('.js', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        filename: file,
                        js_code: content,
                        placeholders: placeholders,
                        source: 'file',
                        category: categorizeTemplate(file)
                    };
                });
            }
        } catch (fileErr) {
            console.error('Error reading file templates:', fileErr.message);
        }

        // Read DB-based templates
        let dbTemplates = [];
        try {
            const { data, error } = await supabase
                .from('js_templates')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && data) {
                dbTemplates = data.map(t => ({
                    ...t,
                    id: `db_${t.id}`,
                    source: 'database'
                }));
            }
        } catch (dbErr) {
            console.error('Error reading DB templates:', dbErr.message);
        }

        // Merge both sources
        const allTemplates = [...fileTemplates, ...dbTemplates];
        res.json(allTemplates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper to categorize file-based templates by filename patterns
function categorizeTemplate(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('alert')) return 'alert';
    if (lower.includes('banner') || lower.includes('social')) return 'banner';
    if (lower.includes('widget') || lower.includes('leaderboard') || lower.includes('poll')) return 'widget';
    if (lower.includes('countdown') || lower.includes('timer')) return 'widget';
    if (lower.includes('qr')) return 'widget';
    if (lower.includes('weather')) return 'widget';
    return 'general';
}

// Helper to extract placeholders from JS code
function findPlaceholdersInJs(jsCode) {
    const matches = jsCode.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    
    const placeholders = [...new Set(matches.map(m => {
        return m.slice(2, -2).trim();
    }))];
    
    return placeholders;
}
// Add this endpoint to receive Android app logs
app.post('/api/android-log', (req, res) => {
    const { level, tag, message, device_id } = req.body;
    console.log(`[Android][${device_id || 'unknown'}][${level || 'info'}][${tag}] ${message}`);
    res.json({ received: true });
});
// POST endpoint to inject JS into Supabase realtime table
app.post('/api/overlay-inject', async (req, res) => {
    try {
        const { js_code, table_name, device_slug, template_name } = req.body;
        
        console.log('[overlay-inject] Received request:', {
            device_slug: device_slug || 'broadcast',
            template_name: template_name || 'unknown',
            js_code_length: js_code?.length || 0,
            timestamp: new Date().toISOString()
        });
        
        if (!js_code) {
            console.log('[overlay-inject] ERROR: No js_code provided');
            return res.status(400).json({ error: 'js_code is required' });
        }
        
        const tableName = table_name || 'overlay_injects';
        
        const { data, error } = await supabase
            .from(tableName)
            .insert([{
                js_code: js_code,
                device_slug: device_slug || null,
                template_name: template_name || null,
                created_at: new Date(),
                status: 'pending'
            }])
            .select()
            .single();
        
        if (error) {
            console.log('[overlay-inject] Supabase insert ERROR:', error.message);
            throw error;
        }
        
        console.log('[overlay-inject] SUCCESS - Inserted ID:', data.id, 'at', new Date().toISOString());
        
        res.json({
            success: true,
            id: data.id,
            message: 'JS injected successfully'
        });
    } catch (error) {
        console.error('[overlay-inject] FAILED:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET endpoint to retrieve stored JS injections
app.get('/api/overlay-injects', async (req, res) => {
    try {
        const { device_slug, limit = 50 } = req.query;
        
        let query = supabase
            .from('overlay_injects')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));
        
        if (device_slug) {
            query = query.eq('device_slug', device_slug);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`✅ Server running on ${SELF_URL}`)
    console.log(`   Health: ${SELF_URL}/health`)
    console.log(`   Templates API: ${SELF_URL}/api/templates`)
    console.log(`   Schedules API: ${SELF_URL}/api/schedules`)
    console.log(`   JS Templates API: ${SELF_URL}/api/js-templates`)
    console.log(`   Overlay Inject API: ${SELF_URL}/api/overlay-inject`)
    console.log(`   Self-cron active (every 60 seconds)`)
})
// ============================================
// DATABASE JS TEMPLATES CRUD
// ============================================

// Get all DB JS templates
app.get('/api/js-templates/db', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('js_templates')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single JS template by ID
app.get('/api/js-template/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('js_templates')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Create new JS template
app.post('/api/js-templates', async (req, res) => {
    try {
        const { name, description, js_code, placeholders, category } = req.body;
        
        if (!name || !js_code) {
            return res.status(400).json({ error: 'Name and js_code are required' });
        }

        // Extract placeholders if not provided
        let extractedPlaceholders = placeholders;
        if (!extractedPlaceholders) {
            extractedPlaceholders = findPlaceholdersInJs(js_code);
        }

        const { data, error } = await supabase
            .from('js_templates')
            .insert([{
                name: name,
                description: description || '',
                js_code: js_code,
                placeholders: extractedPlaceholders,
                category: category || 'general'
            }])
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update JS template
app.put('/api/js-template/:id', async (req, res) => {
    try {
        const { name, description, js_code, placeholders, category, is_active } = req.body;
        
        const { data, error } = await supabase
            .from('js_templates')
            .update({
                name: name,
                description: description,
                js_code: js_code,
                placeholders: placeholders,
                category: category,
                is_active: is_active !== undefined ? is_active : true,
                updated_at: new Date()
            })
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete JS template
app.delete('/api/js-template/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('js_templates')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
