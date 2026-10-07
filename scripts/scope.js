'use strict';
// Plan scope: which files the approved plan says this item touches. After each edit, a file outside the plan's
// "## Files" table gets a warning (PostToolUse) and a line in .mndx/scope.log; verify lists them as deviations.
// Tests, docs, lockfiles and scratch are always in scope. Items without a Files table are not checked.

const fs = require('fs');
const path = require('path');
const lib = require('./lib');

const SCOPE_LOG = 'scope.log';
const ALWAYS_IN_SCOPE = [
  /\.md$/i,
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|poetry\.lock|uv\.lock|Cargo\.lock|go\.sum)$/,
  /(^|\/)(__tests__|tests?|e2e|maestro)\//,
  /\.(test|spec)\.[a-z]+$/i,
  /^\.scratch\//,
  /^\.mndx\//,
];

// Paths in backticks from the first column of the plan's "## Files" table. Several per cell are allowed.
function plannedFiles(planText) {
  const section = planText.split(/^###?\s+Files\s*$/m)[1];
  if (!section) return null;
  const body = section.split(/^#{2,3}\s/m)[0];
  const entries = [];
  for (const line of body.split(/\r?\n/)) {
    const cells = line.split('|');
    if (cells.length < 3) continue;
    for (const [, p] of cells[1].matchAll(/`([^`]+)`/g)) entries.push(p.trim().replace(/\\/g, '/'));
  }
  return entries.length ? entries : null;
}

function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*');
  return new RegExp(`^${escaped}$`);
}

// A planned entry covers a file if it's the same path, a directory prefix ("src/ui/"), a glob ("src/**/*.ts"),
// or a bare filename the plan wrote without its folder ("HabitList.tsx").
function covers(entry, rel) {
  if (entry === rel) return true;
  if (entry.endsWith('/')) return rel.startsWith(entry);
  if (entry.includes('*')) return globToRegex(entry).test(rel);
  if (!entry.includes('/')) return rel === entry || rel.endsWith(`/${entry}`);
  return false;
}

function inScope(entries, rel) {
  return ALWAYS_IN_SCOPE.some((re) => re.test(rel)) || entries.some((e) => covers(e, rel));
}

// For an edited absolute path: null when there's nothing to say, else the warning text.
function scopeWarning(root, state, file) {
  const item = state.active;
  if (!item || item.kind !== 'feature') return null;
  const plan = lib.docFile(root, item, 'plan');
  if (!fs.existsSync(plan)) return null;
  const entries = plannedFiles(fs.readFileSync(plan, 'utf8'));
  if (!entries) return null;
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (rel.startsWith('..') || inScope(entries, rel)) return null;
  fs.appendFileSync(path.join(root, lib.STATE_DIR, SCOPE_LOG), JSON.stringify({ at: new Date().toISOString(), item: item.id, file: rel }) + '\n');
  return `MNDX scope: ${rel} is not in ${item.id}'s plan (## Files). If it's needed, that's fine for a small `
    + 'mechanical change: note it under "Deviations from the plan" in verify.md. If it changes behavior or design, '
    + 'stop and update the plan for re-approval.';
}

// Files edited outside the plan for an item (from the log), unique, in first-seen order.
function outOfScope(root, itemId) {
  const file = path.join(root, lib.STATE_DIR, SCOPE_LOG);
  if (!fs.existsSync(file)) return [];
  const seen = new Set();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e.item === itemId) seen.add(e.file);
    } catch { /* skip a torn line */ }
  }
  return [...seen];
}

module.exports = { SCOPE_LOG, plannedFiles, covers, inScope, scopeWarning, outOfScope };
