#!/usr/bin/env node
'use strict';
// PreToolUse hook: the MNDX hard gate.
// - Edit/Write/MultiEdit/NotebookEdit: outside docs (*.md), files can only change while the active
//   item's docs are approved and unchanged since approval. .mndx/** is never editable.
// - Bash: commands that touch .mndx/ directly are blocked (state changes go through mndx.js).
// - Skill: Claude may not invoke the user-only approval commands.
// Projects without .mndx/state.json are not affected.

const fs = require('fs');
const path = require('path');
const lib = require('./lib');

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const USER_ONLY_SKILLS = /^mndx:(approve|autopilot)$/;

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `MNDX gate: ${reason}` },
  }));
  process.exit(0);
}

function isInside(root, file) {
  const rel = path.relative(root, file);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function checkEdit(input) {
  const target = input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path);
  if (!target) return;
  const file = path.resolve(input.cwd || process.cwd(), target);
  // Nearest MNDX project that contains the file; fall back to the session's project.
  const root = lib.findRoot(path.dirname(file)) || lib.findRoot(input.cwd || process.cwd());
  if (!root || !isInside(root, file)) return;

  const rel = path.relative(root, file);
  const top = rel.split(path.sep)[0];
  if (top === lib.STATE_DIR) {
    deny('.mndx/ is managed by MNDX. Use the mndx.js CLI; approvals come only from the user typing /mndx:approve.');
  }
  if (path.extname(file).toLowerCase() === '.md') return; // docs are always writable
  if (top === lib.SCRATCH_DIR) return; // git-ignored throwaway repros and prototypes, never shipped

  const gate = lib.gateStatus(root, lib.readState(root));
  if (!gate.open) deny(`cannot edit ${rel.split(path.sep).join('/')}. ${gate.reason} ${gate.next}`);
}

// Any shell command naming .mndx/ is blocked, wherever it runs (a `cd` inside the command can reach a
// project the session isn't in). Exceptions: the MNDX CLI itself, and git, which ship uses to commit the state.
function checkBash(input) {
  const command = (input.tool_input && input.tool_input.command) || '';
  if (!/\.mndx[\\/]/.test(command)) return;
  if (/mndx\.js/.test(command) || /^\s*git\s+(add|commit|status|diff|log|show)\b/.test(command)) return;
  deny('do not touch .mndx/ from the shell. Read state with `mndx.js status --json`; change it with the mndx.js CLI.');
}

function checkSkill(input) {
  const name = (input.tool_input && (input.tool_input.skill || input.tool_input.command || input.tool_input.name)) || '';
  if (USER_ONLY_SKILLS.test(String(name).replace(/^\//, ''))) {
    deny(`${name} can only be typed by the user. Ask them to run it.`);
  }
}

function main() {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  try {
    if (EDIT_TOOLS.has(input.tool_name)) checkEdit(input);
    else if (input.tool_name === 'Bash' || input.tool_name === 'PowerShell') checkBash(input);
    else if (input.tool_name === 'Skill') checkSkill(input);
  } catch (err) {
    // Fail closed on a broken state file: the gate must not silently open.
    if (err instanceof lib.MndxError) deny(err.message);
    throw err;
  }
}

main();
