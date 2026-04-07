const fs = require('fs');
const s = fs.readFileSync('d:/todo-app-main/index.html', 'utf8');
const a = s.indexOf('let noteS=`');
const b = s.indexOf('let postponeS=`', a);
console.log(s.slice(a, b));
