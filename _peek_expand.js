const fs = require('fs');
const s = fs.readFileSync('d:/todo-app-main/index.html', 'utf8');
const ex = s.indexOf("let expandH=''");
const semi = s.indexOf(';}}return`<div class="task-item"', ex);
console.log('len', semi - ex);
console.log(s.slice(ex, ex + 12000));
