'use strict';
// `mndx.js check` and the ship rules: shipping needs a real, green, current quality-bar run, a PASS verdict and
// live-run evidence. Claims in docs alone are not enough.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const check = require('../check');

const SCRIPTS = path.join(__dirname, '..');
const OK = 'node -e "process.exit(0)"';
const FAIL = 'node -e "console.error(\'2 tests failed\'); process.exit(1)"';

function cli(cwd, ...args) {
  const res = spawnSync(process.execPath, [path.join(SCRIPTS, 'mndx.js'), ...args], { cwd, encoding: 'utf8' });
  return { code: res.status, out: res.stdout, err: res.stderr };
}
function approve(cwd) {
  const res = spawnSync(process.execPath, [path.join(SCRIPTS, 'approve.js')], { cwd, encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'UserPromptExpansion', cwd, command_name: 'mndx:approve', args: [], original_prompt: '/mndx:approve' }) });
  assert.equal(res.status, 0, res.stderr);
}
const state = (cwd) => JSON.parse(fs.readFileSync(path.join(cwd, '.mndx', 'state.json'), 'utf8'));

function qualityBar(cwd, rows) {
  const table = rows.map(([n, c]) => `| ${n} | \`${c}\` |`).join('\n');
  fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), `# App\n\n## Quality bar\n| Check | Command |\n|---|---|\n${table}\n\n## Conventions\n- x\n`);
}

// A fix item approved and at stage verify, with code in src/.
function fixAtVerify() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-check-'));
  cli(dir, 'init');
  cli(dir, 'new', 'fix', 'crash');
  const item = path.join(dir, state(dir).active.dir);
  fs.writeFileSync(path.join(item, 'bug.md'), '# bug\n\n> **Status:** DRAFT\n\nroot cause: x\n');
  approve(dir);
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'module.exports = 1;\n');
  assert.equal(cli(dir, 'stage', 'verify').code, 0);
  return { dir, item };
}
function verifyDoc(item, { verdict = 'PASS', live = true } = {}) {
  fs.writeFileSync(path.join(item, 'verify.md'), [
    '# v', '', '## Live run', '<!-- comment only -->', '| Flow | Steps | Observed | Evidence |', '|---|---|---|---|',
    live ? '| AC1 | clicked save | saved | evidence/a.png |' : '', '', '## Verdict', '<!-- PASS or FAIL -->', verdict, '',
  ].join('\n'));
}

test('parses the CLAUDE.md quality bar, skipping install/run rows and placeholders', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-qb-'));
  qualityBar(dir, [['Install', 'pnpm i'], ['Format', 'pnpm format:check'], ['Lint', '…'], ['Test', 'pnpm test'], ['Run (dev)', 'pnpm dev']]);
  assert.deepEqual(check.parseQualityBar(dir).map((c) => c.name), ['Format', 'Test']);
});

test('check runs the real commands and records exit codes', () => {
  const { dir } = fixAtVerify();
  qualityBar(dir, [['Lint', OK], ['Test', FAIL]]);
  const res = cli(dir, 'check');
  assert.equal(res.code, 1);
  assert.match(res.err, /❌ Test/);
  assert.match(res.err, /2 tests failed/, 'failing output is shown');
  const record = check.readRecord(dir);
  assert.deepEqual(record.results.map((r) => r.code), [0, 1]);
});

test('ship is refused until check is green, current, and verify.md is PASS with a live run', () => {
  const { dir, item } = fixAtVerify();
  qualityBar(dir, [['Lint', OK], ['Test', FAIL]]);
  cli(dir, 'check');
  assert.match(cli(dir, 'stage', 'ship').err, /Quality bar failed: Test/);

  qualityBar(dir, [['Lint', OK], ['Test', OK]]);
  assert.equal(cli(dir, 'check').code, 0);
  assert.match(cli(dir, 'stage', 'ship').err, /verify\.md is still an unfilled template/);

  verifyDoc(item, { verdict: 'FAIL' });
  assert.match(cli(dir, 'stage', 'ship').err, /Verdict.*not PASS/);

  verifyDoc(item, { live: false });
  assert.match(cli(dir, 'stage', 'ship').err, /no "## Live run" evidence/);

  verifyDoc(item);
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'module.exports = 2; // changed after check\n');
  assert.match(cli(dir, 'stage', 'ship').err, /Code changed since the last/);

  assert.equal(cli(dir, 'check').code, 0);
  const ok = cli(dir, 'stage', 'ship');
  assert.equal(ok.code, 0, ok.err);
  assert.equal(cli(dir, 'done').code, 0);
});

test('docs, lockfiles and scratch files do not invalidate a check', () => {
  const { dir, item } = fixAtVerify();
  qualityBar(dir, [['Test', OK]]);
  verifyDoc(item);
  cli(dir, 'check');
  fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}');
  fs.mkdirSync(path.join(dir, '.scratch'));
  fs.writeFileSync(path.join(dir, '.scratch', 'repro.js'), '1');
  fs.appendFileSync(path.join(item, 'verify.md'), '\nmore notes\n');
  assert.equal(cli(dir, 'stage', 'ship').code, 0);
});

test('a quality bar without a Test command cannot ship', () => {
  const { dir, item } = fixAtVerify();
  qualityBar(dir, [['Lint', OK]]);
  verifyDoc(item);
  cli(dir, 'check');
  assert.match(cli(dir, 'stage', 'ship').err, /no Test command/);
});

test('check needs runnable commands', () => {
  const { dir } = fixAtVerify();
  qualityBar(dir, [['Lint', '…']]);
  assert.match(cli(dir, 'check').err, /no runnable/);
});

test('chores ship on a green check without verify.md', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-chore-'));
  cli(dir, 'init');
  cli(dir, 'new', 'chore', 'bump');
  fs.writeFileSync(path.join(dir, state(dir).active.dir, 'chore.md'), '# c\n\n> **Status:** DRAFT\n\nbump deps\n');
  approve(dir);
  qualityBar(dir, [['Test', OK]]);
  assert.equal(cli(dir, 'check').code, 0);
  assert.equal(cli(dir, 'stage', 'ship').code, 0);
});
