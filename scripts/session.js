#!/usr/bin/env node
'use strict';
// SessionStart hook. Gives Claude MNDX context from the first message:
// - in an MNDX project: active item, stage, gate, autopilot, next backlog item
// - in an existing codebase not yet in MNDX: a one-time hint that /mndx:init would learn and assess it
// - anywhere else (or with a .mndxignore file): nothing

const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require('./lib');

const CODEBASE_MARKERS = ['package.json', 'pyproject.toml', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml',
  'build.gradle', 'build.gradle.kts', 'pubspec.yaml', 'composer.json', 'Gemfile', 'mix.exs', 'deno.json'];
const CODEBASE_DIRS = ['src', 'app', 'lib', 'cmd', 'internal'];

function looksLikeCodebase(dir) {
  if (path.resolve(dir) === path.resolve(os.homedir())) return false;
  if (CODEBASE_MARKERS.some((f) => fs.existsSync(path.join(dir, f)))) return true;
  try {
    if (fs.readdirSync(dir).some((f) => /\.(sln|csproj)$/i.test(f))) return true;
  } catch { return false; }
  return CODEBASE_DIRS.some((d) => {
    try { return fs.statSync(path.join(dir, d)).isDirectory(); } catch { return false; }
  });
}

// First `todo` row of docs/BACKLOG.md: | # | Item | Kind | Why | Status |
function nextBacklogItem(root) {
  const file = path.join(root, 'docs', 'BACKLOG.md');
  if (!fs.existsSync(file)) return null;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length >= 5 && /^\d+$/.test(cells[0]) && /^todo$/i.test(cells[cells.length - 1]) && cells[1] !== '…') {
      return { item: cells[1], kind: cells[2] };
    }
  }
  return null;
}

function projectContext(root) {
  const state = lib.readState(root);
  const gate = lib.gateStatus(root, state);
  const lines = ['MNDX project (follow the mndx:workflow rules: route every task, docs before code, only the user approves).'];
  if (state.active) {
    const a = state.active;
    lines.push(`Active item: ${a.id} (${a.kind}) "${a.title}", stage: ${a.stage}, docs in ${a.dir}.`);
  } else {
    lines.push('No active item.');
    const next = nextBacklogItem(root);
    if (next) lines.push(`Next in docs/BACKLOG.md: ${next.item} (${next.kind}), so suggest /mndx:${next.kind === 'feature' ? 'spec' : next.kind} for it.`);
  }
  lines.push(`Code gate: ${gate.open ? 'OPEN' : 'CLOSED'}. ${gate.reason}${gate.next ? ' ' + gate.next : ''}`);
  if (state.autopilot && state.autopilot.active) lines.push(`Autopilot is ON for: "${state.autopilot.goal}".`);
  return lines.join('\n');
}

const UNADOPTED_HINT = 'This folder contains an existing codebase that is not set up with MNDX. If the user asks for '
  + 'changes, mention once, in one line, that `/mndx:init` would first learn and audit this project, then let them '
  + 'choose to rebuild it properly, fix what needs fixing, or keep it as-is. Don\'t repeat it, and don\'t hold up their request.';

function main() {
  const input = lib.readHookInput();
  const cwd = input.cwd || process.cwd();
  if (fs.existsSync(path.join(cwd, '.mndxignore'))) return;
  let context = null;
  try {
    const root = lib.findRoot(cwd);
    if (root) context = projectContext(root);
    else if (looksLikeCodebase(cwd)) context = UNADOPTED_HINT;
  } catch (err) {
    if (!(err instanceof lib.MndxError)) throw err;
    context = `MNDX: ${err.message}`;
  }
  if (context) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context } }));
  }
}

main();
