import fs from "fs";
import path from "path";
import {
  QuestionRecord,
  QuestionRecordSchema,
  StudentReport,
  StudentReportSchema,
  Taxonomy,
  TaxonomySchema,
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
