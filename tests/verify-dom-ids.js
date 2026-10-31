const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Extract all ids from index.html
const idRegex = /id=["']([^"']+)["']/g;
const htmlIds = new Set();
let match;
while ((match = idRegex.exec(html)) !== null) {
  htmlIds.add(match[1]);
}

const jsFiles = [
  '../js/engine.js',
  '../js/storage.js',
  '../js/personas.js',
  '../js/help-content.js',
  '../js/tutorials.js',
  '../js/app.js',
  '../js/app-extensions.js'
];

const missingIdsByFile = {};

jsFiles.forEach(relPath => {
  const filePath = path.join(__dirname, relPath);
  const code = fs.readFileSync(filePath, 'utf8');
  const getByIdRegex = /getElementById\(["']([^"']+)["']\)/g;
  let m;
  const missing = new Set();
  while ((m = getByIdRegex.exec(code)) !== null) {
    const id = m[1];
    // Dynamic or generated elements created by JS dynamically
    const dynamicallyCreated = [
      'maya-tour-popover',
      'maya-tour-backdrop',
      'btn-tour-next',
      'btn-tour-prev',
      'btn-tour-exit',
      'btn-dismiss-side-pop',
      'btn-side-pop-ok',
      'toast-container',
      'qr-canvas',
      'qr-code-view'
    ];
    if (!htmlIds.has(id) && !dynamicallyCreated.includes(id)) {
      missing.add(id);
    }
  }
  if (missing.size > 0) {
    missingIdsByFile[relPath] = Array.from(missing);
  }
});

console.log('Missing IDs:', JSON.stringify(missingIdsByFile, null, 2));
