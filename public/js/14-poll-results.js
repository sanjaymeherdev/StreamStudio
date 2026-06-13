// Poll Results Template
// Usage: Display live poll results with percentage bars
(function() {
  var option1 = "{{option1}}";
  var votes1 = parseInt("{{votes1}}") || 0;
  var option2 = "{{option2}}";
  var votes2 = parseInt("{{votes2}}") || 0;
  
  var total = votes1 + votes2;
  var pct1 = total > 0 ? Math.round((votes1 / total) * 100) : 0;
  var pct2 = total > 0 ? Math.round((votes2 / total) * 100) : 0;
  var bar1Width = Math.round(400 * pct1 / 100);
  var bar2Width = Math.round(400 * pct2 / 100);
  
  renderTemplate({
    name: "poll-results",
    elements: [
      { type:'shape', shapeType:'rectangle', x:760, y:300, width:400, height:180, color:'rgba(8,10,16,0.9)', borderRadius:12, zIndex:1 },
      { type:'text', x:960, y:330, content:'{{question}}', color:'#fff', fontSize:20, fontWeight:700, textAlign:'center', zIndex:2 },
      
      // Option 1
      { type:'text', x:780, y:370, content:option1 + ' (' + votes1 + ')', color:'#60a5fa', fontSize:14, fontWeight:600, zIndex:3 },
      { type:'shape', shapeType:'rectangle', x:780, y:395, width:bar1Width, height:24, color:'#60a5fa', borderRadius:4, zIndex:4 },
      { type:'text', x:1160, y:413, content:pct1 + '%', color:'#fff', fontSize:12, fontWeight:700, textAlign:'right', zIndex:5 },
      
      // Option 2
      { type:'text', x:780, y:430, content:option2 + ' (' + votes2 + ')', color:'#f87171', fontSize:14, fontWeight:600, zIndex:3 },
      { type:'shape', shapeType:'rectangle', x:780, y:455, width:bar2Width, height:24, color:'#f87171', borderRadius:4, zIndex:4 },
      { type:'text', x:1160, y:473, content:pct2 + '%', color:'#fff', fontSize:12, fontWeight:700, textAlign:'right', zIndex:5 }
    ],
    animation: { type:'fadeIn', duration:0.4 },
    duration: {{duration}},
    loopCount: {{loopCount}}
  }, {});
})();
