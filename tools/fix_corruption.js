/**
 * Fix corrupted showAddTaskRow function and remove old add-embed CSS
 * Run: node tools/fix_corruption.js
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// Fix corrupted showAddTaskRow (has duplicate garbage at end)
const corrupted = `function showAddTaskRow(){closeAddSplitMenu();var _as=document.querySelector('.add-split');if(_as)_as.classList.add('add-split-form-open');var qib=document.getElementById('quickImportBox');if(qib)qib.classList.add('hidden');resetGhostForm();var inp=document.getElementById('tIn');setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}catch(e){}},16.);}`;
const fixed = `function showAddTaskRow(){closeAddSplitMenu();var _as=document.querySelector('.add-split');if(_as)_as.classList.add('add-split-form-open');var qib=document.getElementById('quickImportBox');if(qib)qib.classList.add('hidden');resetGhostForm();var inp=document.getElementById('tIn');setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}`;

if (s.includes(corrupted)) {
  s = s.replace(corrupted, fixed);
  console.log('Fixed corrupted showAddTaskRow');
} else {
  // Try finding it another way - look for the garbage
  const garbage = '}catch(e){}},16.);}';
  const idx = s.indexOf(garbage);
  if (idx >= 0) {
    // Find the start of the function
    const fnStart = s.lastIndexOf('function showAddTaskRow', idx);
    if (fnStart >= 0) {
      const before = s.slice(0, fnStart);
      const after = s.slice(idx + garbage.length);
      s = before + fixed + after;
      console.log('Fixed using positional approach');
    }
  } else {
    // Just check if the garbage exists
    const garbage2 = 'catch(e){}},16.);}';
    if (s.includes(garbage2)) {
      console.log('Found garbage2 at', s.indexOf(garbage2));
    }
    console.warn('Corrupted string not found. Checking if already fixed...');
    const alreadyFixed = `function showAddTaskRow(){closeAddSplitMenu();var _as=document.querySelector('.add-split');if(_as)_as.classList.add('add-split-form-open');var qib=document.getElementById('quickImportBox');if(qib)qib.classList.add('hidden');resetGhostForm();var inp=document.getElementById('tIn');setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}`;
    if (s.includes(alreadyFixed)) {
      console.log('Already fixed!');
    } else {
      // Search for the function
      const fnIdx = s.indexOf('function showAddTaskRow');
      if (fnIdx >= 0) {
        const fnEnd = s.indexOf('}', fnIdx + 50);
        console.log('showAddTaskRow content:', s.slice(fnIdx, fnEnd + 1).substring(0, 300));
      }
    }
  }
}

// Remove old add-embed CSS that references deleted elements
const oldCssStart = '.list-panel .tasks{position:relative;z-index:0;padding:0 0 4px;gap:0;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden}.list-panel #addEmbedWrap:has(#addTaskInlineHold.hidden):has(#quickImportBox.hidden){max-height:0!important;min-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}';
const newCssStart = '.list-panel .tasks{position:relative;z-index:0;padding:0 0 4px;gap:0;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden}';
if (s.includes(oldCssStart)) {
  s = s.replace(oldCssStart, newCssStart);
  console.log('Removed old addEmbedWrap CSS');
} else {
  console.log('Old addEmbedWrap CSS already removed or not found');
}

// Remove unused add-embed CSS classes (they won't match anything since elements are gone)
// We can leave them as harmless CSS rules - no harm in keeping them

fs.writeFileSync(file, s, 'utf8');
console.log('Done');
