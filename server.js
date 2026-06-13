require('dotenv').config()
const express = require('express')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000
const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
const scheduler = require('./scheduler');
// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Health endpoint (for keep-alive)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on ${SELF_URL}`)
  console.log(`   Health check: ${SELF_URL}/health`)
  console.log(`   Main page: ${SELF_URL}/`)
  
  // CRITICAL: Self-ping every 14 minutes to keep Render awake
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/health`)
      console.log('[keep-alive] ping sent at', new Date().toISOString())
    } catch (e) {
      console.log('[keep-alive] ping failed')
    }
  }, 14 * 60 * 1000)
})
// ============================================
// TEMPLATE API ROUTES
// ============================================

// Get all templates
app.get('/api/templates', async (req, res) => {
    try {
        const templates = await scheduler.getAllTemplates()
        res.json(templates)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get single template
app.get('/api/template/:id', async (req, res) => {
    try {
        const template = await scheduler.getTemplateById(req.params.id)
        res.json(template)
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
})

// Create template
app.post('/api/templates', async (req, res) => {
    try {
        const template = await scheduler.createTemplate(req.body)
        res.json(template)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update template
app.put('/api/template/:id', async (req, res) => {
    try {
        const template = await scheduler.updateTemplate(req.params.id, req.body)
        res.json(template)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Delete template
app.delete('/api/template/:id', async (req, res) => {
    try {
        await scheduler.deleteTemplate(req.params.id)
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============================================
// SCHEDULE API ROUTES
// ============================================

// Get all schedules
app.get('/api/schedules', async (req, res) => {
    try {
        const schedules = await scheduler.getAllSchedules()
        res.json(schedules)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create schedule
app.post('/api/schedules', async (req, res) => {
    try {
        const schedule = await scheduler.createSchedule(req.body)
        res.json(schedule)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update schedule
app.put('/api/schedule/:id', async (req, res) => {
    try {
        const schedule = await scheduler.updateSchedule(req.params.id, req.body)
        res.json(schedule)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Delete schedule
app.delete('/api/schedule/:id', async (req, res) => {
    try {
        await scheduler.deleteSchedule(req.params.id)
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============================================
// TRIGGER / CRON ENDPOINTS
// ============================================

// Cron endpoint (call this every minute from cron-job.org)
app.post('/api/trigger-schedules', async (req, res) => {
    try {
        const result = await scheduler.triggerDueSchedules()
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get schedule logs
app.get('/api/schedule-logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50
        const logs = await scheduler.getScheduleLogs(limit)
        res.json(logs)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Manually trigger overlay (for testing)
app.post('/api/trigger-now', async (req, res) => {
    try {
        const { template_id, device_id, duration_seconds } = req.body
        const result = await scheduler.triggerNow(template_id, device_id, duration_seconds)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Serve overlay HTML for WebView
app.get('/api/overlay/:templateId', async (req, res) => {
    try {
        const template = await scheduler.getTemplateById(req.params.templateId)
        const duration = parseInt(req.query.duration) || 10
        
        const html = scheduler.buildOverlayHTML(template, duration)
        res.setHeader('Content-Type', 'text/html')
        res.send(html)
    } catch (error) {
        res.status(404).send(`<h1>Template not found</h1><p>${error.message}</p>`)
    }
})
