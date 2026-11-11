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
  validateEditScope,
  validateFacultyAction,
  validateRoutePolicy,
} from "../src/lib/safety";
import { ProposedEdit, QuestionRecord } from "../src/types";

console.log("=================================================");
console.log("ACADZA STAGE 3: FACULTY ACTION & SAFETY TEST SUITE");
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

console.log("--- 1. DATASET INTEGRITY & CLUSTERING ---");

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

runTest("Duplicate clusters properly identified (4 duplicate groups)", () => {
  const duplicates = groups.filter((g) => g.isDuplicate);
  assert.strictEqual(duplicates.length, 4);

  // Group 1: 60f744b3f1b9bc7cc7b4a949 has 3 reports
  const g3 = groups.find((g) => g.questionId === "60f744b3f1b9bc7cc7b4a949");
  assert(g3, "Group 60f744b3f1b9bc7cc7b4a949 exists");
  assert.strictEqual(g3.reports.length, 3);
  const repIds = g3.reports.map((r) => r.reportId).sort();
  assert.deepStrictEqual(repIds, ["R001", "R002", "R003"]);
});

console.log("\n--- 2. ANSWER KEY SAFETY & CONFIRMATION ---");

runTest("Answer key approval requires explicit confirmation", () => {
  const edit: ProposedEdit = { field: "answer", find: "C", replace: "A" };
  // Without confirmation flag
  const checkUnconfirmed = validateFacultyAction(
    "approve",
    "answer_key",
    edit,
    taxonomy,
    false
  );
  assert.strictEqual(checkUnconfirmed.valid, false);
  assert(
    checkUnconfirmed.error?.includes("explicitly confirm"),
    "Error mentions confirmation requirement"
  );

  // With confirmation flag
  const checkConfirmed = validateFacultyAction(
    "approve",
    "answer_key",
    edit,
    taxonomy,
    true
  );
  assert.strictEqual(checkConfirmed.valid, true);
});

runTest("Answer key repair can NEVER route to auto_apply", () => {
  const check = validateRoutePolicy(
    {
      verdict: "defect",
      repair: "answer_key",
      edit: { field: "answer", find: "C", replace: "A" },
      route: "auto_apply",
      confidence: 0.99,
    },
    taxonomy
  );
  assert.strictEqual(check.valid, false);
  assert(
    check.error?.includes("faculty_review"),
    "Error requires faculty_review route"
  );
});

console.log("\n--- 3. TAXONOMY FIELD SCOPE RESTRICTIONS ---");

runTest("Field scope violation is rejected (e.g. answer edited on spelling repair)", () => {
  // spelling repair only allows 'question' and 'solution'
  const illegalEdit: ProposedEdit = { field: "answer", replace: "B" };
  const scopeCheck = validateEditScope("spelling", illegalEdit, taxonomy);
  assert.strictEqual(scopeCheck.valid, false);
  assert(
    scopeCheck.error?.includes("is not allowed for repair 'spelling'"),
    "Error explains field restriction"
  );
});

runTest("Repair with fields: [] rejects automated edits (e.g. unsound / wrong_question)", () => {
  const edit: ProposedEdit = { field: "question", replace: "new text" };
  const scopeCheck = validateEditScope("unsound", edit, taxonomy);
  assert.strictEqual(scopeCheck.valid, false);
  assert(
    scopeCheck.error?.includes("allowed fields: []"),
    "Error notes human decision / empty fields"
  );
});

runTest("Valid edit within allowed scope passes validation", () => {
  const validEdit: ProposedEdit = {
    field: "question",
    find: "Epithellial tisue",
    replace: "Epithelial tissue",
  };
  const scopeCheck = validateEditScope("spelling", validEdit, taxonomy);
  assert.strictEqual(scopeCheck.valid, true);
});

console.log("\n--- 4. IN-MEMORY QUESTION PATCH APPLICATION ---");

runTest("applyEditToQuestion cleanly updates answer key for SCQ", () => {
  const q = questions.find((item) => item._id === "60f744b3f1b9bc7cc7b4a949")!;
  assert(q, "Target question exists");
  assert.strictEqual(q.scq?.answer, "C");

  const edit: ProposedEdit = { field: "answer", find: "C", replace: "A" };
  const updated = applyEditToQuestion(q, edit);

  assert.strictEqual(updated.scq?.answer, "A");
  // Original question in memory remains unchanged
  assert.strictEqual(q.scq?.answer, "C");
});

runTest("applyEditToQuestion cleanly updates integer question answer", () => {
  const q = questions.find((item) => item._id === "68dea616d0cda73d07e93ae6")!;
  assert(q, "Target integer question exists");
  assert.strictEqual(String(q.integerQuestion?.answer), "2");

  const edit: ProposedEdit = { field: "answer", find: "2", replace: 1 };
  const updated = applyEditToQuestion(q, edit);

  assert.strictEqual(updated.integerQuestion?.answer, 1);
  assert.strictEqual(String(q.integerQuestion?.answer), "2");
});

runTest("applyEditToQuestion surgically replaces stem substring without affecting surrounding text", () => {
  const q = questions.find((item) => item._id === "61dffbec08489156b684bd22")!;
  assert(q, "Target question exists");
  assert(q.scq?.question.includes("Epithellial tisue"));

  const edit: ProposedEdit = {
    field: "question",
    find: "Epithellial tisue",
    replace: "Epithelial tissue",
  };
  const updated = applyEditToQuestion(q, edit);

  assert(
    updated.scq?.question.includes("Epithelial tissue"),
    "Updated question contains corrected text"
  );
  assert(
    !updated.scq?.question.includes("Epithellial tisue"),
    "Updated question no longer contains typo"
  );
  // Rest of question remains identical
  assert.strictEqual(
    q.scq?.solution,
    updated.scq?.solution,
    "Solution is completely untouched"
  );
});

console.log("\n--- 5. QUESTION GROUP SYNCHRONIZATION ---");

runTest("Clustered duplicate reports all receive the same question-level decision", () => {
  // Q 60f744b3f1b9bc7cc7b4a949 has 3 reports: R001, R002, R003
  const g = groups.find((item) => item.questionId === "60f744b3f1b9bc7cc7b4a949")!;
  assert(g);
  assert.strictEqual(g.reports.length, 3);
  assert.strictEqual(g.primaryResult.repair, "answer_key");

  // In the group model, all 3 reports are bound to this group's decision
  const reportIdsInGroup = g.reports.map((r) => r.reportId);
  assert(reportIdsInGroup.includes("R001"));
  assert(reportIdsInGroup.includes("R002"));
  assert(reportIdsInGroup.includes("R003"));
});

runTest("Solution-derived inference flags correctly attached to R006, R007, R008", () => {
  const gRL = groups.find((g) => g.questionId === "696a866665252c04fc1f81c2"); // R006
  const gLR = groups.find((g) => g.questionId === "60f742f6660d187cc13a8078"); // R007, R008

  assert(gRL?.isSolutionDerived, "R006 flagged as solution derived");
  assert(gLR?.isSolutionDerived, "R007 & R008 flagged as solution derived");

  // Other questions must not have this flag
  const gOther = groups.find((g) => g.questionId === "61dffbec08489156b684bd22");
  assert.strictEqual(gOther?.isSolutionDerived, false);
});

runTest("Unrecoverable distractors / alien derivations correctly flagged with edit: null", () => {
  const gMissingOption = groups.find(
    (g) => g.questionId === "622f08d7b70e4b50e4500a1b"
  ); // R009, R010
  const gAlienDeriv = groups.find(
    (g) => g.questionId === "612151a6a34397610a9a2e58"
  ); // R018, R019

  assert(gMissingOption?.isContentUnrecoverable, "R009/R010 flagged unrecoverable");
  assert.strictEqual(gMissingOption?.primaryResult.edit, null);
  assert.strictEqual(gMissingOption?.primaryResult.route, "faculty_review");

  assert(gAlienDeriv?.isContentUnrecoverable, "R018/R019 flagged unrecoverable");
  assert.strictEqual(gAlienDeriv?.primaryResult.edit, null);
  assert.strictEqual(gAlienDeriv?.primaryResult.route, "faculty_review");
});

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
