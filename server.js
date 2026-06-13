require('dotenv').config()
const express = require('express')
const fetch = require('node-fetch')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = process.env.PORT || 3000
const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yfjzvpzgecbnfysacbjq.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmanp2cHpnZWNibmZ5c2FjYmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTY2MzcsImV4cCI6MjA4MzU3MjYzN30.v27rjgUTGuHAq6sAjhjQYWb-Y9O23f5FpwXQBFZyjmQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Middleware
app.use(express.json())
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
    const { width = 1080, height = 1920, elements = [], background = 'transparent' } = design;
    
    let css = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            width: 100vw;
            height: 100vh;
            background: ${background};
            overflow: hidden;
            position: relative;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .overlay-container {
            position: relative;
            width: 100%;
            height: 100%;
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideLeft {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideRight {
            from { transform: translateX(-100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
        }
        
        @keyframes zoomIn {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    
    let html = '<div class="overlay-container">';
    let js = `
        // Overlay controller
        let autoHideTimer;
        let loopInterval;
        
        function startAutoHide(duration) {
            if (duration && duration > 0) {
                autoHideTimer = setTimeout(() => {
                    document.body.style.transition = 'opacity 0.3s';
                    document.body.style.opacity = '0';
                    setTimeout(() => {
                        if (window.parent && window.parent.overlayComplete) {
                            window.parent.overlayComplete();
                        }
                    }, 300);
                }, duration * 1000);
            }
        }
        
        function startLoop(elements, loopCount, delay) {
            let count = 0;
            loopInterval = setInterval(() => {
                count++;
                if (loopCount > 0 && count >= loopCount) {
                    clearInterval(loopInterval);
                }
            }, delay * 1000);
        }
        
        // Listen for stream state from Android
        function onStreamState(isLive) {
            console.log('Stream state:', isLive);
            if (typeof window.streamStateChanged === 'function') {
                window.streamStateChanged(isLive);
            }
        }
        
        // Cleanup
        window.overlayComplete = function() {
            if (autoHideTimer) clearTimeout(autoHideTimer);
            if (loopInterval) clearInterval(loopInterval);
        };
    `;
    
    elements.forEach((el, idx) => {
        const elementId = `el_${idx}`;
        let positionCss = '';
        
        // Position styles
        switch(el.position) {
            case 'top-left':
                positionCss = `top: ${el.y || 20}px; left: ${el.x || 20}px;`;
                break;
            case 'top-center':
                positionCss = `top: ${el.y || 20}px; left: 50%; transform: translateX(-50%);`;
                break;
            case 'top-right':
                positionCss = `top: ${el.y || 20}px; right: ${el.x || 20}px;`;
                break;
            case 'middle-left':
                positionCss = `top: 50%; left: ${el.x || 20}px; transform: translateY(-50%);`;
                break;
            case 'center':
                positionCss = `top: 50%; left: 50%; transform: translate(-50%, -50%);`;
                break;
            case 'middle-right':
                positionCss = `top: 50%; right: ${el.x || 20}px; transform: translateY(-50%);`;
                break;
            case 'bottom-left':
                positionCss = `bottom: ${el.y || 20}px; left: ${el.x || 20}px;`;
                break;
            case 'bottom-center':
                positionCss = `bottom: ${el.y || 20}px; left: 50%; transform: translateX(-50%);`;
                break;
            case 'bottom-right':
                positionCss = `bottom: ${el.y || 20}px; right: ${el.x || 20}px;`;
                break;
            case 'lower-third':
                positionCss = `bottom: 80px; left: ${el.x || 20}px;`;
                break;
            case 'absolute':
                positionCss = `top: ${el.y || 0}%; left: ${el.x || 0}%;`;
                break;
            default:
                positionCss = `bottom: ${el.y || 20}px; left: ${el.x || 20}px;`;
        }
        
        // Animation styles
        let animationCss = '';
        if (el.animation && el.animation !== 'none') {
            animationCss = `animation: ${el.animation} ${el.animationDuration || 0.5}s ${el.animationDelay || 0}s ease-out both;`;
        }
        
        // Base element styles
        const baseStyle = `
            position: absolute;
            ${positionCss}
            z-index: ${el.zIndex || 10};
            opacity: ${(el.opacity || 100) / 100};
            ${animationCss}
        `;
        
        switch(el.type) {
            case 'shape':
                let shapeCss = '';
                if (el.shapeType === 'rectangle') {
                    shapeCss = `
                        width: ${el.width || 100}px;
                        height: ${el.height || 100}px;
                        background: ${el.color || '#4DFFA0'};
                        border-radius: ${el.borderRadius || 0}px;
                    `;
                } else if (el.shapeType === 'circle') {
                    const size = el.size || 100;
                    shapeCss = `
                        width: ${size}px;
                        height: ${size}px;
                        background: ${el.color || '#4DFFA0'};
                        border-radius: 50%;
                    `;
                } else if (el.shapeType === 'line') {
                    shapeCss = `
                        width: ${el.width || 100}px;
                        height: ${el.thickness || 2}px;
                        background: ${el.color || '#4DFFA0'};
                        border-radius: ${(el.thickness || 2) / 2}px;
                    `;
                    if (el.rotation) {
                        shapeCss += `transform: rotate(${el.rotation}deg); transform-origin: left center;`;
                    }
                }
                html += `<div id="${elementId}" style="${baseStyle} ${shapeCss}"></div>`;
                break;
                
            case 'image':
                html += `<img id="${elementId}" src="${el.src}" style="${baseStyle} width: ${el.width || 200}px; height: ${el.height || 'auto'}; object-fit: ${el.objectFit || 'contain'}; border-radius: ${el.borderRadius || 0}px;" alt="">`;
                break;
                
            case 'gif':
                html += `<img id="${elementId}" src="${el.src}" style="${baseStyle} width: ${el.width || 200}px; height: ${el.height || 'auto'}; object-fit: ${el.objectFit || 'contain'};" alt="" loop="${el.loop ? 'infinite' : ''}">`;
                break;
                
            case 'video':
                html += `<video id="${elementId}" src="${el.src}" style="${baseStyle} width: ${el.width || 320}px; height: ${el.height || 180}px; object-fit: ${el.objectFit || 'cover'}; border-radius: ${el.borderRadius || 0}px;" autoplay loop muted playsinline></video>`;
                break;
                
            case 'text':
                const shadowMap = {
                    none: 'none',
                    soft: '2px 2px 8px rgba(0,0,0,0.3)',
                    hard: '2px 2px 0px rgba(0,0,0,0.8)',
                    glow: `0 0 15px ${el.color || '#4DFFA0'}`
                };
                html += `<div id="${elementId}" style="${baseStyle} color: ${el.color || '#ffffff'}; font-size: ${el.fontSize || 24}px; font-weight: ${el.fontWeight || 'bold'}; font-family: ${el.fontFamily || 'Arial, sans-serif'}; text-align: ${el.textAlign || 'center'}; text-shadow: ${shadowMap[el.textShadow] || 'none'}; white-space: ${el.whiteSpace || 'normal'}; max-width: ${el.maxWidth || 400}px; background: ${el.bgColor || 'transparent'}; padding: ${el.padding || 0}px; border-radius: ${el.borderRadius || 0}px;">${el.content || 'Text'}</div>`;
                break;
                
            case 'social':
                const socialIcons = {
                    youtube: '▶️',
                    twitch: '🎮',
                    tiktok: '🎵',
                    instagram: '📷',
                    twitter: '🐦',
                    facebook: '👍',
                    discord: '💬'
                };
                html += `<div id="${elementId}" style="${baseStyle} display: flex; align-items: center; gap: 12px; background: ${el.bgColor || 'rgba(0,0,0,0.7)'}; padding: ${el.padding || '8px 16px'}; border-radius: ${el.borderRadius || 50}px; backdrop-filter: blur(10px);">
                            <span style="font-size: ${el.iconSize || 24}px;">${socialIcons[el.platform] || '💬'}</span>
                            <span style="color: ${el.textColor || '#ffffff'}; font-size: ${el.fontSize || 14}px; font-weight: ${el.fontWeight || 'bold'};">@${el.username}</span>
                            ${el.showLiveBadge ? '<span style="color: #ff4444; font-size: 12px; background: rgba(255,68,68,0.2); padding: 2px 8px; border-radius: 20px;">LIVE</span>' : ''}
                        </div>`;
                break;
        }
    });
    
    html += '</div>';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Overlay</title>
    <style>${css}</style>
</head>
<body>
    ${html}
    <script>
        ${js}
        
        // Auto-hide if duration set
        const DURATION = ${design.duration || 0};
        const LOOP_COUNT = ${design.loopCount || 1};
        const LOOP_DELAY = ${design.loopDelay || 0};
        
        if (DURATION > 0) {
            startAutoHide(DURATION);
        }
        
        if (LOOP_COUNT > 1 && LOOP_DELAY > 0) {
            startLoop(null, LOOP_COUNT, LOOP_DELAY);
        }
        
        // Handle visibility
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Pause videos when hidden
                document.querySelectorAll('video').forEach(v => v.pause());
            } else {
                // Resume videos when visible
                document.querySelectorAll('video').forEach(v => v.play());
            }
        });
    </script>
</body>
</html>`;
}
// ============================================
// SCHEDULE CRUD
// ============================================

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
    console.log('[scheduler] Checking due schedules at', new Date().toISOString())
    
    // Get due schedules directly from Supabase
    const { data: dueSchedules, error } = await supabase
        .from('schedules')
        .select('id, template_id, device_id, duration_seconds, repeat_qty')
        .eq('is_active', true)
        .lte('start_datetime', new Date().toISOString())
        .or(`end_datetime.is.null,end_datetime.gte.${new Date().toISOString()}`)
    
    if (error) {
        console.error('[scheduler] Error:', error.message)
        return { triggered: 0 }
    }
    
    // Filter out schedules that already reached repeat limit
    let triggered = 0
    
    for (const schedule of dueSchedules || []) {
        // Check repeat limit
        const { count, error: countError } = await supabase
            .from('schedule_logs')
            .select('*', { count: 'exact', head: true })
            .eq('schedule_id', schedule.id)
            .eq('status', 'completed')
        
        if (countError) continue
        
        if (count >= schedule.repeat_qty) {
            continue // Skip, already reached repeat limit
        }
        
        try {
            // Get template
            const { data: template, error: templateError } = await supabase
                .from('templates')
                .select('*')
                .eq('id', schedule.template_id)
                .single()
            
            if (templateError || !template) continue
            
            // Build overlay URL
            const overlayUrl = `${SELF_URL}/api/overlay/${schedule.template_id}`
            
            // Update device_state
            await supabase
                .from('device_state')
                .update({
                    template_id: schedule.template_id,
                    active_url: overlayUrl,
                    overlay_active_until: new Date(Date.now() + (schedule.duration_seconds * 1000)).toISOString(),
                    updated_at: new Date()
                })
                .eq('device_id', schedule.device_id)
            
            // Log success
            await supabase
                .from('schedule_logs')
                .insert([{
                    schedule_id: schedule.id,
                    template_id: schedule.template_id,
                    device_id: schedule.device_id,
                    status: 'completed',
                    repeat_count: count + 1
                }])
            
            triggered++
            console.log(`[scheduler] Triggered: ${template.name} on ${schedule.device_id}`)
            
        } catch (err) {
            console.error(`[scheduler] Failed schedule ${schedule.id}:`, err)
            await supabase
                .from('schedule_logs')
                .insert([{
                    schedule_id: schedule.id,
                    template_id: schedule.template_id,
                    device_id: schedule.device_id,
                    status: 'failed',
                    error_message: err.message
                }])
        }
    }
    
    return { triggered, checked_at: new Date().toISOString() }
}

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
        })
        const result = await response.json()
        if (result.triggered > 0) {
            console.log(`[self-cron] Triggered ${result.triggered} overlay(s)`)
        }
    } catch (err) {
        // Silent fail - will retry next minute
    }
}, 60 * 1000) // Every 60 seconds
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
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`✅ Server running on ${SELF_URL}`)
    console.log(`   Health: ${SELF_URL}/health`)
    console.log(`   Templates API: ${SELF_URL}/api/templates`)
    console.log(`   Schedules API: ${SELF_URL}/api/schedules`)
    console.log(`   Self-cron active (every 60 seconds)`)
})