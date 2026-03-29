/**
 * Fix the corrupted showAddTaskRow function
 * Run: node tools/fix_corruption4.js
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// Find the showAddTaskRow function and fix its ending
const corrupted = `function showAddTaskRow(){closeAddSplitMenu();var _as=document.querySelector('.add-split');if(_as)_as.classList.add('add-split-form-open');var qib=document.getElementById('quickImportBox');if(qib)qib.classList.add('hidden');resetGhostForm();var inp=document.getElementById('tIn');setTimeout(function(){try{if(inp)inp.focus();  }}catch(e){}},16);}`;
const correct = `function showAddTaskRow(){closeAddSplitMenu();var _as=document.querySelector('.add-split');if(_as)_as.classList.add('add-split-form-open');var qib=document.getElementById('quickImportBox');if(qib)qib.classList.add('hidden');resetGhostForm();var inp=document.getElementById('tIn');setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16);}`;

if (s.includes(corrupted)) {
  s = s.replace(corrupted, correct);
  console.log('Replaced using exact match');
} else {
  // Find the function and fix it manually
  const fnIdx = s.indexOf('function showAddTaskRow()');
  const cancelIdx = s.indexOf('function cancelAddTask()');
  if (fnIdx < 0 || cancelIdx < 0) {
    console.error('Could not find functions');
    process.exit(1);
  }

  const between = s.slice(fnIdx, cancelIdx);
  console.log('Between (first 200):', between.slice(0, 200));
  console.log('Between (last 100):', between.slice(-100));

  // Find the correct ending
  // The function should end with: setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16);}
  const stEnd = 'setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16);}';
  const stIdx = between.lastIndexOf(stEnd);
  if (stIdx >= 0) {
    const funcEnd = stIdx + stEnd.length;
    const before = s.slice(0, fnIdx);
    const after = s.slice(cancelIdx);
    s = before + correct + after;
    console.log('Replaced using positional approach');
  } else {
    console.error('Could not find correct ending');
    console.error('Looking for:', JSON.stringify(stEnd));
    process.exit(1);
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('Done');
