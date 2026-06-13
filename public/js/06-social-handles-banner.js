renderTemplate({
  name: "social-handles-banner",
  elements: [
    { type:'shape', shapeType:'rectangle', x:0, y:960, width:1920, height:120, color:'rgba(8,10,16,0.85)', zIndex:1 },
    { type:'shape', shapeType:'rectangle', x:0, y:960, width:1920, height:3, color:'#4DFFA0', zIndex:2 },

    { type:'text', x:50, y:990, content:'{{name}}', color:'#fff', fontSize:42, fontWeight:800, fontFamily:"'Barlow Condensed', sans-serif", zIndex:3 },
    { type:'text', x:50, y:1042, content:'LIVE NOW', color:'#4DFFA0', fontSize:14, fontWeight:700, zIndex:3 },

    { type:'social', x:1280, y:980, platform:'instagram', username:'{{ig_handle}}', textColor:'#fff', fontSize:18, iconSize:24, bgColor:'transparent', borderRadius:0, padding:'0', zIndex:3 },
    { type:'social', x:1280, y:1020, platform:'youtube', username:'{{yt_handle}}', textColor:'#fff', fontSize:18, iconSize:24, bgColor:'transparent', borderRadius:0, padding:'0', zIndex:3 },

    { type:'shape', shapeType:'circle', x:1660, y:985, size:28, color:'#f59e0b', zIndex:3 },
    { type:'text', x:1668, y:988, content:'₹', color:'#000', fontSize:18, fontWeight:900, zIndex:4 },
    { type:'text', x:1700, y:990, content:'{{upi_handle}}', color:'#fff', fontSize:18, fontWeight:600, zIndex:3 }
  ],
  animation: { type:'slide', direction:'up', duration:0.6 },
  duration: 8,
  loopCount: 1
}, {});
