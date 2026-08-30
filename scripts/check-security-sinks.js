import fs from 'node:fs';
import path from 'node:path';

const findings = [];
function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      const source = fs.readFileSync(full, 'utf8');
      if (/dangerouslySetInnerHTML|\.innerHTML\s*=|\.innerHTML\b/.test(source) && !source.includes('sanitizeReaderHtml')) {
        findings.push(`${full}: HTML sink requires sanitizeReaderHtml`);
      }
    }
  }
}

walk('src');
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log('HTML sink guard passed.');
}
