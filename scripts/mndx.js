#!/usr/bin/env node
'use strict';
// MNDX CLI. Claude runs this through Bash to manage work items; it can never grant approvals
// itself except under an autopilot grant that a user-typed /mndx:autopilot created.

const fs = require('fs');
const path = require('path');
const lib = require('./lib');
const skills = require('./skills');
const route = require('./route');
const check = require('./check');
const scope = require('./scope');

const USAGE = `Usage: node mndx.js <command> [args]

  init                      Create .mndx/state.json in the current directory
  status [--json]           Show the active item, approvals, gate and autopilot state
  new <feature|fix|chore> <title...>
                            Start a work item (copies doc templates, makes it active)
  stage <build|verify|ship> Move the active item forward (only once its docs are approved;
                            ship also needs a green, current check and a PASS verify.md)
  check                     Run CLAUDE.md's quality-bar commands for real and record the results
  scope                     List files edited outside the active feature's plan (## Files)
  done [note...]            Close the active item as shipped (must be at stage "ship")
  abandon [reason...]       Close the active item without shipping (docs are kept)
  approve [doc]             Autopilot only: approve the next doc after review
  autopilot-end <completed|stopped> [note...]
                            End the autopilot grant
  route "<task>" [--ui] [--json]
                            Map a plain-language task to production concerns, checklists and skills
  skills [list]             Show recommended community skills and which are installed
  skills install [core|web|mobile|backend|all]
                            Install them globally via npx skills (default: all)
  skills update             Snapshot, update (npx skills update), then report changes + risky new lines
  skills rollback [snapshot] [skills...]
                            Restore skills from a snapshot (default: the latest)
`;

function requireRoot() {
  const root = lib.findRoot(process.cwd());
  if (!root) throw new lib.MndxError('Not an MNDX project (no .mndx/state.json here or above). Run /mndx:init.');
  return root;
}

function describe(root, state) {
  const lines = [];
  lines.push(`MNDX project: ${root}`);
  if (state.autopilot && state.autopilot.active) {
    lines.push(`Autopilot: ON since ${state.autopilot.grantedAt} — goal: ${state.autopilot.goal || '(continue active item)'}`);
  }
  const item = state.active;
  if (!item) {
    lines.push('Active item: none');
  } else {
    lines.push(`Active item: ${item.id} (${item.kind}) — "${item.title}"`);
    lines.push(`Folder: ${item.dir}`);
    lines.push(`Stage: ${item.stage}`);
    for (const s of lib.approvalStatus(root, item)) {
      const a = item.approvals && item.approvals[s.doc];
      lines.push(`  ${s.doc}.md: ${s.state}${a && s.state === 'approved' ? ` (by ${a.by}, ${a.at.slice(0, 10)})` : ''}`);
    }
  }
  const gate = lib.gateStatus(root, state);
  lines.push(`Code gate: ${gate.open ? 'OPEN' : 'CLOSED'} — ${gate.reason}${gate.next ? ' ' + gate.next : ''}`);
  const record = check.readRecord(root);
  if (record) {
    const failed = record.results.filter((r) => r.code !== 0).map((r) => r.name);
    const current = record.fingerprint === check.fingerprint(root);
    lines.push(`Last check: ${record.at.slice(0, 16).replace('T', ' ')} — ${failed.length ? 'FAILED: ' + failed.join(', ') : 'all green'}${current ? '' : ' (code changed since)'}`);
  }
  if (state.active) {
    const extra = scope.outOfScope(root, state.active.id);
    if (extra.length) lines.push(`Out-of-plan edits (${extra.length}): ${extra.join(', ')}. List them as deviations in verify.md.`);
  }
  if (state.active && state.active.stage === 'ship') {
    const blocker = check.shipBlocker(root, state.active);
    lines.push(`Ship readiness: ${blocker ? 'NOT READY — ' + blocker : 'ready'}`);
  }
  const violations = path.join(root, lib.STATE_DIR, 'violations.log');
  if (fs.existsSync(violations)) {
    const entries = fs.readFileSync(violations, 'utf8').trim().split('\n').filter(Boolean);
    if (entries.length) {
      const last = JSON.parse(entries[entries.length - 1]);
      lines.push(`⚠ Watchdog: ${entries.length} shell change(s) to code while the gate was closed; last ${last.at.slice(0, 16).replace('T', ' ')}: ${last.files.join(', ')}`);
    }
  }
  const recent = state.history.slice(-5).reverse();
  if (recent.length) {
    lines.push('Recent:');
    for (const h of recent) lines.push(`  ${h.at.slice(0, 10)} ${h.outcome.padEnd(9)} ${h.id}`);
  }
  return lines.join('\n');
}

function main(argv) {
  const [command, ...rest] = argv;
  switch (command) {
    case 'init': {
      const root = lib.findRoot(process.cwd());
      if (root) return `Already an MNDX project: ${root}`;
      lib.initState(process.cwd());
      return `Initialized MNDX state in ${path.join(process.cwd(), lib.STATE_DIR)}`;
    }
    case 'status': {
      const root = requireRoot();
      const state = lib.readState(root);
      if (rest.includes('--json')) {
        return JSON.stringify({ root, ...state, gate: lib.gateStatus(root, state),
          docs: state.active ? lib.approvalStatus(root, state.active) : [] }, null, 2);
      }
      return describe(root, state);
    }
    case 'new': {
      const root = requireRoot();
      const state = lib.readState(root);
      const [kind, ...title] = rest;
      const item = lib.newItem(root, state, kind, title.join(' '));
      const docs = lib.KINDS[kind].templates.map((t) => `${item.dir}/${t}`);
      return `Started ${item.id} (${kind}${item.autopilot ? ', autopilot' : ''}).\nDocs to fill in:\n  ${docs.join('\n  ')}`;
    }
    case 'stage': {
      const root = requireRoot();
      const state = lib.readState(root);
      lib.setStage(root, state, rest[0]);
      return `${state.active.id} is now at stage: ${rest[0]}`;
    }
    case 'done': {
      const root = requireRoot();
      const state = lib.readState(root);
      if (!state.active) throw new lib.MndxError('No active MNDX work item.');
      if (state.active.stage !== 'ship') {
        throw new lib.MndxError(`${state.active.id} is at stage "${state.active.stage}". Verify it, then run: stage ship.`);
      }
      const gate = lib.gateStatus(root, state);
      if (!gate.open) throw new lib.MndxError(`${gate.reason} ${gate.next}`);
      const blocker = check.shipBlocker(root, state.active);
      if (blocker) throw new lib.MndxError(`Not ready to ship: ${blocker}`);
      const item = lib.closeItem(root, state, 'shipped', rest.join(' '));
      return `Shipped ${item.id}. Code gate is closed until the next item is approved.`;
    }
    case 'abandon': {
      const root = requireRoot();
      const state = lib.readState(root);
      const item = lib.closeItem(root, state, 'abandoned', rest.join(' '));
      return `Abandoned ${item.id}. Its docs stay in ${item.dir}.`;
    }
    case 'approve': {
      const root = requireRoot();
      const state = lib.readState(root);
      if (!(state.autopilot && state.autopilot.active)) {
        throw new lib.MndxError('Only the user can approve outside autopilot. Ask them to type /mndx:approve.');
      }
      return lib.approve(root, state, { doc: rest[0], by: 'autopilot' });
    }
    case 'autopilot-end': {
      const root = requireRoot();
      const state = lib.readState(root);
      const [outcome, ...note] = rest;
      if (!['completed', 'stopped'].includes(outcome)) throw new lib.MndxError('Outcome must be "completed" or "stopped".');
      if (!(state.autopilot && state.autopilot.active)) return 'Autopilot is not active.';
      state.history.push({ id: 'autopilot', kind: 'autopilot', title: state.autopilot.goal, outcome,
        note: note.join(' ') || undefined, at: new Date().toISOString() });
      state.autopilot = null;
      if (state.active) state.active.autopilot = false;
      lib.writeState(root, state);
      return `Autopilot ended (${outcome}). Approvals are back to the user.`;
    }
    case 'scope': {
      const root = requireRoot();
      const state = lib.readState(root);
      if (!state.active) return 'No active item.';
      const extra = scope.outOfScope(root, state.active.id);
      return extra.length
        ? `Edited outside ${state.active.id}'s plan:\n  ${extra.join('\n  ')}`
        : `No edits outside ${state.active.id}'s plan.`;
    }
    case 'check': {
      const root = requireRoot();
      const record = check.runChecks(root);
      const out = check.formatRecord(record);
      if (record.results.some((r) => r.code !== 0)) throw new lib.MndxError(out);
      return out;
    }
    case 'route': {
      const json = rest.includes('--json');
      const ui = rest.includes('--ui');
      const text = rest.filter((a) => a !== '--json' && a !== '--ui').join(' ');
      if (!text.trim()) throw new lib.MndxError('Usage: mndx.js route "<task in plain language>" [--ui] [--json]');
      const routed = route.route(text, { ui });
      return json ? JSON.stringify(routed, null, 2) : route.format(routed);
    }
    case 'skills': {
      const [sub = 'list', ...groups] = rest;
      if (sub === 'list') return skills.list(process.cwd());
      if (sub === 'install') return skills.install(process.cwd(), groups);
      if (sub === 'update') return skills.update(process.cwd());
      if (sub === 'rollback') return skills.rollback(groups);
      throw new lib.MndxError(`Unknown skills command "${sub}" (expected: list, install, update, rollback).`);
    }
    case undefined:
    case 'help':
    case '--help':
      return USAGE;
    default:
      throw new lib.MndxError(`Unknown command "${command}".\n\n${USAGE}`);
  }
}

if (require.main === module) {
  try {
    process.stdout.write(main(process.argv.slice(2)) + '\n');
  } catch (err) {
    if (!(err instanceof lib.MndxError)) throw err;
    process.stderr.write(`mndx: ${err.message}\n`);
    process.exit(1);
  }
}

module.exports = { main };
