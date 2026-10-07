'use strict';
// Release items: gated like any item, and they ship only when the version is consistent in release.md,
// CHANGELOG.md and package.json, on a green, current check.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPTS = path.join(__dirname, '..');
const cli = (cwd, ...args) => {
  const r = spawnSync(process.execPath, [path.join(SCRIPTS, 'mndx.js'), ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
};
const approve = (cwd) => spawnSync(process.execPath, [path.join(SCRIPTS, 'approve.js')], { cwd, encoding: 'utf8',
  input: JSON.stringify({ hook_event_name: 'UserPromptExpansion', cwd, command_name: 'mndx:approve', args: [], original_prompt: '/mndx:approve' }) });
const write = (cwd, rel, text) => fs.writeFileSync(path.join(cwd, rel), text);

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mndx-release-'));
  cli(dir, 'init');
  write(dir, 'CLAUDE.md', '# p\n\n## Quality bar\n| Check | Command |\n|---|---|\n| Test | `node -e "process.exit(0)"` |\n');
  write(dir, 'package.json', JSON.stringify({ name: 'p', version: '1.1.0' }));
  write(dir, 'CHANGELOG.md', '# Changelog\n\n## [Unreleased]\n### Added\n- habits\n\n## [1.1.0] - 2026-09-01\n- x\n');
  assert.equal(cli(dir, 'new', 'release', 'v1.2.0').code, 0);
  const state = JSON.parse(fs.readFileSync(path.join(dir, '.mndx', 'state.json'), 'utf8'));
  return { dir, item: state.active };
}

test('a release is a gated item: code stays locked until release.md is approved', () => {
  const { dir, item } = setup();
  assert.equal(item.kind, 'release');
  assert.match(item.dir, /^docs\/releases\//);
  const gate = spawnSync(process.execPath, [path.join(SCRIPTS, 'gate.js')], { cwd: dir, encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'PreToolUse', cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, 'package.json') } }) });
  assert.match(gate.stdout, /release\.md is still an unfilled template/);
});

test('ships only when the version agrees everywhere', () => {
  const { dir, item } = setup();
  write(dir, path.join(item.dir, 'release.md'), '# r\n\n> **Status:** DRAFT\n> Version: 1.2.0\n\nnotes\n');
  approve(dir);
  assert.equal(cli(dir, 'check').code, 0);
  assert.match(cli(dir, 'stage', 'ship').err, /no "## \[1\.2\.0\] - YYYY-MM-DD" section/);

  write(dir, 'CHANGELOG.md', '# Changelog\n\n## [1.2.0] - 2026-10-07\n### Added\n- habits\n\n## [1.1.0] - 2026-09-01\n');
  assert.match(cli(dir, 'stage', 'ship').err, /fresh empty "## \[Unreleased\]"/);

  write(dir, 'CHANGELOG.md', '# Changelog\n\n## [Unreleased]\n\n## [1.2.0] - 2026-10-07\n### Added\n- habits\n');
  assert.equal(cli(dir, 'check').code, 0);
  assert.match(cli(dir, 'stage', 'ship').err, /package\.json version is 1\.1\.0, but the release is 1\.2\.0/);

  write(dir, 'package.json', JSON.stringify({ name: 'p', version: '1.2.0' }));
  assert.match(cli(dir, 'stage', 'ship').err, /Code changed since the last/, 'manifest edit invalidates the check');
  assert.equal(cli(dir, 'check').code, 0);
  const ok = cli(dir, 'stage', 'ship');
  assert.equal(ok.code, 0, ok.err);
  assert.equal(cli(dir, 'done').code, 0);
});

test('an invalid version line is refused', () => {
  const { dir, item } = setup();
  write(dir, path.join(item.dir, 'release.md'), '# r\n\n> **Status:** DRAFT\n> Version: next\n');
  approve(dir);
  cli(dir, 'check');
  assert.match(cli(dir, 'stage', 'ship').err, /no valid "> Version: x\.y\.z"/);
});
