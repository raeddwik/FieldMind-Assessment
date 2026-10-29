const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("assessment-config.js", "utf8"), context);
vm.runInContext(fs.readFileSync("scoring-engine.js", "utf8"), context);

const config = context.window.FIELD_MIND_ASSESSMENT;
const engine = context.window.FIELD_MIND_SCORING_ENGINE;

// Keep the server-side submission contract aligned with the browser questionnaire.
const serverSource = fs.readFileSync(
  "supabase/functions/fieldmind-submit-assessment/index.ts", "utf8"
);
const serverConfigMatch = serverSource.match(/const CONFIG = (\{[\s\S]*?\}) as const;/);
assert.ok(serverConfigMatch, "server-side questionnaire config must be present");
const serverConfig = JSON.parse(serverConfigMatch[1]);
assert.equal(serverConfig.version, config.version, "browser/server scale versions must match");
assert.equal(JSON.stringify(serverConfig.items.map((item) => item.id)),
  JSON.stringify(config.items.map((item) => item.id)),
  "browser/server question IDs and order must match");
assert.equal(
  JSON.stringify(serverConfig.domains.map((domain) => ({
    id: domain.id, title: domain.title, kind: domain.kind
  }))),
  JSON.stringify(config.domains.map((domain) => ({
    id: domain.id, title: domain.title, kind: domain.kind
  }))),
  "browser/server domain definitions must match"
);
for (const item of serverConfig.items) {
  const browserItem = config.items.find((candidate) => candidate.id === item.id);
  assert.ok(browserItem, `server-only question: ${item.id}`);
  assert.equal(item.scale, browserItem.responseScale,
    `response scale mismatch for ${item.id}`);
  const expectedMax = config.responseScales[browserItem.responseScale]
    .reduce((max, option) => Math.max(max, option.value), -Infinity);
  assert.equal(item.scale === "yes_no_optional" ? 2 : 4, expectedMax,
    `server answer range must match browser options for ${item.id}`);
}

// Consent must come from the user's checkbox and be checked again on submit.
const appSource = fs.readFileSync("app.js", "utf8");
assert.match(appSource, /if \(!\$\("consent"\)\?\.checked\)/,
  "submission must reject if explicit consent is absent");
assert.match(appSource, /consent_given:\s*\$\("consent"\)\.checked/,
  "submission must send the actual consent checkbox value");
assert.doesNotMatch(appSource, /consent_given:\s*true/,
  "submission must not hard-code consent as granted");

 // Declined answers in flag domains must remain distinct from positive and negative answers.
assert.match(appSource, /Number\(domain\.declinedCount \|\| 0\)/,
  "assessment result must read the server's declined-answer count");
assert.match(appSource, /اختار المستخدم عدم الإجابة عن سؤال أو أكثر/,
  "assessment and admin summaries must describe declined answers explicitly");
assert.match(appSource, /عدم الإجابة لا يثبت أو ينفي/,
  "assessment result must clarify that declining is not diagnostic");
assert.match(appSource, /Number\(value\.declinedCount\) > 0/,
  "dashboard and export summaries must account for declined answers");
assert.match(serverSource, /body\.consent_given !== true/,
  "server must independently require explicit consent");

assert.match(serverSource, /const declined = items\.filter\(item => answers\[item\.id\] === 2\)/,
  "server must count declined responses in flag domains");
assert.match(serverSource, /declinedCount: declined\.length/,
  "server flag-domain results must include declined-answer count");
assert.match(serverSource, /declinedItemIds: declined\.map\(item => item\.id\)/,
  "server flag-domain results must include declined question IDs");
assert.match(serverSource, /"answer_declined"/,
  "server must distinguish declined flag-domain answers from no flagged response");

assert.ok(config && Array.isArray(config.items), "questionnaire config must load");
assert.equal(config.items.length, 42, "expected 42 questionnaire items");
assert.equal(new Set(config.items.map((item) => item.id)).size, config.items.length,
  "question IDs must be unique");
assert.ok(config.domains.length > 0, "at least one domain is required");

for (const item of config.items) {
  assert.ok(config.domains.some((domain) => domain.id === item.domain),
    `unknown domain for ${item.id}`);
  const scale = config.responseScales[item.responseScale];
  assert.ok(Array.isArray(scale) && scale.length > 0,
    `missing response scale for ${item.id}`);
}

const zeroAnswers = Object.fromEntries(config.items.map((item) => [item.id,
  item.responseScale === "yes_no_optional" ? 0 : 0
]));
const baseline = engine.calculate(zeroAnswers);
assert.equal(baseline.status, "calculation_preview_only");
assert.equal(baseline.classification, null);
assert.equal(baseline.experimentalIndices.status, "retired");
assert.equal(baseline.criticalIndicators.positiveCount, 0);

const incomplete = { ...zeroAnswers };
delete incomplete.dep_01;
assert.equal(engine.calculate(incomplete).status, "invalid_or_incomplete");

const declined = { ...zeroAnswers, safe_01: 2, safe_02: 2 };
const declinedResult = engine.calculate(declined);
assert.equal(declinedResult.criticalIndicators.declinedCount, 2);
assert.equal(declinedResult.criticalIndicators.positiveCount, 0);
assert.equal(declinedResult.criticalIndicators.status, "safety_answer_declined");
assert.equal(declinedResult.followUp.level, "offer_support");

const positiveSafety = { ...zeroAnswers, safe_01: 1 };
const safetyResult = engine.calculate(positiveSafety);
assert.equal(safetyResult.criticalIndicators.positiveCount, 1);
assert.equal(safetyResult.criticalIndicators.selfHarmThoughts, true);
assert.equal(safetyResult.followUp.level, "prompt_human_review");

const immediateDanger = { ...zeroAnswers, safe_02: 1 };
assert.equal(engine.calculate(immediateDanger).followUp.level, "urgent_safety");

console.log("FieldMind assessment engine checks passed.");
