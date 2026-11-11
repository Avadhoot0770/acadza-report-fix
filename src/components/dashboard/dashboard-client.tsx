"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import {
  QuestionGroupViewModel,
  ReportQueueTable,
} from "@/components/queue/report-queue-table";
import { QuestionPreviewModal } from "@/components/queue/question-preview-modal";

interface DashboardClientProps {
  groups: QuestionGroupViewModel[];
  totalReports: number;
  uniqueQuestions: number;
  duplicateGroupsCount: number;
  highPriorityCount: number;
  autoApplyEligibleCount: number;
}

export function DashboardClient({
  groups,
  totalReports,
  uniqueQuestions,
  duplicateGroupsCount,
  highPriorityCount,
  autoApplyEligibleCount,
}: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] =
    useState<QuestionGroupViewModel | null>(null);

  return (
    <>
      <Header
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Metric Cards */}
        <OverviewMetrics
          totalReports={totalReports}
          uniqueQuestions={uniqueQuestions}
          duplicateGroupsCount={duplicateGroupsCount}
          highPriorityCount={highPriorityCount}
          autoApplyEligibleCount={autoApplyEligibleCount}
        />

        {/* Queue Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Incoming Question Triage Queue
              </h2>
              <p className="text-xs text-slate-500">
                Questions grouped by cluster. Click on any row to inspect original MathML content and student comments.
              </p>
            </div>
          </div>

          <ReportQueueTable
            groups={groups}
            onSelectGroup={setSelectedGroup}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* Inspect Modal */}
      <QuestionPreviewModal
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
      />
    </>
  );
}
