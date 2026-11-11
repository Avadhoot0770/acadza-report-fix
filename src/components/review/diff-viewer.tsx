"use client";

import React, { useMemo } from "react";
import { diffWords } from "diff";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CornerDownRight,
  FileCode,
  Info,
  Sparkles,
} from "lucide-react";
import { ProposedEdit, QuestionRecord } from "@/types";

interface DiffViewerProps {
  originalQuestion: QuestionRecord;
  edit: ProposedEdit | null | undefined;
  repairKey?: string | null;
  isSolutionDerived?: boolean;
  isContentUnrecoverable?: boolean;
}

export function DiffViewer({
  originalQuestion,
  edit,
  repairKey,
  isSolutionDerived = false,
  isContentUnrecoverable = false,
}: DiffViewerProps) {
  // If no edit proposed (e.g. unrecoverable distractor or manual authoring needed)
  if (!edit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Manual Authoring Required (No Automated Edit Proposed)
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {isContentUnrecoverable ? (
                <>
                  <strong className="font-semibold">Unrecoverable Content:</strong> The missing option or solution content cannot be safely reconstructed from the database record without hallucinating. The system strictly refused to invent distractors and routed this case to faculty review.
                </>
              ) : (
                <>
                  This defect category requires human content authoring. Please review the reported defect and use the{" "}
                  <strong className="font-semibold">Custom Edit</strong> action to supply a verified replacement.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Word-level diff when find and replace are strings
  const stringDiff = useMemo(() => {
    if (
      edit.find !== undefined &&
      typeof edit.find === "string" &&
      typeof edit.replace === "string"
    ) {
      return diffWords(edit.find, edit.replace);
    }
    return null;
  }, [edit.find, edit.replace]);

  return (
    <div className="space-y-4">
      {/* Solution-Derived Parameter Warning Callout */}
      {isSolutionDerived && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span>Solution-Derived Parameter Inference</span>
              <span className="bg-blue-200/80 text-blue-800 text-[10px] px-2 py-0.2 rounded-full font-semibold">
                High Confidence
              </span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              The missing circuit parameter was reconstructed directly from the step-by-step mathematical derivation in the stored solution, not from original question stem text. Please verify circuit parameters match syllabus standards.
            </p>
          </div>
        </div>
      )}

      {/* Main Diff Card */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {/* Header bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Proposed Surgical Fix
            </span>
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
              field: {edit.field}
            </span>
          </div>
          {repairKey && (
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              repair: {repairKey}
            </span>
          )}
        </div>

        {/* Content Diff: Answer Key Case vs Text Replacement */}
        {edit.field === "answer" ? (
          <div className="p-4 space-y-3">
            <div className="text-xs text-slate-600 font-medium">
              Answer key replacement:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Before */}
              <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/60 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Current Key in Database
                </span>
                <div className="font-mono text-base font-bold text-rose-900">
                  {typeof edit.find === "object"
                    ? JSON.stringify(edit.find)
                    : String(edit.find ?? "N/A")}
                </div>
              </div>

              {/* After */}
              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/60 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Proposed Verified Key
                </span>
                <div className="font-mono text-base font-bold text-emerald-900">
                  {typeof edit.replace === "object"
                    ? JSON.stringify(edit.replace)
                    : String(edit.replace)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Word-by-word diff if available */}
            {stringDiff ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600">
                  Exact Character / Word Diff:
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/80 font-mono text-xs leading-relaxed break-words">
                  {stringDiff.map((part, index) => {
                    if (part.added) {
                      return (
                        <span
                          key={index}
                          className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold underline decoration-emerald-500"
                        >
                          {part.value}
                        </span>
                      );
                    }
                    if (part.removed) {
                      return (
                        <span
                          key={index}
                          className="bg-rose-100 text-rose-900 px-1 py-0.5 rounded line-through decoration-rose-500"
                        >
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={index}>{part.value}</span>;
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {edit.find !== undefined && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                      Original Target (Find):
                    </span>
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 font-mono text-xs text-rose-950 break-words line-through">
                      {typeof edit.find === "object"
                        ? JSON.stringify(edit.find)
                        : String(edit.find)}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Proposed Replacement:
                  </span>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 font-mono text-xs text-emerald-950 break-words font-semibold">
                    {typeof edit.replace === "object"
                      ? JSON.stringify(edit.replace)
                      : String(edit.replace)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
