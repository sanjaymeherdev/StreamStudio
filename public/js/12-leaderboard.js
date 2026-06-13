// Dynamic Leaderboard Template
// Usage: Show top supporters, donors, or subscribers
(function() {
  // Parse JSON array of supporters
  var supporters = JSON.parse("{{supporters_json}}");
  
  var elements = [
    { type:'shape', shapeType:'rectangle', x:1600, y:60, width:280, height:400, color:'rgba(8,10,16,0.9)', borderRadius:12, zIndex:1 },
    { type:'text', x:1740, y:90, content:'{{title}}', color:'#fbbf24', fontSize:20, fontWeight:800, textAlign:'center', zIndex:2 }
  ];
  
  supporters.forEach((sup, i) => {
    elements.push({ type:'shape', shapeType:'line', x:1620, y:130 + (i * 60), width:240, thickness:1, color:'rgba(255,255,255,0.1)', zIndex:2 });
    elements.push({ type:'text', x:1620, y:145 + (i * 60), content:(i+1) + '. ' + sup.name, color:i===0 ? '#fbbf24' : '#fff', fontSize:16, fontWeight:i===0 ? 700 : 500, zIndex:3 });
    elements.push({ type:'text', x:1860, y:145 + (i * 60), content:sup.amount, color:'#22c55e', fontSize:14, fontWeight:600, textAlign:'right', zIndex:3 });
  });
  
  renderTemplate({
    name: "leaderboard",
    elements: elements,
    animation: { type:'slide', direction:'left', duration:0.5 },
    duration: {{duration}},
    loopCount: {{loopCount}}
  }, {});
})();
