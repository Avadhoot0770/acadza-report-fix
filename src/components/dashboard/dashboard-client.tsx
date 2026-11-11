"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { ReportQueueTable } from "@/components/queue/report-queue-table";
import { ReviewDrawer } from "@/components/review/review-drawer";
import { useReview } from "@/context/review-context";
import {
  AlertCircle,
  Database,
  Info,
  RotateCcw,
  Sparkles,
  UserCheck,
} from "lucide-react";

export function DashboardClient() {
  const {
    questionGroups,
    selectedGroupId,
    setSelectedGroupId,
    activeActor,
    setActiveActor,
    resetDemoState,
  } = useReview();

  const [searchQuery, setSearchQuery] = useState("");
  const [showActorModal, setShowActorModal] = useState(false);
  const [actorInput, setActorInput] = useState(activeActor);

  const selectedGroup =
    questionGroups.find((g) => g.questionId === selectedGroupId) || null;

  return (
    <>
      <Header searchValue={searchQuery} onSearchChange={setSearchQuery} />

      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Persistence Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/90 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="leading-relaxed">
              <strong>Browser-Local Demo Persistence:</strong> Faculty review actions, custom edits, and audit logs are recorded in your browser&apos;s local storage for evaluation. Original source files remain 100% immutable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActorModal(true)}
              className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100/60 font-semibold text-[11px] flex items-center gap-1 transition-colors"
            >
              <UserCheck className="h-3 w-3" />
              <span>Reviewing as: {activeActor.split("(")[0].trim()}</span>
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Reset all faculty decisions and audit logs back to initial triage state?"
                  )
                ) {
                  resetDemoState();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-[11px] flex items-center gap-1 transition-colors"
              title="Reset all demo decisions and audit entries"
            >
              <RotateCcw className="h-3 w-3 text-slate-400" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <OverviewMetrics />

        {/* Queue Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Question Triage & Review Queue
              </h2>
              <p className="text-xs text-slate-500">
                Click on any question row to inspect MathML stems, review verified calculations, and execute surgical fixes.
              </p>
            </div>
          </div>

          <ReportQueueTable
            groups={questionGroups}
            onSelectGroup={(g) => setSelectedGroupId(g.questionId)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </div>

      {/* Comprehensive Question Review Workspace Drawer */}
      <ReviewDrawer
        group={selectedGroup}
        onClose={() => setSelectedGroupId(null)}
      />

      {/* Switch Faculty Actor Modal */}
      {showActorModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              Configure Reviewing Faculty Profile
            </h3>
            <p className="text-xs text-slate-500">
              This name will be attached to all institutional audit trail entries for actions taken during this session.
            </p>
            <input
              type="text"
              value={actorInput}
              onChange={(e) => setActorInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowActorModal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (actorInput.trim()) {
                    setActiveActor(actorInput.trim());
                    setShowActorModal(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-2xs"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
