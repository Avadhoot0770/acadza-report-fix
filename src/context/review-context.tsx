"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FacultyActionType,
  FacultyAuditEntry,
  ProposedEdit,
  QuestionGroup,
  ReviewStatus,
  Taxonomy,
} from "@/types";
import {
  applyEditToQuestion,
  isEligibleForBatchApproval,
  validateFacultyAction,
} from "@/lib/safety";

const STORAGE_KEY_DECISIONS = "acadza_faculty_decisions_v1";
const STORAGE_KEY_AUDIT = "acadza_faculty_audit_v1";

interface SavedDecision {
  questionId: string;
  status: ReviewStatus;
  decision: {
    action: FacultyActionType;
    actor: string;
    timestamp: string;
    note?: string;
    appliedEdit?: ProposedEdit;
  };
}

interface ReviewContextType {
  questionGroups: QuestionGroup[];
  auditLogs: FacultyAuditEntry[];
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  activeActor: string;
  setActiveActor: (actor: string) => void;
  taxonomy: Taxonomy;
  isHydrated: boolean;
  metrics: {
    totalReports: number;
    uniqueQuestions: number;
    pendingFacultyReviewQuestions: number;
    pendingFacultyReviewReports: number;
    autoApplyQuestions: number;
    autoApplyReports: number;
    noChangeQuestions: number;
    noChangeReports: number;
    answerKeyQuestions: number;
    answerKeyReports: number;
    duplicateClustersCount: number;
    duplicateClusterReports: number;
    approvedQuestions: number;
    approvedReports: number;
    editedQuestions: number;
    editedReports: number;
    rejectedQuestions: number;
    rejectedReports: number;
    totalDecidedQuestions: number;
    totalDecidedReports: number;
    // Backward-compatible aliases
    pendingFacultyReview: number;
    autoApplyProposals: number;
    noChangeCases: number;
    approvedCount: number;
    editedCount: number;
    rejectedCount: number;
    answerKeyCount: number;
  };
  approveProposal: (
    questionId: string,
    note?: string,
    confirmedAnswerKey?: boolean
  ) => { success: boolean; error?: string };
  editProposal: (
    questionId: string,
    customEdit: ProposedEdit,
    note: string,
    confirmedAnswerKey?: boolean
  ) => { success: boolean; error?: string };
  rejectProposal: (
    questionId: string,
    reason: string
  ) => { success: boolean; error?: string };
  batchApproveAutoApply: () => { approvedCount: number };
  resetDemoState: () => void;
}

const ReviewContext = createContext<ReviewContextType | null>(null);

export function useReview() {
  const ctx = useContext(ReviewContext);
  if (!ctx) {
    throw new Error("useReview must be used within a ReviewProvider");
  }
  return ctx;
}

interface ReviewProviderProps {
  children: React.ReactNode;
  initialGroups: QuestionGroup[];
  taxonomy: Taxonomy;
}

export function ReviewProvider({
  children,
  initialGroups,
  taxonomy,
}: ReviewProviderProps) {
  const [questionGroups, setQuestionGroups] =
    useState<QuestionGroup[]>(initialGroups);
  const [auditLogs, setAuditLogs] = useState<FacultyAuditEntry[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeActor, setActiveActor] = useState<string>(
    "Dr. S. K. Sharma (Senior Physics Faculty)"
  );
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Initialize all historical audits from question records
  const initialHistoricalAudits = useMemo(() => {
    const list: FacultyAuditEntry[] = [];
    for (const g of initialGroups) {
      if (g.auditEntries && g.auditEntries.length > 0) {
        list.push(...g.auditEntries);
      }
    }
    return list;
  }, [initialGroups]);

  // Hydrate from localStorage once mounted
  useEffect(() => {
    try {
      const storedDecisions = localStorage.getItem(STORAGE_KEY_DECISIONS);
      const storedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);

      let savedDecisionsMap = new Map<string, SavedDecision>();
      if (storedDecisions) {
        const parsed: SavedDecision[] = JSON.parse(storedDecisions);
        for (const d of parsed) {
          savedDecisionsMap.set(d.questionId, d);
        }
      }

      let extraAudits: FacultyAuditEntry[] = [];
      if (storedAudit) {
        extraAudits = JSON.parse(storedAudit);
      }

      // Merge saved decisions into initialGroups
      if (savedDecisionsMap.size > 0) {
        setQuestionGroups((prev) =>
          prev.map((g) => {
            const saved = savedDecisionsMap.get(g.questionId);
            if (!saved) return g;

            let updatedQuestion = g.question;
            if (saved.decision.appliedEdit) {
              updatedQuestion = applyEditToQuestion(
                g.originalQuestion,
                saved.decision.appliedEdit
              );
            }

            return {
              ...g,
              question: updatedQuestion,
              status: saved.status,
              facultyDecision: saved.decision,
            };
          })
        );
      }

      setAuditLogs([...extraAudits, ...initialHistoricalAudits]);
    } catch (e) {
      console.error("Failed to load demo persistence from localStorage", e);
      setAuditLogs(initialHistoricalAudits);
    } finally {
      setIsHydrated(true);
    }
  }, [initialHistoricalAudits]);

  // Helper to persist to localStorage
  const saveStateToStorage = useCallback(
    (groups: QuestionGroup[], newAuditEntry?: FacultyAuditEntry) => {
      try {
        const savedDecisions: SavedDecision[] = groups
          .filter((g) => g.facultyDecision)
          .map((g) => ({
            questionId: g.questionId,
            status: g.status,
            decision: g.facultyDecision!,
          }));
        localStorage.setItem(
          STORAGE_KEY_DECISIONS,
          JSON.stringify(savedDecisions)
        );

        if (newAuditEntry) {
          const storedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
          const current: FacultyAuditEntry[] = storedAudit
            ? JSON.parse(storedAudit)
            : [];
          const updated = [newAuditEntry, ...current];
          localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updated));
        }
      } catch (e) {
        console.error("Failed to save demo state to localStorage", e);
      }
    },
    []
  );

  // 1. Approve proposal
  const approveProposal = useCallback(
    (
      questionId: string,
      note?: string,
      confirmedAnswerKey: boolean = false
    ) => {
      const group = questionGroups.find((g) => g.questionId === questionId);
      if (!group) return { success: false, error: "Question not found" };

      const isAnswerKey = group.primaryResult.repair === "answer_key";
      const validation = validateFacultyAction(
        "approve",
        group.primaryResult.repair,
        group.primaryResult.edit,
        taxonomy,
        confirmedAnswerKey
      );
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const timestamp = new Date().toISOString();
      const editToApply = group.primaryResult.edit ?? undefined;
      const updatedQuestion = editToApply
        ? applyEditToQuestion(group.originalQuestion, editToApply)
        : group.question;

      const reportIds = group.reports.map((r) => r.reportId);
      const auditEntry: FacultyAuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        questionId: group.questionId,
        reportId: reportIds[0],
        reportIds,
        action: "approve",
        actor: activeActor,
        timestamp,
        note:
          note ||
          (isAnswerKey
            ? "Approved verified answer key correction"
            : "Approved proposed triage fix"),
        field: editToApply?.field,
        repairKey: group.primaryResult.repair ?? undefined,
        beforeValue: editToApply?.find,
        afterValue: editToApply?.replace,
        appliedEdit: editToApply,
      };

      const updatedGroups = questionGroups.map((g) => {
        if (g.questionId !== questionId) return g;
        return {
          ...g,
          question: updatedQuestion,
          status: "approved" as ReviewStatus,
          facultyDecision: {
            action: "approve" as FacultyActionType,
            actor: activeActor,
            timestamp,
            note,
            appliedEdit: editToApply,
          },
          auditEntries: [auditEntry, ...g.auditEntries],
        };
      });

      setQuestionGroups(updatedGroups);
      setAuditLogs((prev) => [auditEntry, ...prev]);
      saveStateToStorage(updatedGroups, auditEntry);

      return { success: true };
    },
    [questionGroups, taxonomy, activeActor, saveStateToStorage]
  );

  // 2. Custom Edit proposal
  const editProposal = useCallback(
    (
      questionId: string,
      customEdit: ProposedEdit,
      note: string,
      confirmedAnswerKey: boolean = false
    ) => {
      const group = questionGroups.find((g) => g.questionId === questionId);
      if (!group) return { success: false, error: "Question not found" };

      const validation = validateFacultyAction(
        "edit",
        group.primaryResult.repair,
        customEdit,
        taxonomy,
        confirmedAnswerKey
      );
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const timestamp = new Date().toISOString();
      const updatedQuestion = applyEditToQuestion(
        group.originalQuestion,
        customEdit
      );
      const reportIds = group.reports.map((r) => r.reportId);

      const auditEntry: FacultyAuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        questionId: group.questionId,
        reportId: reportIds[0],
        reportIds,
        action: "edit",
        actor: activeActor,
        timestamp,
        note: note || "Applied faculty custom edit",
        field: customEdit.field,
        repairKey: group.primaryResult.repair ?? undefined,
        beforeValue: customEdit.find,
        afterValue: customEdit.replace,
        proposedEdit: group.primaryResult.edit ?? undefined,
        appliedEdit: customEdit,
      };

      const updatedGroups = questionGroups.map((g) => {
        if (g.questionId !== questionId) return g;
        return {
          ...g,
          question: updatedQuestion,
          status: "edited" as ReviewStatus,
          facultyDecision: {
            action: "edit" as FacultyActionType,
            actor: activeActor,
            timestamp,
            note,
            appliedEdit: customEdit,
          },
          auditEntries: [auditEntry, ...g.auditEntries],
        };
      });

      setQuestionGroups(updatedGroups);
      setAuditLogs((prev) => [auditEntry, ...prev]);
      saveStateToStorage(updatedGroups, auditEntry);

      return { success: true };
    },
    [questionGroups, taxonomy, activeActor, saveStateToStorage]
  );

  // 3. Reject proposal
  const rejectProposal = useCallback(
    (questionId: string, reason: string) => {
      const group = questionGroups.find((g) => g.questionId === questionId);
      if (!group) return { success: false, error: "Question not found" };

      const timestamp = new Date().toISOString();
      const reportIds = group.reports.map((r) => r.reportId);

      const auditEntry: FacultyAuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        questionId: group.questionId,
        reportId: reportIds[0],
        reportIds,
        action: "reject",
        actor: activeActor,
        timestamp,
        note: reason || "Rejected proposal - no change to question",
        field: group.primaryResult.edit?.field,
        repairKey: group.primaryResult.repair ?? undefined,
        beforeValue: group.primaryResult.edit?.find,
        afterValue: undefined,
      };

      const updatedGroups = questionGroups.map((g) => {
        if (g.questionId !== questionId) return g;
        return {
          ...g,
          question: g.originalQuestion, // Revert to original
          status: "rejected" as ReviewStatus,
          facultyDecision: {
            action: "reject" as FacultyActionType,
            actor: activeActor,
            timestamp,
            note: reason,
          },
          auditEntries: [auditEntry, ...g.auditEntries],
        };
      });

      setQuestionGroups(updatedGroups);
      setAuditLogs((prev) => [auditEntry, ...prev]);
      saveStateToStorage(updatedGroups, auditEntry);

      return { success: true };
    },
    [questionGroups, activeActor, saveStateToStorage]
  );

  // 4. Batch approve safe auto-apply proposals
  const batchApproveAutoApply = useCallback(() => {
    let approvedCount = 0;
    const timestamp = new Date().toISOString();
    const newAuditEntries: FacultyAuditEntry[] = [];

    const updatedGroups = questionGroups.map((g) => {
      const eligibility = isEligibleForBatchApproval(g, taxonomy);
      if (eligibility.eligible && g.primaryResult.edit) {
        approvedCount++;
        const editToApply = g.primaryResult.edit;
        const updatedQuestion = applyEditToQuestion(
          g.originalQuestion,
          editToApply
        );
        const reportIds = g.reports.map((r) => r.reportId);

        const auditEntry: FacultyAuditEntry = {
          id: `audit-${Date.now()}-${approvedCount}-${Math.random().toString(36).slice(2, 6)}`,
          questionId: g.questionId,
          reportId: reportIds[0],
          reportIds,
          action: "approve",
          actor: activeActor,
          timestamp,
          note: `Batch approved safe auto-apply repair: ${g.primaryResult.repair}`,
          field: editToApply.field,
          repairKey: g.primaryResult.repair ?? undefined,
          beforeValue: editToApply.find,
          afterValue: editToApply.replace,
          appliedEdit: editToApply,
        };
        newAuditEntries.push(auditEntry);

        return {
          ...g,
          question: updatedQuestion,
          status: "approved" as ReviewStatus,
          facultyDecision: {
            action: "approve" as FacultyActionType,
            actor: activeActor,
            timestamp,
            note: `Batch approved safe repair: ${g.primaryResult.repair}`,
            appliedEdit: editToApply,
          },
          auditEntries: [auditEntry, ...g.auditEntries],
        };
      }
      return g;
    });

    if (approvedCount > 0) {
      setQuestionGroups(updatedGroups);
      setAuditLogs((prev) => [...newAuditEntries, ...prev]);
      try {
        const savedDecisions: SavedDecision[] = updatedGroups
          .filter((g) => g.facultyDecision)
          .map((g) => ({
            questionId: g.questionId,
            status: g.status,
            decision: g.facultyDecision!,
          }));
        localStorage.setItem(
          STORAGE_KEY_DECISIONS,
          JSON.stringify(savedDecisions)
        );

        const storedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
        const current: FacultyAuditEntry[] = storedAudit
          ? JSON.parse(storedAudit)
          : [];
        localStorage.setItem(
          STORAGE_KEY_AUDIT,
          JSON.stringify([...newAuditEntries, ...current])
        );
      } catch (e) {
        console.error("Failed to save batch decisions", e);
      }
    }

    return { approvedCount };
  }, [questionGroups, activeActor]);

  // 5. Reset demo state
  const resetDemoState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_DECISIONS);
      localStorage.removeItem(STORAGE_KEY_AUDIT);
    } catch (e) {
      console.error("Failed to clear localStorage", e);
    }
    setQuestionGroups(initialGroups);
    setAuditLogs(initialHistoricalAudits);
    setSelectedGroupId(null);
  }, [initialGroups, initialHistoricalAudits]);

  // Dynamic live metrics derived from state
  const metrics = useMemo(() => {
    let totalReports = 0;
    let pendingFacultyReviewQuestions = 0;
    let pendingFacultyReviewReports = 0;
    let autoApplyQuestions = 0;
    let autoApplyReports = 0;
    let noChangeQuestions = 0;
    let noChangeReports = 0;
    let approvedQuestions = 0;
    let approvedReports = 0;
    let editedQuestions = 0;
    let editedReports = 0;
    let rejectedQuestions = 0;
    let rejectedReports = 0;
    let answerKeyQuestions = 0;
    let answerKeyReports = 0;
    let duplicateClustersCount = 0;
    let duplicateClusterReports = 0;

    for (const g of questionGroups) {
      const repCount = g.reports.length;
      totalReports += repCount;

      if (g.isDuplicate) {
        duplicateClustersCount++;
        duplicateClusterReports += repCount;
      }

      if (g.isAnswerKey) {
        answerKeyQuestions++;
        answerKeyReports += repCount;
      }

      if (g.status === "pending_review") {
        pendingFacultyReviewQuestions++;
        pendingFacultyReviewReports += repCount;
      } else if (g.status === "auto_applied") {
        autoApplyQuestions++;
        autoApplyReports += repCount;
      } else if (g.status === "no_action_needed") {
        noChangeQuestions++;
        noChangeReports += repCount;
      } else if (g.status === "approved") {
        approvedQuestions++;
        approvedReports += repCount;
      } else if (g.status === "edited") {
        editedQuestions++;
        editedReports += repCount;
      } else if (g.status === "rejected") {
        rejectedQuestions++;
        rejectedReports += repCount;
      }
    }

    const totalDecidedQuestions =
      approvedQuestions + editedQuestions + rejectedQuestions;
    const totalDecidedReports =
      approvedReports + editedReports + rejectedReports;

    return {
      totalReports,
      uniqueQuestions: questionGroups.length,
      pendingFacultyReviewQuestions,
      pendingFacultyReviewReports,
      autoApplyQuestions,
      autoApplyReports,
      noChangeQuestions,
      noChangeReports,
      answerKeyQuestions,
      answerKeyReports,
      duplicateClustersCount,
      duplicateClusterReports,
      approvedQuestions,
      approvedReports,
      editedQuestions,
      editedReports,
      rejectedQuestions,
      rejectedReports,
      totalDecidedQuestions,
      totalDecidedReports,
      // Backward-compatible aliases
      pendingFacultyReview: pendingFacultyReviewQuestions,
      autoApplyProposals: autoApplyQuestions,
      noChangeCases: noChangeQuestions,
      approvedCount: approvedQuestions,
      editedCount: editedQuestions,
      rejectedCount: rejectedQuestions,
      answerKeyCount: answerKeyQuestions,
    };
  }, [questionGroups]);

  return (
    <ReviewContext.Provider
      value={{
        questionGroups,
        auditLogs,
        selectedGroupId,
        setSelectedGroupId,
        activeActor,
        setActiveActor,
        taxonomy,
        isHydrated,
        metrics,
        approveProposal,
        editProposal,
        rejectProposal,
        batchApproveAutoApply,
        resetDemoState,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}
