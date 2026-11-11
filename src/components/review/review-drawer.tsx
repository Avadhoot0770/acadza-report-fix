"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Ban,
  BookOpen,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  CornerDownRight,
  Edit3,
  FileQuestion,
  FileText,
  HelpCircle,
  History,
  Layers,
  MessageSquare,
  RefreshCw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import { getQuestionPayload, ProposedEdit, QuestionGroup } from "@/types";
import { useReview } from "@/context/review-context";
import { DiffViewer } from "./diff-viewer";
import { EvidenceCard } from "./evidence-card";
import { StudentReplyPreview } from "./student-reply-preview";
import { AnswerKeyConfirmationModal } from "./answer-key-confirmation-modal";
import { CustomEditModal } from "./custom-edit-modal";
import { RejectionModal } from "./rejection-modal";

interface ReviewDrawerProps {
  group: QuestionGroup | null;
  onClose: () => void;
}

export function ReviewDrawer({ group, onClose }: ReviewDrawerProps) {
  const {
    taxonomy,
    activeActor,
    approveProposal,
    editProposal,
    rejectProposal,
  } = useReview();

  const [activeTab, setActiveTab] = useState<
    "overview" | "reports" | "evidence" | "audit"
  >("overview");
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!group) return null;

  const payload = getQuestionPayload(group.question);
  const originalPayload = getQuestionPayload(group.originalQuestion);
  const isAnswerKey = group.isAnswerKey;
  const isDuplicate = group.isDuplicate;

  const currentKeyStr = Array.isArray(payload.answer)
    ? `[${payload.answer.join(", ")}]`
    : String(payload.answer ?? "");

  const proposedKeyStr =
    group.primaryResult.edit?.field === "answer"
      ? typeof group.primaryResult.edit.replace === "object"
        ? JSON.stringify(group.primaryResult.edit.replace)
        : String(group.primaryResult.edit.replace)
      : currentKeyStr;

  const handleApproveClick = () => {
    setActionError(null);
    if (isAnswerKey) {
      setShowAnswerKeyModal(true);
    } else {
      const res = approveProposal(group.questionId, undefined, false);
      if (!res.success && res.error) {
        setActionError(res.error);
      }
    }
  };

  const handleConfirmAnswerKey = () => {
    setShowAnswerKeyModal(false);
    const res = approveProposal(
      group.questionId,
      "Independently verified mathematical/scientific derivation",
      true
    );
    if (!res.success && res.error) {
      setActionError(res.error);
    }
  };

  const handleCustomEditSave = (customEdit: ProposedEdit, note: string) => {
    setShowEditModal(false);
    if (customEdit.field === "answer") {
      setShowAnswerKeyModal(true);
      return;
    }
    const res = editProposal(group.questionId, customEdit, note, false);
    if (!res.success && res.error) {
      setActionError(res.error);
    }
  };

  const handleRejectConfirm = (reason: string) => {
    setShowRejectModal(false);
    const res = rejectProposal(group.questionId, reason);
    if (!res.success && res.error) {
      setActionError(res.error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100/70 px-2.5 py-0.5 rounded border border-blue-300">
                  {group.questionId}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase tracking-wider">
                  {group.question.questionType}
                </span>

                {isDuplicate && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {group.reports.length} Reports Clustered
                  </span>
                )}

                {/* Status Badge */}
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    group.status === "approved"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : group.status === "edited"
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                      : group.status === "rejected"
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : group.status === "auto_applied"
                      ? "bg-teal-100 text-teal-800 border-teal-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  Status: {group.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="font-bold text-slate-800">{group.question.subject}</span>
                <span>•</span>
                <span>{group.question.chapter}</span>
                {group.question.concept && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600">{group.question.concept}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Close review (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-6 border-b border-slate-200 bg-white flex items-center justify-between text-xs">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Question & Proposed Fix</span>
              </button>

              <button
                onClick={() => setActiveTab("evidence")}
                className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "evidence"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Scientific Verification</span>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "reports"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Student Reports ({group.reports.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("audit")}
                className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "audit"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Audit Trail ({group.auditEntries.length})</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Reviewing as: <strong className="text-slate-800">{activeActor}</strong>
            </div>
          </div>

          {/* Action Error Notice if any */}
          {actionError && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Proposed Surgical Fix Section */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    AI Triage Recommendation & Surgical Diff
                  </span>
                  <DiffViewer
                    originalQuestion={group.originalQuestion}
                    edit={group.primaryResult.edit}
                    repairKey={group.primaryResult.repair}
                    isSolutionDerived={group.isSolutionDerived}
                    isContentUnrecoverable={group.isContentUnrecoverable}
                  />
                </div>

                {/* Original Question Stem & Options with native MathML */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                      Live Question Stem & Options
                    </span>
                    <div className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                      <span>Database Key:</span>
                      <span className="font-mono font-bold">{currentKeyStr}</span>
                    </div>
                  </div>
                  <div
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm leading-relaxed text-slate-900 prose prose-slate max-w-none shadow-2xs font-sans"
                    dangerouslySetInnerHTML={{ __html: payload.question }}
                  />
                </div>

                {/* Live Solution with native MathML */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    Stored Solution & Derivation
                  </span>
                  <div
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm leading-relaxed text-slate-900 prose prose-slate max-w-none shadow-2xs font-sans"
                    dangerouslySetInnerHTML={{ __html: payload.solution }}
                  />
                </div>

                {/* Empathetic student reply preview */}
                <StudentReplyPreview
                  replyText={group.primaryResult.student_reply}
                  reports={group.reports}
                />
              </div>
            )}

            {activeTab === "evidence" && (
              <div className="space-y-6">
                <EvidenceCard
                  triageResult={group.primaryResult}
                  isAnswerKey={isAnswerKey}
                />

                <StudentReplyPreview
                  replyText={group.primaryResult.student_reply}
                  reports={group.reports}
                />
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-4">
                <div className="text-xs text-slate-500 font-medium">
                  {group.reports.length} student report{group.reports.length > 1 ? "s" : ""} clustered for this question ID.
                </div>

                {group.reports.map((report) => (
                  <div
                    key={report.reportId}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {report.reportId}
                        </span>
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {report.studentId}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                          {report.source}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(report.reportedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/80 text-xs text-amber-950 font-sans leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1 text-[11px] uppercase tracking-wider">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>Student Evidence (Untrusted Lead):</span>
                      </div>
                      &ldquo;{report.comment}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "audit" && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 font-medium">
                  Complete audit history for question {group.questionId}:
                </div>

                {group.auditEntries.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    No historical modifications recorded for this question.
                  </div>
                ) : (
                  group.auditEntries.map((audit) => (
                    <div
                      key={audit.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                              audit.action === "approve"
                                ? "bg-emerald-100 text-emerald-800"
                                : audit.action === "edit"
                                ? "bg-indigo-100 text-indigo-800"
                                : audit.action === "reject"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {audit.action}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {audit.actor}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(audit.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {audit.note && (
                        <p className="text-slate-600 text-xs pl-1">
                          {audit.note}
                        </p>
                      )}
                      {audit.field && (
                        <div className="text-[11px] text-slate-500 pl-1 font-mono">
                          Field: {audit.field} | Before:{" "}
                          {String(audit.beforeValue ?? "N/A")} ➔ After:{" "}
                          {String(audit.afterValue ?? "N/A")}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Action Controls */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {group.status !== "pending_review" && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>
                    Decision Recorded: <strong>{group.status.replace("_", " ")}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Reject Button */}
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Reject Report</span>
              </button>

              {/* Custom Edit Button */}
              {group.primaryResult.repair && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Custom Fix Authoring</span>
                </button>
              )}

              {/* Approve Button */}
              {group.primaryResult.edit && (
                <button
                  onClick={handleApproveClick}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer ${
                    isAnswerKey
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isAnswerKey ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>
                    {isAnswerKey
                      ? "Verify & Approve Answer Key"
                      : "Approve Proposed Fix"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Key High-Stakes Confirmation Modal */}
      <AnswerKeyConfirmationModal
        isOpen={showAnswerKeyModal}
        questionId={group.questionId}
        subject={group.question.subject}
        oldKey={currentKeyStr}
        newKey={proposedKeyStr}
        actor={activeActor}
        onConfirm={handleConfirmAnswerKey}
        onCancel={() => setShowAnswerKeyModal(false)}
      />

      {/* Custom Edit Authoring Modal */}
      {group.primaryResult.repair && (
        <CustomEditModal
          isOpen={showEditModal}
          questionId={group.questionId}
          repairKey={group.primaryResult.repair}
          taxonomy={taxonomy}
          initialEdit={group.primaryResult.edit}
          onSave={handleCustomEditSave}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectModal}
        questionId={group.questionId}
        onConfirm={handleRejectConfirm}
        onCancel={() => setShowRejectModal(false)}
      />
    </>
  );
}
