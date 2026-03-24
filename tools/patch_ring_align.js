/**
 * List panel: add-task circle matches task checkbox ring (32px), align left with task rows.
 * Idempotent, UTF-8 safe (ASCII-only replacements).
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

const ring24 =
  '.list-panel .add-embed-plus{width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;box-sizing:border-box!important}';
const ring32 =
  '.list-panel .add-embed-plus{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;box-sizing:border-box!important;border-width:1.5px!important}';
if (s.includes(ring24)) {
  s = s.split(ring24).join(ring32);
}

s = s.replace(
  /\.list-panel \.add-embed-plus svg\{width:10px!important;height:10px!important\}/g,
  '.list-panel .add-embed-plus svg{width:14px!important;height:14px!important}'
);

const tail =
  '.list-panel .add-embed-plus{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;box-sizing:border-box!important;border-width:1.5px!important}.list-panel .add-embed-plus svg{width:14px!important;height:14px!important;max-width:14px!important;max-height:14px!important}.list-panel .add-embed-trigger,.list-panel .add-embed-editor{padding-left:20px!important}.list-panel .add-embed:hover .add-embed-plus,.list-panel .add-embed:focus-within .add-embed-plus,.list-panel .add-embed-trigger:hover .add-embed-plus,.list-panel .add-embed-trigger:focus-visible .add-embed-plus{transform:none!important}';
if (!s.includes('padding-left:20px!important}')) {
  s = s.replace('</style>', tail + '</style>');
}

fs.writeFileSync(file, s, 'utf8');
console.log('OK: list-panel add ring aligned (32px, matches task-ck-ring; desktop + mobile)');
