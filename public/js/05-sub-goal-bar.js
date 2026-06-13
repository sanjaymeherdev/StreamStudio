(function() {
  var current = parseFloat("{{current}}") || 0;
  var target  = parseFloat("{{target}}")  || 1;
  var pct = Math.max(0, Math.min(1, current / target));
  var barWidth = Math.round(540 * pct);

  renderTemplate({
    name: "sub-goal-bar",
    elements: [
      { type:'shape', shapeType:'rectangle', x:660, y:30, width:600, height:80, color:'rgba(8,10,16,0.8)', borderRadius:14, zIndex:1 },
      { type:'text', x:690, y:45, content:'{{label}}', color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:700, zIndex:2 },
      { type:'shape', shapeType:'rectangle', x:690, y:75, width:540, height:14, color:'rgba(255,255,255,0.12)', borderRadius:7, zIndex:2 },
      { type:'shape', shapeType:'rectangle', x:690, y:75, width:barWidth, height:14, color:'#22c55e', borderRadius:7, zIndex:3 },
      { type:'text', x:1140, y:45, content:'{{current}} / {{target}}', color:'#fff', fontSize:16, fontWeight:800, textAlign:'right', maxWidth:150, zIndex:2 }
    ],
    animation: { type:'fade', duration:0.5 },
    duration: 0,
    loopCount: 1
  }, {});
})();
