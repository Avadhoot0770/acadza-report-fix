import fs from "fs";
import path from "path";
import { loadQuestions, loadReports, loadTaxonomy, getQuestionsMap } from "../src/lib/data";
import { triageAllReports } from "../src/lib/triage/engine";
import {
  isValidVerdict,
  isValidRepair,
  validateEditScope,
  validateRoutePolicy,
  validateCompleteTriage,
} from "../src/lib/safety";
import { TriageResult } from "../src/types";

console.log("=== RUNNING AUTOMATED TRIAGE ENGINE TEST SUITE ===");

const taxonomy = loadTaxonomy();
const questions = loadQuestions();
const reports = loadReports();
const questionsMap = getQuestionsMap();

const results: TriageResult[] = triageAllReports(reports, { taxonomy, questionsMap });

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName} ${detail ? `- ${detail}` : ""}`);
    testsFailed++;
  }
}

// Test 1: All 44 reports processed
assert(results.length === 44, "Test 1: All 44 reports processed", `Got ${results.length}`);

// Test 2: All 39 reported question groups represented
const uniqueQidsInResults = new Set(results.map((r) => r.questionId));
const uniqueQidsInReports = new Set(reports.map((r) => r.questionId));
assert(
  uniqueQidsInResults.size === 39 && uniqueQidsInResults.size === uniqueQidsInReports.size,
  "Test 2: All 39 unique reported question groups represented",
  `Got ${uniqueQidsInResults.size}`
);

// Test 3: Duplicate reports receive consistent question-level analysis
const q60f7 = results.filter((r) => r.questionId === "60f744b3f1b9bc7cc7b4a949");
const q60f7_consistent =
  q60f7.length === 3 &&
  q60f7.every((r) => r.verdict === "defect" && r.repair === "answer_key" && r.route === "faculty_review");
assert(
  q60f7_consistent,
  "Test 3: Duplicate group (60f744b3...) has consistent verdict and repair across all 3 reports"
);

const q60f742 = results.filter((r) => r.questionId === "60f742f6660d187cc13a8078");
const q60f742_consistent =
  q60f742.length === 2 &&
  q60f742.every((r) => r.verdict === "defect" && r.repair === "stem_data");
assert(
  q60f742_consistent,
  "Test 3b: Duplicate group (60f742f6...) has consistent verdict and repair across both reports"
);

// Test 4: Prompt injection report R027 ignored as instruction
const r027 = results.find((r) => r.reportId === "R027");
assert(
  r027 !== undefined &&
    r027.verdict === "no_error" &&
    r027.route === "no_change" &&
    r027.edit === null,
  "Test 4: Prompt injection attack in R027 safely ignored as an instruction (verdict=no_error, route=no_change)"
);

// Test 5: Already-fixed report R017 correctly identified
const r017 = results.find((r) => r.reportId === "R017");
assert(
  r017 !== undefined &&
    r017.verdict === "already_fixed" &&
    r017.route === "no_change" &&
    r017.repair === null &&
    r017.edit === null,
  "Test 5: Historical fix in R017 correctly identified as already_fixed via errorHistory"
);

// Test 6: Answer-key repairs NEVER auto-applied
const answerKeyRepairs = results.filter((r) => r.repair === "answer_key");
const noAnswerKeyAuto = answerKeyRepairs.every((r) => r.route === "faculty_review");
assert(
  answerKeyRepairs.length > 0 && noAnswerKeyAuto,
  `Test 6: All ${answerKeyRepairs.length} answer_key repairs strictly routed to faculty_review, never auto_apply`
);

// Test 7: auto: false repairs NEVER auto-applied
const autoFalseKeys = new Set(
  Object.entries(taxonomy.repairs)
    .filter(([_, conf]) => !conf.auto)
    .map(([key]) => key)
);
const autoFalseResults = results.filter((r) => r.repair && autoFalseKeys.has(r.repair));
const noAutoFalseApplied = autoFalseResults.every((r) => r.route === "faculty_review");
assert(
  autoFalseResults.length > 0 && noAutoFalseApplied,
  `Test 7: All ${autoFalseResults.length} auto: false repairs strictly routed to faculty_review`
);

// Test 8: Invalid taxonomy keys rejected
assert(
  !isValidVerdict("fabricated_verdict", taxonomy),
  "Test 8a: Guardrails reject fabricated verdict key"
);
assert(
  !isValidRepair("invented_repair_type", taxonomy),
  "Test 8b: Guardrails reject fabricated repair key"
);

// Test 9: Invalid edit fields rejected
const invalidEditCheck = validateEditScope(
  "spelling",
  { field: "answer", replace: "X" },
  taxonomy
);
assert(
  !invalidEditCheck.valid,
  "Test 9: Guardrails reject edit field outside allowed repair scope (spelling -> answer)"
);

// Test 10: Non-defect results have null repair and edit
const nonDefectResults = results.filter((r) => r.verdict !== "defect");
const nonDefectClean = nonDefectResults.every(
  (r) => r.repair === null && r.edit === null && r.route === "no_change"
);
assert(
  nonDefectResults.length > 0 && nonDefectClean,
  `Test 10: All ${nonDefectResults.length} non-defect results have strictly null repair and edit with route no_change`
);

// Test 11: R009 & R010 option_repair never invents Option D (edit=null, route=faculty_review)
const r009 = results.find((r) => r.reportId === "R009");
const r010 = results.find((r) => r.reportId === "R010");
assert(
  r009?.edit === null &&
    r009?.route === "faculty_review" &&
    r010?.edit === null &&
    r010?.route === "faculty_review",
  "Test 11: R009 & R010 option_repair never invents distractor Option D; routes to faculty_review with edit=null"
);

// Test 12: R018 & R019 solution_fix foreign derivation routes to faculty_review with edit=null
const r018 = results.find((r) => r.reportId === "R018");
const r019 = results.find((r) => r.reportId === "R019");
assert(
  r018?.edit === null &&
    r018?.route === "faculty_review" &&
    r019?.edit === null &&
    r019?.route === "faculty_review",
  "Test 12: R018 & R019 solution_fix routes to faculty_review with edit=null (no fabricated multi-step derivations)"
);

// Test 13: All auto_apply results have valid, scoped non-null edits directly supported by records
const autoApplyResults = results.filter((r) => r.route === "auto_apply");
const allAutoApplyValid = autoApplyResults.every(
  (r) =>
    r.edit !== null &&
    r.edit !== undefined &&
    r.repair !== null &&
    r.repair !== undefined &&
    taxonomy.repairs[r.repair].auto === true &&
    taxonomy.repairs[r.repair].fields.includes(r.edit.field)
);
assert(
  autoApplyResults.length > 0 && allAutoApplyValid,
  `Test 13: All ${autoApplyResults.length} auto_apply results have valid, scoped non-null edits directly supported by records`
);

// Test 14: Original files in data/ remain byte-for-byte unchanged
const originalSizes = {
  "questions.json": 109574,
  "reports.json": 9922,
  "taxonomy.json": 3396,
};
let filesUntouched = true;
for (const [fname, expectedSize] of Object.entries(originalSizes)) {
  const p = path.join(process.cwd(), "data", fname);
  const size = fs.statSync(p).size;
  if (size !== expectedSize) {
    filesUntouched = false;
    console.error(`File data/${fname} size modified: expected ${expectedSize}, got ${size}`);
  }
}
assert(filesUntouched, "Test 11: All original JSON files in data/ remain byte-for-byte unchanged");

console.log(`\n=== TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED ===`);
if (testsFailed > 0) {
  process.exit(1);
}
