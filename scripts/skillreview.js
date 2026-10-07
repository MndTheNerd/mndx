'use strict';
// Reviewed skill updates: snapshot the installed skills before `npx skills update`, then report exactly what
// changed and scan the changed text for risky instructions. A flagged update can be rolled back from the snapshot.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Instruction patterns that deserve a human look when they appear in an updated skill.
const RISKY = [
  { id: 'push/deploy', re: /\bgit\s+push\b|--force\b|\bdeploy(?:ing)?\b.*\b(prod|production)\b|vercel\s+--prod/i },
  { id: 'remote script', re: /\b(curl|wget|iwr|Invoke-WebRequest)\b[^\n|]*\|\s*(ba|z)?sh\b|\biex\b/i },
  { id: 'instruction override', re: /ignore (all |any )?(previous|prior|above) instructions|disregard (the )?(system|user)|you (must|should) not tell the user/i },
  { id: 'exfiltration', re: /\b(send|upload|post)\b[^\n]{0,40}\b(token|secret|credential|api[_ -]?key|\.env|ssh key)s?\b/i },
  { id: 'destructive', re: /\brm\s+-r[f]?\s+[~/]|\bdel\s+\/s\b|drop\s+(database|table)\b|format\s+[a-z]:/i },
  { id: 'permission change', re: /allowed-tools:|disable-model-invocation|bypassPermissions|--dangerously/i },
];

const skillsHome = () => process.env.MNDX_SKILLS_HOME || path.join(os.homedir(), '.claude', 'skills');
const snapshotsHome = () => process.env.MNDX_SNAPSHOTS_HOME || path.join(os.homedir(), '.claude', 'mndx-skill-snapshots');

function walk(dir, base = dir, out = {}) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const stat = fs.statSync(p); // follows symlinks: skills may be linked from a central store
    if (stat.isDirectory()) walk(p, base, out);
    else out[path.relative(base, p).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  }
  return out;
}

/** Copy the named installed skills into a timestamped snapshot. Returns its id. */
function snapshot(names, now = new Date()) {
  const id = now.toISOString().replace(/[:.]/g, '-');
  const dest = path.join(snapshotsHome(), id);
  fs.mkdirSync(dest, { recursive: true });
  const present = [];
  for (const name of names) {
    const src = path.join(skillsHome(), name);
    if (!fs.existsSync(src)) continue;
    fs.cpSync(src, path.join(dest, name), { recursive: true, dereference: true });
    present.push(name);
  }
  fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify({ at: now.toISOString(), skills: present }, null, 2));
  return id;
}

/** Per-skill added/removed/changed files between a snapshot and what's installed now, with risky findings in new text. */
function diff(id) {
  const dir = path.join(snapshotsHome(), id);
  const { skills } = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const report = [];
  for (const name of skills) {
    const before = walk(path.join(dir, name));
    const after = walk(path.join(skillsHome(), name));
    const added = Object.keys(after).filter((f) => !(f in before));
    const removed = Object.keys(before).filter((f) => !(f in after));
    const changed = Object.keys(after).filter((f) => f in before && before[f] !== after[f]);
    if (!added.length && !removed.length && !changed.length) continue;
    const flags = [];
    for (const f of [...added, ...changed]) {
      const oldText = before[f] ? fs.readFileSync(path.join(dir, name, f), 'utf8') : '';
      const oldLines = new Set(oldText.split(/\r?\n/));
      const newText = fs.readFileSync(path.join(skillsHome(), name, f), 'utf8');
      newText.split(/\r?\n/).forEach((line, i) => {
        if (oldLines.has(line)) return; // only judge lines the update introduced
        for (const r of RISKY) if (r.re.test(line)) flags.push({ file: f, line: i + 1, kind: r.id, text: line.trim().slice(0, 140) });
      });
      if (/\.(sh|ps1|py|js|mjs|cjs|ts|exe|bat|cmd)$/i.test(f) && added.includes(f)) {
        flags.push({ file: f, line: 0, kind: 'new executable', text: 'new script added by the update' });
      }
    }
    report.push({ name, added, removed, changed, flags });
  }
  return report;
}

function formatReport(id, report) {
  if (!report.length) return `No skill content changed (snapshot ${id}).`;
  const lines = [`Skill updates (snapshot ${id}):`];
  for (const s of report) {
    lines.push(`  ${s.flags.length ? '⚠' : '✓'} ${s.name}: ${s.changed.length} changed, ${s.added.length} added, ${s.removed.length} removed`);
    for (const f of s.flags) lines.push(`      ⚠ ${f.kind} — ${f.file}${f.line ? ':' + f.line : ''}: ${f.text}`);
  }
  const flagged = report.filter((s) => s.flags.length);
  lines.push('', flagged.length
    ? `${flagged.length} skill(s) need a look. Read the flagged lines; to undo: mndx.js skills rollback ${id} [${flagged.map((s) => s.name).join(' ')}]`
    : 'Nothing risky in the new text. Skim the changed files if you like; they are already active.');
  return lines.join('\n');
}

/** Restore skills from a snapshot (all of them, or the named ones). */
function rollback(id, names = []) {
  const dir = path.join(snapshotsHome(), id);
  if (!fs.existsSync(path.join(dir, 'manifest.json'))) throw new Error(`No snapshot "${id}" in ${snapshotsHome()}.`);
  const { skills } = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const targets = names.length ? names : skills;
  for (const name of targets) {
    if (!skills.includes(name)) throw new Error(`Snapshot ${id} doesn't contain "${name}".`);
    const live = path.join(skillsHome(), name);
    fs.rmSync(live, { recursive: true, force: true });
    fs.cpSync(path.join(dir, name), live, { recursive: true });
  }
  return targets;
}

function latestSnapshot() {
  if (!fs.existsSync(snapshotsHome())) return null;
  return fs.readdirSync(snapshotsHome()).filter((d) => fs.existsSync(path.join(snapshotsHome(), d, 'manifest.json'))).sort().pop() || null;
}

module.exports = { RISKY, skillsHome, snapshot, diff, formatReport, rollback, latestSnapshot };
