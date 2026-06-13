renderTemplate({
  name: "follow-alert",
  elements: [
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:440, height:110, color:'rgba(8,10,16,0.85)', borderRadius:16, zIndex:1 },
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:6, height:110, color:'#38bdf8', zIndex:2 },
    { type:'text', x:90, y:78, content:'NEW FOLLOWER', color:'#38bdf8', fontSize:14, fontWeight:700, zIndex:3 },
    { type:'text', x:90, y:102, content:'{{name}}', color:'#fff', fontSize:30, fontWeight:800, zIndex:3 },
    { type:'text', x:90, y:142, content:'started following!', color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:400, zIndex:3 }
  ],
  animation: { type:'slide', direction:'left', duration:0.5 },
  duration: 5,
  loopCount: 1
}, {});
