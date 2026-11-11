"use client";

import React from "react";
import { MessageSquare, Send, Sparkles, UserCheck } from "lucide-react";
import { StudentReport } from "@/types";

interface StudentReplyPreviewProps {
  replyText: string;
  reports: StudentReport[];
}

export function StudentReplyPreview({
  replyText,
  reports,
}: StudentReplyPreviewProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs space-y-0">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Empathetic Student-Facing Reply Preview
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Recipients: {reports.length} student{reports.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 leading-relaxed font-sans relative">
          <span className="font-bold text-indigo-900 block mb-1">
            Generated Student Response:
          </span>
          &ldquo;{replyText}&rdquo;
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              Targeted to:{" "}
              {reports.map((r) => `${r.studentId} (${r.reportId})`).join(", ")}
            </span>
          </div>
          <span className="italic">
            Scheduled on faculty action confirmation
          </span>
        </div>
      </div>
    </div>
  );
}
