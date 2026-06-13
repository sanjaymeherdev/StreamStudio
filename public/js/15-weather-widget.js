// Weather Widget Template
// Usage: Show current weather for a location
renderTemplate({
  name: "weather-widget",
  elements: [
    { type:'shape', shapeType:'rectangle', x:1620, y:80, width:260, height:140, color:'rgba(30,41,59,0.9)', borderRadius:12, zIndex:1 },
    { type:'text', x:1640, y:110, content:'{{location}}', color:'#94a3b8', fontSize:14, fontWeight:500, zIndex:2 },
    { type:'text', x:1640, y:140, content:'{{temp}}°', color:'#fff', fontSize:48, fontWeight:800, zIndex:3 },
    { type:'text', x:1780, y:155, content:'{{condition}}', color:'#fbbf24', fontSize:16, fontWeight:600, textAlign:'right', zIndex:4 },
    { type:'text', x:1780, y:185, content:'H:{{high}}° L:{{low}}°', color:'#64748b', fontSize:13, fontWeight:500, textAlign:'right', zIndex:5 }
  ],
  animation: { type:'fadeIn', duration:0.3 },
  duration: {{duration}},
  loopCount: {{loopCount}}
}, {});
