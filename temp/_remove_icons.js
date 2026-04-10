const fs = require('fs');
let s = fs.readFileSync('d:/todo-app-main/index.html', 'utf8');
const re =
  /const icCal='<svg class="exp-ico"[\s\S]*?';const icRecur='<svg class="exp-ico-svg"[\s\S]*?';const icShield='<svg class="exp-ico-svg"[\s\S]*?';/;
if (!re.test(s)) {
  console.error('pattern not found');
  process.exit(1);
}
s = s.replace(re, '');
fs.writeFileSync('d:/todo-app-main/index.html', s);
console.log('ok');
