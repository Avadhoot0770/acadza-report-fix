"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  MessageSquare,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { QuestionGroup, ReviewStatus, Route, VerdictKey } from "@/types";
import { cn } from "@/lib/utils";

export type QuestionGroupViewModel = QuestionGroup;

interface ReportQueueTableProps {
  groups: QuestionGroup[];
  onSelectGroup: (group: QuestionGroup) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function ReportQueueTable({
  groups,
  onSelectGroup,
  searchQuery = "",
  onSearchChange,
}: ReportQueueTableProps) {
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [repairFilter, setRepairFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [duplicateOnly, setDuplicateOnly] = useState<boolean>(false);
  const [answerKeyOnly, setAnswerKeyOnly] = useState<boolean>(false);

  // Extract dynamic route counts for filter buttons
  const routeCounts = useMemo(() => {
    let facultyReview = 0;
    let autoApply = 0;
    let noChange = 0;
    for (const g of groups) {
      if (g.primaryResult.route === "faculty_review") facultyReview++;
      else if (g.primaryResult.route === "auto_apply") autoApply++;
      else if (g.primaryResult.route === "no_change") noChange++;
    }
    return { facultyReview, autoApply, noChange };
  }, [groups]);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (g.question.subject) set.add(g.question.subject);
    });
    return Array.from(set).sort();
  }, [groups]);

  // Extract unique repairs
  const repairs = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (g.primaryResult.repair) set.add(g.primaryResult.repair);
    });
    return Array.from(set).sort();
  }, [groups]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // Route filter
      if (routeFilter !== "all" && g.primaryResult.route !== routeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && g.status !== statusFilter) {
        return false;
      }
      // Verdict filter
      if (verdictFilter !== "all" && g.primaryResult.verdict !== verdictFilter) {
        return false;
      }
      // Repair filter
      if (repairFilter !== "all" && g.primaryResult.repair !== repairFilter) {
        return false;
      }
      // Subject filter
      if (subjectFilter !== "all" && g.question.subject !== subjectFilter) {
        return false;
      }
      // Duplicates only
      if (duplicateOnly && !g.isDuplicate) {
        return false;
      }
      // Answer keys only
      if (answerKeyOnly && !g.isAnswerKey) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQid = g.questionId.toLowerCase().includes(q);
        const matchesSubject = g.question.subject.toLowerCase().includes(q);
        const matchesChapter = g.question.chapter.toLowerCase().includes(q);
        const matchesReportId = g.reports.some((r) =>
          r.reportId.toLowerCase().includes(q)
        );
        const matchesComment = g.reports.some((r) =>
          r.comment.toLowerCase().includes(q)
        );
        const matchesEvidence = g.primaryResult.evidence
          .toLowerCase()
          .includes(q);
        if (
          !matchesQid &&
          !matchesSubject &&
          !matchesChapter &&
          !matchesReportId &&
          !matchesComment &&
          !matchesEvidence
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    groups,
    routeFilter,
    statusFilter,
    verdictFilter,
    repairFilter,
    subjectFilter,
    duplicateOnly,
    answerKeyOnly,
    searchQuery,
  ]);

  const activeFiltersCount =
    (routeFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (verdictFilter !== "all" ? 1 : 0) +
    (repairFilter !== "all" ? 1 : 0) +
    (subjectFilter !== "all" ? 1 : 0) +
    (duplicateOnly ? 1 : 0) +
    (answerKeyOnly ? 1 : 0);

  const resetFilters = () => {
    setRouteFilter("all");
    setStatusFilter("all");
    setVerdictFilter("all");
    setRepairFilter("all");
    setSubjectFilter("all");
    setDuplicateOnly(false);
    setAnswerKeyOnly(false);
    if (onSearchChange) onSearchChange("");
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Top Row: Search & Route Quick Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search by question ID, report ID (e.g. R005), chapter, or comment..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Route Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setRouteFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                routeFilter === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Routes ({groups.length})
            </button>
            <button
              onClick={() => setRouteFilter("faculty_review")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                routeFilter === "faculty_review"
                  ? "bg-purple-600 text-white shadow-2xs font-bold"
                  : "text-purple-800 hover:text-purple-900"
              }`}
            >
              <span>Faculty Review</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200/60 text-purple-900 font-bold">
                {routeCounts.facultyReview}
              </span>
            </button>
            <button
              onClick={() => setRouteFilter("auto_apply")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                routeFilter === "auto_apply"
                  ? "bg-teal-700 text-white shadow-2xs font-bold"
                  : "text-teal-900 hover:text-teal-950"
              }`}
            >
              <span>Safe Auto-Apply</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-200/60 text-teal-950 font-bold">
                {routeCounts.autoApply}
              </span>
            </button>
            <button
              onClick={() => setRouteFilter("no_change")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                routeFilter === "no_change"
                  ? "bg-slate-700 text-white shadow-2xs font-bold"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <span>No Change</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-300 text-slate-800 font-bold">
                {routeCounts.noChange}
              </span>
            </button>
          </div>
        </div>

        {/* Second Row: Detailed Multi-Filter Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Review Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="auto_applied">Auto Applied</option>
              <option value="approved">Faculty Approved</option>
              <option value="edited">Custom Edited</option>
              <option value="rejected">Rejected</option>
              <option value="no_action_needed">No Action Needed</option>
            </select>

            {/* Verdict Filter */}
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Verdicts</option>
              <option value="defect">Defect</option>
              <option value="no_error">No Error</option>
              <option value="display_issue">Display Issue</option>
              <option value="app_issue">App Issue</option>
              <option value="language_mode">Language Mode</option>
              <option value="already_fixed">Already Fixed</option>
              <option value="not_actionable">Not Actionable</option>
            </select>

            {/* Repair Type Filter */}
            <select
              value={repairFilter}
              onChange={(e) => setRepairFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Repair Types ({repairs.length})</option>
              {repairs.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Subject Filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Answer Key High-Stakes Toggle */}
            <button
              onClick={() => setAnswerKeyOnly(!answerKeyOnly)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors flex items-center gap-1.5 ${
                answerKeyOnly
                  ? "bg-rose-100 text-rose-800 border-rose-300 shadow-2xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
              <span>Answer Keys Only</span>
            </button>

            {/* Duplicates Only Toggle */}
            <button
              onClick={() => setDuplicateOnly(!duplicateOnly)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors flex items-center gap-1.5 ${
                duplicateOnly
                  ? "bg-indigo-100 text-indigo-800 border-indigo-300 shadow-2xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              <span>Multi-Report Clusters</span>
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}
          </div>

          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredGroups.length}</strong> of {groups.length} question groups
          </div>
        </div>
      </div>

      {/* Main Review Queue Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Question & Cluster</th>
                <th className="py-3.5 px-4">Subject & Chapter</th>
                <th className="py-3.5 px-4">Student Evidence</th>
                <th className="py-3.5 px-4">AI Verdict & Repair</th>
                <th className="py-3.5 px-4">Route & Urgency</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 space-y-2">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="font-medium text-slate-600">No questions match the current filter criteria.</p>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const isAnswerKey = group.isAnswerKey;
                  const firstReport = group.reports[0];
                  const confidencePercent = Math.round(
                    group.primaryResult.confidence * 100
                  );

                  return (
                    <tr
                      key={group.questionId}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors group cursor-pointer",
                        isAnswerKey && "border-l-4 border-l-rose-500 bg-rose-50/20"
                      )}
                      onClick={() => onSelectGroup(group)}
                    >
                      {/* 1. Question ID & Duplicate Cluster */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {group.questionId.slice(0, 8)}...
                            </span>
                            <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {group.question.questionType}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {group.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                <Users className="h-3 w-3" />
                                {group.reports.length} Reports (
                                {group.reports.map((r) => r.reportId).join(", ")})
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                {firstReport?.reportId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Subject & Chapter */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {group.question.subject}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                          {group.question.chapter}
                        </div>
                        {group.question.concept && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {group.question.concept}
                          </div>
                        )}
                      </td>

                      {/* 3. Student Evidence Lead (Untrusted) */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1 uppercase tracking-wider">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span>Student Lead:</span>
                          </div>
                          <p className="text-slate-700 text-[11px] line-clamp-2 italic leading-snug">
                            &ldquo;{firstReport?.comment}&rdquo;
                          </p>
                        </div>
                      </td>

                      {/* 4. AI Verdict & Repair */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                group.primaryResult.verdict === "defect"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : group.primaryResult.verdict === "no_error"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {group.primaryResult.verdict}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">
                              {confidencePercent}%
                            </span>
                          </div>

                          {group.primaryResult.repair && (
                            <div className="font-mono text-[11px] font-bold text-slate-700">
                              {group.primaryResult.repair}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Route & Urgency */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              group.primaryResult.route === "auto_apply"
                                ? "bg-teal-50 text-teal-800 border-teal-200"
                                : group.primaryResult.route === "faculty_review"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {group.primaryResult.route}
                          </span>

                          {isAnswerKey ? (
                            <div className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                              <AlertOctagon className="h-3 w-3" />
                              <span>Answer Key Mismatch</span>
                            </div>
                          ) : group.isSolutionDerived ? (
                            <div className="text-[10px] font-semibold text-blue-700">
                              Solution Inferred
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* 6. Review Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            group.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : group.status === "edited"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                              : group.status === "rejected"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : group.status === "auto_applied"
                              ? "bg-teal-100 text-teal-800 border-teal-300"
                              : group.status === "pending_review"
                              ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {group.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* 7. Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGroup(group);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1 shadow-2xs ${
                            isAnswerKey
                              ? "bg-rose-600 hover:bg-rose-700 text-white"
                              : group.status === "pending_review"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                          }`}
                        >
                          <span>Review</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
