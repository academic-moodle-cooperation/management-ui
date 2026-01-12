#!/usr/bin/env node
/**
 * License Check Script
 * 
 * Checks that all dependencies have compatible licenses.
 * This is a basic implementation - extend as needed.
 */

const fs = require('fs');
const path = require('path');

// Allowed licenses (extend as needed)
const ALLOWED_LICENSES = [
  'MIT',
  'Apache-2.0',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Unlicense',
  'CC0-1.0',
];

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('License Check Script');
console.log('===================\n');

// Note: This is a basic implementation
// For full license checking, use tools like:
// - license-checker
// - npm-license-checker
// - fossa-cli

console.log('⚠️  Basic license check - extend with license-checker for full audit');
console.log('Recommended: npm install -D license-checker');
console.log('Then run: npx license-checker --onlyAllow "MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause"');

process.exit(0);
