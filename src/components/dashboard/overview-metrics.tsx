"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileCheck,
  FileQuestion,
  HelpCircle,
  Layers,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { useReview } from "@/context/review-context";

export function OverviewMetrics() {
  const { metrics, batchApproveAutoApply } = useReview();
  const [batchNotice, setBatchNotice] = useState<string | null>(null);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  const handleBatchApprove = () => {
    setShowBatchConfirm(false);
    const res = batchApproveAutoApply();
    if (res.approvedCount > 0) {
      setBatchNotice(
        `Successfully batch-approved ${res.approvedCount} safe cosmetic/formatting question repairs.`
      );
      setTimeout(() => setBatchNotice(null), 5000);
    } else {
      setBatchNotice("No pending safe auto-apply items found.");
      setTimeout(() => setBatchNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Batch notice if triggered */}
      {batchNotice && (
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
            <span>{batchNotice}</span>
          </div>
          <button
            onClick={() => setBatchNotice(null)}
            className="text-teal-700 hover:text-teal-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Six Metric Cards Grid: High information density, clean academic layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Total Ingested */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Ingested
            </span>
            <div className="p-1 rounded bg-blue-50 text-blue-600">
              <FileQuestion className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              44 Reports
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              39 Questions (4 clusters)
            </div>
          </div>
        </div>

        {/* 2. Pending Faculty Review */}
        <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-2xs space-y-1.5 bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Faculty Review
            </span>
            <div className="p-1 rounded bg-purple-100 text-purple-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-950 tracking-tight">
              {metrics.pendingFacultyReviewQuestions} Questions
            </div>
            <div className="text-[11px] text-purple-800 font-medium">
              {metrics.pendingFacultyReviewReports} Reports · Pending sign-off
            </div>
          </div>
        </div>

        {/* 3. Safe Auto-Apply Proposals */}
        <div className="p-3.5 rounded-xl bg-white border border-teal-200 shadow-2xs space-y-1.5 bg-teal-50/20">
          <div className="flex items-center justify-between text-teal-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Safe Auto-Apply
            </span>
            <div className="p-1 rounded bg-teal-100 text-teal-800">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-bold text-teal-950 tracking-tight">
                {metrics.autoApplyQuestions} Questions
              </div>
              {metrics.autoApplyQuestions > 0 && (
                <button
                  onClick={() => setShowBatchConfirm(true)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1 transition-colors cursor-pointer"
                  title="Review and approve all eligible safe auto-apply repairs"
                >
                  <CheckSquare className="h-2.5 w-2.5" />
                  <span>Batch</span>
                </button>
              )}
            </div>
            <div className="text-[11px] text-teal-800 font-medium">
              {metrics.autoApplyReports} Reports · Low-risk typos/tags
            </div>
          </div>
        </div>

        {/* 4. High-Stakes Answer Keys */}
        <div className="p-3.5 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-1.5 bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Answer Keys
            </span>
            <div className="p-1 rounded bg-rose-100 text-rose-700">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-rose-950 tracking-tight">
              {metrics.answerKeyQuestions} Questions
            </div>
            <div className="text-[11px] text-rose-800 font-medium">
              {metrics.answerKeyReports} Reports · 2-check verification
            </div>
          </div>
        </div>

        {/* 5. No Change / Sound */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              No Change Needed
            </span>
            <div className="p-1 rounded bg-slate-100 text-slate-600">
              <FileCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {metrics.noChangeQuestions} Questions
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {metrics.noChangeReports} Reports · Valid as written
            </div>
          </div>
        </div>

        {/* 6. Decisions Executed */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Decisions Logged
            </span>
            <div className="p-1 rounded bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {metrics.totalDecidedQuestions} / 39
            </div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <span className="text-emerald-700 font-bold">
                {metrics.approvedQuestions} app
              </span>
              <span>·</span>
              <span className="text-indigo-700 font-bold">
                {metrics.editedQuestions} edit
              </span>
              <span>·</span>
              <span className="text-rose-700 font-bold">
                {metrics.rejectedQuestions} rej
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Approval Confirmation Modal */}
      {showBatchConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-teal-700" />
              <h3 className="font-bold text-sm text-slate-900">
                Confirm Batch Approval for Safe Repairs
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to approve <strong>{metrics.autoApplyQuestions} question repairs</strong> (covering {metrics.autoApplyReports} student reports).
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900">Safety Eligibility Checked:</div>
              <div>• All repairs are classified as cosmetic (typos, markup leaks, exam tags, stem data).</div>
              <div>• All repairs have <code>auto: true</code> in taxonomy.</div>
              <div>• Answer keys are strictly excluded (require individual 2-factor review).</div>
              <div>• Every replacement is verified against original database records.</div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-1">
              <button
                onClick={() => setShowBatchConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchApprove}
                className="px-4 py-1.5 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800 shadow-2xs"
              >
                Confirm Batch Approval ({metrics.autoApplyQuestions})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
