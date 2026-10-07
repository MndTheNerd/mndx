'use strict';
// SessionStart hook: context for MNDX projects, a one-time hint for unadopted codebases, silence elsewhere.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPTS = path.join(__dirname, '..');

function run(script, args, cwd, stdin) {
  return spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { cwd, input: stdin, encoding: 'utf8' });
}

function session(cwd) {
  const res = run('session.js', [], cwd, JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', cwd }));
  assert.equal(res.status, 0, res.stderr);
  return res.stdout ? JSON.parse(res.stdout).hookSpecificOutput.additionalContext : null;
}

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-session-'));

test('silent in an empty folder', () => {
  assert.equal(session(tmp()), null);
});

test('hints /mndx:init in an existing codebase not yet in MNDX', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'package.json'), '{}');
  assert.match(session(dir), /\/mndx:init`? would first learn and audit/);

  const py = tmp();
  fs.mkdirSync(path.join(py, 'src'));
  assert.match(session(py), /existing codebase/);
});

test('.mndxignore silences the hint', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'package.json'), '{}');
  fs.writeFileSync(path.join(dir, '.mndxignore'), '');
  assert.equal(session(dir), null);
});

test('MNDX project: next backlog item, then the active item and gate', () => {
  const dir = tmp();
  run('mndx.js', ['init'], dir);
  fs.mkdirSync(path.join(dir, 'docs'));
  fs.writeFileSync(path.join(dir, 'docs', 'BACKLOG.md'), [
    '| # | Item | Kind | Why | Status |', '|---|---|---|---|---|',
    '| 1 | add test runner | chore | ASSESSMENT #2 | done (abc123) |',
    '| 2 | SQL injection in search | fix | ASSESSMENT #1 | todo |',
  ].join('\n'));
  let ctx = session(dir);
  assert.match(ctx, /No active item/);
  assert.match(ctx, /SQL injection in search \(fix\)/);
  assert.match(ctx, /\/mndx:fix/);
  assert.match(ctx, /Code gate: CLOSED/);

  run('mndx.js', ['new', 'fix', 'sql injection'], dir);
  ctx = session(dir);
  assert.match(ctx, /Active item: 001-sql-injection \(fix\)/);
  assert.match(ctx, /stage: bug/);
});

test('works from a subfolder of the project', () => {
  const dir = tmp();
  run('mndx.js', ['init'], dir);
  fs.mkdirSync(path.join(dir, 'src'));
  assert.match(session(path.join(dir, 'src')), /MNDX project/);
});
