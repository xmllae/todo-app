const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
let i = 0;
while ((i = s.indexOf('taskDashCol', i + 1)) >= 0) {
  if (i < 300000) {
    console.log(i, s.slice(Math.max(0, i - 30), i + 100));
    console.log('---');
  }
}
