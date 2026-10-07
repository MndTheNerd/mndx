#!/usr/bin/env node
'use strict';
// UserPromptExpansion hook. This fires only for slash commands the *user* types (never for the
// Skill tool), so it's the one place approvals and autopilot grants can come from.
//   /mndx:approve [doc]      approve the next doc (or the named one) of the active item
//   /mndx:autopilot <goal>   grant autopilot for a goal; "/mndx:autopilot stop" ends it
//   any other /mndx:* typed  the user is back in control, so an active autopilot ends

const fs = require('fs');
const lib = require('./lib');

function respond(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}
const block = (reason) => respond({ decision: 'block', reason: `MNDX: ${reason}` });
const notify = (message) => respond({ systemMessage: `MNDX: ${message}` });

function parse(input) {
  const original = String(input.original_prompt || `/${input.command_name || ''}`);
  const match = original.match(/^\s*\/mndx:([\w-]+)\s*([\s\S]*)$/);
  if (!match) return null;
  const args = Array.isArray(input.args) ? input.args.join(' ') : String(input.args || match[2] || '');
  return { name: match[1], args: args.trim() };
}

function endAutopilot(root, state, outcome, note) {
  state.history.push({ id: 'autopilot', kind: 'autopilot', title: state.autopilot.goal, outcome,
    note, at: new Date().toISOString() });
  state.autopilot = null;
  if (state.active) state.active.autopilot = false;
  lib.writeState(root, state);
}

function handleApprove(cwd, args) {
  const root = lib.findRoot(cwd);
  if (!root) block('this is not an MNDX project yet. Run /mndx:init first.');
  const state = lib.readState(root);
  if (state.autopilot && state.autopilot.active) endAutopilot(root, state, 'stopped', 'user approved manually');
  notify(lib.approve(root, state, { doc: args || undefined, by: 'you' }));
}

function handleAutopilot(cwd, args) {
  const root = lib.findRoot(cwd) || cwd;
  const state = lib.initState(root);
  const active = state.autopilot && state.autopilot.active;

  if (/^(stop|off|end)$/i.test(args)) {
    if (!active) notify('autopilot was not active.');
    endAutopilot(root, state, 'stopped', 'stopped by user');
    notify('autopilot stopped. Approvals are back to you.');
  }
  if (active) block(`autopilot is already running for: "${state.autopilot.goal}". Type "/mndx:autopilot stop" first.`);
  if (!args && !state.active) block('tell autopilot what to build: /mndx:autopilot <goal>.');

  state.autopilot = { active: true, goal: args || `finish ${state.active.id}`, grantedAt: new Date().toISOString() };
  if (state.active) state.active.autopilot = true;
  lib.writeState(root, state);
  notify(`autopilot granted for "${state.autopilot.goal}". Claude may self-approve after review until it finishes, stops, or you type any /mndx: command.`);
}

function main() {
  const input = lib.readHookInput();
  const cmd = parse(input);
  if (!cmd) return;
  const cwd = input.cwd || process.cwd();
  try {
    if (cmd.name === 'approve') handleApprove(cwd, cmd.args);
    else if (cmd.name === 'autopilot') handleAutopilot(cwd, cmd.args);
    else {
      const root = lib.findRoot(cwd);
      if (!root) return;
      const state = lib.readState(root);
      if (state.autopilot && state.autopilot.active && cmd.name !== 'status') {
        endAutopilot(root, state, 'stopped', `user typed /mndx:${cmd.name}`);
        notify('autopilot ended because you took over. Approvals are back to you.');
      }
    }
  } catch (err) {
    if (err instanceof lib.MndxError) block(err.message);
    throw err;
  }
}

main();
