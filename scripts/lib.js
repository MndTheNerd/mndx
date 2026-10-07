'use strict';
// Shared MNDX state logic used by the CLI (mndx.js) and the hooks (gate.js, approve.js).
// No dependencies: plain Node >= 18.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STATE_DIR = '.mndx';
const STATE_FILE = 'state.json';
// Always writable, git-ignored: bug repro harnesses and throwaway prototypes before approval.
const SCRATCH_DIR = '.scratch';
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
// Left in a copied template until Claude fills it in; a doc that still has it can't be approved.
const TEMPLATE_MARKER = '<!-- mndx:template -->';
const STATUS_LINE = /^>\s*\*\*Status:\*\*.*$/m;

// Each kind of work item: which docs need approval (in order), which templates get copied, where it lives.
const KINDS = {
  feature: { docs: ['spec', 'plan'], templates: ['spec.md', 'plan.md', 'verify.md'], folder: 'features' },
  fix: { docs: ['bug'], templates: ['bug.md', 'verify.md'], folder: 'fixes' },
  chore: { docs: ['chore'], templates: ['chore.md'], folder: 'chores' },
  release: { docs: ['release'], templates: ['release.md'], folder: 'releases' },
};
const POST_APPROVAL_STAGES = ['build', 'verify', 'ship'];

class MndxError extends Error {}

// Hook input from stdin. Tolerates a UTF-8 BOM (Windows PowerShell adds one when piping) and empty input.
function readHookInput() {
  const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, '').trim();
  return raw ? JSON.parse(raw) : {};
}

function statePath(root) {
  return path.join(root, STATE_DIR, STATE_FILE);
}

// Walk up from `startDir` to the nearest directory that holds .mndx/state.json.
function findRoot(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(statePath(dir))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function emptyState() {
  return { version: 1, counter: 0, active: null, autopilot: null, history: [] };
}

function readState(root) {
  const raw = fs.readFileSync(statePath(root), 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    throw new MndxError(`${statePath(root)} is not valid JSON. Fix or delete it by hand (Claude is not allowed to).`);
  }
}

// Atomic write so a crash mid-write can't leave a half-written state file.
function writeState(root, state) {
  const file = statePath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n');
  fs.renameSync(tmp, file);
}

function initState(root) {
  if (!fs.existsSync(statePath(root))) writeState(root, emptyState());
  return readState(root);
}

// Hash of a doc's content, ignoring line endings, trailing whitespace, the Status line (approval
// rewrites it) and checkbox state (build ticks tasks off), none of which change what was approved.
function docHash(text) {
  const normalized = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => !STATUS_LINE.test(line))
    .map((line) => line.trimEnd().replace(/^(\s*[-*]\s+)\[[xX ]\]/, '$1[ ]'))
    .join('\n')
    .trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function docFile(root, item, doc) {
  return path.join(root, item.dir, `${doc}.md`);
}

// For each doc the item needs approved: missing | template | unapproved | stale | approved.
function approvalStatus(root, item) {
  return KINDS[item.kind].docs.map((doc) => {
    const file = docFile(root, item, doc);
    if (!fs.existsSync(file)) return { doc, state: 'missing', file };
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes(TEMPLATE_MARKER)) return { doc, state: 'template', file };
    const approval = item.approvals && item.approvals[doc];
    if (!approval) return { doc, state: 'unapproved', file };
    if (approval.sha !== docHash(text)) return { doc, state: 'stale', file };
    return { doc, state: 'approved', file };
  });
}

function nextCommandFor(item, doc) {
  if (doc === 'spec') return '/mndx:spec';
  if (doc === 'plan') return '/mndx:plan';
  if (item.kind === 'release') return '/mndx:release';
  return item.kind === 'fix' ? '/mndx:fix' : '/mndx:chore';
}

// Whether non-doc files may be edited right now, and if not, why and what to do.
function gateStatus(root, state) {
  if (!state.active) {
    return {
      open: false,
      reason: 'No active MNDX work item.',
      next: 'Start one with /mndx:spec <idea>, /mndx:fix <bug> or /mndx:chore <task>.',
    };
  }
  const item = state.active;
  for (const s of approvalStatus(root, item)) {
    if (s.state === 'approved') continue;
    const rel = path.relative(root, s.file).split(path.sep).join('/');
    const reasons = {
      missing: `${rel} does not exist yet.`,
      template: `${rel} is still an unfilled template.`,
      unapproved: `${rel} has not been approved.`,
      stale: `${rel} changed after it was approved.`,
    };
    const approver = state.autopilot && state.autopilot.active
      ? 'autopilot self-approval after review'
      : 'the user typing /mndx:approve';
    return {
      open: false,
      reason: `${item.id}: ${reasons[s.state]}`,
      next: s.state === 'missing' || s.state === 'template'
        ? `Write it (${nextCommandFor(item, s.doc)}), then get approval from ${approver}.`
        : `It needs approval from ${approver}.`,
    };
  }
  return { open: true, reason: `${item.id} is approved.`, next: '' };
}

// Stage after approvals change: the first doc still needing approval, otherwise build (or later).
function computeStage(root, item) {
  const pending = approvalStatus(root, item).find((s) => s.state !== 'approved');
  if (pending) return pending.doc;
  return POST_APPROVAL_STAGES.includes(item.stage) ? item.stage : 'build';
}

function setStatusLine(file, text) {
  const content = fs.readFileSync(file, 'utf8');
  if (STATUS_LINE.test(content)) fs.writeFileSync(file, content.replace(STATUS_LINE, `> **Status:** ${text}`));
}

// Approve one doc of the active item. `by` is 'you' (user hook) or 'autopilot' (CLI, only with a grant).
// Without `doc`, approves the first doc that still needs it. Returns a short human message.
function approve(root, state, { doc, by }) {
  const item = state.active;
  if (!item) throw new MndxError('Nothing to approve: no active MNDX work item.');
  const statuses = approvalStatus(root, item);
  const target = doc
    ? statuses.find((s) => s.doc === doc)
    : statuses.find((s) => s.state !== 'approved');
  if (!target) {
    throw new MndxError(doc
      ? `"${doc}" is not a doc of ${item.kind} items (expected: ${KINDS[item.kind].docs.join(', ')}).`
      : `Everything for ${item.id} is already approved.`);
  }
  const blocker = statuses.slice(0, statuses.indexOf(target)).find((s) => s.state !== 'approved');
  if (blocker) throw new MndxError(`Approve ${blocker.doc} before ${target.doc}.`);
  const rel = path.relative(root, target.file).split(path.sep).join('/');
  if (target.state === 'missing') throw new MndxError(`${rel} does not exist yet.`);
  if (target.state === 'template') throw new MndxError(`${rel} is still an unfilled template.`);

  const at = new Date().toISOString();
  setStatusLine(target.file, `APPROVED by ${by} · ${at.slice(0, 10)}`);
  item.approvals = item.approvals || {};
  item.approvals[target.doc] = { sha: docHash(fs.readFileSync(target.file, 'utf8')), by, at };
  item.stage = computeStage(root, item);
  writeState(root, state);
  return `Approved ${target.doc} for ${item.id} (by ${by}). Stage is now: ${item.stage}.`;
}

// Up to 40 chars, cut at a word boundary (never mid-word).
function slugify(title) {
  const words = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  let slug = '';
  for (const w of words) {
    const next = slug ? `${slug}-${w}` : w;
    if (next.length > 40) break;
    slug = next;
  }
  return slug || (words[0] || 'item').slice(0, 40);
}

// Create a work item: allocate an id, copy the templates, make it active.
function newItem(root, state, kind, title) {
  if (!KINDS[kind]) throw new MndxError(`Unknown kind "${kind}" (expected: ${Object.keys(KINDS).join(', ')}).`);
  if (!title || !title.trim()) throw new MndxError('A title is required.');
  if (state.active) {
    throw new MndxError(`${state.active.id} is still active. Ship it (/mndx:ship) or abandon it (/mndx:abandon) first.`);
  }
  state.counter += 1;
  const id = `${String(state.counter).padStart(3, '0')}-${slugify(title)}`;
  const dir = path.join('docs', KINDS[kind].folder, id).split(path.sep).join('/');
  const absDir = path.join(root, dir);
  fs.mkdirSync(absDir, { recursive: true });
  const vars = { ID: id, TITLE: title.trim(), DATE: new Date().toISOString().slice(0, 10), KIND: kind };
  for (const name of KINDS[kind].templates) {
    const target = path.join(absDir, name);
    if (fs.existsSync(target)) continue;
    const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'item', name), 'utf8');
    fs.writeFileSync(target, template.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? vars[key] : m)));
  }
  state.active = {
    id,
    kind,
    title: title.trim(),
    dir,
    stage: KINDS[kind].docs[0],
    approvals: {},
    autopilot: Boolean(state.autopilot && state.autopilot.active),
    createdAt: new Date().toISOString(),
  };
  writeState(root, state);
  return state.active;
}

function closeItem(root, state, outcome, note) {
  const item = state.active;
  if (!item) throw new MndxError('No active MNDX work item.');
  state.history.push({
    id: item.id, kind: item.kind, title: item.title, dir: item.dir,
    outcome, note: note || undefined, at: new Date().toISOString(),
  });
  state.active = null;
  writeState(root, state);
  return item;
}

function setStage(root, state, stage) {
  if (!POST_APPROVAL_STAGES.includes(stage)) {
    throw new MndxError(`Stage must be one of: ${POST_APPROVAL_STAGES.join(', ')}. Earlier stages follow approvals.`);
  }
  const gate = gateStatus(root, state);
  if (!gate.open) throw new MndxError(`${gate.reason} ${gate.next}`);
  if (stage === 'ship') {
    const blocker = require('./check').shipBlocker(root, state.active); // lazy: check.js depends on this module
    if (blocker) throw new MndxError(`Not ready to ship: ${blocker}`);
  }
  state.active.stage = stage;
  writeState(root, state);
}

module.exports = {
  STATE_DIR, SCRATCH_DIR, TEMPLATE_MARKER, TEMPLATES_DIR, KINDS, POST_APPROVAL_STAGES, MndxError, readHookInput,
  statePath, findRoot, emptyState, readState, writeState, initState, docHash, docFile,
  approvalStatus, gateStatus, computeStage, approve, slugify, newItem, closeItem, setStage,
};
