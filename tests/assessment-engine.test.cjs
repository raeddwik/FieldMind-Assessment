const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("assessment-config.js", "utf8"), context);
vm.runInContext(fs.readFileSync("scoring-engine.js", "utf8"), context);

const config = context.window.FIELD_MIND_ASSESSMENT;
const engine = context.window.FIELD_MIND_SCORING_ENGINE;

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
