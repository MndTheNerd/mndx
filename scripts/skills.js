'use strict';
// Community skills from the open skills ecosystem (skills.sh), installed globally for Claude Code
// through the `npx skills` CLI so that `npx skills update` keeps them current.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { MndxError } = require('./lib');

const MANIFEST = path.join(__dirname, '..', 'config', 'skills.json');
const GROUPS = ['core', 'security', 'payments', 'ops', 'web', 'mobile', 'backend'];
// skills.sh collects anonymous telemetry by default; MNDX opts out.
const NPX_ENV = { ...process.env, DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1' };

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).skills;
}

// Where Claude Code looks for user and project skills.
function skillDirs(cwd) {
  return [path.join(os.homedir(), '.claude', 'skills'), path.join(cwd, '.claude', 'skills')];
}

function isInstalled(name, cwd) {
  return skillDirs(cwd).some((dir) => fs.existsSync(path.join(dir, name, 'SKILL.md')));
}

function selectGroups(args) {
  const groups = args.length === 0 || args.includes('all') ? GROUPS : args;
  const unknown = groups.filter((g) => !GROUPS.includes(g));
  if (unknown.length) throw new MndxError(`Unknown group(s): ${unknown.join(', ')} (expected: ${GROUPS.join(', ')}, all).`);
  return groups;
}

function list(cwd) {
  const skills = loadManifest();
  const lines = [];
  for (const group of GROUPS) {
    lines.push(`${group}:`);
    for (const s of skills.filter((x) => x.group === group)) {
      const mark = isInstalled(s.name, cwd) ? '✓' : '·';
      lines.push(`  ${mark} ${s.name.padEnd(36)} ${s.repo.padEnd(44)} ${s.use}`);
    }
  }
  const missing = skills.filter((s) => !isInstalled(s.name, cwd)).length;
  lines.push('', missing ? `${missing} not installed. Run: mndx.js skills install [${GROUPS.join('|')}|all]` : 'All recommended skills are installed.');
  return lines.join('\n');
}

function npxSkills(args) {
  const res = spawnSync('npx', ['-y', 'skills@latest', ...args], {
    env: NPX_ENV, stdio: 'inherit', shell: process.platform === 'win32',
  });
  if (res.error) throw new MndxError(`Could not run npx: ${res.error.message}`);
  return res.status === 0;
}

// One `npx skills add` per source repo, global scope, Claude Code only, no prompts.
function install(cwd, args) {
  const groups = selectGroups(args);
  const byRepo = new Map();
  for (const s of loadManifest().filter((x) => groups.includes(x.group))) {
    if (!byRepo.has(s.repo)) byRepo.set(s.repo, []);
    byRepo.get(s.repo).push(s.name);
  }
  const failed = [];
  for (const [repo, names] of byRepo) {
    if (!npxSkills(['add', repo, '-g', '-a', 'claude-code', '-y', '-s', ...names])) failed.push(repo);
  }
  const summary = list(cwd);
  if (failed.length) throw new MndxError(`Install failed for: ${failed.join(', ')}\n\n${summary}`);
  return summary;
}

function update(cwd) {
  if (!npxSkills(['update', '-g', '-y'])) throw new MndxError('npx skills update failed (see output above).');
  return list(cwd);
}

module.exports = { MANIFEST, GROUPS, loadManifest, isInstalled, selectGroups, list, install, update };
