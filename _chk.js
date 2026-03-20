var c=require('fs').readFileSync('d:/todo-app-main/index.html','utf8');
var i=c.indexOf('oc-label">优先级');
console.log(c.substring(Math.max(0,i-100),i+100));
