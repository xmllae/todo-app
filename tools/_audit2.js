var fs=require('fs');
var c=fs.readFileSync('d:/todo-app-main/index.html','utf8');
var emojiRe=/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}][\u{FE00}-\u{FE0F}]?/gu;
var seen={};
var m;
while((m=emojiRe.exec(c))!==null){
  var ctx=c.substring(Math.max(0,m.index-50),m.index+50).replace(/[\r\n]/g,' ');
  if(!seen[m[0]])seen[m[0]]=[];
  seen[m[0]].push(ctx);
}
Object.keys(seen).forEach(function(e){
  console.log('\nEMOJI:',JSON.stringify(e),'x'+seen[e].length);
  seen[e].slice(0,2).forEach(function(ctx){console.log('  CTX:',ctx.substring(0,120));});
});
