// scheduler.js
// Separate module for template & schedule management with Supabase

const { createClient } = require('@supabase/supabase-js')

// Supabase config - replace with your values or use environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yfjzvpzgecbnfysacbjq.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmanp2cHpnZWNibmZ5c2FjYmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTY2MzcsImV4cCI6MjA4MzU3MjYzN30.v27rjgUTGuHAq6sAjhjQYWb-Y9O23f5FpwXQBFZyjmQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================
// TEMPLATE CRUD OPERATIONS
// ============================================

// Get all templates
async function getAllTemplates() {
    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
}

// Get single template by ID
async function getTemplateById(id) {
    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()
    
    if (error) throw error
    return data
}

// Create new template
async function createTemplate(templateData) {
    const { data, error } = await supabase
        .from('templates')
        .insert([{
            name: templateData.name,
            description: templateData.description || '',
            html_content: templateData.html_content,
            css_content: templateData.css_content || '',
            js_content: templateData.js_content || '',
            thumbnail_url: templateData.thumbnail_url || '',
            is_active: templateData.is_active !== undefined ? templateData.is_active : true
        }])
        .select()
        .single()
    
    if (error) throw error
    return data
}

// Update template
async function updateTemplate(id, templateData) {
    const { data, error } = await supabase
        .from('templates')
        .update({
            name: templateData.name,
            description: templateData.description,
            html_content: templateData.html_content,
            css_content: templateData.css_content,
            js_content: templateData.js_content,
            thumbnail_url: templateData.thumbnail_url,
            is_active: templateData.is_active,
            updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single()
    
    if (error) throw error
    return data
}

// Delete template
async function deleteTemplate(id) {
    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)
    
    if (error) throw error
    return true
}

// ============================================
// SCHEDULE CRUD OPERATIONS
// ============================================

// Get all schedules (with template info)
async function getAllSchedules() {
    const { data, error } = await supabase
        .from('schedules')
        .select(`
            *,
            templates:template_id (
                id,
                name,
                html_content,
                duration_seconds
            )
        `)
        .order('start_datetime', { ascending: true })
    
    if (error) throw error
    return data
}

// Get single schedule
async function getScheduleById(id) {
    const { data, error } = await supabase
        .from('schedules')
        .select(`
            *,
            templates:template_id (*)
        `)
        .eq('id', id)
        .single()
    
    if (error) throw error
    return data
}

// Create schedule
async function createSchedule(scheduleData) {
    const { data, error } = await supabase
        .from('schedules')
        .insert([{
            template_id: scheduleData.template_id,
            device_id: scheduleData.device_id || 'phone1',
            start_datetime: scheduleData.start_datetime,
            end_datetime: scheduleData.end_datetime || null,
            repeat_interval_seconds: scheduleData.repeat_interval_seconds || 0,
            repeat_qty: scheduleData.repeat_qty || 1,
            loop_count: scheduleData.loop_count || 1,
            duration_seconds: scheduleData.duration_seconds || 10,
            is_active: scheduleData.is_active !== undefined ? scheduleData.is_active : true
        }])
        .select()
        .single()
    
    if (error) throw error
    return data
}

// Update schedule
async function updateSchedule(id, scheduleData) {
    const { data, error } = await supabase
        .from('schedules')
        .update({
            template_id: scheduleData.template_id,
            device_id: scheduleData.device_id,
            start_datetime: scheduleData.start_datetime,
            end_datetime: scheduleData.end_datetime,
            repeat_interval_seconds: scheduleData.repeat_interval_seconds,
            repeat_qty: scheduleData.repeat_qty,
            loop_count: scheduleData.loop_count,
            duration_seconds: scheduleData.duration_seconds,
            is_active: scheduleData.is_active,
            updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single()
    
    if (error) throw error
    return data
}

// Delete schedule
async function deleteSchedule(id) {
    const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)
    
    if (error) throw error
    return true
}

// ============================================
// TRIGGER LOGIC (Called by cron)
// ============================================

// Check and trigger due schedules
async function triggerDueSchedules() {
    console.log('[scheduler] Checking due schedules at', new Date().toISOString())
    
    // Call Supabase function to get due schedules
    const { data: dueSchedules, error } = await supabase
        .rpc('get_due_schedules')
    
    if (error) {
        console.error('[scheduler] Error getting due schedules:', error)
        return { triggered: 0, error: error.message }
    }
    
    let triggered = 0
    
    for (const schedule of dueSchedules) {
        try {
            // Get template details
            const template = await getTemplateById(schedule.template_id)
            
            if (!template) {
                console.error(`[scheduler] Template ${schedule.template_id} not found`)
                continue
            }
            
            // Build the overlay URL (served from this server)
            const overlayUrl = `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}/api/overlay/${schedule.template_id}`
            
            // Update device_state to show this overlay
            const { error: updateError } = await supabase
                .from('device_state')
                .update({
                    template_id: schedule.template_id,
                    active_url: overlayUrl,
                    overlay_active_until: new Date(Date.now() + (schedule.duration_seconds * 1000)).toISOString(),
                    updated_at: new Date()
                })
                .eq('device_id', schedule.device_id)
            
            if (updateError) throw updateError
            
            // Log successful trigger
            await supabase
                .from('schedule_logs')
                .insert([{
                    schedule_id: schedule.schedule_id,
                    template_id: schedule.template_id,
                    device_id: schedule.device_id,
                    status: 'completed',
                    repeat_count: 1
                }])
            
            triggered++
            console.log(`[scheduler] Triggered template ${template.name} on device ${schedule.device_id}`)
            
        } catch (err) {
            console.error(`[scheduler] Failed to trigger schedule ${schedule.schedule_id}:`, err)
            
            // Log failure
            await supabase
                .from('schedule_logs')
                .insert([{
                    schedule_id: schedule.schedule_id,
                    template_id: schedule.template_id,
                    device_id: schedule.device_id,
                    status: 'failed',
                    error_message: err.message
                }])
        }
    }
    
    return { triggered, checked_at: new Date().toISOString() }
}

// Get schedule logs
async function getScheduleLogs(limit = 50) {
    const { data, error } = await supabase
        .from('schedule_logs')
        .select(`
            *,
            schedules:schedule_id (*),
            templates:template_id (name)
        `)
        .order('triggered_at', { ascending: false })
        .limit(limit)
    
    if (error) throw error
    return data
}

// Manually trigger an overlay right now
async function triggerNow(templateId, deviceId = 'phone1', durationSeconds = 10) {
    const template = await getTemplateById(templateId)
    if (!template) throw new Error('Template not found')
    
    const overlayUrl = `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}/api/overlay/${templateId}`
    
    const { error } = await supabase
        .from('device_state')
        .update({
            template_id: templateId,
            active_url: overlayUrl,
            overlay_active_until: new Date(Date.now() + (durationSeconds * 1000)).toISOString(),
            updated_at: new Date()
        })
        .eq('device_id', deviceId)
    
    if (error) throw error
    
    return { success: true, template: template.name, duration: durationSeconds }
}

// Serve overlay HTML (combines template + duration)
function buildOverlayHTML(template, durationSeconds) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: transparent;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        /* Auto-hide container that triggers hide after duration */
        #overlay-container {
            width: 100%;
            height: 100%;
            opacity: 1;
            transition: opacity 0.3s ease;
        }
        #overlay-container.hiding {
            opacity: 0;
        }
        ${template.css_content || ''}
    </style>
</head>
<body>
    <div id="overlay-container">
        ${template.html_content || '<div style="color:white; padding:20px;">No HTML content</div>'}
    </div>
    <script>
        // Duration in seconds from server
        const DURATION = ${durationSeconds};
        let hideTimeout;
        
        function hideOverlay() {
            const container = document.getElementById('overlay-container');
            if (container) {
                container.classList.add('hiding');
                setTimeout(() => {
                    // Notify Android that overlay can be cleared
                    if (window.Android) {
                        window.Android.overlayComplete();
                    }
                }, 300);
            }
        }
        
        // Auto-hide after duration
        if (DURATION > 0) {
            hideTimeout = setTimeout(hideOverlay, DURATION * 1000);
        }
        
        // Execute template's custom JS
        ${template.js_content || ''}
        
        // Listen for stream state from Android
        function onStreamState(isLive) {
            console.log('Stream live:', isLive);
            if (typeof window.streamStateChanged === 'function') {
                window.streamStateChanged(isLive);
            }
        }
        
        // Cleanup on overlay end
        window.overlayComplete = function() {
            // Android will handle removing the overlay
        };
    </script>
</body>
</html>
    `
}

// ============================================
// EXPORTS FOR Express routes
// ============================================

module.exports = {
    // Templates
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Schedules
    getAllSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    
    // Trigger
    triggerDueSchedules,
    getScheduleLogs,
    triggerNow,
    buildOverlayHTML
}