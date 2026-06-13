renderTemplate({
  name: "donation-alert",
  elements: [
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:500, height:130, color:'rgba(8,10,16,0.85)', borderRadius:16, zIndex:1 },
    { type:'shape', shapeType:'rectangle', x:60, y:60, width:6, height:130, color:'#f59e0b', zIndex:2 },
    { type:'text', x:90, y:78, content:'DONATION', color:'#f59e0b', fontSize:14, fontWeight:700, zIndex:3 },
    { type:'text', x:90, y:102, content:'{{name}}', color:'#fff', fontSize:30, fontWeight:800, zIndex:3 },
    { type:'text', x:90, y:148, content:'{{message}}', color:'rgba(255,255,255,0.6)', fontSize:15, fontWeight:400, maxWidth:340, zIndex:3 },
    { type:'shape', shapeType:'rectangle', x:430, y:75, width:110, height:40, color:'#f59e0b', borderRadius:8, zIndex:3 },
    { type:'text', x:430, y:88, content:'{{amount}}', color:'#000', fontSize:20, fontWeight:800, textAlign:'center', maxWidth:110, zIndex:4 }
  ],
  animation: { type:'zoom', duration:0.6 },
  duration: 7,
  loopCount: 1
}, {});
