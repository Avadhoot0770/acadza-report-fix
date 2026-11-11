import fs from "fs";
import path from "path";
import {
  FacultyAuditEntry,
  QuestionGroup,
  QuestionRecord,
  QuestionRecordSchema,
  ReviewStatus,
  StudentReport,
  StudentReportSchema,
  Taxonomy,
  TaxonomySchema,
  TriageResult,
  TriageResultSchema,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Loads and validates taxonomy.json
 */
export function loadTaxonomy(): Taxonomy {
  const filePath = path.join(DATA_DIR, "taxonomy.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  return TaxonomySchema.parse(json);
}

/**
 * Loads and validates all questions from questions.json
 * Preserves the exact nested payload per questionType (scq / mcq / integerQuestion).
 */
export function loadQuestions(): QuestionRecord[] {
  const filePath = path.join(DATA_DIR, "questions.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json)) {
    throw new Error("questions.json must contain an array of questions");
  }
  return json.map((q) => QuestionRecordSchema.parse(q));
}

/**
 * Loads and validates all student reports from reports.json
 */
export function loadReports(): StudentReport[] {
  const filePath = path.join(DATA_DIR, "reports.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json)) {
    throw new Error("reports.json must contain an array of reports");
  }
  return json.map((r) => StudentReportSchema.parse(r));
}

/**
 * Loads and validates all triage results from results.json
 */
export function loadResults(): TriageResult[] {
  const filePath = path.join(process.cwd(), "results.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("results.json does not exist. Please run triage first.");
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json)) {
    throw new Error("results.json must contain an array of triage results");
  }
  return json.map((r) => TriageResultSchema.parse(r));
}

/**
 * Returns a lookup map from questionId (_id) to QuestionRecord
 */
export function getQuestionsMap(): Map<string, QuestionRecord> {
  const questions = loadQuestions();
  const map = new Map<string, QuestionRecord>();
  for (const q of questions) {
    map.set(q._id, q);
  }
  return map;
}

/**
 * Groups reports by questionId
 */
export function getReportsGroupedByQuestion(): Map<string, StudentReport[]> {
  const reports = loadReports();
  const grouped = new Map<string, StudentReport[]>();
  for (const r of reports) {
    const list = grouped.get(r.questionId) || [];
    list.push(r);
    grouped.set(r.questionId, list);
  }
  return grouped;
}

/**
 * Assembles unified QuestionGroup objects combining Questions, Reports, Triage Results,
 * and historical Audit logs.
 */
export function buildQuestionGroups(): QuestionGroup[] {
  const questionsMap = getQuestionsMap();
  const reports = loadReports();
  const results = loadResults();

  // Group reports by questionId
  const reportsByQid = new Map<string, StudentReport[]>();
  for (const r of reports) {
    const list = reportsByQid.get(r.questionId) || [];
    list.push(r);
    reportsByQid.set(r.questionId, list);
  }

  // Group triage results by questionId
  const resultsByQid = new Map<string, TriageResult[]>();
  for (const res of results) {
    const list = resultsByQid.get(res.questionId) || [];
    list.push(res);
    resultsByQid.set(res.questionId, list);
  }

  const groups: QuestionGroup[] = [];

  for (const [qid, reps] of Array.from(reportsByQid.entries())) {
    const q = questionsMap.get(qid);
    if (!q) continue;

    const triageResults = resultsByQid.get(qid) || [];
    const primaryResult = triageResults[0] || {
      reportId: reps[0].reportId,
      questionId: qid,
      verdict: "not_actionable" as const,
      repair: null,
      edit: null,
      route: "no_change" as const,
      confidence: 0.5,
      evidence: "No automated triage result available",
      student_reply: "We have received your report and our team is investigating.",
    };

    const isDuplicate = reps.length > 1;
    const isAnswerKey = primaryResult.repair === "answer_key";
    const isSolutionDerived =
      qid === "696a866665252c04fc1f81c2" || qid === "60f742f6660d187cc13a8078";
    const isContentUnrecoverable =
      (primaryResult.repair === "option_repair" ||
        primaryResult.repair === "solution_fix") &&
      !primaryResult.edit;

    let status: ReviewStatus = "pending_review";
    if (primaryResult.route === "no_change") {
      status = "no_action_needed";
    } else if (primaryResult.route === "auto_apply") {
      status = "auto_applied";
    } else {
      status = "pending_review";
    }

    let urgency: "critical" | "high" | "medium" | "low" | "info" = "medium";
    if (isAnswerKey) {
      urgency = "critical";
    } else if (isDuplicate) {
      urgency = "high";
    } else if (primaryResult.route === "faculty_review") {
      urgency = "high";
    } else if (primaryResult.route === "auto_apply") {
      urgency = "medium";
    } else if (
      primaryResult.verdict === "display_issue" ||
      primaryResult.verdict === "app_issue" ||
      primaryResult.verdict === "language_mode"
    ) {
      urgency = "info";
    } else {
      urgency = "low";
    }

    // Historical audit entries from question.errorHistory
    const auditEntries: FacultyAuditEntry[] = (q.errorHistory || []).map(
      (h, idx) => ({
        id: `hist-${qid}-${idx}`,
        questionId: qid,
        action: "historical" as const,
        actor: h.actor,
        timestamp: h.at,
        note: `[Historical Fix] Type: ${h.type} – ${h.note}`,
      })
    );

    groups.push({
      questionId: qid,
      question: JSON.parse(JSON.stringify(q)),
      originalQuestion: JSON.parse(JSON.stringify(q)),
      reports: reps,
      triageResults,
      primaryResult,
      status,
      urgency,
      isDuplicate,
      isAnswerKey,
      isSolutionDerived,
      isContentUnrecoverable,
      auditEntries,
      facultyDecision: null,
    });
  }

  // Sort groups: Critical answer keys first, then multi-report duplicates, then pending reviews, then auto_apply, then no_change
  const urgencyWeight: Record<string, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    info: 2,
    low: 1,
  };

  groups.sort((a, b) => {
    if (urgencyWeight[a.urgency] !== urgencyWeight[b.urgency]) {
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    }
    return b.reports.length - a.reports.length;
  });

  return groups;
}
