'use strict';
// Plan-scope warnings: edits outside the approved plan's Files table are flagged (never blocked) and logged.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const scope = require('../scope');

const SCRIPTS = path.join(__dirname, '..');
const node = (script, args, cwd, input) => spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { cwd, input, encoding: 'utf8' });

const PLAN = `# Plan

> **Status:** DRAFT

## Changes
### Files
| File | Change |
|---|---|
| \`src/domain/habits.ts\` | new |
| \`src/ui/\` | new components |
| \`src/**/*.css\` | styles |
| \`AddHabitForm.tsx\`, \`vite.config.ts\` | form; config |

## Tasks
- [ ] T1
`;

test('parses backticked paths from the Files table, several per cell', () => {
  assert.deepEqual(scope.plannedFiles(PLAN), ['src/domain/habits.ts', 'src/ui/', 'src/**/*.css', 'AddHabitForm.tsx', 'vite.config.ts']);
  assert.equal(scope.plannedFiles('# no files table'), null);
});

test('exact paths, folders, globs and bare filenames cover files; tests/docs/lockfiles always do', () => {
  const e = scope.plannedFiles(PLAN);
  for (const f of ['src/domain/habits.ts', 'src/ui/Notice.tsx', 'src/app/x/deep.css', 'src/forms/AddHabitForm.tsx', 'vite.config.ts',
    'src/domain/habits.test.ts', 'tests/e2e/login.spec.ts', 'README.md', 'package-lock.json', '.scratch/x.js']) {
    assert.equal(scope.inScope(e, f), true, f);
  }
  for (const f of ['src/domain/dates.ts', 'src/App.tsx', 'server/index.js', 'package.json']) {
    assert.equal(scope.inScope(e, f), false, f);
  }
});

test('hook warns (does not block) on an out-of-plan edit of an approved feature, and logs it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-scope-'));
  node('mndx.js', ['init'], dir);
  node('mndx.js', ['new', 'feature', 'habits'], dir);
  const state = JSON.parse(fs.readFileSync(path.join(dir, '.mndx', 'state.json'), 'utf8'));
  const item = path.join(dir, state.active.dir);
  fs.writeFileSync(path.join(item, 'spec.md'), '# s\n\n> **Status:** DRAFT\n\nAC1\n');
  fs.writeFileSync(path.join(item, 'plan.md'), PLAN);
  for (let i = 0; i < 2; i++) {
    node('approve.js', [], dir, JSON.stringify({ hook_event_name: 'UserPromptExpansion', cwd: dir, command_name: 'mndx:approve', args: [], original_prompt: '/mndx:approve' }));
  }
  const hook = (rel) => {
    const res = node('scopehook.js', [], dir, JSON.stringify({ hook_event_name: 'PostToolUse', cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, rel) } }));
    assert.equal(res.status, 0, res.stderr);
    return res.stdout ? JSON.parse(res.stdout).hookSpecificOutput : null;
  };
  assert.equal(hook('src/ui/Row.tsx'), null);
  const warn = hook('src/App.tsx');
  assert.equal(warn.hookEventName, 'PostToolUse');
  assert.match(warn.additionalContext, /src\/App\.tsx is not in 001-habits's plan/);
  hook('src/App.tsx');
  assert.deepEqual(scope.outOfScope(dir, '001-habits'), ['src/App.tsx']);
});

test('items without a plan Files table, and non-MNDX folders, are not checked', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-scope-none-'));
  const res = node('scopehook.js', [], dir, JSON.stringify({ hook_event_name: 'PostToolUse', cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, 'x.js') } }));
  assert.equal(res.stdout, '');
});
