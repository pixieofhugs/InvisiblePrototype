/*
 * Build-time converter: design_handoff data.js  ->  data/seed/*.json
 *
 * data.js is browser JS that assigns window.CLAIMS / window.AUDIT_LOG_INIT /
 * window.NEW_CLAIM_TEMPLATES (with comments, trailing commas, single quotes,
 * en-dashes, etc). We evaluate it in a VM sandbox with a fake `window` so the
 * conversion is byte-faithful — no hand-transcription.
 *
 * Run from repo root:  node scripts/convert_seed.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_JS = path.join(ROOT, 'web', 'data.js');
const OUT_DIR = path.join(ROOT, 'data', 'seed');

const code = fs.readFileSync(DATA_JS, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'data.js' });

const w = sandbox.window;
const required = ['CLAIMS', 'AUDIT_LOG_INIT', 'NEW_CLAIM_TEMPLATES', 'TIER_CONFIG', 'ACTION_CONFIG'];
for (const key of required) {
  if (w[key] === undefined) {
    console.error(`ERROR: window.${key} not found in data.js`);
    process.exit(1);
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const writes = {
  'claims_seed.json': w.CLAIMS,
  'audit_seed.json': w.AUDIT_LOG_INIT,
  'templates_seed.json': w.NEW_CLAIM_TEMPLATES,
};

for (const [file, value] of Object.entries(writes)) {
  const dest = path.join(OUT_DIR, file);
  fs.writeFileSync(dest, JSON.stringify(value, null, 2) + '\n', 'utf8');
  const count = Array.isArray(value) ? `${value.length} items` : `${Object.keys(value).length} keys`;
  console.log(`wrote ${file}  (${count})`);
}

console.log('Seed conversion complete.');
