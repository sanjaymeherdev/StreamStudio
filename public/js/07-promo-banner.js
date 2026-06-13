renderTemplate({
  name: "promo-banner",
  elements: [
    { type:'shape', shapeType:'rectangle', x:560, y:850, width:800, height:180, color:'rgba(8,10,16,0.85)', borderRadius:18, zIndex:1 },
    { type:'image', x:580, y:870, src:'{{image_url}}', width:200, height:140, objectFit:'cover', borderRadius:12, zIndex:2 },
    { type:'text', x:800, y:885, content:'{{title}}', color:'#fff', fontSize:30, fontWeight:800, maxWidth:520, zIndex:2 },
    { type:'text', x:800, y:935, content:'{{subtitle}}', color:'rgba(255,255,255,0.65)', fontSize:18, fontWeight:400, maxWidth:520, zIndex:2 },
    { type:'shape', shapeType:'rectangle', x:800, y:975, width:200, height:40, color:'#4DFFA0', borderRadius:8, zIndex:2 },
    { type:'text', x:800, y:986, content:'{{cta}}', color:'#0A0D14', fontSize:16, fontWeight:800, textAlign:'center', maxWidth:200, zIndex:3 }
  ],
  animation: { type:'slide', direction:'up', duration:0.6 },
  duration: 10,
  loopCount: 1
}, {});
