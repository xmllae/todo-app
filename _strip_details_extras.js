const fs = require('fs');
const path = 'd:/todo-app-main/index.html';
let s = fs.readFileSync(path, 'utf8');

const ppBlock =
  /if\(isExp\)\{const tom=new Date\(parseDS\(sel\)\);tom\.setDate\(tom\.getDate\(\)\+1\);const tomS=fd\(tom\);const tom2=new Date\(parseDS\(sel\)\);tom2\.setDate\(tom2\.getDate\(\)\+2\);const tom2S=fd\(tom2\);const nmon=getNextMonday\(\);let ppDropExp='';if\(ppOpenId===t\.id\)\{ppDropExp=`[\s\S]*?`\}/;

if (!ppBlock.test(s)) {
  console.error('ppBlock not found');
  process.exit(1);
}
s = s.replace(ppBlock, 'if(isExp){');

const postponeThroughFreeze =
  /let postponeS=`[\s\S]*?`;\s*const rule=t\.recurRuleId\?recurRules\.find\(r=>r\.id===t\.recurRuleId\):null;[\s\S]*?let freezeS=`[\s\S]*?`;\s*/;

if (!postponeThroughFreeze.test(s)) {
  console.error('postponeThroughFreeze not found');
  process.exit(1);
}
s = s.replace(postponeThroughFreeze, '');

if (!s.includes('const detailsBundle=detailsFormS+durS')) {
  console.error('detailsBundle broken');
  process.exit(1);
}

fs.writeFileSync(path, s);
console.log('ok');
