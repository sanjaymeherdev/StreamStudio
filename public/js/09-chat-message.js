renderTemplate({
  name: "chat-message",
  elements: [
    { type:'shape', shapeType:'rectangle', x:40, y:620, width:480, height:90, color:'rgba(8,10,16,0.7)', borderRadius:14, zIndex:1, animation:'slideLeft', animDuration:0.4 },
    { type:'shape', shapeType:'circle', x:55, y:635, size:36, color:'#4DFFA0', zIndex:2, animation:'slideLeft', animDuration:0.4 },
    { type:'text', x:55, y:645, content:'{{initial}}', color:'#0A0D14', fontSize:18, fontWeight:900, textAlign:'center', maxWidth:36, zIndex:3, animation:'slideLeft', animDuration:0.4 },
    { type:'text', x:105, y:632, content:'{{name}}', color:'#4DFFA0', fontSize:16, fontWeight:700, zIndex:2, animation:'slideLeft', animDuration:0.4 },
    { type:'text', x:105, y:658, content:'{{message}}', color:'rgba(255,255,255,0.9)', fontSize:16, fontWeight:400, maxWidth:400, zIndex:2, animation:'slideLeft', animDuration:0.4 }
  ],
  duration: 5
}, {});
