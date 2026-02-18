#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// This script rewrites absolute production domain references in the build output
// into root-relative paths so the site works regardless of domain. It also copies
// the CNAME file into the build output (useful for GitHub Pages).

const CANDIDATE_DIRS = ['build', 'dist', 'public', 'out'];
const PROD_HOSTS = [
  'https://poweremma.com',
  'https://www.poweremma.com',
  'http://poweremma.com',
  'http://www.poweremma.com',
];

function findBuildDir() {
  for (const d of CANDIDATE_DIRS) {
    const p = path.resolve(process.cwd(), d);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  // fallback: look for index.html in cwd
  const maybe = path.resolve(process.cwd(), 'index.html');
  if (fs.existsSync(maybe)) return process.cwd();
  console.error('Could not find build output directory (looked for: ' + CANDIDATE_DIRS.join(', ') + ').');
  process.exit(1);
}

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function rewriteFile(file) {
  try {
    const ext = path.extname(file).toLowerCase();
    // Only process common text/binary-safe filetypes
    const textExts = new Set(['.html', '.css', '.js', '.json', '.txt', '.map']);
    if (!textExts.has(ext)) return;
    let s = fs.readFileSync(file, 'utf8');
    let orig = s;
    for (const host of PROD_HOSTS) {
      // replace host + slash with root-relative slash
      s = s.split(host + '/').join('/');
      // replace host without trailing slash
      s = s.split(host).join('/');
    }
    if (s !== orig) {
      fs.writeFileSync(file + '.bak', orig, 'utf8');
      fs.writeFileSync(file, s, 'utf8');
      console.log(`Rewrote ${file} (backup -> ${file}.bak)`);
    }
  } catch (err) {
    console.error('Error rewriting', file, err.message);
  }
}

(function main() {
  const buildDir = findBuildDir();
  console.log('fix-build-domains: operating on build dir:', buildDir);
  walk(buildDir, (f) => rewriteFile(f));

  // Copy CNAME if present in project root (useful for GitHub Pages)
  const cnameSrc = path.resolve(process.cwd(), 'CNAME');
  if (fs.existsSync(cnameSrc)) {
    const cnameDst = path.join(buildDir, 'CNAME');
    try {
      fs.copyFileSync(cnameSrc, cnameDst);
      console.log('Copied CNAME ->', cnameDst);
    } catch (err) {
      console.error('Failed to copy CNAME:', err.message);
    }
  }

  console.log('fix-build-domains: done.');
})();
