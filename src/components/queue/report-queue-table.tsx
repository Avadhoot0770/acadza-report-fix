"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { QuestionRecord, StudentReport } from "@/types";
import { cn } from "@/lib/utils";

export interface QuestionGroupViewModel {
  questionId: string;
  question: QuestionRecord;
  reports: StudentReport[];
  subject: string;
  chapter: string;
  questionType: string;
  answerKey: string;
  isDuplicate: boolean;
  priority: "critical" | "high" | "normal" | "low";
  priorityReason: string;
}

interface ReportQueueTableProps {
  groups: QuestionGroupViewModel[];
  onSelectGroup?: (group: QuestionGroupViewModel) => void;
  searchQuery?: string;
}

export function ReportQueueTable({
  groups,
  onSelectGroup,
  searchQuery = "",
}: ReportQueueTableProps) {
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [duplicateOnly, setDuplicateOnly] = useState<boolean>(false);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (g.subject) set.add(g.subject);
    });
    return Array.from(set);
  }, [groups]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // Subject filter
      if (subjectFilter !== "all" && g.subject !== subjectFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== "all" && g.questionType !== typeFilter) {
        return false;
      }
      // Duplicate only
      if (duplicateOnly && !g.isDuplicate) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = g.questionId.toLowerCase().includes(q);
        const matchesSubject = g.subject.toLowerCase().includes(q);
        const matchesChapter = g.chapter.toLowerCase().includes(q);
        const matchesComment = g.reports.some((r) =>
          r.comment.toLowerCase().includes(q)
        );
        const matchesStudent = g.reports.some((r) =>
          r.studentId.toLowerCase().includes(q)
        );
        if (
          !matchesId &&
          !matchesSubject &&
          !matchesChapter &&
          !matchesComment &&
          !matchesStudent
        ) {
          return false;
        }
      }
      return true;
    });
  }, [groups, subjectFilter, typeFilter, duplicateOnly, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Table Filters Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold px-2 py-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Subjects ({groups.length})</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Question Types</option>
            <option value="scq">Single Choice (SCQ)</option>
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="integerQuestion">Integer / Numerical</option>
          </select>

          {/* Duplicates Only Toggle */}
          <button
            onClick={() => setDuplicateOnly(!duplicateOnly)}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5",
              duplicateOnly
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Duplicates Only (Cluster)</span>
          </button>
        </div>

        {/* Counter */}
        <div className="text-slate-500 font-medium px-2">
          Showing <span className="font-bold text-slate-900">{filteredGroups.length}</span> question clusters
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Question & Type</th>
                <th className="py-3 px-4">Subject & Chapter</th>
                <th className="py-3 px-4">Keyed Answer</th>
                <th className="py-3 px-4">Student Reports</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No questions match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  return (
                    <tr
                      key={group.questionId}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectGroup?.(group)}
                    >
                      {/* Question ID & Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {group.questionId.slice(0, 8)}...
                          </span>
                          {group.isDuplicate && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Users className="h-3 w-3" />
                              {group.reports.length} Reports
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1 uppercase">
                          {group.questionType === "scq"
                            ? "Single Choice (SCQ)"
                            : group.questionType === "mcq"
                            ? "Multiple Choice (MCQ)"
                            : "Numerical (Integer)"}
                        </div>
                      </td>

                      {/* Subject & Chapter */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {group.subject}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={group.chapter}>
                          {group.chapter}
                        </div>
                      </td>

                      {/* Stored Answer Key */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {group.answerKey}
                        </span>
                      </td>

                      {/* Student Comments */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          {group.reports.slice(0, 2).map((r) => (
                            <div
                              key={r.reportId}
                              className="text-[11px] text-slate-600 truncate flex items-center gap-1.5"
                              title={r.comment}
                            >
                              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                {r.reportId}:
                              </span>
                              <span className="italic truncate">&quot;{r.comment}&quot;</span>
                            </div>
                          ))}
                          {group.reports.length > 2 && (
                            <div className="text-[10px] font-semibold text-blue-600">
                              +{group.reports.length - 2} more report(s)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-3.5 px-4">
                        {group.priority === "critical" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" />
                            Critical (Key)
                          </span>
                        ) : group.priority === "high" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="h-3 w-3" />
                            High Defect
                          </span>
                        ) : group.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Users className="h-3 w-3" />
                            Multi-Report
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGroup?.(group);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 hover:bg-blue-100/80 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
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
