const fs = require('fs');
const s = fs.readFileSync('d:/todo-app-main/index.html', 'utf8');
const i = s.indexOf('let freezeS=');
console.log(s.slice(i, i + 400));
