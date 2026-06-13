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
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`✅ Server running on ${SELF_URL}`)
    console.log(`   Health: ${SELF_URL}/health`)
    console.log(`   Templates API: ${SELF_URL}/api/templates`)
    console.log(`   Schedules API: ${SELF_URL}/api/schedules`)
    console.log(`   Self-cron active (every 60 seconds)`)
})