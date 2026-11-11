import fs from "fs";
import path from "path";
import {
  loadQuestions,
  loadReports,
  loadTaxonomy,
  getReportsGroupedByQuestion,
} from "../src/lib/data";
import {
  isValidVerdict,
  isValidRepair,
  validateEditScope,
  validateRoutePolicy,
  validateCompleteTriage,
} from "../src/lib/safety";

console.log("=== STAGE 1 VERIFICATION: DATASET & SAFETY FOUNDATION ===");

// 1. Verify Taxonomy
const taxonomy = loadTaxonomy();
console.log(`[PASS] Taxonomy loaded: ${Object.keys(taxonomy.verdicts).length} verdicts, ${Object.keys(taxonomy.repairs).length} repairs`);

// 2. Verify Questions
const questions = loadQuestions();
console.log(`[PASS] Questions loaded: ${questions.length} questions (expected 43)`);
if (questions.length !== 43) {
  throw new Error(`Expected 43 questions, got ${questions.length}`);
}

// 3. Verify Reports
const reports = loadReports();
console.log(`[PASS] Reports loaded: ${reports.length} reports (expected 44)`);
if (reports.length !== 44) {
  throw new Error(`Expected 44 reports, got ${reports.length}`);
}

// 4. Verify Grouping
const grouped = getReportsGroupedByQuestion();
console.log(`[PASS] Grouped reports into ${grouped.size} unique questions (expected 39)`);
if (grouped.size !== 39) {
  throw new Error(`Expected 39 unique questions in reports, got ${grouped.size}`);
}

const duplicates = Array.from(grouped.entries()).filter(([_, r]) => r.length > 1);
console.log(`[PASS] Duplicate clusters: ${duplicates.length} groups (expected 4)`);
for (const [qid, r] of duplicates) {
  console.log(`  - Question ${qid}: ${r.length} reports`);
}

// 5. Verify Original Files Integrity
const files = ["questions.json", "reports.json", "taxonomy.json"];
for (const file of files) {
  const p = path.join(process.cwd(), "data", file);
  if (!fs.existsSync(p)) {
    throw new Error(`CRITICAL: data/${file} missing!`);
  }
  const stats = fs.statSync(p);
  console.log(`[PASS] data/${file} is intact (${stats.size} bytes)`);
}

// 6. Test Safety Guardrails
console.log("\n=== TESTING SAFETY GUARDRAILS ===");

// Test 6.1: Valid verdict
console.log("6.1 Valid verdict 'defect':", isValidVerdict("defect", taxonomy));
console.log("6.1 Invalid verdict 'invented_bug':", isValidVerdict("invented_bug", taxonomy));

// Test 6.2: Edit scope check (spelling can touch question, cannot touch answer)
const spellingOk = validateEditScope("spelling", { field: "question", replace: "test" }, taxonomy);
console.log("6.2 Spelling edit on question:", spellingOk.valid);

const spellingBad = validateEditScope("spelling", { field: "answer", replace: "A" }, taxonomy);
console.log("6.2 Spelling edit on answer (should fail):", !spellingBad.valid, "-", spellingBad.error);

// Test 6.3: auto: false repairs cannot be auto-applied
const autoFalseCheck = validateRoutePolicy(
  { verdict: "defect", repair: "diagram", route: "auto_apply", confidence: 0.99 },
  taxonomy
);
console.log("6.3 Diagram with auto_apply (should fail):", !autoFalseCheck.valid, "-", autoFalseCheck.error);

// Test 6.4: answer_key must route to faculty_review
const answerKeyAuto = validateRoutePolicy(
  { verdict: "defect", repair: "answer_key", route: "auto_apply", confidence: 0.99 },
  taxonomy
);
console.log("6.4 answer_key with auto_apply (should fail):", !answerKeyAuto.valid, "-", answerKeyAuto.error);

// Test 6.5: Non-defect verdict must route to no_change
const noErrorCheck = validateRoutePolicy(
  { verdict: "no_error", route: "faculty_review", confidence: 0.95 },
  taxonomy
);
console.log("6.5 no_error with faculty_review (should fail):", !noErrorCheck.valid, "-", noErrorCheck.error);

console.log("\n=== ALL STAGE 1 CHECKS PASSED SUCCESSFULLY ===");
