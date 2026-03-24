/**
 * Make list-panel add-task circle match task row ring visual size (~28px).
 * Safe UTF-8: only replaces ASCII CSS substrings.
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

const oldBlock =
  '.list-panel .add-embed-plus,.list-panel .task-ck-ring{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;box-sizing:border-box!important}.list-panel .add-embed-plus{border-width:2.5px!important}';
const newBlock =
  '.list-panel .task-ck-ring{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;box-sizing:border-box!important}.list-panel .add-embed-plus{width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;box-sizing:border-box!important;border-width:2.5px!important}';

if (!s.includes(oldBlock)) {
  console.error('Expected CSS block not found (already patched or layout changed)');
  process.exit(1);
}
s = s.replace(oldBlock, newBlock);

// Slightly smaller + icon inside 28px circle
s = s.replace(
  '.list-panel .add-embed-plus svg{width:14px!important;height:14px!important}',
  '.list-panel .add-embed-plus svg{width:12px!important;height:12px!important}'
);
// If file still had 16px from older state
s = s.replace(
  '.list-panel .add-embed-plus svg{width:16px!important;height:16px!important}',
  '.list-panel .add-embed-plus svg{width:12px!important;height:12px!important}'
);

fs.writeFileSync(file, s, 'utf8');
console.log('OK: add-embed-plus ring unified to ~28px (match task SVG ring)');
