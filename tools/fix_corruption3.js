/**
 * Fix the corrupted showAddTaskRow function by searching for the specific garbage pattern
 * Run: node tools/fix_corruption3.js
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

const garbage = '}catch(e){}},16.);}';
const idx = s.indexOf(garbage);
if (idx >= 0) {
  const before = s.slice(0, idx);
  const after = s.slice(idx + garbage.length);
  // Also add the missing closing brace for the function
  const correctEnd = '  }';
  s = before + correctEnd + after;
  console.log('Fixed garbage at position', idx);
} else {
  // Try another approach - find the specific pattern
  const garbage2 = '}catch(e){}},16.);}';
  const idx2 = s.indexOf(garbage2);
  if (idx2 >= 0) {
    const before = s.slice(0, idx2);
    const after = s.slice(idx2 + garbage2.length);
    s = before + '  }' + after;
    console.log('Fixed garbage2 at position', idx2);
  } else {
    console.error('Garbage not found. Searching manually...');
    // Find the start of showAddTaskRow
    const fnIdx = s.indexOf('function showAddTaskRow()');
    if (fnIdx >= 0) {
      // Find where it should end (look for the next function or blank line)
      // The function should end before function cancelAddTask
      const cancelIdx = s.indexOf('function cancelAddTask()', fnIdx);
      if (cancelIdx >= 0) {
        // What comes between showAddTaskRow and cancelAddTask?
        const between = s.slice(fnIdx, cancelIdx);
        console.log('Between showAddTaskRow and cancelAddTask:', JSON.stringify(between.slice(-80)));
        // The correct ending is:  setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}
        // and then } for the function
        // Find the closing of the setTimeout call
        const stIdx = between.lastIndexOf('setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);');
        if (stIdx >= 0) {
          const funcBody = between.slice(0, stIdx + 'setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);'.length);
          const nextClose = between.indexOf('}', funcBody.length);
          // Find the next } that's the function closing
          const funcEnd = stIdx + 'setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}'.length;
          const rest = between.slice(funcEnd);
          console.log('Rest after setTimeout end:', JSON.stringify(rest));
        }
      }
    }
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('Done');
