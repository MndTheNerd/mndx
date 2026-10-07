#!/usr/bin/env node
'use strict';
// Shell watchdog (PreToolUse + PostToolUse on Bash/PowerShell). The edit gate can't see files written by shell
// commands (redirects, scripts, generators), so around each shell command run while the gate is CLOSED, this
// snapshots the dirty files in git and afterwards reports any code file the command changed. Claude is told to
// revert it; the event is logged to .mndx/violations.log and surfaced by `mndx.js status`.
// Needs git; outside a git repo or with the gate open it does nothing.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const lib = require('./lib');

const VIOLATIONS_FILE = 'violations.log';
const ALLOWED = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|poetry\.lock|uv\.lock|Cargo\.lock|go\.sum)$/;

function snapshotFile(toolUseId) {
  return path.join(os.tmpdir(), `mndx-watch-${String(toolUseId || 'x').replace(/[^\w-]/g, '')}.json`);
}

// Dirty files (modified, added, untracked; not ignored) → content hash. Docs, state and scratch are excluded.
function dirtyCode(root) {
  const res = spawnSync('git', ['status', '--porcelain=v1', '-uall', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0) return null;
  const map = {};
  const entries = res.stdout.split('\0').filter(Boolean);
  for (let i = 0; i < entries.length; i++) {
    const status = entries[i].slice(0, 2);
    const file = entries[i].slice(3);
    if (status[0] === 'R' || status[0] === 'C') i++; // rename/copy: next entry is the old path
    if (/\.md$/i.test(file) || ALLOWED.test(file) || /^(\.mndx|\.scratch)\//.test(file)) continue;
    const abs = path.join(root, file);
    map[file] = fs.existsSync(abs) && fs.statSync(abs).isFile()
      ? crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex')
      : 'deleted';
  }
  return map;
}

function closedGateRoot(cwd) {
  const root = lib.findRoot(cwd);
  if (!root) return null;
  try {
    return lib.gateStatus(root, lib.readState(root)).open ? null : root;
  } catch { return null; }
}

function pre(input) {
  const root = closedGateRoot(input.cwd || process.cwd());
  if (!root) return;
  const dirty = dirtyCode(root);
  if (!dirty) return;
  fs.writeFileSync(snapshotFile(input.tool_use_id), JSON.stringify({ root, dirty }));
}

function post(input) {
  const file = snapshotFile(input.tool_use_id);
  if (!fs.existsSync(file)) return;
  const { root, dirty: before } = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.unlinkSync(file);
  const after = dirtyCode(root) || {};
  const changed = Object.keys(after).filter((f) => after[f] !== before[f]);
  if (!changed.length) return;

  const command = String((input.tool_input && input.tool_input.command) || '').slice(0, 300);
  fs.appendFileSync(path.join(root, lib.STATE_DIR, VIOLATIONS_FILE),
    JSON.stringify({ at: new Date().toISOString(), files: changed, command }) + '\n');
  const list = changed.slice(0, 10).join(', ') + (changed.length > 10 ? ` (+${changed.length - 10} more)` : '');
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `MNDX watchdog: that shell command changed code while the gate is CLOSED: ${list}. `
      + 'Writing code through the shell bypasses approval. Revert these changes now (git checkout -- <file> for tracked '
      + 'files, delete new ones) unless they are generated artifacts the approved docs expect, and say which. '
      + 'Recorded in .mndx/violations.log.',
  }));
}

function main() {
  const input = lib.readHookInput();
  if (input.tool_name !== 'Bash' && input.tool_name !== 'PowerShell') return;
  try {
    if (input.hook_event_name === 'PreToolUse') pre(input);
    else if (input.hook_event_name === 'PostToolUse') post(input);
  } catch (err) {
    if (!(err instanceof lib.MndxError)) process.stderr.write(`mndx watchdog: ${err.message}\n`);
  }
}

if (require.main === module) main();

module.exports = { VIOLATIONS_FILE, dirtyCode };
