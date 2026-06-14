renderTemplate({
  name: "raid-alert",
  elements: [
    { type:'shape', shapeType:'rectangle', x:40, y:200, width:500, height:110, color:'rgba(239,68,68,0.92)', borderRadius:12, zIndex:1, animation:'slideLeft', animDuration:0.6 },
    { type:'text', x:60, y:218, content:'⚔️ RAID INCOMING!', color:'#fff', fontSize:18, fontWeight:800, zIndex:2, animation:'slideLeft', animDuration:0.6 },
    { type:'text', x:60, y:248, content:'{{name}}', color:'#fff', fontSize:28, fontWeight:900, zIndex:2, animation:'slideLeft', animDuration:0.6 },
    { type:'text', x:60, y:282, content:'raiding with {{amount}} viewers!', color:'rgba(255,255,255,0.85)', fontSize:14, fontWeight:600, zIndex:2, animation:'slideLeft', animDuration:0.6 }
  ],
  duration: 6
}, {});
