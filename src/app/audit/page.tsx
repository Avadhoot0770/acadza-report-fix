"use client";

import React, { useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { useReview } from "@/context/review-context";
import {
  AlertCircle,
  Clock,
  Download,
  Filter,
  History,
  Info,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
  User,
  X,
} from "lucide-react";

export default function AuditPage() {
  const { auditLogs, resetDemoState } = useReview();
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQid = log.questionId.toLowerCase().includes(q);
        const matchesActor = log.actor.toLowerCase().includes(q);
        const matchesNote = log.note?.toLowerCase().includes(q) ?? false;
        const matchesField = log.field?.toLowerCase().includes(q) ?? false;
        if (!matchesQid && !matchesActor && !matchesNote && !matchesField) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, actionFilter, searchQuery]);

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `acadza-audit-log-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <>
      <Header
        title="Institutional Faculty Audit Trail"
        subtitle="Verifiable ledger of AI triage approvals, custom faculty repairs, and historical question fixes."
      />

      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Persistence Notice Banner */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="leading-relaxed">
              <strong>Browser-Local Demo Persistence:</strong> Audit records for actions taken in this session are persisted in your local browser storage for evaluation purposes. Original database records in <code>questions.json</code> remain strictly untouched.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Reset all demo audit logs back to initial historical fixes?"
                  )
                ) {
                  resetDemoState();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset Log</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by question ID, actor, or notes..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Actions ({auditLogs.length})</option>
              <option value="approve">Faculty Approvals</option>
              <option value="edit">Custom Faculty Edits</option>
              <option value="reject">Rejections</option>
              <option value="historical">Historical Database Fixes</option>
            </select>
          </div>

          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredLogs.length}</strong> of {auditLogs.length} audit entries
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100 text-xs">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-1">
                <AlertCircle className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No audit records match the current criteria.</p>
                <p className="text-[11px]">Take an approve, edit, or reject action from the Review Queue to generate new session audit entries.</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
                          log.action === "approve"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : log.action === "edit"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                            : log.action === "reject"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {log.action}
                      </span>

                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.questionId}
                      </span>

                      {log.reportIds && log.reportIds.length > 0 && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Reports: [{log.reportIds.join(", ")}]
                        </span>
                      )}

                      {log.repairKey && (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          repair: {log.repairKey}
                        </span>
                      )}
                    </div>

                    <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {log.note && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-800 leading-relaxed">
                      <strong className="font-semibold text-slate-900">Rationale / Note:</strong> {log.note}
                    </div>
                  )}

                  {/* Diff Details if an edit was recorded */}
                  {log.field && (
                    <div className="p-2.5 bg-slate-100/70 rounded-lg text-[11px] font-mono text-slate-700 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">Modified Field: [{log.field}]</span>
                      <span>•</span>
                      <span className="text-rose-700 line-through">
                        Before: {typeof log.beforeValue === "object" ? JSON.stringify(log.beforeValue) : String(log.beforeValue ?? "N/A")}
                      </span>
                      <span>➔</span>
                      <span className="text-emerald-700 font-bold">
                        After: {typeof log.afterValue === "object" ? JSON.stringify(log.afterValue) : String(log.afterValue ?? "N/A")}
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>
                      Actor: <strong className="text-slate-700">{log.actor}</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
