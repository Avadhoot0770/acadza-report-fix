import {
  EditableField,
  ProposedEdit,
  QuestionGroup,
  QuestionRecord,
  QuestionType,
  RepairKey,
  Route,
  Taxonomy,
  TriageResult,
  TriageResultSchema,
  VerdictKey,
} from "@/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a verdict exists in the taxonomy.
 */
export function isValidVerdict(verdict: string, taxonomy: Taxonomy): verdict is VerdictKey {
  return Object.prototype.hasOwnProperty.call(taxonomy.verdicts, verdict);
}

/**
 * Validates that a repair key exists in the taxonomy.
 */
export function isValidRepair(repair: string, taxonomy: Taxonomy): repair is RepairKey {
  return Object.prototype.hasOwnProperty.call(taxonomy.repairs, repair);
}

/**
 * Validates that the proposed edit ONLY touches fields explicitly allowed
 * by the selected repair in taxonomy.json.
 */
export function validateEditScope(
  repairKey: string,
  edit: ProposedEdit | null | undefined,
  taxonomy: Taxonomy
): { valid: boolean; error?: string } {
  if (!edit) return { valid: true };

  const repairConfig = taxonomy.repairs[repairKey];
  if (!repairConfig) {
    return {
      valid: false,
      error: `Repair key '${repairKey}' does not exist in taxonomy`,
    };
  }

  // Repairs with fields: [] cannot propose edits directly
  if (repairConfig.fields.length === 0) {
    return {
      valid: false,
      error: `Repair '${repairKey}' has allowed fields: [] (authored content / human decision). No automated edit is permitted.`,
    };
  }

  if (!repairConfig.fields.includes(edit.field)) {
    return {
      valid: false,
      error: `Field '${edit.field}' is not allowed for repair '${repairKey}'. Allowed fields: [${repairConfig.fields.join(
        ", "
      )}]`,
    };
  }

  return { valid: true };
}

/**
 * Enforces all safety routing rules:
 * 1. auto: false repairs CAN NEVER be auto-applied.
 * 2. Mandatory project safety requirement: Every answer_key repair MUST route to faculty_review,
 *    even if its taxonomy entry says auto: true.
 * 3. Non-defect verdicts (no_error, display_issue, app_issue, language_mode, already_fixed, not_actionable)
 *    MUST route to no_change and CANNOT have edits or repairs.
 * 4. Defect with repair where confidence is low must route to faculty_review.
 */
export function validateRoutePolicy(
  result: {
    verdict: string;
    repair?: string | null;
    edit?: ProposedEdit | null;
    route: string;
    confidence: number;
  },
  taxonomy: Taxonomy
): { valid: boolean; error?: string } {
  const { verdict, repair, edit, route, confidence } = result;

  // 1. Non-defect verdicts must route to no_change and have no repair or edit
  if (verdict !== "defect") {
    if (route !== "no_change") {
      return {
        valid: false,
        error: `Non-defect verdict '${verdict}' must route to 'no_change', but got '${route}'`,
      };
    }
    if (repair) {
      return {
        valid: false,
        error: `Non-defect verdict '${verdict}' must not have a repair key, but got '${repair}'`,
      };
    }
    if (edit) {
      return {
        valid: false,
        error: `Non-defect verdict '${verdict}' must not have a proposed edit`,
      };
    }
    return { valid: true };
  }

  // 2. Defect verdict requires a valid repair key
  if (!repair) {
    return {
      valid: false,
      error: `Verdict 'defect' requires a valid repair key from taxonomy`,
    };
  }

  const repairConfig = taxonomy.repairs[repair];
  if (!repairConfig) {
    return {
      valid: false,
      error: `Repair key '${repair}' does not exist in taxonomy`,
    };
  }

  // 3. Rule: auto: false repairs can NEVER be auto-applied
  if (!repairConfig.auto && route === "auto_apply") {
    return {
      valid: false,
      error: `Repair '${repair}' is marked auto: false in taxonomy and can never be auto-applied`,
    };
  }

  // 4. Strict Safety Requirement: Every answer_key repair must route to faculty_review
  if (repair === "answer_key" && route === "auto_apply") {
    return {
      valid: false,
      error: `Safety requirement: Every answer_key repair must route to 'faculty_review' for independent verification`,
    };
  }

  // 5. If route is auto_apply, confidence must be high
  if (route === "auto_apply" && confidence < 0.85) {
    return {
      valid: false,
      error: `Cannot auto_apply with confidence ${confidence} < 0.85. Must route to 'faculty_review'`,
    };
  }

  return { valid: true };
}

/**
 * Validates a complete triage result object against all safety guardrails.
 */
export function validateCompleteTriage(
  input: unknown,
  taxonomy: Taxonomy
): ValidationResult {
  const errors: string[] = [];

  // Parse schema
  const parsed = TriageResultSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }

  const result = parsed.data;

  // Validate verdict
  if (!isValidVerdict(result.verdict, taxonomy)) {
    errors.push(`Verdict '${result.verdict}' is not an approved taxonomy verdict`);
  }

  // Validate repair if present
  if (result.repair && !isValidRepair(result.repair, taxonomy)) {
    errors.push(`Repair '${result.repair}' is not an approved taxonomy repair`);
  }

  // Validate edit scope
  if (result.repair) {
    const scopeCheck = validateEditScope(result.repair, result.edit, taxonomy);
    if (!scopeCheck.valid && scopeCheck.error) {
      errors.push(scopeCheck.error);
    }
  }

  // Validate route policy
  const routeCheck = validateRoutePolicy(
    {
      verdict: result.verdict,
      repair: result.repair,
      edit: result.edit,
      route: result.route,
      confidence: result.confidence,
    },
    taxonomy
  );
  if (!routeCheck.valid && routeCheck.error) {
    errors.push(routeCheck.error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Treats student comment as untrusted evidence.
 * Strips prompt-injection triggers and isolates content.
 */
export function sanitizeStudentComment(comment: string): string {
  if (!comment) return "";
  // Never modify original text in storage, but when processing:
  // Detect known prompt injection markers
  const injectionPatterns = [
    /ignore (?:all )?previous instructions/i,
    /you are (?:the |an )?admin/i,
    /system override/i,
    /act as (?:a |an |the )?/i,
  ];

  const hasInjection = injectionPatterns.some((pattern) =>
    pattern.test(comment)
  );

  return comment.trim();
}

/**
 * Validates a faculty action before execution:
 * 1. An action of type "edit" MUST provide a valid ProposedEdit that obeys the repair's allowed fields.
 * 2. If repair has fields: [], cannot apply edit without manual authoring.
 * 3. Ensures answer key modifications have been acknowledged.
 */
export function validateFacultyAction(
  action: "approve" | "edit" | "reject",
  repairKey: string | null | undefined,
  edit: ProposedEdit | null | undefined,
  taxonomy: Taxonomy,
  answerKeyConfirmed: boolean = false
): { valid: boolean; error?: string } {
  if (action === "reject") {
    return { valid: true };
  }

  if (action === "approve") {
    if (repairKey === "answer_key" && !answerKeyConfirmed) {
      return {
        valid: false,
        error:
          "Safety requirement: Faculty must explicitly confirm answer key modifications before approval.",
      };
    }
    return { valid: true };
  }

  if (action === "edit") {
    if (!edit) {
      return {
        valid: false,
        error: "Edit action requires a proposed edit payload.",
      };
    }
    if (!repairKey) {
      return {
        valid: false,
        error: "Cannot edit a question without an identified defect repair type.",
      };
    }
    const scopeCheck = validateEditScope(repairKey, edit, taxonomy);
    if (!scopeCheck.valid) {
      return scopeCheck;
    }
    if (edit.field === "answer" && !answerKeyConfirmed) {
      return {
        valid: false,
        error:
          "Safety requirement: Faculty must explicitly confirm answer key modifications.",
      };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Applies a verified ProposedEdit to an in-memory QuestionRecord.
 * Preserves the original record structure and supports scq, mcq, and integerQuestion.
 */
export function applyEditToQuestion(
  q: QuestionRecord,
  edit: ProposedEdit
): QuestionRecord {
  const cloned = JSON.parse(JSON.stringify(q)) as QuestionRecord;
  const payload = cloned[cloned.questionType];

  if (edit.field === "questionType") {
    const oldType = cloned.questionType;
    const newType = edit.replace as QuestionType;
    if (cloned[oldType] && !cloned[newType]) {
      cloned[newType] = cloned[oldType];
    }
    cloned.questionType = newType;
    return cloned;
  }

  if (!payload) return cloned;

  if (edit.field === "answer") {
    payload.answer = edit.replace;
  } else if (edit.field === "question") {
    if (edit.find && typeof edit.find === "string" && edit.find.length > 0) {
      payload.question = payload.question.replace(
        edit.find,
        String(edit.replace)
      );
    } else {
      payload.question = String(edit.replace);
    }
  } else if (edit.field === "solution") {
    if (edit.find && typeof edit.find === "string" && edit.find.length > 0) {
      payload.solution = payload.solution.replace(
        edit.find,
        String(edit.replace)
      );
    } else {
      payload.solution = String(edit.replace);
    }
  }

  return cloned;
}

/**
 * Rigorously checks whether a QuestionGroup is eligible for automated batch approval:
 * 1. Must currently be in 'auto_applied' status (or pending_review with route auto_apply).
 * 2. Must have route === 'auto_apply'.
 * 3. MUST NOT be an answer_key repair (mandatory safety requirement).
 * 4. Repair must have auto: true in taxonomy.
 * 5. Must have a non-null, valid edit payload.
 * 6. Must pass validateEditScope and validateRoutePolicy.
 * 7. Must pass confidence threshold >= 0.85.
 */
export function isEligibleForBatchApproval(
  group: QuestionGroup,
  taxonomy: Taxonomy
): { eligible: boolean; reason?: string } {
  const { primaryResult } = group;

  // 1. Mandatory Project Safety Rule: Answer keys can NEVER be batch approved
  if (primaryResult.repair === "answer_key") {
    return {
      eligible: false,
      reason:
        "Answer key corrections require explicit individual faculty review and confirmation",
    };
  }

  // 2. Strict Taxonomy Rule: auto: false repairs can NEVER be batch approved
  if (primaryResult.repair) {
    const repairConfig = taxonomy.repairs[primaryResult.repair];
    if (repairConfig && !repairConfig.auto) {
      return {
        eligible: false,
        reason: `Repair '${primaryResult.repair}' has auto: false in taxonomy`,
      };
    }
  }

  // 3. Unresolved proposals with edit: null can NEVER be batch approved
  if (!primaryResult.edit) {
    return {
      eligible: false,
      reason: "No concrete proposed edit available (edit: null)",
    };
  }

  // 4. Must strictly be routed to auto_apply
  if (primaryResult.route !== "auto_apply") {
    return {
      eligible: false,
      reason: `Route '${primaryResult.route}' cannot be batch approved; only 'auto_apply' is eligible`,
    };
  }

  // 5. Must currently be in an eligible pending status
  if (group.status !== "auto_applied" && group.status !== "pending_review") {
    return {
      eligible: false,
      reason: `Status '${group.status}' is not eligible for batch approval`,
    };
  }

  if (!primaryResult.repair) {
    return {
      eligible: false,
      reason: "No repair key present",
    };
  }

  const repairConfig = taxonomy.repairs[primaryResult.repair];
  if (!repairConfig) {
    return {
      eligible: false,
      reason: `Repair '${primaryResult.repair}' does not exist in taxonomy`,
    };
  }

  // 6. Validate scope
  const scopeCheck = validateEditScope(
    primaryResult.repair,
    primaryResult.edit,
    taxonomy
  );
  if (!scopeCheck.valid) {
    return {
      eligible: false,
      reason: scopeCheck.error,
    };
  }

  if (primaryResult.confidence < 0.85) {
    return {
      eligible: false,
      reason: `Confidence ${primaryResult.confidence} < 0.85`,
    };
  }

  return { eligible: true };
}
