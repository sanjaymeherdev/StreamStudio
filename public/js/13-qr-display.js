// QR Code Display Template
// Usage: Show QR code for donations, follows, or links
renderTemplate({
  name: "qr-display",
  elements: [
    { type:'shape', shapeType:'rectangle', x:1620, y:400, width:260, height:280, color:'rgba(255,255,255,0.95)', borderRadius:16, zIndex:1 },
    { type:'image', x:1635, y:415, width:230, height:230, src:'{{qr_url}}', borderRadius:8, zIndex:2 },
    { type:'text', x:1750, y:665, content:'{{label}}', color:'#000', fontSize:18, fontWeight:700, textAlign:'center', zIndex:3 }
  ],
  animation: { type:'zoomIn', duration:0.4 },
  duration: {{duration}},
  loopCount: {{loopCount}}
}, {});
