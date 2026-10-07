'use strict';
// Shell watchdog: code changed by a shell command while the gate is closed is reported and logged.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPTS = path.join(__dirname, '..');
const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-watch-'));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 't@t');
  git(dir, 'config', 'user.name', 't');
  spawnSync(process.execPath, [path.join(SCRIPTS, 'mndx.js'), 'init'], { cwd: dir });
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), '1\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'init');
  return dir;
}

function hook(dir, event, id, command = 'echo hi') {
  const res = spawnSync(process.execPath, [path.join(SCRIPTS, 'watch.js')], { cwd: dir, encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: event, cwd: dir, tool_name: 'Bash', tool_use_id: id, tool_input: { command } }) });
  assert.equal(res.status, 0, res.stderr);
  return res.stdout ? JSON.parse(res.stdout) : null;
}

// Run a "shell command" (here: a function that touches files) between the pre and post hooks.
function shell(dir, id, effect, command) {
  hook(dir, 'PreToolUse', id, command);
  effect();
  return hook(dir, 'PostToolUse', id, command);
}

test('code written by a shell command while the gate is closed is caught and logged', () => {
  const dir = repo();
  const out = shell(dir, 't1', () => {
    fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'hacked\n');
    fs.writeFileSync(path.join(dir, 'src', 'new.js'), 'new\n');
  }, 'echo hacked > src/a.js');
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /src\/a\.js/);
  assert.match(out.reason, /src\/new\.js/);
  const log = fs.readFileSync(path.join(dir, '.mndx', 'violations.log'), 'utf8').trim().split('\n');
  assert.equal(log.length, 1);
  assert.match(JSON.parse(log[0]).command, /echo hacked/);

  const status = spawnSync(process.execPath, [path.join(SCRIPTS, 'mndx.js'), 'status'], { cwd: dir, encoding: 'utf8' });
  assert.match(status.stdout, /Watchdog: 1 shell change/);
});

test('docs, lockfiles, scratch and pre-existing dirty files are not flagged', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'dirty before\n'); // already dirty: not this command's doing
  const out = shell(dir, 't2', () => {
    fs.writeFileSync(path.join(dir, 'README.md'), '# docs\n');
    fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}');
    fs.mkdirSync(path.join(dir, '.scratch'));
    fs.writeFileSync(path.join(dir, '.scratch', 'repro.js'), 'x');
  });
  assert.equal(out, null);
});

test('a command that changes an already-dirty file is still caught', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'dirty before\n');
  const out = shell(dir, 't3', () => fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'changed again\n'));
  assert.equal(out.decision, 'block');
});

test('nothing is watched while the gate is open', () => {
  const dir = repo();
  const mndx = (...a) => spawnSync(process.execPath, [path.join(SCRIPTS, 'mndx.js'), ...a], { cwd: dir, encoding: 'utf8' });
  mndx('new', 'chore', 'gen');
  const state = JSON.parse(fs.readFileSync(path.join(dir, '.mndx', 'state.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, state.active.dir, 'chore.md'), '# c\n\n> **Status:** DRAFT\n\ncodegen\n');
  spawnSync(process.execPath, [path.join(SCRIPTS, 'approve.js')], { cwd: dir, encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'UserPromptExpansion', cwd: dir, command_name: 'mndx:approve', args: [], original_prompt: '/mndx:approve' }) });
  const out = shell(dir, 't4', () => fs.writeFileSync(path.join(dir, 'src', 'gen.js'), 'generated\n'));
  assert.equal(out, null);
});

test('outside MNDX projects the watchdog does nothing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-watch-none-'));
  git(dir, 'init', '-q');
  assert.equal(shell(dir, 't5', () => fs.writeFileSync(path.join(dir, 'x.js'), '1')), null);
});
