'use strict';
// End-to-end tests for the MNDX gate, approval hook and CLI. Run: node --test scripts/test
// Hooks are driven exactly as Claude Code drives them: JSON on stdin, decision JSON on stdout.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPTS = path.join(__dirname, '..');

function tmpProject({ mndx = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-test-'));
  if (mndx) run('mndx.js', ['init'], { cwd: dir });
  return dir;
}

function run(script, args, { cwd, stdin } = {}) {
  const res = spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], {
    cwd, input: stdin, encoding: 'utf8',
  });
  return { code: res.status, out: res.stdout, err: res.stderr };
}

const cli = (cwd, ...args) => run('mndx.js', args, { cwd });

function gate(cwd, toolName, toolInput) {
  const res = run('gate.js', [], { cwd, stdin: JSON.stringify({ hook_event_name: 'PreToolUse', cwd, tool_name: toolName, tool_input: toolInput }) });
  assert.equal(res.code, 0, res.err);
  if (!res.out) return { allowed: true };
  const out = JSON.parse(res.out).hookSpecificOutput;
  return { allowed: out.permissionDecision !== 'deny', reason: out.permissionDecisionReason };
}
const edit = (cwd, rel) => gate(cwd, 'Write', { file_path: path.join(cwd, rel), content: 'x' });

function typed(cwd, prompt) {
  const [, name = '', rest = ''] = prompt.match(/^\/([\w:-]+)\s*(.*)$/) || [];
  const res = run('approve.js', [], {
    cwd,
    stdin: JSON.stringify({ hook_event_name: 'UserPromptExpansion', cwd, command_name: name, args: rest ? rest.split(' ') : [], original_prompt: prompt }),
  });
  assert.equal(res.code, 0, res.err);
  return res.out ? JSON.parse(res.out) : {};
}

const state = (cwd) => JSON.parse(fs.readFileSync(path.join(cwd, '.mndx', 'state.json'), 'utf8'));
const itemDir = (cwd) => path.join(cwd, state(cwd).active.dir);

function fill(cwd, doc, body = `# ${doc}\n\n> **Status:** DRAFT\n\n- **AC1** Given x, when y, then z\n- [ ] T1 do it\n`) {
  fs.writeFileSync(path.join(itemDir(cwd), `${doc}.md`), body);
}

test('projects without .mndx are never gated', () => {
  const dir = tmpProject({ mndx: false });
  assert.equal(edit(dir, 'src/app.ts').allowed, true);
});

test('with no active item, code is blocked but docs are writable', () => {
  const dir = tmpProject();
  const res = edit(dir, 'src/app.ts');
  assert.equal(res.allowed, false);
  assert.match(res.reason, /No active MNDX work item/);
  assert.equal(edit(dir, 'docs/PRODUCT.md').allowed, true);
  assert.equal(edit(dir, 'README.md').allowed, true);
});

test('.mndx state can never be edited by tools or the shell', () => {
  const dir = tmpProject();
  assert.equal(edit(dir, '.mndx/state.json').allowed, false);
  assert.equal(gate(dir, 'Bash', { command: 'echo {} > .mndx/state.json' }).allowed, false);
  assert.equal(gate(dir, 'Bash', { command: `node "${SCRIPTS}/mndx.js" status` }).allowed, true);
  assert.equal(gate(dir, 'Bash', { command: 'npm test' }).allowed, true);
});

test('Claude cannot invoke the user-only commands through the Skill tool', () => {
  const dir = tmpProject();
  assert.equal(gate(dir, 'Skill', { skill: 'mndx:approve' }).allowed, false);
  assert.equal(gate(dir, 'Skill', { skill: 'mndx:autopilot' }).allowed, false);
  assert.equal(gate(dir, 'Skill', { skill: 'mndx:status' }).allowed, true);
});

test('full feature flow: spec → approve → plan → approve opens the gate', () => {
  const dir = tmpProject();
  assert.equal(cli(dir, 'new', 'feature', 'User Login!').code, 0);
  assert.equal(state(dir).active.id, '001-user-login');
  assert.ok(fs.existsSync(path.join(itemDir(dir), 'spec.md')));

  // An unfilled template can't be approved.
  assert.equal(typed(dir, '/mndx:approve').decision, 'block');

  fill(dir, 'spec');
  assert.equal(typed(dir, '/mndx:approve plan').decision, 'block', 'plan before spec must be refused');
  const ok = typed(dir, '/mndx:approve');
  assert.equal(ok.decision, undefined);
  assert.match(ok.systemMessage, /Approved spec/);
  assert.equal(state(dir).active.stage, 'plan');
  assert.match(fs.readFileSync(path.join(itemDir(dir), 'spec.md'), 'utf8'), /Status:\*\* APPROVED by you/);
  assert.equal(edit(dir, 'src/login.ts').allowed, false, 'plan not approved yet');

  fill(dir, 'plan');
  typed(dir, '/mndx:approve');
  assert.equal(state(dir).active.stage, 'build');
  assert.equal(edit(dir, 'src/login.ts').allowed, true);
  assert.equal(typed(dir, '/mndx:approve').decision, 'block', 'nothing left to approve');
});

test('ticking plan checkboxes keeps the gate open; changing content closes it', () => {
  const dir = tmpProject();
  cli(dir, 'new', 'feature', 'x');
  fill(dir, 'spec'); typed(dir, '/mndx:approve');
  fill(dir, 'plan'); typed(dir, '/mndx:approve');
  const plan = path.join(itemDir(dir), 'plan.md');

  fs.writeFileSync(plan, fs.readFileSync(plan, 'utf8').replace('- [ ] T1', '- [x] T1').replace(/\n/g, '\r\n'));
  assert.equal(edit(dir, 'src/a.ts').allowed, true);

  fs.appendFileSync(plan, '\n- [ ] T2 sneaky extra scope\n');
  const res = edit(dir, 'src/a.ts');
  assert.equal(res.allowed, false);
  assert.match(res.reason, /changed after it was approved/);

  typed(dir, '/mndx:approve plan');
  assert.equal(edit(dir, 'src/a.ts').allowed, true, 're-approval reopens the gate');
});

test('Claude cannot self-approve without an autopilot grant', () => {
  const dir = tmpProject();
  cli(dir, 'new', 'chore', 'bump deps');
  fill(dir, 'chore');
  const res = cli(dir, 'approve');
  assert.equal(res.code, 1);
  assert.match(res.err, /Only the user can approve/);
  assert.equal(state(dir).active.approvals.chore, undefined);
});

test('autopilot: user grant enables self-approval; any manual /mndx command ends it', () => {
  const dir = tmpProject({ mndx: false });
  const granted = typed(dir, '/mndx:autopilot build a todo app');
  assert.match(granted.systemMessage, /autopilot granted/);
  assert.equal(state(dir).autopilot.goal, 'build a todo app');
  assert.equal(typed(dir, '/mndx:autopilot again').decision, 'block', 'no double grant');

  cli(dir, 'new', 'chore', 'project setup');
  assert.equal(state(dir).active.autopilot, true);
  fill(dir, 'chore');
  const approved = cli(dir, 'approve');
  assert.equal(approved.code, 0, approved.err);
  assert.equal(state(dir).active.approvals.chore.by, 'autopilot');
  assert.equal(edit(dir, 'package.json').allowed, true);

  typed(dir, '/mndx:status');
  assert.ok(state(dir).autopilot, '/mndx:status does not end autopilot');
  typed(dir, '/mndx:spec something else');
  assert.equal(state(dir).autopilot, null, 'user took over');
  assert.equal(cli(dir, 'approve').code, 1);
});

test('autopilot stop and autopilot-end', () => {
  const dir = tmpProject();
  typed(dir, '/mndx:autopilot goal');
  assert.match(typed(dir, '/mndx:autopilot stop').systemMessage, /stopped/);
  assert.equal(state(dir).autopilot, null);
  assert.equal(typed(dir, '/mndx:autopilot').decision, 'block', 'no goal and no active item');

  typed(dir, '/mndx:autopilot goal 2');
  assert.equal(cli(dir, 'autopilot-end', 'completed', 'done').code, 0);
  assert.equal(state(dir).autopilot, null);
  assert.equal(state(dir).history.at(-1).outcome, 'completed');
});

test('lifecycle: one active item, stages need approval, done needs ship', () => {
  const dir = tmpProject();
  cli(dir, 'new', 'fix', 'crash on save');
  assert.equal(cli(dir, 'new', 'feature', 'other').code, 1, 'only one active item');
  assert.equal(cli(dir, 'stage', 'build').code, 1, 'not approved yet');

  fill(dir, 'bug'); typed(dir, '/mndx:approve');
  assert.equal(cli(dir, 'done').code, 1, 'must reach ship first');
  assert.equal(cli(dir, 'stage', 'verify').code, 0);
  assert.equal(cli(dir, 'stage', 'ship').code, 0);
  assert.equal(cli(dir, 'done').code, 0);
  assert.equal(state(dir).active, null);
  assert.equal(edit(dir, 'src/a.ts').allowed, false, 'gate closes after ship');

  cli(dir, 'new', 'feature', 'next');
  assert.equal(state(dir).active.id, '002-next');
  assert.equal(cli(dir, 'abandon', 'changed my mind').code, 0);
  assert.equal(state(dir).history.at(-1).outcome, 'abandoned');
});

test('.scratch/ is always writable, lookalike folders are not', () => {
  const dir = tmpProject();
  assert.equal(edit(dir, '.scratch/repro.test.ts').allowed, true);
  assert.equal(edit(dir, '.scratch/deep/harness.py').allowed, true);
  assert.equal(edit(dir, '.scratchy/sneaky.ts').allowed, false);
  assert.equal(edit(dir, 'src/.scratch/sneaky.ts').allowed, false);
});

test('a corrupt state file fails closed', () => {
  const dir = tmpProject();
  fs.writeFileSync(path.join(dir, '.mndx', 'state.json'), '{ not json');
  const res = edit(dir, 'src/a.ts');
  assert.equal(res.allowed, false);
  assert.match(res.reason, /not valid JSON/);
});
