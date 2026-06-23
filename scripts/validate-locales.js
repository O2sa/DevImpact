/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'locales');
const enKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))).sort();

let hasError = false;

fs.readdirSync(localesDir).forEach(file => {
  if (file === 'en.json') return;

  const fileKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'))).sort();
  const missing = enKeys.filter(k => !fileKeys.includes(k));
  const extra = fileKeys.filter(k => !enKeys.includes(k));
  if (missing.length || extra.length) {
    hasError = true;
    console.error(`${file}: ${missing.length ? `Missing keys: ${missing.join(', ')}` : ''}${extra.length ? ` Extra keys: ${extra.join(', ')}` : ''}`);
  }
});

process.exit(hasError ? 1 : 0);
