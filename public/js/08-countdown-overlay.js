renderTemplate({
  name: "countdown-overlay",
  elements: [
    { type:'shape', shapeType:'rectangle', x:0, y:0, width:1920, height:1080, color:'rgba(8,10,16,0.92)', zIndex:1 },
    { type:'text', x:0, y:420, content:'{{title}}', color:'#fff', fontSize:48, fontWeight:800, textAlign:'center', maxWidth:1920, zIndex:2 },
    { type:'countdown', x:0, y:500, durationSeconds:{{duration_seconds}}, format:'ms', fontSize:120, color:'#4DFFA0', textAlign:'center', maxWidth:1920, fontFamily:"'Barlow Condensed', sans-serif", completeText:'STARTING!', zIndex:2 },
    { type:'text', x:0, y:650, content:'{{subtitle}}', color:'rgba(255,255,255,0.6)', fontSize:22, fontWeight:400, textAlign:'center', maxWidth:1920, zIndex:2 }
  ],
  animation: { type:'fade', duration:0.6 },
  duration: 0,
  loopCount: 1
}, {});
