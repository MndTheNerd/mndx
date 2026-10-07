'use strict';
// `mndx.js check`: runs the project's real quality-bar commands (from CLAUDE.md) and records exit codes plus a
// fingerprint of the code they ran against. Shipping requires a green record that still matches the code, so
// "verified" means the commands actually passed, not that Claude said they did.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const lib = require('./lib');

const CHECKS_FILE = 'checks.json';
const SKIP_ROW = /^(install|setup|run|dev|start|serve|deploy|release)\b/i;
const IGNORED_DIRS = new Set(['.git', 'node_modules', '.mndx', '.scratch', 'docs', 'dist', 'build', 'out', '.next',
  '.expo', '.turbo', '.cache', 'coverage', '.venv', 'venv', '__pycache__', 'target', 'test-results', 'playwright-report']);
// Lockfiles change on install and don't affect what was verified.
const IGNORED_FILES = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|poetry\.lock|uv\.lock|Cargo\.lock|go\.sum)$/;
const TIMEOUT_MS = 15 * 60 * 1000;

const checksPath = (root) => path.join(root, lib.STATE_DIR, CHECKS_FILE);

// Rows of the CLAUDE.md "Quality bar" table: | Check | `command` |. Placeholder (…) and non-check rows are skipped.
function parseQualityBar(root) {
  const file = path.join(root, 'CLAUDE.md');
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const section = text.split(/^##\s+Quality bar\s*$/m)[1];
  if (!section) return [];
  const body = section.split(/^##\s/m)[0];
  const checks = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\|\s*([^|`]+?)\s*\|\s*`([^`]+)`\s*\|/);
    if (!m || SKIP_ROW.test(m[1]) || /…|\.\.\.|<|TODO/i.test(m[2])) continue;
    checks.push({ name: m[1], command: m[2] });
  }
  return checks;
}

function isGitRepo(root) {
  const res = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, encoding: 'utf8' });
  return res.status === 0 && res.stdout.trim() === 'true';
}

// Code files only (no docs, state, scratch, build output, lockfiles), as forward-slash paths.
function codeFiles(root) {
  let files;
  if (isGitRepo(root)) {
    const res = spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    files = res.stdout.split('\0').filter(Boolean);
  } else {
    files = [];
    (function walk(dir, rel) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) { if (!IGNORED_DIRS.has(e.name)) walk(path.join(dir, e.name), rel + e.name + '/'); }
        else files.push(rel + e.name);
      }
    })(root, '');
  }
  return files
    .filter((f) => !f.split('/').some((seg, i, all) => i < all.length - 1 && IGNORED_DIRS.has(seg)))
    .filter((f) => !/\.md$/i.test(f) && !IGNORED_FILES.test(f) && fs.existsSync(path.join(root, f)))
    .sort();
}

function fingerprint(root) {
  const hash = crypto.createHash('sha256');
  for (const f of codeFiles(root)) {
    hash.update(f + '\0');
    hash.update(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex') + '\0');
  }
  return hash.digest('hex');
}

function tail(text, lines = 25) {
  return String(text || '').replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').trimEnd().split(/\r?\n/).slice(-lines).join('\n');
}

function runChecks(root) {
  const checks = parseQualityBar(root);
  if (!checks.length) {
    throw new lib.MndxError('CLAUDE.md has no runnable "## Quality bar" commands (format, lint, typecheck, test, build). Fill them in first.');
  }
  const results = checks.map(({ name, command }) => {
    const start = Date.now();
    const res = spawnSync(command, { cwd: root, shell: true, encoding: 'utf8', timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, CI: '1', FORCE_COLOR: '0' } });
    const code = res.error ? (res.error.code === 'ETIMEDOUT' ? 'timeout' : 'error') : res.status;
    return { name, command, code, ms: Date.now() - start, tail: tail(`${res.stdout || ''}\n${res.stderr || ''}`) };
  });
  const record = { at: new Date().toISOString(), fingerprint: fingerprint(root), results };
  fs.writeFileSync(checksPath(root), JSON.stringify(record, null, 2) + '\n');
  return record;
}

function formatRecord(record) {
  const lines = record.results.map((r) => `${r.code === 0 ? '✅' : '❌'} ${r.name.padEnd(12)} ${String(r.code).padStart(7)}  ${(r.ms / 1000).toFixed(1)}s  ${r.command}`);
  const failed = record.results.filter((r) => r.code !== 0);
  for (const f of failed) lines.push('', `── ${f.name} output (tail) ──`, f.tail || '(no output)');
  lines.push('', failed.length ? `${failed.length} check(s) failed.` : `All ${record.results.length} checks passed. Recorded in .mndx/${CHECKS_FILE}.`);
  return lines.join('\n');
}

function readRecord(root) {
  const file = checksPath(root);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// Section of a markdown doc under "## <title>", without HTML comments, table rules or headers.
function sectionContent(text, title) {
  const part = text.split(new RegExp(`^##\\s+${title}\\s*$`, 'm'))[1];
  if (!part) return '';
  return part.split(/^##\s/m)[0].replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^\|?[\s|:-]+\|?$/.test(l) && !/^\|\s*(Flow|AC|Check|Step)\b/i.test(l))
    .join('\n');
}

// Everything that must be true before an item may ship. Returns null when ready, else the reason.
function shipBlocker(root, item) {
  const record = readRecord(root);
  if (!record) return 'No quality-bar run recorded. Run `mndx.js check`.';
  const failed = record.results.filter((r) => r.code !== 0);
  if (failed.length) return `Quality bar failed: ${failed.map((r) => r.name).join(', ')}. Fix, then run \`mndx.js check\` again.`;
  if (!record.results.some((r) => /test/i.test(r.name))) return 'The quality bar has no Test command. Add one to CLAUDE.md.';
  const approvedAt = Object.values(item.approvals || {}).map((a) => a.at).sort().pop();
  if (approvedAt && record.at < approvedAt) return 'The recorded checks are older than this item\'s approval. Run `mndx.js check`.';
  if (record.fingerprint !== fingerprint(root)) return 'Code changed since the last `mndx.js check`. Run it again.';

  if (item.kind === 'chore') return null;
  const verifyFile = path.join(root, item.dir, 'verify.md');
  if (!fs.existsSync(verifyFile)) return `${item.dir}/verify.md is missing. Run /mndx:verify.`;
  const verify = fs.readFileSync(verifyFile, 'utf8');
  if (verify.includes(lib.TEMPLATE_MARKER)) return 'verify.md is still an unfilled template.';
  const verdict = sectionContent(verify, 'Verdict');
  if (!/\bPASS\b/.test(verdict) || /\bFAIL\b/.test(verdict)) return 'verify.md\'s "## Verdict" is not PASS.';
  if (!sectionContent(verify, 'Live run')) return 'verify.md has no "## Live run" evidence (the app was not exercised for real).';
  return null;
}

module.exports = { CHECKS_FILE, parseQualityBar, codeFiles, fingerprint, runChecks, formatRecord, readRecord, sectionContent, shipBlocker, isGitRepo };
