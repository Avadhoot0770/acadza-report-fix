"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileCheck,
  FileQuestion,
  Layers,
  ShieldAlert,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useReview } from "@/context/review-context";

export function OverviewMetrics() {
  const { metrics, batchApproveAutoApply } = useReview();
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  const handleBatchApprove = () => {
    const res = batchApproveAutoApply();
    if (res.approvedCount > 0) {
      setBatchNotice(
        `Successfully batch-approved ${res.approvedCount} safe cosmetic/formatting fixes!`
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
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900 flex items-center justify-between animate-in fade-in">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Ingested Reports */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Ingested
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileQuestion className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalReports}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across <strong className="text-slate-800">{metrics.uniqueQuestions}</strong> questions (4 clusters)
            </div>
          </div>
        </div>

        {/* 2. Pending Faculty Review */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              Pending Faculty Review
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-900 tracking-tight">
              {metrics.pendingFacultyReview}
            </div>
            <div className="text-[11px] text-purple-700/80 font-medium mt-0.5">
              Requires faculty sign-off
            </div>
          </div>
        </div>

        {/* 3. Safe Auto-Apply Proposals */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Safe Auto-Apply
            </span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-teal-950 tracking-tight">
                {metrics.autoApplyProposals}
              </div>
              {metrics.autoApplyProposals > 0 && (
                <button
                  onClick={handleBatchApprove}
                  className="text-[10px] font-bold px-2 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                  title="One-click approval for all safe cosmetic/formatting fixes"
                >
                  <Zap className="h-3 w-3" />
                  <span>Approve All</span>
                </button>
              )}
            </div>
            <div className="text-[11px] text-teal-700/80 font-medium mt-0.5">
              Low-risk typos & formatting
            </div>
          </div>
        </div>

        {/* 4. High-Stakes Answer Keys */}
        <div className="p-4 rounded-2xl bg-white border-2 border-rose-200 shadow-2xs space-y-2 bg-rose-50/20">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Answer Keys
            </span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-950 tracking-tight flex items-center gap-1.5">
              <span>{metrics.answerKeyCount}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 uppercase">
                High Stakes
              </span>
            </div>
            <div className="text-[11px] text-rose-700/90 font-medium mt-0.5">
              Requires 2-check verification
            </div>
          </div>
        </div>

        {/* 5. Faculty Decisions Recorded */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Decisions Logged
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 tracking-tight">
              {metrics.approvedCount + metrics.editedCount + metrics.rejectedCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-700 font-bold">
                {metrics.approvedCount} app
              </span>
              <span>•</span>
              <span className="text-indigo-700 font-bold">
                {metrics.editedCount} edit
              </span>
              <span>•</span>
              <span className="text-rose-700 font-bold">
                {metrics.rejectedCount} rej
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
