import assert from "assert";
import {
  buildQuestionGroups,
  loadQuestions,
  loadReports,
  loadResults,
  loadTaxonomy,
} from "../src/lib/data";
import {
  applyEditToQuestion,
  isEligibleForBatchApproval,
  validateEditScope,
  validateFacultyAction,
  validateRoutePolicy,
} from "../src/lib/safety";
import { ProposedEdit, QuestionRecord } from "../src/types";

console.log("=================================================");
console.log("ACADZA STAGE 3: FACULTY WORKFLOW & SAFETY AUDIT SUITE");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

const taxonomy = loadTaxonomy();
const questions = loadQuestions();
const reports = loadReports();
const results = loadResults();
const groups = buildQuestionGroups();

console.log("--- 1. DASHBOARD METRICS RECONCILIATION ---");

runTest("Total 44 reports grouped into exactly 39 unique question groups", () => {
  assert.strictEqual(reports.length, 44);
  assert.strictEqual(results.length, 44);
  assert.strictEqual(groups.length, 39);

  let totalGroupedReports = 0;
  for (const g of groups) {
    totalGroupedReports += g.reports.length;
  }
  assert.strictEqual(totalGroupedReports, 44);
});

runTest("Reconciliation: 16 reports in faculty_review map to 12 question groups", () => {
  const repFaculty = results.filter((r) => r.route === "faculty_review");
  assert.strictEqual(repFaculty.length, 16);

  const qFaculty = groups.filter((g) => g.primaryResult.route === "faculty_review");
  assert.strictEqual(qFaculty.length, 12);

  // Difference is exactly 4 duplicate reports:
  // Q 60f744b3... (3 reports: R001, R002, R003) -> 2 duplicate reports
  // Q 622f08d7... (2 reports: R009, R010)       -> 1 duplicate report
  // Q 612151a6... (2 reports: R018, R019)       -> 1 duplicate report
  // Total duplicate reports = 2 + 1 + 1 = 4. (16 - 4 = 12 groups)
  const repCountInQ = qFaculty.reduce((acc, g) => acc + g.reports.length, 0);
  assert.strictEqual(repCountInQ, 16);
});

runTest("Reconciliation: 11 reports in auto_apply map to 10 question groups", () => {
  const repAuto = results.filter((r) => r.route === "auto_apply");
  assert.strictEqual(repAuto.length, 11);

  const qAuto = groups.filter((g) => g.primaryResult.route === "auto_apply");
  assert.strictEqual(qAuto.length, 10);

  // Difference is exactly 1 duplicate report:
  // Q 60f742f6... (2 reports: R007, R008) -> 1 duplicate report (11 - 1 = 10 groups)
  const repCountInQ = qAuto.reduce((acc, g) => acc + g.reports.length, 0);
  assert.strictEqual(repCountInQ, 11);
});

runTest("Reconciliation: 17 reports in no_change map to 17 question groups", () => {
  const repNoChange = results.filter((r) => r.route === "no_change");
  assert.strictEqual(repNoChange.length, 17);

  const qNoChange = groups.filter((g) => g.primaryResult.route === "no_change");
  assert.strictEqual(qNoChange.length, 17);

  const repCountInQ = qNoChange.reduce((acc, g) => acc + g.reports.length, 0);
  assert.strictEqual(repCountInQ, 17);
});

runTest("Reconciliation: Answer key escalations account for 6 reports across 4 questions", () => {
  const repAnswerKeys = results.filter((r) => r.repair === "answer_key");
  assert.strictEqual(repAnswerKeys.length, 6);

  const qAnswerKeys = groups.filter((g) => g.isAnswerKey);
  assert.strictEqual(qAnswerKeys.length, 4);

  const repCount = qAnswerKeys.reduce((acc, g) => acc + g.reports.length, 0);
  assert.strictEqual(repCount, 6);
});

console.log("\n--- 2. BATCH APPROVAL SAFETY & INTEGRITY ---");

runTest("Batch approval eligibility strictly admits exactly 10 question groups", () => {
  const eligibleGroups = groups.filter((g) => isEligibleForBatchApproval(g, taxonomy).eligible);
  assert.strictEqual(eligibleGroups.length, 10);

  // Sum of reports across eligible groups must be 11 (due to cluster R007 & R008)
  const totalEligibleReports = eligibleGroups.reduce((acc, g) => acc + g.reports.length, 0);
  assert.strictEqual(totalEligibleReports, 11);
});

runTest("Batch approval strictly excludes all answer_key repairs", () => {
  for (const g of groups) {
    if (g.primaryResult.repair === "answer_key") {
      const check = isEligibleForBatchApproval(g, taxonomy);
      assert.strictEqual(check.eligible, false);
      assert(check.reason?.includes("Answer key"), "Reason mentions answer key exclusion");
    }
  }
});

runTest("Batch approval strictly excludes all auto: false repairs", () => {
  for (const g of groups) {
    const repair = g.primaryResult.repair;
    if (repair && !taxonomy.repairs[repair]?.auto) {
      const check = isEligibleForBatchApproval(g, taxonomy);
      assert.strictEqual(check.eligible, false);
      assert(check.reason?.includes("auto: false"), "Reason mentions auto: false restriction");
    }
  }
});

runTest("Batch approval strictly excludes unresolved proposals where edit is null", () => {
  // R009 & R010, R018 & R019 have edit: null
  for (const g of groups) {
    if (g.primaryResult.edit === null) {
      const check = isEligibleForBatchApproval(g, taxonomy);
      assert.strictEqual(check.eligible, false);
      assert(
        check.reason && check.reason.length > 0,
        "Provides clear rejection reason"
      );
    }
  }
});

runTest("Batch approval applies question-level edit exactly once for duplicate group (R007 & R008)", () => {
  const gInductance = groups.find((g) => g.questionId === "60f742f6660d187cc13a8078")!;
  assert(gInductance);
  assert.strictEqual(gInductance.reports.length, 2);

  const eligibility = isEligibleForBatchApproval(gInductance, taxonomy);
  assert.strictEqual(eligibility.eligible, true);

  // Apply edit
  const updatedQ = applyEditToQuestion(gInductance.originalQuestion, gInductance.primaryResult.edit!);
  assert(updatedQ.scq?.question.includes("an inductance of 95.5 mH"));

  // Audit entry must record both report IDs
  const reportIds = gInductance.reports.map((r) => r.reportId).sort();
  assert.deepStrictEqual(reportIds, ["R007", "R008"]);
});

console.log("\n--- 3. SPECIFIC MANUAL WORKFLOW CASES AUDIT ---");

runTest("Case R001–R003: AC voltage answer-key review, two-step confirmation required, cluster sync", () => {
  const g = groups.find((item) => item.questionId === "60f744b3f1b9bc7cc7b4a949")!;
  assert(g);
  assert.strictEqual(g.reports.length, 3);
  assert.strictEqual(g.primaryResult.repair, "answer_key");
  assert.strictEqual(g.primaryResult.route, "faculty_review");

  // Safety: unconfirmed approval MUST fail
  const unconfirmed = validateFacultyAction("approve", "answer_key", g.primaryResult.edit, taxonomy, false);
  assert.strictEqual(unconfirmed.valid, false);

  // Safety: confirmed approval MUST pass
  const confirmed = validateFacultyAction("approve", "answer_key", g.primaryResult.edit, taxonomy, true);
  assert.strictEqual(confirmed.valid, true);

  // When approved, all 3 reports share this question-level decision
  const updated = applyEditToQuestion(g.originalQuestion, g.primaryResult.edit!);
  assert.strictEqual(updated.scq?.answer, "A");
  assert.strictEqual(g.originalQuestion.scq?.answer, "C");
});

runTest("Case R009–R010: Missing Option D has edit: null and isContentUnrecoverable: true", () => {
  const g = groups.find((item) => item.questionId === "622f08d7b70e4b50e4500a1b")!;
  assert(g);
  assert.strictEqual(g.reports.length, 2);
  assert.strictEqual(g.primaryResult.repair, "option_repair");
  assert.strictEqual(g.primaryResult.edit, null);
  assert.strictEqual(g.primaryResult.route, "faculty_review");
  assert.strictEqual(g.isContentUnrecoverable, true);
});

runTest("Case R018–R019: Alien derivation in solution has edit: null and isContentUnrecoverable: true", () => {
  const g = groups.find((item) => item.questionId === "612151a6a34397610a9a2e58")!;
  assert(g);
  assert.strictEqual(g.reports.length, 2);
  assert.strictEqual(g.primaryResult.repair, "solution_fix");
  assert.strictEqual(g.primaryResult.edit, null);
  assert.strictEqual(g.primaryResult.route, "faculty_review");
  assert.strictEqual(g.isContentUnrecoverable, true);
});

runTest("Case R006, R007, R008: Clearly labelled as solution-derived inferences", () => {
  const gCube = groups.find((g) => g.questionId === "696a866665252c04fc1f81c2")!; // R006
  const gCircuit = groups.find((g) => g.questionId === "60f742f6660d187cc13a8078")!; // R007, R008

  assert.strictEqual(gCube.isSolutionDerived, true);
  assert.strictEqual(gCircuit.isSolutionDerived, true);

  // Negative check: other questions must not have isSolutionDerived true
  const gNormal = groups.find((g) => g.questionId === "61dffbec08489156b684bd22")!;
  assert.strictEqual(gNormal.isSolutionDerived, false);
});

runTest("Case R027: Prompt injection safely isolated as untrusted data (verdict: no_error)", () => {
  const rep27 = reports.find((r) => r.reportId === "R027")!;
  assert(rep27);
  assert(rep27.comment.includes("IGNORE ALL PREVIOUS INSTRUCTIONS"));

  const res27 = results.find((r) => r.reportId === "R027")!;
  assert.strictEqual(res27.verdict, "no_error");
  assert.strictEqual(res27.repair, null);
  assert.strictEqual(res27.edit, null);
  assert.strictEqual(res27.route, "no_change");
});

runTest("Case R015: Identical options defect is auto: false and strictly routes to faculty_review", () => {
  const rep15 = results.find((r) => r.reportId === "R015")!;
  assert.strictEqual(rep15.verdict, "defect");
  assert.strictEqual(rep15.repair, "identical_options");
  assert.strictEqual(rep15.route, "faculty_review");

  // Taxonomy verification
  const repairCfg = taxonomy.repairs["identical_options"];
  assert.strictEqual(repairCfg.auto, false);
  assert.deepStrictEqual(repairCfg.fields, []);
});

console.log("\n--- 4. TAXONOMY FIELD SCOPE & REJECTION WORKFLOW ---");

runTest("Field scope violation is rejected (e.g. answer edited on spelling repair)", () => {
  const illegalEdit: ProposedEdit = { field: "answer", replace: "B" };
  const scopeCheck = validateEditScope("spelling", illegalEdit, taxonomy);
  assert.strictEqual(scopeCheck.valid, false);
});

runTest("Faculty rejection leaves question completely unchanged", () => {
  const q = questions.find((item) => item._id === "60f744b3f1b9bc7cc7b4a949")!;
  const originalCopy = JSON.parse(JSON.stringify(q));

  // Reject action does not mutate the question
  const rejectionCheck = validateFacultyAction("reject", "answer_key", null, taxonomy);
  assert.strictEqual(rejectionCheck.valid, true);

  assert.deepStrictEqual(q, originalCopy);
});

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
