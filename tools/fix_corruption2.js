/**
 * Fix the corrupted showAddTaskRow function
 * Run: node tools/fix_corruption2.js
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// Find and fix showAddTaskRow
const fnName = 'function showAddTaskRow()';
const fnIdx = s.indexOf(fnName);
if (fnIdx < 0) {
  console.error('showAddTaskRow not found!');
  process.exit(1);
}

// Find the end of the function - it ends at the first closing brace after opening
// Walk from the opening { to find matching }
let depth = 0;
let i = fnIdx;
let endIdx = -1;
do {
  if (s[i] === '{') depth++;
  else if (s[i] === '}') {
    depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }
  i++;
} while (i < s.length);

const currentFunc = s.slice(fnIdx, endIdx + 1);
console.log('Current function:', currentFunc.substring(0, 150));
console.log('Ends with:', JSON.stringify(currentFunc.slice(-50)));

// Check if it's already correct
const correctEnding = `function showAddTaskRow(){closeAddSplitMenu();var _as=document.querySelector('.add-split');if(_as)_as.classList.add('add-split-form-open');var qib=document.getElementById('quickImportBox');if(qib)qib.classList.add('hidden');resetGhostForm();var inp=document.getElementById('tIn');setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}`;
const correctFunc = correctEnding + '}';

if (currentFunc === correctFunc) {
  console.log('Already correct!');
} else {
  // Replace the function
  const before = s.slice(0, fnIdx);
  const after = s.slice(endIdx + 1);
  s = before + correctFunc + after;
  console.log('Fixed showAddTaskRow');
}

fs.writeFileSync(file, s, 'utf8');
console.log('Done');
