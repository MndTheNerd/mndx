'use strict';
// First-pass concern router: maps a task written in plain language to the production concerns it
// touches, each with its MNDX checklist and community skills. Deterministic keyword matching only.
// Claude reviews the result with judgment (the route skill) before it goes into the spec.

const fs = require('fs');
const path = require('path');
const skills = require('./skills');

const CONCERNS_FILE = path.join(__dirname, '..', 'config', 'concerns.json');
const CHECKLIST_DIR = path.join(__dirname, '..', 'skills', 'concerns');
const UI_CONCERNS = new Set(['ux', 'frontend-web', 'mobile']);

function loadConcerns() {
  return JSON.parse(fs.readFileSync(CONCERNS_FILE, 'utf8'));
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole-word (or whole-phrase) match, case-insensitive; "-" and "/" count as word separators.
function matches(text, trigger) {
  return new RegExp(`(^|[^a-z0-9])${escape(trigger.toLowerCase())}($|[^a-z0-9])`).test(text);
}

function route(task, { cwd = process.cwd(), ui = false } = {}) {
  const text = ` ${String(task).toLowerCase()} `;
  const { concerns, builtinSkills = [] } = loadConcerns();
  const hits = new Map();
  for (const c of concerns) {
    const matched = c.triggers.filter((t) => matches(text, t));
    if (matched.length) hits.set(c.id, matched);
  }
  // Follow `implies` links transitively (auth → privacy, payments → security + privacy + messaging, …).
  const impliedBy = new Map();
  const queue = [...hits.keys()];
  while (queue.length) {
    const id = queue.shift();
    const concern = concerns.find((c) => c.id === id);
    for (const target of (concern && concern.implies) || []) {
      if (hits.has(target) || impliedBy.has(target)) continue;
      impliedBy.set(target, id);
      queue.push(target);
    }
  }
  const active = new Set([...hits.keys(), ...impliedBy.keys()]);
  const hasUi = ui || [...active].some((id) => UI_CONCERNS.has(id));

  const result = [];
  for (const c of concerns) {
    let reason = null;
    if (hits.has(c.id)) reason = `mentions: ${hits.get(c.id).join(', ')}`;
    else if (impliedBy.has(c.id)) reason = `implied by ${impliedBy.get(c.id)}`;
    else if (c.always === true) reason = 'always applies';
    else if (c.always === 'ui' && hasUi) reason = 'applies to anything with a UI';
    if (!reason) continue;
    result.push({
      id: c.id,
      title: c.title,
      reason,
      checklist: c.checklist ? path.join(CHECKLIST_DIR, c.checklist) : null,
      skills: c.skills.map((name) => ({
        name,
        installed: builtinSkills.includes(name) || skills.isInstalled(name, cwd),
      })),
    });
  }
  return result;
}

function format(routed) {
  const lines = ['Concerns (first pass, so review with judgment):'];
  for (const r of routed) {
    lines.push(`- ${r.title} [${r.id}]: ${r.reason}`);
    if (r.checklist) lines.push(`    checklist: ${r.checklist}`);
    if (r.skills.length) {
      lines.push(`    skills: ${r.skills.map((s) => (s.installed ? s.name : `${s.name} (not installed)`)).join(', ')}`);
    }
  }
  const missing = routed.flatMap((r) => r.skills).filter((s) => !s.installed);
  if (missing.length) lines.push('', 'Some skills are missing. Install them with: mndx.js skills install');
  return lines.join('\n');
}

module.exports = { CONCERNS_FILE, CHECKLIST_DIR, loadConcerns, matches, route, format };
