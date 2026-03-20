var fs=require('fs');
var c=fs.readFileSync('d:/todo-app-main/index.html','utf8');
var i=c.indexOf('显示已完成列');
console.log(c.substring(i-200,i+200));
