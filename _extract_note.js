const fs = require('fs');
const s = fs.readFileSync('d:/todo-app-main/index.html', 'utf8');
const a = s.indexOf('let noteS=`');
const b = s.indexOf('let postponeS=`', a);
fs.writeFileSync('d:/todo-app-main/_frag.txt', s.slice(a, b), 'utf8');
