renderTemplate({
  name: "raid-alert",
  elements: [
    { type:'shape', shapeType:'rectangle', x:0, y:400, width:1920, height:160, color:'rgba(239,68,68,0.92)', zIndex:1 },
    { type:'text', x:80, y:430, content:'⚔️ RAID INCOMING!', color:'#fff', fontSize:28, fontWeight:800, zIndex:2 },
    { type:'text', x:80, y:475, content:'{{name}}', color:'#fff', fontSize:48, fontWeight:900, zIndex:2 },
    { type:'text', x:80, y:530, content:'is raiding with {{amount}} viewers!', color:'rgba(255,255,255,0.85)', fontSize:20, fontWeight:600, zIndex:2 }
  ],
  animation: { type:'slide', direction:'left', duration:0.6 },
  duration: 8,
  loopCount: 2,
  loopDelay: 1
}, {});
