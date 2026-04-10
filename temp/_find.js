const fs = require('fs');
const s = fs.readFileSync('d:/todo-app-main/index.html', 'utf8');
const needle = 'class="task-actions"';
let i = -1;
while ((i = s.indexOf(needle, i + 1)) >= 0) {
  console.log('at', i);
  console.log(s.substring(i, i + 1500));
  console.log('---');
}
