const fs = require('fs');
const c = fs.readFileSync('d:\\todo-app-main\\index.html', 'utf8');
const i = c.indexOf('function rFilterBar');
console.log(c.substring(i, i+600));
