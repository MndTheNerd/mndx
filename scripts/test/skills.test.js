'use strict';
// Offline checks of the skills manifest, the concern taxonomy and the router (no network, no npx).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const skills = require('../skills');
const route = require('../route');

const ROOT = path.join(__dirname, '..', '..');
const PLUGIN_SKILLS = fs.readdirSync(path.join(ROOT, 'skills'));
const manifest = skills.loadManifest();
const { concerns, builtinSkills } = route.loadConcerns();
const known = new Set([...manifest.map((s) => s.name), ...builtinSkills]);

test('manifest entries are complete, unique and valid', () => {
  const names = manifest.map((s) => s.name);
  assert.equal(new Set(names).size, names.length, 'duplicate skill name');
  for (const s of manifest) {
    assert.match(s.repo, /^[\w.-]+\/[\w.-]+$/, `${s.name}: repo must be owner/repo`);
    assert.ok(skills.GROUPS.includes(s.group), `${s.name}: bad group ${s.group}`);
    assert.ok(s.use && s.use.length > 10, `${s.name}: needs a "use" line`);
    assert.ok(!PLUGIN_SKILLS.includes(s.name), `${s.name} collides with an MNDX skill name`);
    if (s.requires) assert.ok(s.requires.command && s.requires.install, `${s.name}: requires needs command + install`);
  }
  for (const g of skills.GROUPS) assert.ok(manifest.some((s) => s.group === g), `no skills in group ${g}`);
});

test('group selection', () => {
  assert.deepEqual(skills.selectGroups([]), skills.GROUPS);
  assert.deepEqual(skills.selectGroups(['all']), skills.GROUPS);
  assert.deepEqual(skills.selectGroups(['web', 'core']), ['web', 'core']);
  assert.throws(() => skills.selectGroups(['webb']), /Unknown group/);
});

test('concern taxonomy: unique ids, real checklists, known skills', () => {
  const ids = concerns.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate concern id');
  for (const c of concerns) {
    assert.ok(c.title && c.triggers.length, `${c.id}: needs a title and triggers`);
    assert.ok([undefined, true, 'ui'].includes(c.always), `${c.id}: bad "always"`);
    if (c.checklist) assert.ok(fs.existsSync(path.join(route.CHECKLIST_DIR, c.checklist)), `${c.id}: missing ${c.checklist}`);
    for (const s of c.skills) assert.ok(known.has(s), `${c.id}: unknown skill ${s}`);
    for (const t of c.triggers) assert.equal(t, t.toLowerCase(), `${c.id}: trigger "${t}" must be lowercase`);
    for (const i of c.implies || []) assert.ok(ids.includes(i) && i !== c.id, `${c.id}: bad implies "${i}"`);
  }
  for (const f of fs.readdirSync(route.CHECKLIST_DIR).filter((f) => f !== 'SKILL.md')) {
    assert.ok(concerns.some((c) => c.checklist === f), `checklist ${f} isn't used by any concern`);
  }
});

test('every manifest skill serves at least one concern or stage', () => {
  // Skills used directly by pipeline stages (workflow table) rather than through a concern.
  const workflow = fs.readFileSync(path.join(ROOT, 'skills', 'workflow', 'SKILL.md'), 'utf8');
  const viaConcern = new Set(concerns.flatMap((c) => c.skills));
  for (const s of manifest) {
    const used = viaConcern.has(s.name) || workflow.includes(`\`${s.name}\``) ||
      PLUGIN_SKILLS.some((d) => fs.readFileSync(path.join(ROOT, 'skills', d, 'SKILL.md'), 'utf8').includes(`\`${s.name}\``));
    assert.ok(used || s.name === 'improve-codebase-architecture', `${s.name} is installed but never used`);
  }
});

test('skill names referenced in MNDX docs exist', () => {
  const agents = fs.readdirSync(path.join(ROOT, 'agents')).map((f) => f.replace(/\.md$/, ''));
  const allowed = new Set([...known, ...PLUGIN_SKILLS, ...agents]);
  const files = [];
  for (const d of PLUGIN_SKILLS) {
    for (const f of fs.readdirSync(path.join(ROOT, 'skills', d))) if (f.endsWith('.md')) files.push(path.join(ROOT, 'skills', d, f));
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'agents'))) files.push(path.join(ROOT, 'agents', f));
  for (const file of files) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!/skill/i.test(line)) continue;
      for (const [, name] of line.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)`/g)) {
        if (!/-/.test(name) && !known.has(name)) continue; // single words are usually commands, not skills
        if (/^(mndx|eas|expo)-?\*?$/.test(name) || name.startsWith('eas-')) continue; // families named by prefix
        if (/^(stack|quality|code|spec)-/.test(name) && allowed.has(name.replace(/^mndx:/, ''))) continue;
        assert.ok(allowed.has(name) || !looksLikeSkill(name), `${path.relative(ROOT, file)}: unknown skill \`${name}\``);
      }
    }
  }
});

// Kebab-case tokens next to the word "skill" that aren't obviously CSS, flags or files.
function looksLikeSkill(name) {
  return !/^(margin|padding|inline|prefers|max|min|font|text|data|aria|x|no|dry|non)-/.test(name);
}

test('router: plain-language tasks map to the right concerns', () => {
  const ids = (task, opts) => route.route(task, opts).map((r) => r.id);

  const sub = ids('Add monthly subscriptions with Stripe and email receipts');
  for (const c of ['payments', 'messaging', 'testing', 'security']) assert.ok(sub.includes(c), `subscriptions → ${c}`);

  const login = ids('Let users sign up with Google and delete their account');
  for (const c of ['auth', 'privacy']) assert.ok(login.includes(c), `login → ${c}`);

  const page = ids('Build a landing page in Arabic and English');
  for (const c of ['ux', 'accessibility', 'seo', 'i18n']) assert.ok(page.includes(c), `landing → ${c}`);

  const cli = ids('Write a CLI that converts CSV files to JSON');
  assert.ok(cli.includes('api') && cli.includes('data'));
  assert.ok(!cli.includes('ux') && !cli.includes('accessibility'), 'no UI concerns for a CLI');
  assert.ok(ids('Write a CLI that converts CSV', { ui: true }).includes('accessibility'), '--ui forces UI concerns');

  const store = ids('Publish the iOS app to the App Store with in-app purchase');
  for (const c of ['app-store', 'mobile', 'payments']) assert.ok(store.includes(c), `store → ${c}`);

  const ai = ids('Summarize support tickets with Claude and log token usage');
  for (const c of ['ai', 'observability']) assert.ok(ai.includes(c), `ai → ${c}`);
});

test('router: date logic and local persistence are caught (dogfood findings)', () => {
  const r = route.route("add habits, mark one done for today, show each habit's current streak, saved in the browser").map((x) => x.id);
  assert.ok(r.includes('time'), 'today/streak → time');
  assert.ok(r.includes('data'), 'saved → data');
});

test('router: implied concerns are pulled in with a reason', () => {
  const r = route.route('add a login page');
  const privacy = r.find((x) => x.id === 'privacy');
  assert.ok(privacy, 'login implies privacy');
  assert.equal(privacy.reason, 'implied by auth');
  const pay = route.route('one-time checkout').map((x) => x.id);
  for (const c of ['security', 'privacy', 'messaging']) assert.ok(pay.includes(c), `checkout implies ${c}`);
});

test('router: whole-word matching, no false hits inside words', () => {
  assert.equal(route.matches(' paid ', 'ai'), false);
  assert.equal(route.matches(' maintain ', 'ai'), false);
  assert.equal(route.matches(' use ai here ', 'ai'), true);
  assert.equal(route.matches(' sign-in flow ', 'sign in'), false);
  assert.equal(route.matches(' github actions ', 'github actions'), true);
  assert.equal(route.matches(' e2e tests ', 'e2e'), true);
});

test('router output names checklists and skill install status', () => {
  const r = route.route('accept payments').find((x) => x.id === 'payments');
  assert.ok(r.checklist.endsWith('payments.md'));
  assert.ok(r.skills.some((s) => s.name === 'stripe-best-practices' && typeof s.installed === 'boolean'));
  assert.match(route.format(route.route('accept payments')), /Payments & billing/);
});

test('every reviewer agent declares a model, so reviews never silently run on the most expensive one', () => {
  const dir = path.join(ROOT, 'agents');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert.ok(files.length >= 3, 'expected the reviewer agents');
  for (const f of files) {
    const frontmatter = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatter, `${f}: missing frontmatter`);
    assert.match(frontmatter[1], /^model:\s*(sonnet|opus|haiku|inherit)\s*$/m, `${f}: needs model: sonnet|opus|haiku|inherit`);
  }
});
test('the build skill ends each task with a bounded refactor, then re-runs the tests', () => {
  const build = fs.readFileSync(path.join(ROOT, 'skills', 'build', 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
  const step = build.match(/^\d+\. \*\*Refactor[\s\S]*?(?=^\d+\. )/m);
  assert.ok(step, 'build skill needs a Refactor step in the per-task loop');
  assert.match(step[0], /no new behavior/i);
  assert.match(step[0], /re-?run|run the same tests/i);
  assert.match(step[0], /undo/i, 'a refactor that turns a test red must be undone');
  // It must come after "make it green" and before the task is ticked off.
  assert.ok(build.indexOf('Refactor, once') > build.indexOf('Run the tests for the area'));
  assert.ok(build.indexOf('Refactor, once') < build.indexOf('Tick the task'));
});