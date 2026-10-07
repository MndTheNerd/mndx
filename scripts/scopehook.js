#!/usr/bin/env node
'use strict';
// PostToolUse hook on Edit/Write/MultiEdit/NotebookEdit: warns Claude when an approved feature's edit lands outside
// the plan's Files table (scope creep caught while it happens, not at review). Never blocks.

const path = require('path');
const lib = require('./lib');
const scope = require('./scope');

function main() {
  const input = lib.readHookInput();
  const target = input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path);
  if (!target) return;
  const file = path.resolve(input.cwd || process.cwd(), target);
  const root = lib.findRoot(path.dirname(file)) || lib.findRoot(input.cwd || process.cwd());
  if (!root) return;
  let warning;
  try {
    warning = scope.scopeWarning(root, lib.readState(root), file);
  } catch {
    return; // never let scope advice break an edit
  }
  if (warning) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: warning } }));
  }
}

main();
