"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Smartphone,
  Tag,
  User,
  X,
} from "lucide-react";
import { getQuestionPayload, QuestionGroup, StudentReport } from "@/types";

interface QuestionPreviewModalProps {
  group: QuestionGroup | null;
  onClose: () => void;
}

export function QuestionPreviewModal({
  group,
  onClose,
}: QuestionPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!group) return null;

  const payload = getQuestionPayload(group.question);
  const answerStr = Array.isArray(payload.answer)
    ? `[${payload.answer.join(", ")}]`
    : String(payload.answer ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {group.questionId}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                {group.question.questionType}
              </span>
              {group.isDuplicate && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {group.reports.length} Reports Clustered
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{group.question.subject}</span>
              <span>•</span>
              <span>{group.question.chapter}</span>
              {group.question.concept && (
                <>
                  <span>•</span>
                  <span>{group.question.concept}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question Text with MathML */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                Original Question Stem & Options
              </span>
              <div className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Keyed Answer: <span className="font-mono font-bold">{answerStr}</span>
              </div>
            </div>
            <div
              className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm leading-relaxed text-slate-900 prose prose-slate max-w-none shadow-inner"
              dangerouslySetInnerHTML={{ __html: payload.question }}
            />
          </div>

          {/* Stored Solution with MathML */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Stored Solution & Explanation
            </span>
            <div
              className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm leading-relaxed text-slate-900 prose prose-slate max-w-none shadow-inner"
              dangerouslySetInnerHTML={{ __html: payload.solution }}
            />
          </div>

          {/* Student Reports List */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
              Untrusted Student Reports ({group.reports.length})
            </span>
            <div className="space-y-2">
              {group.reports.map((report: StudentReport) => (
                <div
                  key={report.reportId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {report.reportId}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {report.studentId}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {report.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 italic bg-white p-2 rounded-lg border border-slate-100 mt-1">
                      &ldquo;{report.comment}&rdquo;
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.reportedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
