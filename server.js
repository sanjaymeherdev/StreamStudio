require('dotenv').config()
const express = require('express')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000
const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`

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
