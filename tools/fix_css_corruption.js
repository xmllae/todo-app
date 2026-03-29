/**
 * Fix the corrupted CSS at line 79
 * Run: node tools/fix_css_corruption.js
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// Fix line 79 - the corrupted CSS block
// Find the corrupted part and fix it
const corruptedPattern = '.list-panel .task-ghost-wrap{position:relative;z-index:20;isolation:isolate;box-sizing:border-box}order-box;transition:background .18s ease,box-shadow .18s ease}';
const cleanReplacement = '.list-panel .task-ghost-wrap{position:relative;z-index:20;isolation:isolate;box-sizing:border-box}';

if (s.includes(corruptedPattern)) {
  s = s.replace(corruptedPattern, cleanReplacement);
  console.log('Fixed corrupted CSS at task-ghost-wrap');
} else {
  // Find the corrupted portion
  const corrupted = 'box-sizing:border-box}order-box;transition:';
  const idx = s.indexOf(corrupted);
  if (idx >= 0) {
    // Find what precedes this
    const before = s.slice(0, idx);
    // Find the end of the corruption
    const garbageEnd = s.indexOf('}', idx);
    if (garbageEnd >= 0) {
      const before2 = s.slice(0, idx + 'box-sizing:border-box}'.length);
      const after = s.slice(garbageEnd + 1);
      s = before2 + after;
      console.log('Fixed using positional approach');
    }
  } else {
    console.log('Corrupted pattern not found - checking if already fixed');
    if (!s.includes('}order-box')) {
      console.log('Already fixed or no corruption found');
    }
  }
}

// Also check for and remove the orphaned .add-embed CSS rules that are left over
// after the task-ghost-wrap replacement.
// The old CSS block was:
// .list-panel #overdueArea:empty{display:none}.list-panel .tasks{...}.list-panel #addEmbedWrap:has(...)...
// After replacement it should be:
// .list-panel #overdueArea:empty{display:none}.list-panel .tasks{...}.list-panel .task-ghost-wrap{...}
// But some old .add-embed CSS got merged incorrectly.

// Check if line 79 has the correct structure
const line79Start = s.indexOf('.list-panel #overdueArea');
if (line79Start >= 0) {
  // Find the end of line 79's CSS block (ends before .list-panel .tb-section)
  const nextBlock = s.indexOf('.list-panel .tb-section', line79Start);
  if (nextBlock > line79Start) {
    const line79Content = s.slice(line79Start, nextBlock);
    // Check if it has corruption
    if (line79Content.includes('}order-box')) {
      // Find and fix
      const corrupted = '}order-box;transition:background .18s ease,box-shadow .18s ease}';
      const fixed = '}';
      if (line79Content.includes(corrupted)) {
        const newContent = line79Content.replace(corrupted, fixed);
        s = s.slice(0, line79Start) + newContent + s.slice(nextBlock);
        console.log('Fixed corruption in line 79 CSS block');
      }
    }
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('Done');
