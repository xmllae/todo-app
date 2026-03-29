/**
 * Fix showAddTaskRow function - handles CRLF line endings
 * Run: node tools/fix_showAddTaskRow.js
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

const marker = `var h=document.getElementById('addTaskInlineHold');if(h)h.classList.remove('hidden');var inp=document.getElementById('tIn'),tt=document.getElementById('tTime'),dur=document.getElementById('durIn'),ps=document.getElementById('pSel');if(inp)inp.value='';if(tt)tt.value='';if(dur)dur.value='';if(ps)ps.value='medium';var w=document.getElementById('addEmbedWrap'),r=document.getElementById('addBoxRow2');if(w)w.classList.add('add-embed-active');if(r)r.classList.add('expanded');refreshAddEmbedPrioArc();setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}`;

const replacement = `resetGhostForm();var inp=document.getElementById('tIn');setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}`;

if (s.includes(marker)) {
  s = s.replace(marker, replacement);
  console.log('Replaced showAddTaskRow');
} else {
  // Try normalizing CRLF
  const normalized = s.replace(/\r\n/g, '\n');
  if (normalized.includes(marker)) {
    s = normalized.replace(marker, replacement);
    // Convert back to CRLF if original was CRLF
    if (s.includes('\r\n') || !s.includes('\n')) {
      // original was CRLF - check if we changed anything
    }
    console.log('Replaced showAddTaskRow (after CRLF normalization)');
  } else {
    console.error('Marker not found in either encoding');
    console.error('Marker length:', marker.length);
    // Check if the marker with single newlines is there
    const simple = marker.replace(/\r\n/g, '\n');
    if (normalized.includes(simple)) {
      console.log('Found with simple newlines, replacing...');
      s = normalized.replace(simple, replacement);
    } else {
      console.error('Still not found. Trying substring search...');
      // Find the function
      const idx = s.indexOf("var h=document.getElementById('addTaskInlineHold')");
      if (idx >= 0) {
        const endIdx = s.indexOf('}', idx);
        console.log('Found marker at', idx, 'to', endIdx);
        const before = s.slice(0, idx);
        const after = s.slice(endIdx + 1);
        s = before + replacement + after;
        console.log('Replaced using positional approach');
      } else {
        console.error('Marker not found at all');
        process.exit(1);
      }
    }
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('Done');
