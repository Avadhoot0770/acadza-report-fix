"use client";

import React from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  FileCheck,
  Percent,
  ShieldCheck,
} from "lucide-react";
import { TriageResult } from "@/types";

interface EvidenceCardProps {
  triageResult: TriageResult;
  isAnswerKey?: boolean;
}

export function EvidenceCard({
  triageResult,
  isAnswerKey = false,
}: EvidenceCardProps) {
  const confidencePercent = Math.round(triageResult.confidence * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs space-y-0">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600" />
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Scientific Verification & Reasoning
          </span>
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium">Confidence:</span>
          <div className="w-14 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full ${
                confidencePercent >= 90
                  ? "bg-emerald-500"
                  : confidencePercent >= 75
                  ? "bg-blue-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="font-mono font-bold text-slate-800 text-[11px]">
            {confidencePercent}%
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Route & Verdict Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              triageResult.verdict === "defect"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : triageResult.verdict === "no_error"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            verdict: {triageResult.verdict}
          </span>

          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              triageResult.route === "auto_apply"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : triageResult.route === "faculty_review"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            route: {triageResult.route}
          </span>

          {triageResult.repair && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              repair: {triageResult.repair}
            </span>
          )}

          {isAnswerKey && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Answer Key Mismatch</span>
            </span>
          )}
        </div>

        {/* Evidence Text */}
        <div className="text-xs text-slate-800 leading-relaxed font-sans bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80 whitespace-pre-line">
          {triageResult.evidence}
        </div>
      </div>
    </div>
  );
}
