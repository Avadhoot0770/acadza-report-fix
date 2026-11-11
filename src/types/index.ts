import { z } from "zod";

// ==========================================
// 1. TAXONOMY TYPES & SCHEMAS (Source of truth)
// ==========================================

export const VerdictKeySchema = z.enum([
  "defect",
  "no_error",
  "display_issue",
  "app_issue",
  "language_mode",
  "already_fixed",
  "not_actionable",
]);
export type VerdictKey = z.infer<typeof VerdictKeySchema>;

export const RepairKeySchema = z.enum([
  "spelling",
  "noise",
  "exam_reference",
  "markup_leak",
  "answer_form",
  "notation",
  "stem_data",
  "option_repair",
  "solution_fix",
  "solution_missing",
  "answer_key",
  "type_mismatch",
  "identical_options",
  "diagram",
  "wrong_question",
  "unsound",
  "wrong_chapter",
  "syllabus",
]);
export type RepairKey = z.infer<typeof RepairKeySchema>;

export const RouteSchema = z.enum([
  "auto_apply",
  "faculty_review",
  "no_change",
]);
export type Route = z.infer<typeof RouteSchema>;

export const EditableFieldSchema = z.enum([
  "question",
  "solution",
  "answer",
  "questionType",
]);
export type EditableField = z.infer<typeof EditableFieldSchema>;

export const ProposedEditSchema = z.object({
  field: EditableFieldSchema,
  find: z.any().optional(),
  replace: z.any(),
});
export type ProposedEdit = z.infer<typeof ProposedEditSchema>;

export const RepairConfigSchema = z.object({
  fields: z.array(z.string()),
  auto: z.boolean(),
  label: z.string(),
});
export type RepairConfig = z.infer<typeof RepairConfigSchema>;

export const TaxonomySchema = z.object({
  _about: z.string().optional(),
  verdicts: z.record(z.string(), z.string()),
  repairs: z.record(z.string(), RepairConfigSchema),
});
export type Taxonomy = z.infer<typeof TaxonomySchema>;

// ==========================================
// 2. STUDENT REPORT TYPES & SCHEMAS
// ==========================================

export const StudentReportSchema = z.object({
  reportId: z.string(),
  questionId: z.string(),
  studentId: z.string(),
  source: z.string(),
  reportedAt: z.string(),
  comment: z.string(),
});
export type StudentReport = z.infer<typeof StudentReportSchema>;

// ==========================================
// 3. QUESTION TYPES & SCHEMAS (Real format)
// ==========================================

export const QuestionTypeSchema = z.enum(["scq", "mcq", "integerQuestion"]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const ErrorHistoryEntrySchema = z.object({
  type: z.string(),
  actor: z.string(),
  at: z.string(),
  note: z.string(),
});
export type ErrorHistoryEntry = z.infer<typeof ErrorHistoryEntrySchema>;

export const QuestionContentPayloadSchema = z.object({
  question: z.string(),
  solution: z.string(),
  answer: z.any(),
  quesImages: z.array(z.string()).default([]),
  solutionImages: z.array(z.string()).default([]),
});
export type QuestionContentPayload = z.infer<typeof QuestionContentPayloadSchema>;

export const QuestionRecordSchema = z.object({
  _id: z.string(),
  qid: z.union([z.string(), z.number()]).nullable().optional(),
  questionType: QuestionTypeSchema,
  subject: z.string(),
  chapter: z.string(),
  concept: z.string().nullable().optional(),
  subConcept: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  error: z.union([z.number(), z.boolean()]).nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  errorHistory: z.array(ErrorHistoryEntrySchema).default([]),
  scq: QuestionContentPayloadSchema.optional(),
  mcq: QuestionContentPayloadSchema.optional(),
  integerQuestion: QuestionContentPayloadSchema.optional(),
});
export type QuestionRecord = z.infer<typeof QuestionRecordSchema>;

// Helper to extract active payload
export function getQuestionPayload(q: QuestionRecord): QuestionContentPayload {
  const payload = q[q.questionType];
  if (!payload) {
    throw new Error(
      `Missing payload for questionType ${q.questionType} on question ${q._id}`
    );
  }
  return payload;
}

// ==========================================
// 4. TRIAGE & RESULTS SCHEMAS (results.json)
// ==========================================

export const TriageResultSchema = z.object({
  reportId: z.string(),
  questionId: z.string(),
  verdict: VerdictKeySchema,
  repair: RepairKeySchema.nullable().optional(),
  edit: ProposedEditSchema.nullable().optional(),
  route: RouteSchema,
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  student_reply: z.string(),
});
export type TriageResult = z.infer<typeof TriageResultSchema>;

// ==========================================
// 5. FACULTY AUDIT & REVIEW SCHEMAS
// ==========================================

export const FacultyActionTypeSchema = z.enum([
  "approve",
  "edit",
  "reject",
  "re_triage",
]);
export type FacultyActionType = z.infer<typeof FacultyActionTypeSchema>;

export const FacultyAuditEntrySchema = z.object({
  id: z.string(),
  questionId: z.string(),
  reportId: z.string().optional(),
  action: FacultyActionTypeSchema,
  actor: z.string(),
  timestamp: z.string(),
  note: z.string().optional(),
  proposedEdit: ProposedEditSchema.optional(),
  appliedEdit: ProposedEditSchema.optional(),
});
export type FacultyAuditEntry = z.infer<typeof FacultyAuditEntrySchema>;

// Grouped question view model for the queue
export interface QuestionGroup {
  questionId: string;
  question: QuestionRecord;
  reports: StudentReport[];
  triageResults: TriageResult[];
  status: "pending_review" | "approved" | "edited" | "rejected" | "auto_applied";
  urgency: "critical" | "high" | "medium" | "low" | "info";
  auditEntries: FacultyAuditEntry[];
}
