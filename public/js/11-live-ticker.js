// Live Ticker/Crawler Template
// Usage: Scrolling text for announcements, news, or sponsor messages
renderTemplate({
  name: "live-ticker",
  elements: [
    { type:'shape', shapeType:'rectangle', x:0, y:1020, width:1920, height:60, color:'rgba(0,0,0,0.85)', zIndex:1 },
    { type:'text', x:40, y:1038, content:'{{message}}', color:'#fff', fontSize:28, fontWeight:600, zIndex:2, animation:{type:'ticker', duration:15}}
  ],
  animation: { type:'fadeIn', duration:0.3 },
  duration: {{duration}},
  loopCount: {{loopCount}}
}, {});
