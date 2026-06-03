const fs = require('fs');
const path = require('path');

const filesToParse = [
  { name: 'UI_UX_TASKLIST.md', path: path.join(__dirname, '../UI_UX_TASKLIST.md') },
  { name: 'vivah_ai_ready_development_tasklist.md', path: path.join(__dirname, '../vivah_ai_ready_development_tasklist.md') },
  { name: 'docs/member-dashboard-redesign-tasklist.md', path: path.join(__dirname, '../docs/member-dashboard-redesign-tasklist.md') },
  { name: 'docs/admin-panel-redesign-plan.md', path: path.join(__dirname, '../docs/admin-panel-redesign-plan.md') }
];

console.log('=== Starting Tasklist Checkbox Parser ===\n');

let totalChecked = 0;
let totalUnchecked = 0;

filesToParse.forEach(fileInfo => {
  if (!fs.existsSync(fileInfo.path)) {
    console.log(`[Warning] File not found: ${fileInfo.name}`);
    return;
  }

  const content = fs.readFileSync(fileInfo.path, 'utf8');
  const lines = content.split('\n');

  let checkedCount = 0;
  let uncheckedCount = 0;

  lines.forEach(line => {
    // Match - [x] or - [X]
    if (line.match(/^\s*-\s*\[[xX]\]/)) {
      checkedCount++;
    }
    // Match - [ ]
    else if (line.match(/^\s*-\s*\[\s*\]/)) {
      uncheckedCount++;
    }
  });

  console.log(`File: ${fileInfo.name}`);
  console.log(`  - Completed: ${checkedCount}`);
  console.log(`  - Pending:   ${uncheckedCount}`);
  const total = checkedCount + uncheckedCount;
  const pct = total > 0 ? ((checkedCount / total) * 100).toFixed(1) : 0;
  console.log(`  - Progress:  ${pct}%\n`);

  totalChecked += checkedCount;
  totalUnchecked += uncheckedCount;
});

const overallTotal = totalChecked + totalUnchecked;
const overallPct = overallTotal > 0 ? ((totalChecked / overallTotal) * 100).toFixed(1) : 0;

console.log('=== Summary ===');
console.log(`Total Completed Tasks: ${totalChecked}`);
console.log(`Total Pending Tasks:   ${totalUnchecked}`);
console.log(`Overall Project Completion: ${overallPct}%`);
