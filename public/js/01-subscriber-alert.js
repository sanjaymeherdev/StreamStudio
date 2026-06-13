renderTemplate({
  name: "subscriber-alert",
  elements: [
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:460, height:120, color:'rgba(8,10,16,0.85)', borderRadius:16, zIndex:1 },
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:6, height:120, color:'#22c55e', zIndex:2 },
    { type:'text', x:90, y:78, content:'NEW SUBSCRIBER', color:'#22c55e', fontSize:14, fontWeight:700, zIndex:3 },
    { type:'text', x:90, y:102, content:'{{name}}', color:'#fff', fontSize:32, fontWeight:800, zIndex:3 },
    { type:'text', x:90, y:148, content:'{{detail}}', color:'rgba(255,255,255,0.6)', fontSize:15, fontWeight:400, zIndex:3 }
  ],
  animation: { type:'slide', direction:'down', duration:0.5 },
  duration: 6,
  loopCount: 1
}, {});
