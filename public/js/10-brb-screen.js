renderTemplate({
  name: "brb-screen",
  elements: [
    { type:'shape', shapeType:'rectangle', x:0, y:0, width:1920, height:1080, color:'rgba(8,10,16,0.95)', zIndex:1 },
    { type:'image', x:760, y:280, src:'{{logo_url}}', width:400, height:300, objectFit:'contain', zIndex:2 },
    { type:'text', x:0, y:640, content:'{{title}}', color:'#fff', fontSize:56, fontWeight:800, textAlign:'center', maxWidth:1920, zIndex:2 },
    { type:'text', x:0, y:720, content:'{{subtitle}}', color:'rgba(255,255,255,0.6)', fontSize:24, fontWeight:400, textAlign:'center', maxWidth:1920, zIndex:2 }
  ],
  animation: { type:'fade', duration:0.8 },
  duration: 0,
  loopCount: 1
}, {});
