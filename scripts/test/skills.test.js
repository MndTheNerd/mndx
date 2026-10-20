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
const { concerns, builtinSkills, optionalSkills = [] } = route.loadConcerns();
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
  const alsoConsider = concerns.flatMap((c) => c.alsoConsider || []); // Claude Code and plugin skills
  const allowed = new Set([...known, ...PLUGIN_SKILLS, ...agents, ...alsoConsider, ...optionalSkills]);
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
// The 111 "what vibe coders miss" topics (a viral engineering checklist) and the MNDX checklist that owns each one.
// Each needle must appear in that checklist, so a topic can't be dropped without this test noticing.
const ENGINEERING_TOPICS = [
  ['Rate Limiting', 'api.md', 'rate limiting'], ['Caching', 'performance.md', 'caching'],
  ['Load Balancing', 'infra.md', 'load balancer'], ['Reverse Proxies', 'infra.md', 'reverse proxy'],
  ['API Gateways', 'infra.md', 'api gateway'], ['CI/CD', 'devops.md', 'ci/cd'], ['Docker', 'devops.md', 'docker'],
  ['Kubernetes', 'infra.md', 'kubernetes'], ['Service Discovery', 'infra.md', 'service discovery'],
  ['Circuit Breakers', 'reliability.md', 'circuit breaker'], ['Timeouts', 'reliability.md', 'timeout'],
  ['Retries', 'reliability.md', 'retries'], ['Exponential Backoff', 'reliability.md', 'exponential backoff'],
  ['Idempotency', 'api.md', 'idempotency'], ['Message Queues', 'reliability.md', 'message queue'],
  ['Pub/Sub', 'reliability.md', 'pub/sub'], ['Event-Driven Architecture', 'reliability.md', 'event-driven'],
  ['Distributed Transactions', 'reliability.md', 'distributed transactions'], ['Saga Pattern', 'reliability.md', 'saga'],
  ['Dead Letter Queues', 'reliability.md', 'dead-letter queue'], ['Cron Jobs', 'reliability.md', 'cron'],
  ['WebSockets', 'api.md', 'websockets'], ['Long Polling', 'api.md', 'long polling'],
  ['Server-Sent Events', 'api.md', 'server-sent events'], ['Database Indexing', 'data.md', 'indexes'],
  ['Query Optimization', 'performance.md', 'query optimization'], ['N+1 Queries', 'performance.md', 'n+1'],
  ['Connection Pooling', 'performance.md', 'connection pooling'], ['Read Replicas', 'data.md', 'read replicas'],
  ['Sharding', 'data.md', 'sharding'], ['Partitioning', 'data.md', 'partitioning'], ['Replication', 'data.md', 'replication'],
  ['Leader Election', 'reliability.md', 'leader election'], ['CAP Theorem', 'reliability.md', 'cap theorem'],
  ['Eventual Consistency', 'reliability.md', 'eventual consistency'],
  ['Optimistic Locking', 'data.md', 'optimistic locking'], ['Pessimistic Locking', 'data.md', 'pessimistic locking'],
  ['Distributed Locks', 'reliability.md', 'distributed locks'], ['Race Conditions', 'reliability.md', 'race conditions'],
  ['Deadlocks', 'reliability.md', 'deadlocks'], ['Memory Leaks', 'performance.md', 'leaks'],
  ['Garbage Collection', 'performance.md', 'garbage'], ['Thread Safety', 'reliability.md', 'thread safety'],
  ['Backpressure', 'performance.md', 'backpressure'], ['Autoscaling', 'infra.md', 'autoscaling'],
  ['Horizontal Scaling', 'infra.md', 'horizontal scaling'], ['Vertical Scaling', 'infra.md', 'vertical scaling'],
  ['CDN', 'infra.md', 'cdn'], ['Edge Caching', 'infra.md', 'edge caching'],
  ['Cache Invalidation', 'performance.md', 'cache invalidation'], ['Feature Flags', 'devops.md', 'feature flags'],
  ['Blue-Green Deployment', 'devops.md', 'blue-green'], ['Canary Releases', 'devops.md', 'canary'],
  ['Rolling Deployments', 'devops.md', 'rolling'], ['Rollbacks', 'devops.md', 'rollback'],
  ['Health Checks', 'observability.md', 'health checks'], ['Liveness & Readiness Probes', 'observability.md', ['liveness', 'readiness']],
  ['Monitoring', 'observability.md', 'monitoring'], ['Logging', 'observability.md', 'logging'],
  ['Distributed Tracing', 'observability.md', 'distributed tracing'], ['Metrics', 'observability.md', 'metrics'],
  ['Alerts', 'observability.md', 'alerts'], ['SLOs', 'observability.md', 'slos'], ['SLIs', 'observability.md', 'slis'],
  ['Error Budgets', 'observability.md', 'error budget'], ['Observability', 'observability.md', 'observability'],
  ['Secrets Management', 'security.md', 'secrets management'], ['IAM', 'security.md', 'iam:'],
  ['OAuth', 'auth.md', 'oauth'], ['JWT Rotation', 'auth.md', ['jwt', 'key rotation']], ['TLS', 'security.md', '**tls**'],
  ['Encryption at Rest', 'security.md', 'encryption at rest'], ['Encryption in Transit', 'security.md', 'encryption in transit'],
  ['WAF', 'security.md', 'waf'], ['DDoS Protection', 'security.md', 'ddos'], ['CORS', 'security.md', 'cors'],
  ['CSRF', 'security.md', 'csrf'], ['SQL Injection', 'security.md', 'sql injection'], ['XSS', 'security.md', 'xss'],
  ['SSRF', 'security.md', 'ssrf'], ['Database Migrations', 'data.md', 'migration'],
  ['Schema Versioning', 'data.md', 'schema versioning'], ['Disaster Recovery', 'reliability.md', 'disaster'],
  ['Backups', 'reliability.md', 'backups'], ['Failover', 'reliability.md', 'failover'],
  ['Multi-Region Deployment', 'infra.md', 'multi-region'], ['Chaos Engineering', 'reliability.md', 'chaos engineering'],
  ['Cost Optimization', 'infra.md', 'cost optimization'], ['Cold Starts', 'performance.md', 'cold starts'],
  ['Serverless Limits', 'infra.md', ['serverless', 'limits']], ['Latency', 'performance.md', 'latency'],
  ['Throughput', 'performance.md', 'throughput'], ['P99 Latency', 'performance.md', 'p99'],
  ['Tail Latency', 'performance.md', 'tail latency'], ['Network Partitions', 'reliability.md', 'network partitions'],
  ['Clock Skew', 'reliability.md', 'clock skew'], ['DNS', 'infra.md', 'dns'], ['TCP vs UDP', 'api.md', ['tcp', 'udp']],
  ['HTTP/2 & HTTP/3', 'api.md', ['http/2', 'http/3']], ['gRPC', 'api.md', 'grpc'], ['Webhooks', 'api.md', 'webhooks'],
  ['API Versioning', 'api.md', 'versioning'], ['Semantic Versioning', 'devops.md', 'semver'],
  ['Infrastructure as Code', 'infra.md', 'infrastructure-as-code'], ['Terraform', 'infra.md', 'terraform'],
  ['Helm Charts', 'infra.md', 'helm charts'], ['Build Caching', 'devops.md', 'build caching'],
  ['Dependency Hell', 'devops.md', 'dependency hell'], ['Production Incidents', 'devops.md', 'production incidents'],
  ['On-Call', 'devops.md', 'on call'], ['Postmortems', 'devops.md', 'postmortem'],
];

test('all 111 engineering topics land in a checklist', () => {
  assert.equal(ENGINEERING_TOPICS.length, 111);
  assert.equal(new Set(ENGINEERING_TOPICS.map((t) => t[0])).size, 111, 'duplicate topic');
  for (const [topic, file, needle] of ENGINEERING_TOPICS) {
    const text = fs.readFileSync(path.join(route.CHECKLIST_DIR, file), 'utf8').toLowerCase();
    for (const n of [].concat(needle)) assert.ok(text.includes(n), `${topic}: "${n}" is missing from ${file}`);
  }
});

test('the scale-sensitive checklists carry the complexity budget', () => {
  for (const f of ['reliability.md', 'performance.md']) {
    const text = fs.readFileSync(path.join(route.CHECKLIST_DIR, f), 'utf8');
    assert.match(text, /Scale gate/, `${f}: needs the scale gate`);
    assert.match(text, /n\/a: <reason>/, `${f}: must say how to opt out`);
  }
  assert.match(fs.readFileSync(path.join(route.CHECKLIST_DIR, 'SKILL.md'), 'utf8'), /Complexity budget/);
});

test('router: engineering tasks reach the right concerns', () => {
  const ids = (task) => route.route(task).map((r) => r.id);
  const cases = [
    ['Add retries with exponential backoff and a dead letter queue to the webhook handler', ['reliability', 'api']],
    ['Add p99 latency alerts, SLOs and an error budget', ['observability', 'performance']],
    ['Roll out the new checkout with a canary release behind a feature flag', ['devops']],
    ['Add a read replica and shard the orders table', ['data']],
    ['Put the site behind a CDN with a WAF and DDoS protection', ['infra', 'security', 'performance']],
    ['Rotate the JWT signing keys', ['auth']],
    ["Write a postmortem for last night's incident", ['devops']],
    ['Fix the race condition when two users book the same slot', ['reliability']],
    ['Stream live updates to the browser with websockets', ['api']],
  ];
  for (const [task, expected] of cases) {
    const got = ids(task);
    for (const c of expected) assert.ok(got.includes(c), `"${task}" should route to ${c}, got ${got.join(', ')}`);
  }
});

test('alsoConsider names Claude Code and plugin skills, never the curated ones', () => {
  const curated = new Set([...manifest.map((s) => s.name), ...builtinSkills]);
  for (const c of concerns) {
    const names = c.alsoConsider || [];
    assert.equal(new Set(names).size, names.length, `${c.id}: duplicate alsoConsider`);
    for (const n of names) {
      assert.match(n, /^[a-z0-9-]+(:[a-z0-9-]+)?$/, `${c.id}: bad skill name "${n}"`);
      assert.ok(!curated.has(n), `${c.id}: "${n}" is already a curated skill`);
    }
  }
});

test('router output lists alsoConsider, and the route skill treats the curated skills as a floor', () => {
  const security = route.route('add a login page').find((r) => r.id === 'security');
  assert.ok(security.alsoConsider.includes('security-review'));
  assert.match(route.format(route.route('add a login page')), /also consider, if this session lists them: .*security-review/);
  const routeSkill = fs.readFileSync(path.join(ROOT, 'skills', 'route', 'SKILL.md'), 'utf8');
  assert.match(routeSkill, /floor,\s+not\s+a\s+ceiling/);
  assert.match(routeSkill, /skills\s+your\s+session\s+actually\s+lists/);
});
test('assess is evidence-first and handles projects with no source safely', () => {
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
  const assess = read('skills/assess/SKILL.md');
  for (const re of [/summary-first/i, /\*\*observed\*\*/, /\*\*inferred\*\*/, /not found/, /authorized to analyze/,
    /reverse-engineer-anything/, /Never run an unknown binary or\s+app without the user's explicit OK/]) {
    assert.match(assess, re, `assess skill is missing ${re}`);
  }
  const auditor = read('agents/project-auditor.md');
  for (const re of [/search boundary/, /NOT EXAMINED/, /\*\*observed\*\*/]) assert.match(auditor, re, `auditor is missing ${re}`);
  const template = read('templates/project/ASSESSMENT.md');
  for (const re of [/## Questions/, /## Not examined/, /\| Evidence \|/]) assert.match(template, re, `template is missing ${re}`);
});
test('reviews are quick by default, with delta re-reviews, and the skills point at one shared protocol', () => {
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
  const reviews = read('skills/reviews/SKILL.md');
  for (const re of [/default is \*\*quick\*\*/, /MODE: DELTA/, /Never\s+re-review for minors|\*\*Never\*\* re-review for minors/,
    /fresh full review/, /review-mode full/]) {
    assert.match(reviews, re, `reviews skill is missing ${re}`);
  }
  for (const p of ['skills/spec/SKILL.md', 'skills/verify/SKILL.md', 'skills/autopilot/SKILL.md']) {
    assert.match(read(p), /skills\/reviews\/SKILL\.md/, `${p} must point at the reviews skill`);
  }
  for (const p of ['agents/spec-reviewer.md', 'agents/code-reviewer.md']) {
    const agent = read(p);
    assert.match(agent, /## Delta mode/, `${p} needs a delta mode`);
    assert.match(agent, /MODE: DELTA/, `${p} must say what triggers delta mode`);
  }
});
